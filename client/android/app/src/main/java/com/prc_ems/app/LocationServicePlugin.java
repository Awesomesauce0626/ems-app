package com.prc_ems.app;

import android.Manifest;
import android.content.Intent;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "LocationService",
    permissions = {
        @Permission(
            strings = { Manifest.permission.ACCESS_FINE_LOCATION },
            alias = "fineLocation"
        )
    }
)
public class LocationServicePlugin extends Plugin {

    private void startTrackingService() {
        Intent intent = new Intent(getContext(), LocationTrackingService.class);
        getContext().startService(intent);
    }

    @PluginMethod
    public void startService(PluginCall call) {
        if (getPermissionState("fineLocation") != PermissionState.GRANTED) {
            requestPermissionForAlias("fineLocation", call, "locationPermissionCallback");
        } else {
            startTrackingService();
            call.resolve();
        }
    }

    @PluginMethod
    public void stopService(PluginCall call) {
        Intent intent = new Intent(getContext(), LocationTrackingService.class);
        getContext().stopService(intent);
        call.resolve();
    }

    @PermissionCallback
    private void locationPermissionCallback(PluginCall call) {
        if (getPermissionState("fineLocation") == PermissionState.GRANTED) {
            startTrackingService();
            call.resolve();
        } else {
            call.reject("Location permission is required to go on duty.");
        }
    }
}
