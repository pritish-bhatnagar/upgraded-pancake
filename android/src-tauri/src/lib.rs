//! The whole application: open a window on the bundled Angular build.
//!
//! The web deployment serves `dist/upgraded-pancake` from pm2; here the same
//! directory is packaged into the APK and loaded by the system webview, so the
//! phone and the website cannot drift apart. Everything the app does — Firebase
//! auth and data, the API on port 3000, HLS playback — is done by the JavaScript
//! over the network exactly as it is in a browser.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
