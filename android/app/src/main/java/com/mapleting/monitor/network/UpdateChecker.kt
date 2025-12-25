package com.mapleting.monitor.network

import android.content.Context
import android.util.Log
import com.google.gson.Gson
import com.mapleting.monitor.R
import com.mapleting.monitor.data.GitHubAsset
import com.mapleting.monitor.data.GitHubRelease
import com.mapleting.monitor.data.UpdateInfo
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * Client for checking app updates from GitHub releases
 */
class UpdateChecker(private val context: Context) {
    
    companion object {
        private const val TAG = "UpdateChecker"
        private const val GITHUB_API_BASE = "https://api.github.com"
        private const val REPO_OWNER = "shanefully-done"
        private const val REPO_NAME = "mapleting"
        private const val RELEASES_ENDPOINT = "/repos/$REPO_OWNER/$REPO_NAME/releases/latest"
    }
    
    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()
    
    private val gson = Gson()
    
    /**
     * Check for updates by fetching the latest release from GitHub
     * 
     * @return UpdateInfo containing update details, or null if check fails
     */
    suspend fun checkForUpdates(): UpdateInfo? = withContext(Dispatchers.IO) {
        try {
            val currentVersion = getCurrentVersionName()
            val currentVersionCode = getCurrentVersionCode()
            
            if (currentVersion == null) {
                Log.e(TAG, "Unable to get current version")
                return@withContext null
            }
            
            // Fetch latest release from GitHub
            val release = fetchLatestRelease() ?: return@withContext null
            
            // Parse version from tag (e.g., "v1.0.2" -> "1.0.2")
            val latestVersion = release.tag_name.removePrefix("v")
            
            // Calculate version code from version string
            val latestVersionCode = calculateVersionCode(latestVersion)
            
            // Find APK download URL
            val apkAsset = release.assets.find { 
                it.name.endsWith(".apk") || it.name.contains("monitor") 
            }
            
            val downloadUrl = apkAsset?.browser_download_url ?: run {
                // Fallback: construct URL from version if asset not found
                constructFallbackDownloadUrl(latestVersion)
            }
            
            // Check if update is available
            val isUpdateAvailable = latestVersionCode > currentVersionCode
            
            UpdateInfo(
                latestVersion = latestVersion,
                latestVersionCode = latestVersionCode,
                downloadUrl = downloadUrl,
                releaseNotes = release.body ?: "",
                isUpdateAvailable = isUpdateAvailable
            )
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to check for updates", e)
            null
        }
    }
    
    /**
     * Fetch the latest release from GitHub API
     */
    private fun fetchLatestRelease(): GitHubRelease? {
        val request = Request.Builder()
            .url("$GITHUB_API_BASE$RELEASES_ENDPOINT")
            .header("Accept", "application/vnd.github.v3+json")
            .build()
        
        return try {
            val response = client.newCall(request).execute()
            
            if (!response.isSuccessful) {
                Log.e(TAG, "GitHub API request failed: ${response.code}")
                return null
            }
            
            val responseBody = response.body?.string()
            if (responseBody != null) {
                gson.fromJson(responseBody, GitHubRelease::class.java)
            } else {
                null
            }
        } catch (e: IOException) {
            Log.e(TAG, "Network error fetching release", e)
            null
        }
    }
    
    /**
     * Get current version name from BuildConfig
     */
    private fun getCurrentVersionName(): String? {
        return try {
            val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            packageInfo.versionName
        } catch (e: Exception) {
            Log.e(TAG, "Unable to get current version name", e)
            null
        }
    }
    
    /**
     * Get current version code from BuildConfig
     */
    private fun getCurrentVersionCode(): Int {
        return try {
            val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
                packageInfo.longVersionCode.toInt()
            } else {
                @Suppress("DEPRECATION")
                packageInfo.versionCode
            }
        } catch (e: Exception) {
            Log.e(TAG, "Unable to get current version code", e)
            0
        }
    }
    
    /**
     * Calculate version code from version string (e.g., "1.0.2" -> 102)
     */
    private fun calculateVersionCode(version: String): Int {
        return try {
            val parts = version.split(".")
            val major = parts.getOrNull(0)?.toIntOrNull() ?: 0
            val minor = parts.getOrNull(1)?.toIntOrNull() ?: 0
            val patch = parts.getOrNull(2)?.toIntOrNull() ?: 0
            
            // Encode as: major * 10000 + minor * 100 + patch
            major * 10000 + minor * 100 + patch
        } catch (e: Exception) {
            Log.e(TAG, "Unable to parse version: $version", e)
            0
        }
    }
    
    /**
     * Fallback URL construction when APK asset is not found in release
     */
    private fun constructFallbackDownloadUrl(version: String): String {
        return "https://github.com/$REPO_OWNER/$REPO_NAME/releases/download/v$version/mapleting-monitor.apk"
    }
}