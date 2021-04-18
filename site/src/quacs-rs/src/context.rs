use crate::semester_data::SemesterData;
use crate::utils::*;

use std::collections::HashMap;
use std::collections::HashSet;

pub struct Context<'a, const N: usize> {
    data: SemesterData<'a, N>,
    curr_times: [u64; N],
    schedules: Vec<Vec<u32>>,
    selected_courses: HashMap<&'static str, HashSet<u32>>,
}

impl<'a, const N: usize> Context<'a, N> {
    pub fn from_semester_data(data: SemesterData<'a, N>) -> Self {
        Self {
            data,
            curr_times: [0; N],
            schedules: Vec::new(),
            selected_courses: HashMap::new(),
        }
    }

    pub fn generate_schedules_and_conflicts(&mut self) -> usize {
        let mut selected_courses: Vec<&HashSet<u32>> = self
            .selected_courses
            .values()
            .filter(|set| !set.is_empty())
            .collect();

        let schedules_len = if selected_courses.is_empty() {
            console_log!(
                "Called generateSchedulesAndConflicts with no schedules, short circuiting!"
            );

            self.schedules = Vec::new();
            self.curr_times = [0; N];

            0
        } else {
            selected_courses.sort_by_key(|set| set.len());

            bm_start!("generate schedules");
            self.curr_times = [u64::MAX; N];
            self.schedules = Self::generate_schedules_driver(
                self.data,
                &mut selected_courses,
                &mut self.curr_times,
            );
            bm_end!("generate schedules");

            self.schedules.len()
        };

        console_log!("Generated {} schedules", schedules_len);
        console_log!("Conflicting times: {:?}", self.curr_times);

        schedules_len
    }

    fn generate_schedules_driver(
        data: SemesterData<'a, N>,
        courses: &mut Vec<&HashSet<u32>>,
        global_times: &mut [u64; N],
    ) -> Vec<Vec<u32>> {
        courses.sort_by_cached_key(|set| set.len());

        let (required_times, conflict) = courses
            .iter()
            .take_while(|set| set.len() == 1)
            .map(|set| set.iter().next().unwrap())
            .fold(([0u64; N], false), |(conf, internal_conf), crn| {
                let crn_times = data.crn_times.get(crn).unwrap();

                let conflict_with_prev = bitwise_and(&conf, crn_times).iter().any(|cnf| *cnf != 0);

                (
                    bitwise_or(&conf, crn_times),
                    internal_conf || conflict_with_prev,
                )
            });

        if conflict {
            // There's a conflict inside the 1 section conflict, so abort early
            return Vec::new();
        } else if required_times.iter().all(|cnf| *cnf == 0) {
            // There are no 1 section courses, so we can skip all of the below
            let courses = courses
                .iter()
                .map(|set| (*set).clone())
                .collect::<Vec<HashSet<u32>>>();
            return Self::generate_schedules(
                data,
                0,
                &courses,
                &mut Vec::new(),
                &mut [0; N],
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
                            let crn_times = data.crn_times.get(crn).unwrap();
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

        if courses[0].is_empty() {
            Vec::new()
        } else {
            Self::generate_schedules(
                data,
                0,
                &courses,
                &mut Vec::new(),
                &mut [0; N],
                global_times,
            )
        }
    }

    fn generate_schedules(
        data: SemesterData<'a, N>,
        idx: usize,
        courses: &[HashSet<u32>],
        current_courses: &mut Vec<u32>,
        current_times: &mut [u64; N],
        overall_times: &mut [u64; N],
    ) -> Vec<Vec<u32>> {
        if idx >= courses.len() {
            *overall_times = bitwise_and(overall_times, current_times);
            return vec![current_courses.clone()];
        }

        let mut ret = Vec::new();

        for section in &courses[idx] {
            let curr_sec_times = data.crn_times.get(section).unwrap();
            let section_conflicts =
                bitwise_and(data.crn_times.get(section).unwrap(), current_times);
            if section_conflicts.iter().any(|cnf| cnf != &0) {
                continue;
            }

            *current_times = bitwise_xor(current_times, curr_sec_times);
            current_courses.push(*section);

            ret.append(&mut Self::generate_schedules(
                data,
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

    pub fn set_selected(&mut self, crn: u32, selected: bool) {
        if !self.data.crn_courses.contains_key(&crn) {
            // Old CRN, ignore
            return;
        }

        console_log!("Setting crn {} to {}", crn, selected);

        let course_name = self.data.crn_courses.get(&crn).unwrap();
        if selected {
            if !self.selected_courses.contains_key(course_name) {
                self.selected_courses.insert(course_name, HashSet::new());
            }

            self.selected_courses
                .get_mut(course_name)
                .unwrap()
                .insert(crn);
        } else if self.selected_courses.contains_key(course_name) {
            let crn_set = self.selected_courses.get_mut(course_name).unwrap();
            crn_set.remove(&crn);
            if crn_set.is_empty() {
                self.selected_courses.remove(course_name);
            }
        }

        console_log!("Selected courses: {:?}", self.selected_courses);
    }

    pub fn everything_conflicts(&self) -> bool {
        self.curr_times.iter().all(|cnf| cnf == &u64::MAX)
    }

    pub fn is_in_conflict(&self, crn: u32) -> bool {
        if self.everything_conflicts() {
            return true;
        } else if !self.data.crn_courses.contains_key(&crn) {
            // Old CRN, ignore
            return false;
        }

        let course_name = self.data.crn_courses.get(&crn).unwrap();

        if self.selected_courses.get(course_name).is_some() {
            console_log!("Checking if crn {} conflicts with global schedule", crn);

            // Assuming we didn't have other sections from this course selected, do we conflict?
            // This check stops us from saying that every section of a course conflicts if we've
            // just selected one, since courses usually have a common timeslot (e.g. test slots).
            // It also lets users see which sections they selected conflict with stuff.
            let mut course_vec: Vec<&HashSet<u32>> = self
                .selected_courses
                .iter()
                .filter(|(name, _)| name != &course_name)
                .map(|(_, sections)| sections)
                .collect();
            let mut tmp_set = HashSet::new();
            tmp_set.insert(crn);
            course_vec.push(&tmp_set);

            Self::generate_schedules_driver(self.data, &mut course_vec, &mut [0; N]).is_empty()
        } else {
            // This is a normal section, so we can just check if the timeslots overlap
            let crn_times = self.data.crn_times.get(&crn).unwrap();

            console_log!(
                "Checking if crn {} ({:?}) conflicts with global schedule of {:?}",
                crn,
                crn_times,
                self.curr_times
            );

            bitwise_and(crn_times, &self.curr_times)
                .iter()
                .any(|conf| conf != &0)
        }
    }

    pub fn get_schedule(&self, idx: usize) -> Box<[u32]> {
        if self.schedules.is_empty() {
            console_log!(
                "Requested schedule #{}, but no schedules selected... Returning empty schedule",
                idx
            );
            Box::new([])
        } else {
            console_log!("Getting schedule #{}", idx);
            self.schedules[idx].clone().into_boxed_slice()
        }
    }
}
