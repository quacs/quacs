#[macro_use]
mod utils;
mod context;
mod data;
mod semester_data;
mod test_context;
mod wasm_context;

use wasm_bindgen::prelude::*;
use wasm_context::WasmContext;

#[wasm_bindgen]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

#[wasm_bindgen(js_name = "generateSchedulesAndConflicts")]
pub fn generate_schedules_and_conflicts(ctx: &mut WasmContext) -> usize {
    ctx.generate_schedules_and_conflicts()
}

#[wasm_bindgen(js_name = "setSelected")]
pub fn set_selected(ctx: &mut WasmContext, crn: u32, selected: bool) {
    ctx.set_selected(crn, selected);
}

#[wasm_bindgen(js_name = "everythingConflicts")]
pub fn everything_conflicts(ctx: &WasmContext) -> bool {
    ctx.everything_conflicts()
}

#[wasm_bindgen(js_name = "isInConflict")]
pub fn is_in_conflict(ctx: &WasmContext, crn: u32) -> bool {
    ctx.is_in_conflict(crn)
}

#[wasm_bindgen(js_name = "getSchedule")]
pub fn get_schedule(ctx: &WasmContext, idx: usize) -> Box<[u32]> {
    ctx.get_schedule(idx)
}
