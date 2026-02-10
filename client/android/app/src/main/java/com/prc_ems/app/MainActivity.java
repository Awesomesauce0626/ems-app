package com.prc_ems.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LocationServicePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
