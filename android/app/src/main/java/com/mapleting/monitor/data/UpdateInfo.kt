package com.mapleting.monitor.data

/**
 * Data class representing update information from GitHub releases
 */
data class UpdateInfo(
    val latestVersion: String,           // e.g., "1.0.1"
    val latestVersionCode: Int,          // e.g., 2
    val downloadUrl: String,             // APK download URL
    val releaseNotes: String,            // Release notes
    val isUpdateAvailable: Boolean       // true if latestVersion > currentVersion
)

/**
 * Data class representing GitHub API release response
 */
data class GitHubRelease(
    val tag_name: String,
    val name: String,
    val body: String,
    val html_url: String,
    val assets: List<GitHubAsset>
)

data class GitHubAsset(
    val name: String,
    val browser_download_url: String,
    val size: Long
)