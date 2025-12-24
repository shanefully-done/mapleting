package com.mapleting.monitor.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.mapleting.monitor.data.ConfigRepository
import com.mapleting.monitor.data.ConfigValidation
import com.mapleting.monitor.data.LogEntry
import com.mapleting.monitor.data.LogManager
import com.mapleting.monitor.data.MonitorConfig
import kotlinx.coroutines.launch

/**
 * ViewModel for managing monitoring state and configuration
 */
class MonitoringViewModel(application: Application) : AndroidViewModel(application) {
    
    private val configRepository = ConfigRepository(application)
    
    // LiveData for UI state
    private val _monitoringState = MutableLiveData<MonitoringState>(MonitoringState.Stopped)
    val monitoringState: LiveData<MonitoringState> = _monitoringState
    
    private val _config = MutableLiveData<MonitorConfig?>(null)
    val config: LiveData<MonitorConfig?> = _config
    
    private val _batteryOptimizationEnabled = MutableLiveData<Boolean?>(null)
    val batteryOptimizationEnabled: LiveData<Boolean?> = _batteryOptimizationEnabled
    
    // Expose logs from LogManager
    val logs: LiveData<List<LogEntry>> = LogManager.logs
    
    init {
        loadConfig()
    }
    
    /**
     * Load configuration from storage
     */
    private fun loadConfig() {
        viewModelScope.launch {
            val savedConfig = configRepository.loadConfig()
            _config.postValue(savedConfig)
        }
    }
    
    /**
     * Save configuration
     */
    fun saveConfig(config: MonitorConfig, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            val validation = configRepository.validateConfig(config)
            
            when (validation) {
                is ConfigValidation.Valid -> {
                    configRepository.saveConfig(config)
                    _config.postValue(config)
                    onSuccess()
                }
                is ConfigValidation.Error -> {
                    onError(validation.message)
                }
            }
        }
    }
    
    /**
     * Clear configuration
     */
    fun clearConfig() {
        viewModelScope.launch {
            configRepository.clearConfig()
            _config.postValue(null)
        }
    }
    
    /**
     * Update monitoring state
     */
    fun setMonitoringState(state: MonitoringState) {
        _monitoringState.postValue(state)
    }
    
    /**
     * Update battery optimization status
     */
    fun setBatteryOptimizationEnabled(enabled: Boolean) {
        _batteryOptimizationEnabled.postValue(enabled)
    }
    
    /**
     * Clear all logs
     */
    fun clearLogs() {
        LogManager.clearLogs()
    }
    
    /**
     * Load logs from persistent storage
     */
    fun loadLogs(application: Application) {
        viewModelScope.launch {
            LogManager.loadLogs(application)
        }
    }
    
    /**
     * Save logs to persistent storage
     */
    fun saveLogs(application: Application) {
        viewModelScope.launch {
            LogManager.saveLogs(application)
        }
    }
}

/**
 * Sealed class for monitoring state
 */
sealed class MonitoringState {
    object Stopped : MonitoringState()
    object Monitoring : MonitoringState()
}