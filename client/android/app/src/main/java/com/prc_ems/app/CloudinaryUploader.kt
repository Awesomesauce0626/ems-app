package com.prc_ems.app

import com.cloudinary.android.MediaManager
import com.cloudinary.android.callback.ErrorInfo
import com.cloudinary.android.callback.UploadCallback

object CloudinaryUploader {
    fun uploadReportMedia(filePath: String, onComplete: (String) -> Unit, onError: (String) -> Unit) {
        MediaManager.get().upload(filePath)
            .unsigned("prc-ems-app") // Preset name updated
            .callback(object : UploadCallback {
                override fun onSuccess(requestId: String?, resultData: Map<*, *>?) {
                    val url = resultData?.get("secure_url").toString()
                    onComplete(url)
                }

                override fun onError(requestId: String?, error: ErrorInfo?) {
                    onError(error?.description ?: "Unknown error")
                }

                override fun onReschedule(requestId: String?, error: ErrorInfo?) {
                    // Not implemented
                }

                override fun onProgress(requestId: String?, bytes: Long, totalBytes: Long) {
                    // Not implemented
                }

                override fun onStart(requestId: String?) {
                    // Not implemented
                }
            }).dispatch()
    }
}
