#[macro_use]
extern crate serde_derive;
extern crate wasm_bindgen;

mod types;
use types::{CourseSecPair, CourseSection};

use std::collections::{HashMap, HashSet};

use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = generateCurrentSchedulesAndConflicts)]
pub fn gen_schedules_and_conflicts(
    selected_crns: &JsValue,
    crn_to_sections: &JsValue,
) -> Box<[u32]> {
    let selected_crns: HashMap<u32, bool> = selected_crns.into_serde().unwrap();
    let crn_to_sections: HashMap<u32, CourseSecPair> = crn_to_sections.into_serde().unwrap();

    let mut selected_courses: HashMap<&String, Vec<&CourseSection>> = HashMap::new();

    for (course, section) in selected_crns
        .iter()
        .filter(|(_, selected)| **selected)
        .map(|(crn, _)| (&crn_to_sections[crn].course, &crn_to_sections[crn].sec))
    {
        match selected_courses.get_mut(&course.id) {
            Some(course_vec) => course_vec.push(section),
            None => {
                selected_courses.insert(&course.id, vec![section]);
            }
        };
    }

    let selected_courses: Vec<Vec<&CourseSection>> = selected_courses
        .into_iter()
        .map(|(_, sections)| sections)
        .collect();

    let mut conflicts = Vec::new();
    let schedules = gen_schedules(
        0,
        &selected_courses,
        &mut HashSet::new(),
        &mut conflicts,
        &crn_to_sections,
    );
    let num_elem_vec = vec![conflicts.len() as u32];

    num_elem_vec
        .into_iter()
        .chain(conflicts.into_iter())
        .chain(schedules.into_iter().flatten())
        .collect()
}

fn gen_schedules(
    idx: usize,
    selected_sections: &Vec<Vec<&CourseSection>>,
    used_sections: &mut HashSet<u32>,
    conflicts: &mut Vec<u32>,
    crn_to_sections: &HashMap<u32, CourseSecPair>,
) -> Vec<Vec<u32>> {
    if idx >= selected_sections.len() {
        let mut curr_schedule_conflicts =
            generate_conflicts(used_sections, crn_to_sections, conflicts);

        if conflicts.is_empty() {
            conflicts.swap_with_slice(&mut curr_schedule_conflicts);
        } else {
            let mut new_conflicts: Vec<u32> = conflicts
                .iter()
                .filter(|crn| curr_schedule_conflicts.contains(crn))
                .map(|i| *i)
                .collect();

            conflicts.swap_with_slice(&mut new_conflicts);
        }

        return vec![used_sections.iter().map(|i| *i).collect()];
    }

    let mut ret = Vec::new();

    for section in selected_sections[idx].iter() {
        if section
            .conflicts
            .iter()
            .any(|(crn, _)| used_sections.contains(crn))
        {
            continue;
        }

        used_sections.insert(section.crn);

        ret.append(&mut gen_schedules(
            idx + 1,
            selected_sections,
            used_sections,
            conflicts,
            crn_to_sections,
        ));

        used_sections.remove(&section.crn);
    }

    return ret;
}

fn generate_conflicts(
    schedule: &HashSet<u32>,
    crn_to_sections: &HashMap<u32, CourseSecPair>,
    overall_conflicts: &Vec<u32>,
) -> Vec<u32> {
    schedule
        .iter()
        .map(|crn| &crn_to_sections[crn].sec)
        .map(|section| {
            section
                .conflicts
                .keys()
                .filter(|crn| !overall_conflicts.contains(crn))
        })
        .flatten()
        .map(|i| *i)
        .collect()
}
