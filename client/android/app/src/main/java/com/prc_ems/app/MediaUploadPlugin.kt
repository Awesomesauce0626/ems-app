package com.prc_ems.app

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "MediaUpload")
class MediaUploadPlugin : Plugin() {

    @PluginMethod
    fun uploadMedia(call: PluginCall) {
        val filePath = call.getString("filePath") ?: run {
            call.reject("File path is required.")
            return
        }

        // The file path from Capacitor is a URI, so we need to get the actual path
        val realPath = context.contentResolver.openInputStream(android.net.Uri.parse(filePath))?.let {
            val file = java.io.File.createTempFile("upload", ".tmp", context.cacheDir)
            file.outputStream().use { output ->
                it.copyTo(output)
            }
            file.absolutePath
        } ?: run {
            call.reject("Could not get real path from URI.")
            return
        }

        CloudinaryUploader.uploadReportMedia(realPath, {
            url -> val ret = JSObject()
            ret.put("url", url)
            call.resolve(ret)
        }, {
            error -> call.reject("Upload failed: $error")
        })
    }
}
