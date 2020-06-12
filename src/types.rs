#![allow(non_snake_case)]
use std::collections::HashMap;

#[derive(Serialize, Deserialize)]
pub struct Timeslot {
    pub days: Vec<char>,
    pub timeStart: u16, // [0, 2400)
    pub timeEnd: u16,   // [0, 2400)
    pub instructor: String,
    pub dateStart: String,
    pub dateEnd: String,
    pub location: String,
}

#[derive(Serialize, Deserialize)]
pub struct CourseSection {
    pub title: String,
    pub subj: String,
    pub crse: u32,
    pub sec: String,
    pub crn: u32,

    pub credMin: u8,
    pub credMax: u8,

    pub cap: u16,
    pub rem: u16,

    pub timeslots: Vec<Timeslot>,

    pub conflicts: HashMap<u32, bool>,
}

#[derive(Serialize, Deserialize)]
pub struct Course {
    pub title: String,
    pub subj: String,
    pub crse: u16, // 4 digits
    pub id: String,
    pub sections: Vec<CourseSection>,
}

#[derive(Serialize, Deserialize)]
pub struct CourseSecPair {
    pub course: Course,
    pub sec: CourseSection,
}
