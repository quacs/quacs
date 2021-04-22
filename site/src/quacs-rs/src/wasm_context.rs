use crate::context::Context;
use crate::data::BIT_VEC_LEN;
use crate::semester_data::SemesterData;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct WasmContext(Context<'static, BIT_VEC_LEN>);

impl Default for WasmContext {
    fn default() -> Self {
        Self(Context::from_semester_data(SemesterData::from_mod()))
    }
}

#[wasm_bindgen]
impl WasmContext {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Default::default()
    }

    #[wasm_bindgen(js_name = "generateSchedulesAndConflicts")]
    pub fn generate_schedules_and_conflicts(&mut self) -> usize {
        self.0.generate_schedules_and_conflicts()
    }

    #[wasm_bindgen(js_name = "setSelected")]
    pub fn set_selected(&mut self, crn: u32, selected: bool) {
        self.0.set_selected(crn, selected)
    }

    #[wasm_bindgen(js_name = "everythingConflicts")]
    pub fn everything_conflicts(&self) -> bool {
        self.0.everything_conflicts()
    }

    #[wasm_bindgen(js_name = "isInConflict")]
    pub fn is_in_conflict(&self, crn: u32) -> bool {
        self.0.is_in_conflict(crn)
    }

    #[wasm_bindgen(js_name = "getSchedule")]
    pub fn get_schedule(&self, idx: usize) -> Box<[u32]> {
        self.0.get_schedule(idx)
    }
}
