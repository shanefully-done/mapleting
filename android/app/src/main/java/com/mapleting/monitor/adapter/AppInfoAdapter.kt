package com.mapleting.monitor.adapter

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.TextView
import com.mapleting.monitor.data.AppInfoItem
import com.mapleting.monitor.R

/**
 * Custom adapter for displaying installed apps in a dialog
 * Shows both the app label (name) and package name
 */
class AppInfoAdapter(
    context: Context,
    private val apps: List<AppInfoItem>
) : ArrayAdapter<AppInfoItem>(context, R.layout.item_app_info, apps) {
    
    override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
        val view = convertView ?: LayoutInflater.from(context)
            .inflate(R.layout.item_app_info, parent, false)
        
        val app = apps[position]
        
        val labelTextView = view.findViewById<TextView>(R.id.appLabelTextView)
        val packageTextView = view.findViewById<TextView>(R.id.packageNameTextView)
        
        labelTextView.text = app.label
        packageTextView.text = app.packageName
        
        return view
    }
}