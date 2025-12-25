package com.mapleting.monitor

import android.Manifest
import android.app.ActivityManager
import android.app.AlertDialog
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import com.mapleting.monitor.databinding.ActivityMainBinding
import com.mapleting.monitor.data.MonitorConfig
import com.mapleting.monitor.data.UpdateInfo
import com.mapleting.monitor.network.UpdateChecker
import com.mapleting.monitor.service.ForegroundAccessibilityService
import com.mapleting.monitor.service.MonitoringService
import com.mapleting.monitor.utils.AccessibilityUtils
import com.mapleting.monitor.viewmodel.MonitoringState
import com.mapleting.monitor.viewmodel.MonitoringViewModel
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    private lateinit var viewModel: MonitoringViewModel
    private var isMonitoring = false
    private var isAdvancedConfigExpanded = false
    
    // Permission launcher for POST_NOTIFICATIONS
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            Toast.makeText(this, "Notification permission granted", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(this, "Notification permission denied", Toast.LENGTH_SHORT).show()
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        viewModel = ViewModelProvider(this)[MonitoringViewModel::class.java]
        
        setupUI()
        observeViewModel()
        checkPermissions()
        checkBatteryOptimization()
        checkAccessibilityPermission()
        checkForUpdates()
    }
    
    override fun onResume() {
        super.onResume()
        checkBatteryOptimization()
        checkAccessibilityPermission()
        checkIfServiceRunning()
    }
    
    private fun setupUI() {
        // Advanced config toggle
        binding.advancedConfigHeader.setOnClickListener {
            toggleAdvancedConfig()
        }
        
        // Start/Stop button
        binding.startStopButton.setOnClickListener {
            if (isMonitoring) {
                stopMonitoring()
            } else {
                startMonitoring()
            }
        }
        
        // Battery optimization button
        binding.batteryOptimizationButton.setOnClickListener {
            openBatteryOptimizationSettings()
        }
        
        // Accessibility permission button
        binding.accessibilityPermissionButton.setOnClickListener {
            AccessibilityUtils.openAccessibilitySettings(this)
        }
        
        // Text change listener for validation feedback
        binding.nicknameEditText.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                // Clear error when user types
                binding.nicknameLayout.error = null
            }
        })
    }
    
    /**
     * Toggle the advanced config section visibility
     */
    private fun toggleAdvancedConfig() {
        isAdvancedConfigExpanded = !isAdvancedConfigExpanded
        
        if (isAdvancedConfigExpanded) {
            binding.advancedConfigContent.visibility = View.VISIBLE
            binding.advancedConfigIndicator.text = "▲"
        } else {
            binding.advancedConfigContent.visibility = View.GONE
            binding.advancedConfigIndicator.text = "▼"
        }
    }
    
    private fun observeViewModel() {
        viewModel.config.observe(this) { config ->
            updateUIWithConfig(config)
        }
        
        viewModel.monitoringState.observe(this) { state ->
            when (state) {
                is MonitoringState.Stopped -> {
                    isMonitoring = false
                    updateStatusUI(false)
                }
                is MonitoringState.Monitoring -> {
                    isMonitoring = true
                    updateStatusUI(true)
                }
            }
        }
        
        viewModel.batteryOptimizationEnabled.observe(this) { enabled ->
            enabled?.let { updateBatteryOptimizationUI(it) }
        }
        
        viewModel.monitoringUrl.observe(this) { url ->
            updateMonitoringUrlUI(url)
        }
    }
    
    private fun updateUIWithConfig(config: MonitorConfig?) {
        if (config != null) {
            binding.nicknameEditText.setText(config.nickname)
            binding.packageNameEditText.setText(config.packageName)
            binding.serverUrlEditText.setText(config.serverUrl)
        }
    }
    
    private fun updateStatusUI(monitoring: Boolean) {
        if (monitoring) {
            binding.statusTextView.text = getString(R.string.status_monitoring)
            binding.statusTextView.setTextColor(getColor(R.color.status_running))
            binding.startStopButton.text = getString(R.string.stop_monitoring)
            
            // Disable inputs while monitoring
            binding.nicknameEditText.isEnabled = false
            binding.packageNameEditText.isEnabled = false
            binding.serverUrlEditText.isEnabled = false
            binding.advancedConfigHeader.isEnabled = false
        } else {
            binding.statusTextView.text = getString(R.string.status_stopped)
            binding.statusTextView.setTextColor(getColor(R.color.status_stopped))
            binding.startStopButton.text = getString(R.string.start_monitoring)
            
            // Enable inputs when not monitoring
            binding.nicknameEditText.isEnabled = true
            binding.packageNameEditText.isEnabled = true
            binding.serverUrlEditText.isEnabled = true
            binding.advancedConfigHeader.isEnabled = true
        }
    }
    
    /**
     * Update the monitoring URL display
     */
    private fun updateMonitoringUrlUI(url: String?) {
        if (url != null) {
            binding.monitoringUrlTextView.text = url
            binding.monitoringUrlContainer.visibility = View.VISIBLE
        } else {
            binding.monitoringUrlContainer.visibility = View.GONE
        }
    }
    
    private fun updateBatteryOptimizationUI(enabled: Boolean) {
        if (enabled) {
            binding.batteryOptimizationTextView.text = getString(R.string.battery_optimization_enabled)
            binding.batteryOptimizationTextView.setTextColor(getColor(R.color.status_stopped))
            binding.batteryOptimizationButton.visibility = View.VISIBLE
        } else {
            binding.batteryOptimizationTextView.text = getString(R.string.battery_optimization_disabled)
            binding.batteryOptimizationTextView.setTextColor(getColor(R.color.status_running))
            binding.batteryOptimizationButton.visibility = View.GONE
        }
    }
    
    /**
     * Check accessibility permission status and update UI
     */
    private fun checkAccessibilityPermission() {
        val isEnabled = AccessibilityUtils.isAccessibilityServiceEnabled(
            this,
            ForegroundAccessibilityService::class.java
        )
        
        updateAccessibilityPermissionUI(isEnabled)
        
        // Show permission dialog if not enabled and not monitoring
        if (!isEnabled && !isMonitoring) {
            AccessibilityUtils.showAccessibilityPermissionDialog(this)
        }
    }
    
    /**
     * Update UI to reflect accessibility permission status
     */
    private fun updateAccessibilityPermissionUI(enabled: Boolean) {
        val statusText = if (enabled) {
            getString(R.string.accessibility_enabled)
        } else {
            getString(R.string.accessibility_disabled)
        }
        
        binding.accessibilityPermissionTextView.text = getString(
            R.string.accessibility_permission_status,
            statusText
        )
        
        if (enabled) {
            binding.accessibilityPermissionTextView.setTextColor(getColor(R.color.status_running))
            binding.accessibilityPermissionButton.visibility = View.GONE
        } else {
            binding.accessibilityPermissionTextView.setTextColor(getColor(R.color.status_stopped))
            binding.accessibilityPermissionButton.visibility = View.VISIBLE
        }
    }
    
    private fun startMonitoring() {
        // Get values from inputs
        val nickname = binding.nicknameEditText.text?.toString()?.trim() ?: ""
        val packageName = binding.packageNameEditText.text?.toString()?.trim() ?: ""
        val serverUrl = binding.serverUrlEditText.text?.toString()?.trim() ?: ""
        
        // Use defaults if not provided
        val finalServerUrl = if (serverUrl.isBlank()) {
            MonitorConfig.DEFAULT_SERVER_URL
        } else {
            serverUrl
        }
        
        val finalPackageName = if (packageName.isBlank()) {
            MonitorConfig.DEFAULT_PACKAGE_NAME
        } else {
            packageName
        }
        
        // Validate inputs
        if (nickname.isBlank()) {
            binding.nicknameLayout.error = "Character name is required"
            return
        }
        
        // Create config with defaults
        val config = MonitorConfig(
            nickname = nickname,
            serverUrl = finalServerUrl,
            packageName = finalPackageName,
            checkInterval = 60000L
        )
        
        // Save config and start service
        viewModel.saveConfig(config,
            onSuccess = {
                startMonitoringService(config)
            },
            onError = { message ->
                Toast.makeText(this, message, Toast.LENGTH_LONG).show()
            }
        )
    }
    
    private fun startMonitoringService(config: MonitorConfig) {
        val intent = Intent(this, MonitoringService::class.java).apply {
            putExtra(MonitoringService.EXTRA_CONFIG, config)
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
        
        // Pass config to ensure URL is updated immediately
        viewModel.setMonitoringState(MonitoringState.Monitoring, config)
        Toast.makeText(this, "Monitoring started", Toast.LENGTH_SHORT).show()
    }
    
    private fun stopMonitoring() {
        val intent = Intent(this, MonitoringService::class.java).apply {
            action = MonitoringService.ACTION_STOP
        }
        startService(intent)
        
        viewModel.setMonitoringState(MonitoringState.Stopped)
        Toast.makeText(this, "Monitoring stopped", Toast.LENGTH_SHORT).show()
    }
    
    private fun checkIfServiceRunning() {
        val activityManager = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val services = activityManager.getRunningServices(Integer.MAX_VALUE)
        
        val isRunning = services.any {
            it.service.className == MonitoringService::class.java.name
        }
        
        if (isRunning && !isMonitoring) {
            viewModel.setMonitoringState(MonitoringState.Monitoring)
        } else if (!isRunning && isMonitoring) {
            viewModel.setMonitoringState(MonitoringState.Stopped)
        }
    }
    
    private fun checkPermissions() {
        // POST_NOTIFICATIONS permission (Android 13+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }
    
    private fun checkBatteryOptimization() {
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        val isIgnoringBatteryOptimizations = powerManager.isIgnoringBatteryOptimizations(packageName)
        
        viewModel.setBatteryOptimizationEnabled(!isIgnoringBatteryOptimizations)
    }
    
    private fun openBatteryOptimizationSettings() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                data = Uri.parse("package:$packageName")
            }
            startActivity(intent)
        }
    }
    
    /**
     * Check for app updates from GitHub releases
     */
    private fun checkForUpdates() {
        lifecycleScope.launch {
            try {
                val updateChecker = UpdateChecker(this@MainActivity)
                val updateInfo = updateChecker.checkForUpdates()
                
                updateInfo?.let { info ->
                    if (info.isUpdateAvailable) {
                        showUpdateDialog(info)
                    }
                }
            } catch (e: Exception) {
                // Silently fail on update check errors
                // Don't interrupt user experience with update errors
            }
        }
    }
    
    /**
     * Show update available dialog
     */
    private fun showUpdateDialog(updateInfo: UpdateInfo) {
        val currentVersion = try {
            val packageInfo = packageManager.getPackageInfo(packageName, 0)
            packageInfo.versionName
        } catch (e: Exception) {
            "unknown"
        }
        
        val message = StringBuilder()
        message.append(getString(R.string.update_available_message))
        message.append("\n\n")
        message.append(getString(R.string.current_version, currentVersion))
        message.append("\n")
        message.append(getString(R.string.latest_version, updateInfo.latestVersion))
        
        // Add release notes if available
        if (updateInfo.releaseNotes.isNotBlank()) {
            message.append("\n\n")
            message.append(getString(R.string.whats_new))
            message.append("\n")
            message.append(updateInfo.releaseNotes.take(500)) // Limit to 500 chars
            if (updateInfo.releaseNotes.length > 500) {
                message.append("...")
            }
        }
        
        AlertDialog.Builder(this)
            .setTitle(getString(R.string.update_available_title))
            .setMessage(message.toString())
            .setPositiveButton(getString(R.string.update_now)) { _, _ ->
                openDownloadPage(updateInfo.downloadUrl)
            }
            .setNegativeButton(getString(R.string.update_later), null)
            .setNeutralButton(getString(R.string.update_remind_later)) { _, _ ->
                // Option to remind later - could implement with SharedPreferences
            }
            .setCancelable(false)
            .show()
    }
    
    /**
     * Open the download page in browser
     */
    private fun openDownloadPage(url: String) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(
                this,
                getString(R.string.update_download_failed),
                Toast.LENGTH_LONG
            ).show()
        }
    }
}