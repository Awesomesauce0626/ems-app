package com.prc_ems.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.Looper;
import androidx.core.app.NotificationCompat;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;
import org.json.JSONObject;
import java.net.URISyntaxException;
import io.socket.client.IO;
import io.socket.client.Socket;

public class LocationTrackingService extends Service {

    private static final String CHANNEL_ID = "LocationTrackingServiceChannel";
    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;
    private Socket mSocket;

    @Override
    public void onCreate() {
        super.onCreate();
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);

        // Connect to Socket.IO server
        try {
            // IMPORTANT: Replace with your actual backend URL in production
            mSocket = IO.socket("https://ems-app-e26y.onrender.com");
        } catch (URISyntaxException e) {
            throw new RuntimeException(e);
        }
        mSocket.connect();

        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult locationResult) {
                if (locationResult == null) {
                    return;
                }
                for (android.location.Location location : locationResult.getLocations()) {
                    if (location != null && mSocket.connected()) {
                        try {
                            JSONObject locationData = new JSONObject();
                            // This structure must match what your frontend hook sends
                            JSONObject userObj = new JSONObject();
                            userObj.put("id", "native_" + Build.ID); // Create a semi-unique ID
                            userObj.put("name", "On-Duty Responder (Native)");
                            
                            JSONObject locationObj = new JSONObject();
                            locationObj.put("lat", location.getLatitude());
                            locationObj.put("lng", location.getLongitude());

                            locationData.put("user", userObj);
                            locationData.put("location", locationObj);

                            mSocket.emit("ems-location-update", locationData);
                        } catch (Exception e) {
                            // Ignore JSON errors
                        }
                    }
                }
            }
        };
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        createNotificationChannel();
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("PRC-CN EMS On Duty")
                .setContentText("Your location is being shared with the command center.")
                .setSmallIcon(R.mipmap.ic_launcher)
                .build();

        startForeground(1, notification);

        startLocationUpdates();

        return START_STICKY;
    }

    private void startLocationUpdates() {
        LocationRequest locationRequest = new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 15000) // 15 seconds
                .setWaitForAccurateLocation(false)
                .setMinUpdateIntervalMillis(10000) // 10 seconds
                .setMaxUpdateDelayMillis(20000)
                .build();
        try {
             fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper());
        } catch (SecurityException e) {
            // This would happen if permissions are not granted, which we handle elsewhere
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        fusedLocationClient.removeLocationUpdates(locationCallback);
        if (mSocket != null) {
            mSocket.disconnect();
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Location Tracking Service",
                    NotificationManager.IMPORTANCE_DEFAULT
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(serviceChannel);
        }
    }
}
