package com.prc_ems.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Create the high-priority notification channel for new alerts
            NotificationManager manager = getSystemService(NotificationManager.class);
            
            String channelId = "ems_alerts";
            CharSequence channelName = "EMS Alerts";
            String channelDescription = "High-priority notifications for new emergency alerts.";
            int importance = NotificationManager.IMPORTANCE_HIGH;

            NotificationChannel channel = new NotificationChannel(channelId, channelName, importance);
            channel.setDescription(channelDescription);
            channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);

            // Define the sound for the notification channel
            Uri soundUri = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.siren_alarm);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_ALARM)
                .build();
            channel.setSound(soundUri, audioAttributes);

            manager.createNotificationChannel(channel);
        }
    }
}
