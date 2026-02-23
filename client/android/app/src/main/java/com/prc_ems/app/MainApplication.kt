package com.prc_ems.app

import android.content.Context
import androidx.multidex.MultiDex
import com.cloudinary.android.MediaManager
import com.getcapacitor.BridgeApplication

class MainApplication : BridgeApplication() {
    override fun attachBaseContext(base: Context) {
        super.attachBaseContext(base)
        MultiDex.install(this)
    }

    override fun onCreate() {
        super.onCreate()

        // Initialize Cloudinary only if the credentials are provided
        // This prevents crashes if local.properties is missing
        if (BuildConfig.CLOUDINARY_CLOUD_NAME.isNotEmpty()) {
            val config = mapOf(
                "cloud_name" to BuildConfig.CLOUDINARY_CLOUD_NAME,
                "api_key" to BuildConfig.CLOUDINARY_API_KEY,
                "api_secret" to BuildConfig.CLOUDINARY_API_SECRET
            )
            MediaManager.init(this, config)
        }
    }
}
