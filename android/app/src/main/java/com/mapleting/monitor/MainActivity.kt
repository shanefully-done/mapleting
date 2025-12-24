package com.mapleting.monitor

import android.Manifest
import android.app.ActivityManager
import android.app.AlertDialog
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.text.Editable
import android.text.TextWatcher
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModelProvider
import com.mapleting.monitor.adapter.AppInfoAdapter
import com.mapleting.monitor.databinding.ActivityMainBinding
import com.mapleting.monitor.data.AppInfoItem
import com.mapleting.monitor.data.MonitorConfig
import com.mapleting.monitor.data.LogManager
import com.mapleting.monitor.service.ForegroundAccessibilityService
import com.mapleting.monitor.service.MonitoringService
import com.mapleting.monitor.utils.AccessibilityUtils
import com.mapleting.monitor.viewmodel.MonitoringState
import com.mapleting.monitor.viewmodel.MonitoringViewModel
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    private lateinit var viewModel: MonitoringViewModel
    private var isMonitoring = false
    
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
        
        // Load persisted logs
        viewModel.loadLogs(application)
    }
    
    override fun onResume() {
        super.onResume()
        checkBatteryOptimization()
        checkAccessibilityPermission()
        checkIfServiceRunning()
    }
    
    override fun onPause() {
        super.onPause()
        // Save logs when activity is paused
        viewModel.saveLogs(application)
    }
    
    private fun setupUI() {
        // Advanced settings toggle
        binding.advancedCheckBox.setOnCheckedChangeListener { _, isChecked ->
            binding.serverUrlLayout.visibility = if (isChecked) {
                android.view.View.VISIBLE
            } else {
                android.view.View.GONE
            }
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
        
        // Clear logs button
        binding.clearLogsButton.setOnClickListener {
            viewModel.clearLogs()
        }
        
        // Browse apps button
        binding.browseAppsButton.setOnClickListener {
            showAppPickerDialog()
        }
        
        // Text change listeners for validation feedback
        binding.nicknameEditText.addTextChangedListener(createTextWatcher())
        binding.packageNameEditText.addTextChangedListener(createTextWatcher())
        
        // Tap-to-copy functionality for logs
        binding.logsTextView.setOnClickListener {
            copyLogsToClipboard()
        }
    }
    
    /**
     * Copy all logs to clipboard
     */
    private fun copyLogsToClipboard() {
        val logsText = binding.logsTextView.text?.toString()
        if (logsText.isNullOrEmpty() || logsText == "No logs yet") {
            Toast.makeText(this, "No logs to copy", Toast.LENGTH_SHORT).show()
            return
        }
        
        val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
        val clip = android.content.ClipData.newPlainText("Mapleting Monitor Logs", logsText)
        clipboard.setPrimaryClip(clip)
        
        Toast.makeText(this, "Logs copied to clipboard", Toast.LENGTH_SHORT).show()
    }
    
    private fun createTextWatcher(): TextWatcher {
        return object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                // Clear errors when user types
                binding.nicknameLayout.error = null
                binding.packageNameLayout.error = null
            }
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
        
        // Observe logs and update display
        viewModel.logs.observe(this) { logEntries ->
            updateLogsDisplay(logEntries)
        }
    }
    
    private fun updateUIWithConfig(config: MonitorConfig?) {
        if (config != null) {
            binding.nicknameEditText.setText(config.nickname)
            binding.packageNameEditText.setText(config.packageName)
            binding.serverUrlEditText.setText(config.serverUrl)
            
            // Update config display
            val configText = buildString {
                append("• Nickname: ${config.nickname}\n")
                append("• Package: ${config.packageName}\n")
                append("• Server: ${config.serverUrl}\n")
                append("• Interval: ${config.checkInterval / 1000}s")
            }
            binding.configDisplayTextView.text = configText
        } else {
            binding.configDisplayTextView.text = getString(R.string.no_config_saved)
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
        } else {
            binding.statusTextView.text = getString(R.string.status_stopped)
            binding.statusTextView.setTextColor(getColor(R.color.status_stopped))
            binding.startStopButton.text = getString(R.string.start_monitoring)
            
            // Enable inputs when not monitoring
            binding.nicknameEditText.isEnabled = true
            binding.packageNameEditText.isEnabled = true
            binding.serverUrlEditText.isEnabled = true
        }
    }
    
    private fun updateBatteryOptimizationUI(enabled: Boolean) {
        if (enabled) {
            binding.batteryOptimizationTextView.text = getString(R.string.battery_optimization_enabled)
            binding.batteryOptimizationTextView.setTextColor(getColor(R.color.status_stopped))
            binding.batteryOptimizationButton.visibility = android.view.View.VISIBLE
        } else {
            binding.batteryOptimizationTextView.text = getString(R.string.battery_optimization_disabled)
            binding.batteryOptimizationTextView.setTextColor(getColor(R.color.status_running))
            binding.batteryOptimizationButton.visibility = android.view.View.GONE
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
            binding.accessibilityPermissionButton.visibility = android.view.View.GONE
        } else {
            binding.accessibilityPermissionTextView.setTextColor(getColor(R.color.status_stopped))
            binding.accessibilityPermissionButton.visibility = android.view.View.VISIBLE
        }
    }
    
    /**
     * Update the logs display with current log entries
     */
    private fun updateLogsDisplay(logEntries: List<com.mapleting.monitor.data.LogEntry>?) {
        if (logEntries.isNullOrEmpty()) {
            binding.logsTextView.text = "No logs yet"
        } else {
            val logsText = logEntries.joinToString("\n") { entry ->
                entry.getFormattedLog()
            }
            binding.logsTextView.text = logsText
            
            // Auto-scroll to top (most recent log)
            binding.logsScrollView.post {
                binding.logsScrollView.scrollTo(0, 0)
            }
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
            binding.nicknameLayout.error = "Nickname is required"
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
        
        viewModel.setMonitoringState(MonitoringState.Monitoring)
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
     * Show a dialog with all installed apps to allow user to select package name
     */
    private fun showAppPickerDialog() {
        // Get all installed applications
        val pm = packageManager
        val packages = pm.getInstalledApplications(PackageManager.GET_META_DATA)
        
        // Filter out system apps (optional - keep user apps only)
        val userApps = packages.filter { appInfo ->
            (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) == 0
        }
        
        // Create app info list with package name and app label
        val appList = userApps.mapNotNull { appInfo ->
            val label = try {
                appInfo.loadLabel(pm).toString()
            } catch (e: Exception) {
                null
            }
            
            if (label != null) {
                AppInfoItem(label, appInfo.packageName)
            } else {
                null
            }
        }.sortedBy { it.label.lowercase() }
        
        if (appList.isEmpty()) {
            Toast.makeText(this, "No apps found", Toast.LENGTH_SHORT).show()
            return
        }
        
        // Create adapter
        val adapter = AppInfoAdapter(this, appList)
        
        // Show dialog with list
        AlertDialog.Builder(this)
            .setTitle("Select an App to Monitor")
            .setAdapter(adapter) { _, which ->
                // Set selected package name
                val selectedApp = appList[which]
                binding.packageNameEditText.setText(selectedApp.packageName)
                Toast.makeText(
                    this,
                    "Selected: ${selectedApp.label}",
                    Toast.LENGTH_SHORT
                ).show()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
}