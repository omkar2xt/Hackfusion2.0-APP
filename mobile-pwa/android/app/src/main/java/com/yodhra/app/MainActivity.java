package com.yodhra.app;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.storage.FirebaseStorage;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "YODHRA_FIREBASE";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        initFirebase();
    }

    private void initFirebase() {
        try {
            FirebaseApp app = FirebaseApp.initializeApp(this);
            if (app != null) {
                Log.i(TAG, "Firebase initialized successfully: " + app.getName());
            } else {
                Log.i(TAG, "Firebase already initialized by FirebaseInitProvider.");
            }

            // Safe verification of requested service clients
            FirebaseAuth auth = FirebaseAuth.getInstance();
            FirebaseFirestore db = FirebaseFirestore.getInstance();
            FirebaseStorage storage = FirebaseStorage.getInstance();
            Log.i(TAG, "Firebase Auth, Firestore, and Storage clients active.");
        } catch (Exception e) {
            Log.e(TAG, "Safe Firebase initialization error (non-fatal): " + e.getMessage());
        }
    }
}

