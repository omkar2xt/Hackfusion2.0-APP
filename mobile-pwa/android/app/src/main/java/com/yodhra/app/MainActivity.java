package com.yodhra.app;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;
import com.google.firebase.analytics.FirebaseAnalytics;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.storage.FirebaseStorage;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "YODHRA_FIREBASE";
    private FirebaseAnalytics mFirebaseAnalytics;

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

            // Analytics App Open Event
            mFirebaseAnalytics = FirebaseAnalytics.getInstance(this);
            Bundle analyticsBundle = new Bundle();
            analyticsBundle.putString(FirebaseAnalytics.Param.ITEM_ID, "app_startup");
            analyticsBundle.putString(FirebaseAnalytics.Param.ITEM_NAME, "YODHRA_CYBER_APP_OPEN");
            analyticsBundle.putString(FirebaseAnalytics.Param.CONTENT_TYPE, "session");
            mFirebaseAnalytics.logEvent(FirebaseAnalytics.Event.APP_OPEN, analyticsBundle);
            Log.i(TAG, "Firebase Analytics APP_OPEN event recorded.");

            // Retrieve FCM Device Registration Token
            FirebaseMessaging.getInstance().getToken()
                .addOnCompleteListener(task -> {
                    if (!task.isSuccessful()) {
                        Log.w(TAG, "Fetching FCM registration token failed: ", task.getException());
                        return;
                    }
                    String token = task.getResult();
                    Log.i(TAG, "Device FCM Registration Token: " + token);
                });

        } catch (Exception e) {
            Log.e(TAG, "Safe Firebase initialization error (non-fatal): " + e.getMessage());
        }
    }
}

