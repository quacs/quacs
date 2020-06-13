/*
#![allow(non_snake_case)]
use std::collections::HashMap;

#[derive(Serialize, Deserialize)]
pub struct Timeslot {
    pub days: Vec<char>,
    pub timeStart: i32,
    pub timeEnd: i32,
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

    pub credMin: u32,
    pub credMax: u32,

    pub cap: u32,
    pub rem: i32,

    pub timeslots: Vec<Timeslot>,

    pub conflicts: HashMap<u32, bool>,
}

#[derive(Serialize, Deserialize)]
pub struct Course {
    pub title: String,
    pub subj: String,
    pub crse: u32,
    pub id: String,
    pub sections: Vec<CourseSection>,
}
*/

#[derive(Serialize, Deserialize)]
pub struct CrnToSec {
    pub course: String,
    pub conflicts: Vec<u32>,
}

/*
#[derive(Serialize, Deserialize)]
pub struct CourseSecPair {
    pub course: Course,
    pub sec: CourseSection,
}
*/
