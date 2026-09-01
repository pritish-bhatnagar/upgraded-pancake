// The Android build enters through lib.rs; this exists so the same code can be
// run on a desktop while working on it.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    upgraded_pancake_mobile::run()
}
