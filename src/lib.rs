#[macro_use]
mod utils;
mod parsed;
use parsed::TIMES;

use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = "generateSchedulesAndConflicts")]
pub fn generate_schedules_and_conflicts(selected_courses: &JsValue) -> Box<[u64]> {
    let mut selected_courses: Vec<Vec<u32>> = selected_courses.into_serde().unwrap();
    selected_courses.sort_by_key(|vec| vec.len());

    console_log!("Selected courses: {:#?}", selected_courses);

    bm_start!("generate schedules");
    let mut times = [0; 3];
    let schedules = generate_schedules(
        0,
        &selected_courses,
        &mut Vec::with_capacity(selected_courses.len()),
        &mut [0; 3],
        &mut times,
    );
    bm_end!("generate schedules");

    console_log!("Generated {} schedules", schedules.len());

    let total_size = schedules.len() * selected_courses.len() + 3;

    let mut ret = Vec::with_capacity(total_size);

    for time in &times {
        ret.push(*time);
    }

    for schedule in &schedules {
        for crn in schedule {
            ret.push(*crn as u64);
        }
    }

    console_log!("Output array size: {}", ret.len());

    ret.into_boxed_slice()
}

fn generate_schedules(
    idx: usize,
    courses: &Vec<Vec<u32>>,
    current_courses: &mut Vec<u32>,
    current_times: &mut [u64; 3],
    overall_times: &mut [u64; 3],
) -> Vec<Vec<u32>> {
    if idx >= courses.len() {
        for i in 0..3 {
            overall_times[i] |= current_times[i];
        }

        return vec![current_courses.clone()];
    }

    let mut ret = Vec::new();

    for section in &courses[idx] {
        let curr_sec_times = TIMES.get(section).unwrap();
        let section_conflicts = bitwise_and(TIMES.get(section).unwrap(), current_times);
        if section_conflicts.iter().any(|cnf| cnf != &0) {
            continue;
        }

        bitwise_xor_mut(current_times, curr_sec_times);
        current_courses.push(*section);

        ret.append(&mut generate_schedules(
            idx + 1,
            courses,
            current_courses,
            current_times,
            overall_times,
        ));

        current_courses.pop();
        bitwise_xor_mut(current_times, curr_sec_times);
    }

    ret
}

fn bitwise_and(t1: &[u64; 3], t2: &[u64; 3]) -> [u64; 3] {
    let mut ret = [0; 3];
    for i in 0..3 {
        ret[i] = t1[i] & t2[i];
    }
    ret
}

fn bitwise_xor_mut(t1: &mut [u64; 3], t2: &[u64; 3]) {
    for i in 0..3 {
        t1[i] ^= t2[i];
    }
}
