package com.mapleting.monitor.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first

// DataStore extension
private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "monitor_config")

/**
 * Repository for managing monitor configuration using DataStore
 */
class ConfigRepository(private val context: Context) {
    
    companion object {
        private val NICKNAME_KEY = stringPreferencesKey("nickname")
        private val SERVER_URL_KEY = stringPreferencesKey("server_url")
        private val PACKAGE_NAME_KEY = stringPreferencesKey("package_name")
        private val CHECK_INTERVAL_KEY = longPreferencesKey("check_interval")
    }
    
    /**
     * Save configuration to DataStore
     */
    suspend fun saveConfig(config: MonitorConfig) {
        context.dataStore.edit { preferences ->
            preferences[NICKNAME_KEY] = config.nickname
            preferences[SERVER_URL_KEY] = config.serverUrl
            preferences[PACKAGE_NAME_KEY] = config.packageName
            preferences[CHECK_INTERVAL_KEY] = config.checkInterval
        }
    }
    
    /**
     * Load configuration from DataStore
     * Returns null if configuration is incomplete
     */
    suspend fun loadConfig(): MonitorConfig? {
        val preferences = context.dataStore.data.first()
        
        val nickname = preferences[NICKNAME_KEY]
        val serverUrl = preferences[SERVER_URL_KEY]
        val packageName = preferences[PACKAGE_NAME_KEY]
        val checkInterval = preferences[CHECK_INTERVAL_KEY] ?: 3000L
        
        return if (nickname != null && serverUrl != null && packageName != null) {
            MonitorConfig(nickname, serverUrl, packageName, checkInterval)
        } else {
            null
        }
    }
    
    /**
     * Clear all configuration from DataStore
     */
    suspend fun clearConfig() {
        context.dataStore.edit { preferences ->
            preferences.clear()
        }
    }
    
    /**
     * Validate configuration
     */
    fun validateConfig(config: MonitorConfig): ConfigValidation {
        return when {
            config.nickname.isBlank() -> ConfigValidation.Error("Nickname cannot be empty")
            !isValidUrl(config.serverUrl) -> ConfigValidation.Error("Invalid server URL")
            !isValidPackageName(config.packageName) -> ConfigValidation.Error("Invalid package name")
            config.checkInterval < 1000 -> ConfigValidation.Error("Check interval must be at least 1 second")
            else -> ConfigValidation.Valid
        }
    }
    
    private fun isValidUrl(url: String): Boolean {
        return try {
            val urlObj = java.net.URL(url)
            urlObj.protocol == "https"
        } catch (e: Exception) {
            false
        }
    }
    
    private fun isValidPackageName(packageName: String): Boolean {
        // Android package name format: com.example.app
        val pattern = Regex("^[a-z][a-z0-9_]*(\\.[a-z][a-z0-9_]*)+$")
        return pattern.matches(packageName)
    }
}

/**
 * Sealed class for configuration validation result
 */
sealed class ConfigValidation {
    object Valid : ConfigValidation()
    data class Error(val message: String) : ConfigValidation()
}