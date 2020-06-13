#[macro_use]
extern crate serde_derive;

extern crate wasm_bindgen;
extern crate web_sys;

#[macro_use]
mod utils;

mod types;
use types::CrnToSec;

use std::collections::{HashMap, HashSet};

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

#[wasm_bindgen(js_name = generateCurrentSchedulesAndConflicts)]
pub fn gen_schedules_and_conflicts(
    selected_crns: &JsValue,
    crn_to_sections: &JsValue,
) -> Box<[u32]> {
    bm_start!("parse inputs");
    let selected_crns: HashMap<u32, bool> = selected_crns.into_serde().unwrap();

    let crn_to_sections: HashMap<u32, CrnToSec> = crn_to_sections.into_serde().unwrap();
    bm_end!("parse inputs");

    bm_start!("calculation");
    let mut selected_courses: HashMap<&String, Vec<u32>> = HashMap::new();

    // Map selected sections to courses
    for (course, section) in selected_crns
        .iter()
        .filter(|(_, selected)| **selected)
        .map(|(crn, _)| (&crn_to_sections[crn].course, crn))
    {
        match selected_courses.get_mut(&course) {
            Some(course_vec) => course_vec.push(*section),
            None => {
                selected_courses.insert(&course, vec![*section]);
            }
        };
    }

    let selected_courses: Vec<&Vec<u32>> = selected_courses.values().collect();

    let mut conflicts = HashSet::new();
    let schedules = gen_schedules(
        0,
        &selected_courses,
        &mut Vec::new(),
        &mut conflicts,
        &crn_to_sections,
    );
    let magic_num_vec = vec![selected_courses.len() as u32, conflicts.len() as u32];

    let ret = magic_num_vec
        .into_iter()
        .chain(conflicts.into_iter())
        .chain(schedules.into_iter().flatten())
        .collect();
    bm_end!("calculation");

    ret
}

fn gen_schedules(
    idx: usize,
    selected_crns: &Vec<&Vec<u32>>,
    used_sections: &mut Vec<u32>,
    overall_conflicts: &mut HashSet<u32>,
    crn_to_sections: &HashMap<u32, CrnToSec>,
) -> Vec<Vec<u32>> {
    if idx >= selected_crns.len() {
        if overall_conflicts.is_empty() {
            let initial_conflicts = generate_initial_conflicts(used_sections, crn_to_sections);

            overall_conflicts.reserve(initial_conflicts.len());
            initial_conflicts.iter().for_each(|crn| {
                overall_conflicts.insert(*crn);
            });
        } else {
            let curr_schedule_conflicts =
                generate_conflicts(used_sections, crn_to_sections, overall_conflicts);

            overall_conflicts.retain(|conf| curr_schedule_conflicts.contains(conf));
        }

        return vec![used_sections.iter().map(|i| *i).collect()];
    }

    let mut ret = Vec::new();

    for crn in selected_crns[idx].iter() {
        if crn_to_sections[crn]
            .conflicts
            .iter()
            .any(|crn| used_sections.contains(crn))
        {
            continue;
        }

        used_sections.push(*crn);

        ret.append(&mut gen_schedules(
            idx + 1,
            selected_crns,
            used_sections,
            overall_conflicts,
            crn_to_sections,
        ));

        used_sections.pop();
    }

    return ret;
}

fn generate_conflicts(
    schedule: &Vec<u32>,
    crn_to_sections: &HashMap<u32, CrnToSec>,
    overall_conflicts: &HashSet<u32>,
) -> Vec<u32> {
    schedule
        .iter()
        .map(|crn| &crn_to_sections[crn])
        .map(|section| {
            section
                .conflicts
                .iter()
                .filter(|crn| overall_conflicts.contains(crn))
        })
        .flatten()
        .map(|i| *i)
        .collect()
}

fn generate_initial_conflicts(
    schedule: &Vec<u32>,
    crn_to_sections: &HashMap<u32, CrnToSec>,
) -> Vec<u32> {
    schedule
        .iter()
        .map(|crn| &crn_to_sections[crn])
        .map(|section| section.conflicts.iter())
        .flatten()
        .map(|i| *i)
        .collect()
}
