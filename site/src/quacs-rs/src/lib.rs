#[macro_use]
mod utils;
use utils::*;

mod data;
pub use data::BIT_VEC_LEN;
use data::{CRN_COURSES, CRN_TIMES};

use lazy_static::lazy_static;
use std::sync::RwLock;

use std::collections::{HashMap, HashSet};

use wasm_bindgen::prelude::*;

lazy_static! {
    static ref CURR_TIMES: RwLock<[u64; BIT_VEC_LEN]> = RwLock::new([0; BIT_VEC_LEN]);
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
        *CURR_TIMES.write().unwrap() = [0; BIT_VEC_LEN];

        0
    } else {
        selected_courses.sort_by_key(|set| set.len());

        bm_start!("generate schedules");
        #[allow(unused_assignments)]
        let mut times = CURR_TIMES.write().unwrap();
        *times = [u64::MAX; BIT_VEC_LEN];
        let schedules = generate_schedules_driver(&mut selected_courses, &mut times);
        bm_end!("generate schedules");

        let schedules_len = schedules.len();

        *SCHEDULES.write().unwrap() = schedules;

        schedules_len
    };

    console_log!("Generated {} schedules", schedules_len);
    console_log!("Conflicting times: {:?}", *CURR_TIMES.read().unwrap());

    schedules_len
}

fn generate_schedules_driver(
    courses: &mut Vec<&HashSet<u32>>,
    global_times: &mut [u64; BIT_VEC_LEN],
) -> Vec<Vec<u32>> {
    courses.sort_by_cached_key(|set| set.len());

    let (required_times, conflict) = courses
        .iter()
        .take_while(|set| set.len() == 1)
        .map(|set| set.iter().next().unwrap())
        .fold(
            ([0u64; BIT_VEC_LEN], false),
            |(conf, internal_conf), crn| {
                let crn_times = CRN_TIMES.get(crn).unwrap();

                let conflict_with_prev = bitwise_and(&conf, crn_times).iter().any(|cnf| *cnf != 0);

                (
                    bitwise_or(&conf, crn_times),
                    internal_conf || conflict_with_prev,
                )
            },
        );

    if conflict {
        // There's a conflict inside the 1 section conflict, so abort early
        return Vec::new();
    } else if required_times.iter().all(|cnf| *cnf == 0) {
        // There are no 1 section courses, so we can skip all of the below
        let courses = courses.iter().map(|set| (*set).clone()).collect();
        return generate_schedules(
            0,
            &courses,
            &mut Vec::new(),
            &mut [0; BIT_VEC_LEN],
            global_times,
        );
    }

    let mut courses: Vec<HashSet<u32>> = courses
        .iter()
        .map(|set| {
            if set.len() == 1 {
                (*set).clone()
            } else {
                set.iter()
                    .filter(|crn| {
                        let crn_times = CRN_TIMES.get(crn).unwrap();
                        bitwise_and(crn_times, &required_times)
                            .iter()
                            .all(|cnf| cnf == &0)
                    })
                    .cloned()
                    .collect()
            }
        })
        .collect();

    courses.sort_by_cached_key(|set| set.len());

    if courses[0].len() == 0 {
        Vec::new()
    } else {
        generate_schedules(
            0,
            &courses,
            &mut Vec::new(),
            &mut [0; BIT_VEC_LEN],
            global_times,
        )
    }
}

fn generate_schedules(
    idx: usize,
    courses: &Vec<HashSet<u32>>,
    current_courses: &mut Vec<u32>,
    current_times: &mut [u64; BIT_VEC_LEN],
    overall_times: &mut [u64; BIT_VEC_LEN],
) -> Vec<Vec<u32>> {
    if idx >= courses.len() {
        *overall_times = bitwise_and(overall_times, current_times);
        return vec![current_courses.clone()];
    }

    let mut ret = Vec::new();

    for section in &courses[idx] {
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
    if !CRN_COURSES.contains_key(&crn) {
        // Old CRN, ignore
        return;
    }

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
        let crn_set = selected_courses_map.get_mut(course_name).unwrap();
        crn_set.remove(&crn);
        if crn_set.is_empty() {
            selected_courses_map.remove(course_name);
        }
    }

    console_log!("Selected courses: {:?}", *selected_courses_map);
}

#[wasm_bindgen(js_name = "everythingConflicts")]
pub fn everything_conflicts() -> bool {
    CURR_TIMES
        .read()
        .unwrap()
        .iter()
        .all(|cnf| cnf == &u64::MAX)
}

#[wasm_bindgen(js_name = "isInConflict")]
pub fn is_in_conflict(crn: u32) -> bool {
    if everything_conflicts() {
        return true;
    } else if !CRN_COURSES.contains_key(&crn) {
        // Old CRN, ignore
        return false;
    }

    let selected_courses_map = SELECTED_COURSES.read().unwrap();
    let course_name = CRN_COURSES.get(&crn).unwrap();

    if selected_courses_map.get(course_name).is_some() {
        // Assuming we didn't have other sections from this course selected, do we conflict?
        // This check stops us from saying that every section of a course conflicts if we've
        // just selected one, since courses usually have a common timeslot (e.g. test slots).
        // It also lets users see which sections they selected conflict with stuff.
        let mut course_vec: Vec<&HashSet<u32>> = selected_courses_map
            .iter()
            .filter(|(name, _)| name != &course_name)
            .map(|(_, sections)| sections)
            .collect();
        let mut tmp_set = HashSet::new();
        tmp_set.insert(crn);
        course_vec.push(&tmp_set);

        generate_schedules_driver(&mut course_vec, &mut [0; BIT_VEC_LEN]).is_empty()
    } else {
        // This is a normal section, so we can just check if the timeslots overlap
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
}

#[wasm_bindgen(js_name = "getSchedule")]
pub fn get_schedule(idx: usize) -> Box<[u32]> {
    if SCHEDULES.read().unwrap().is_empty() {
        console_log!(
            "Requested schedule #{}, but no schedules selected... Returning empty schedule",
            idx
        );
        Box::new([])
    } else {
        console_log!("Getting schedule #{}", idx);
        SCHEDULES.read().unwrap()[idx].clone().into_boxed_slice()
    }
}
