package com.talons.farm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.view.WindowManager;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebView;

import androidx.core.content.ContextCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

// The game fills the whole screen (the status and navigation bars slide in on a swipe and hide
// again), and the screen stays on while the farm is being played. If Android closes the game's
// page to free memory, the game opens again from its last save instead of the whole app closing.
// The page is told when the phone runs hot or is saving battery, and draws less then.
public class MainActivity extends BridgeActivity {
    // the screen stays on this long after the last touch, then goes off as the phone's own
    // screen timeout says: a farm left open on the table does not keep the screen lit for hours
    private static final long AWAKE_MS = 3 * 60 * 1000;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable letSleep = () -> getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    private BroadcastReceiver powerSaveReceiver;
    // a PowerManager.OnThermalStatusChangedListener (Android 10 and later only)
    private Object thermalListener;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        stayAwake();
        // the phone's font size setting must not blow up the game's buttons and panels
        if (getBridge() != null && getBridge().getWebView() != null) getBridge().getWebView().getSettings().setTextZoom(100);
        // the page that draws the farm was closed by Android (out of memory on a busy farm): by
        // default that takes the whole app down. Start the screen again instead; the farm is
        // saved every few seconds, so it comes back where it was.
        if (getBridge() != null) {
            getBridge().addWebViewListener(new WebViewListener() {
                @Override
                public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                    recreate();
                    return true;
                }

                @Override
                public void onPageLoaded(WebView webView) {
                    sendPowerState();
                }
            });
        }
        // the farm also fills the strip beside the camera cutout
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(lp);
        }
        hideBars();
        // a hot phone (Android 10 and later) or the phone's battery saver: the page draws fewer
        // frames a second until it passes
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            PowerManager.OnThermalStatusChangedListener l = status -> sendPowerState();
            pm.addThermalStatusListener(l);
            thermalListener = l;
        }
        powerSaveReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                sendPowerState();
            }
        };
        ContextCompat.registerReceiver(this, powerSaveReceiver, new IntentFilter(PowerManager.ACTION_POWER_SAVE_MODE_CHANGED), ContextCompat.RECEIVER_NOT_EXPORTED);
    }

    @Override
    public void onResume() {
        super.onResume();
        stayAwake();
        sendPowerState();
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(letSleep);
        if (powerSaveReceiver != null) {
            try {
                unregisterReceiver(powerSaveReceiver);
            } catch (IllegalArgumentException ignored) {
                // never registered
            }
            powerSaveReceiver = null;
        }
        if (thermalListener != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) pm.removeThermalStatusListener((PowerManager.OnThermalStatusChangedListener) thermalListener);
            thermalListener = null;
        }
        super.onDestroy();
    }

    // every touch keeps the screen on for a few more minutes
    @Override
    public void onUserInteraction() {
        super.onUserInteraction();
        stayAwake();
    }

    private void stayAwake() {
        // the flag is set only when it is off: setting a window flag is a round trip to the system
        if ((getWindow().getAttributes().flags & WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) == 0) {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        }
        handler.removeCallbacks(letSleep);
        handler.postDelayed(letSleep, AWAKE_MS);
    }

    // tells the page how hot the phone is (0 cool to 6 shutting down) and whether the phone's
    // battery saver is on; the page listens for the 'farm-power' event
    private void sendPowerState() {
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm == null || getBridge() == null || getBridge().getWebView() == null) return;
        int thermal = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q ? pm.getCurrentThermalStatus() : 0;
        String js = "window.__power={thermal:" + thermal + ",saver:" + pm.isPowerSaveMode() + "};window.dispatchEvent(new Event('farm-power'));";
        WebView wv = getBridge().getWebView();
        wv.post(() -> wv.evaluateJavascript(js, null));
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideBars();
    }

    private void hideBars() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.hide(WindowInsetsCompat.Type.systemBars());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
