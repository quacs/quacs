#[macro_use]
mod utils;
use utils::*;

mod parsed;
use parsed::{CRN_COURSES, CRN_TIMES};

use lazy_static::lazy_static;
use std::sync::RwLock;

use std::collections::{HashMap, HashSet};

use wasm_bindgen::prelude::*;

lazy_static! {
    static ref CURR_TIMES: RwLock<[u64; 3]> = RwLock::new([0; 3]);
    static ref SCHEDULES: RwLock<Vec<Vec<u32>>> = RwLock::new(Vec::new());
    static ref SELECTED_COURSES: RwLock<HashMap<&'static str, HashSet<u32>>> =
        RwLock::new(HashMap::new());
}

#[wasm_bindgen]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

#[wasm_bindgen(js_name = "generateSchedulesAndConflicts")]
pub fn generate_schedules_and_conflicts() -> usize {
    let selected_courses_map = SELECTED_COURSES.read().unwrap();
    let mut selected_courses: Vec<&HashSet<u32>> = selected_courses_map
        .values()
        .filter(|set| !set.is_empty())
        .collect();

    let schedules_len = if selected_courses.len() == 0 {
        console_log!("Called generateSchedulesAndConflicts with no schedules, short circuiting!");

        *SCHEDULES.write().unwrap() = Vec::new();
        *CURR_TIMES.write().unwrap() = [0; 3];

        0
    } else {
        selected_courses.sort_by_key(|set| set.len());

        bm_start!("generate schedules");
        #[allow(unused_assignments)]
        let mut times = CURR_TIMES.write().unwrap();
        *times = [u64::MAX; 3];
        let schedules = generate_schedules(
            0,
            &selected_courses,
            &mut Vec::with_capacity(selected_courses.len()),
            &mut [0; 3],
            &mut times,
        );
        bm_end!("generate schedules");

        let schedules_len = schedules.len();

        *SCHEDULES.write().unwrap() = schedules;

        schedules_len
    };

    console_log!("Generated {} schedules", schedules_len);
    console_log!("Conflicting times: {:?}", *CURR_TIMES.read().unwrap());

    schedules_len
}

fn generate_schedules(
    idx: usize,
    courses: &Vec<&HashSet<u32>>,
    current_courses: &mut Vec<u32>,
    current_times: &mut [u64; 3],
    overall_times: &mut [u64; 3],
) -> Vec<Vec<u32>> {
    if idx >= courses.len() {
        *overall_times = bitwise_and(overall_times, current_times);
        return vec![current_courses.clone()];
    }

    let mut ret = Vec::new();

    for section in courses[idx] {
        let curr_sec_times = CRN_TIMES.get(section).unwrap();
        let section_conflicts = bitwise_and(CRN_TIMES.get(section).unwrap(), current_times);
        if section_conflicts.iter().any(|cnf| cnf != &0) {
            continue;
        }

        *current_times = bitwise_xor(current_times, curr_sec_times);
        current_courses.push(*section);

        ret.append(&mut generate_schedules(
            idx + 1,
            courses,
            current_courses,
            current_times,
            overall_times,
        ));

        current_courses.pop();
        *current_times = bitwise_xor(current_times, curr_sec_times);
    }

    ret
}

#[wasm_bindgen(js_name = "setSelected")]
pub fn set_selected(crn: u32, selected: bool) {
    console_log!("Setting crn {} to {}", crn, selected);
    let mut selected_courses_map = SELECTED_COURSES.write().unwrap();

    let course_name = CRN_COURSES.get(&crn).unwrap();
    if selected {
        if !selected_courses_map.contains_key(course_name) {
            selected_courses_map.insert(course_name, HashSet::new());
        }

        selected_courses_map
            .get_mut(course_name)
            .unwrap()
            .insert(crn);
    } else if selected_courses_map.contains_key(course_name) {
        selected_courses_map
            .get_mut(course_name)
            .unwrap()
            .remove(&crn);
    }

    console_log!("Selected courses: {:?}", *selected_courses_map);
}

#[wasm_bindgen(js_name = "isInConflict")]
pub fn is_in_conflict(crn: u32) -> bool {
    let selected_courses_map = SELECTED_COURSES.read().unwrap();
    let course_name = CRN_COURSES.get(&crn).unwrap();
    if selected_courses_map
        .get(course_name)
        .unwrap_or(&HashSet::new())
        .contains(&crn)
    {
        return false; // don't mark currently selected courses as conflicting
    }

    let crn_times = CRN_TIMES.get(&crn).unwrap();
    let curr_times = CURR_TIMES.read().unwrap();

    console_log!(
        "Checking if crn {} ({:?}) conflicts with global schedule of {:?}",
        crn,
        crn_times,
        *curr_times
    );

    bitwise_and(crn_times, &curr_times)
        .iter()
        .any(|conf| conf != &0)
}

#[wasm_bindgen(js_name = "getSchedule")]
pub fn get_schedule(idx: usize) -> Box<[u32]> {
    console_log!("Getting schedule #{}", idx);
    SCHEDULES.read().unwrap()[idx].clone().into_boxed_slice()
}
