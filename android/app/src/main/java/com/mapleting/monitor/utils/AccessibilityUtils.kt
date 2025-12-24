package com.mapleting.monitor.utils

import android.app.Activity
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.accessibilityservice.AccessibilityService
import android.widget.Toast
import androidx.appcompat.app.AlertDialog

/**
 * Utility functions for AccessibilityService permission handling.
 */
object AccessibilityUtils {
    
    /**
     * Check if an AccessibilityService is enabled.
     * 
     * @param context Application context
     * @param serviceClass The class of the AccessibilityService to check
     * @return true if the service is enabled, false otherwise
     */
    fun isAccessibilityServiceEnabled(
        context: Context,
        serviceClass: Class<out AccessibilityService>
    ): Boolean {
        val expectedComponentName = ComponentName(context, serviceClass)
        
        val enabledServices = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false
        
        // Split by colon (separator used by Android)
        val enabledServicesList = enabledServices.split(":")
        return enabledServicesList.any {
            val componentName = ComponentName.unflattenFromString(it)
            componentName?.equals(expectedComponentName) ?: false
        }
    }
    
    /**
     * Open the accessibility settings screen.
     * 
     * @param context Application context
     */
    fun openAccessibilitySettings(context: Context) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            context.startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(
                context,
                "Unable to open accessibility settings",
                Toast.LENGTH_LONG
            ).show()
        }
    }
    
    /**
     * Show a dialog explaining why accessibility permission is needed.
     * 
     * @param activity The activity to show the dialog from
     * @param onPermissionGranted Callback when user grants permission
     */
    fun showAccessibilityPermissionDialog(
        activity: Activity,
        onPermissionGranted: (() -> Unit)? = null
    ) {
        AlertDialog.Builder(activity)
            .setTitle("Accessibility Permission Required")
            .setMessage(
                "To detect when the monitored app leaves the foreground, " +
                "this app needs Accessibility Service permission.\n\n" +
                "This allows us to:\n" +
                "• Detect when you switch away from the monitored app\n" +
                "• Send accurate disconnection notifications\n\n" +
                "Your data is NOT collected or transmitted. " +
                "This permission is only used to detect app switches."
            )
            .setPositiveButton("Enable") { _, _ ->
                openAccessibilitySettings(activity)
                onPermissionGranted?.invoke()
            }
            .setNegativeButton("Cancel") { _, _ ->
                Toast.makeText(
                    activity,
                    "Monitoring may not work correctly without accessibility permission",
                    Toast.LENGTH_LONG
                ).show()
            }
            .setNeutralButton("Learn More") { _, _ ->
                showDetailedExplanation(activity)
            }
            .setCancelable(false)
            .show()
    }
    
    /**
     * Show detailed explanation about accessibility permission.
     */
    private fun showDetailedExplanation(activity: Activity) {
        AlertDialog.Builder(activity)
            .setTitle("About Accessibility Permission")
            .setMessage(
                "Why is this permission needed?\n\n" +
                "Android restricts apps from detecting when other apps enter or leave the foreground " +
                "for security and privacy reasons. The Accessibility Service API is the standard way " +
                "to detect app changes without requiring root access.\n\n" +
                "What this app does with this permission:\n" +
                "• Monitors window state changes (app switches)\n" +
                "• Sends notifications when the monitored app is no longer visible\n" +
                "• Does NOT read your screen content or personal data\n" +
                "• Does NOT collect or transmit any information\n\n" +
                "Privacy Guarantee:\n" +
                "This app is open source and the code is publicly available. " +
                "You can verify that we only detect app switches and nothing more."
            )
            .setPositiveButton("I Understand") { _, _ ->
                // Return to main dialog
                showAccessibilityPermissionDialog(activity)
            }
            .show()
    }
    
    /**
     * Get the permission status text for display in UI.
     */
    fun getPermissionStatusText(context: Context, serviceClass: Class<out AccessibilityService>): String {
        return if (isAccessibilityServiceEnabled(context, serviceClass)) {
            "Enabled"
        } else {
            "Disabled"
        }
    }
}