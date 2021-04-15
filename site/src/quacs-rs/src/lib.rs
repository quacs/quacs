#[macro_use]
mod utils;
mod context;
mod data;
mod semester_data;
mod wasm_context;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}
