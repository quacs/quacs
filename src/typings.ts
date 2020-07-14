export interface Day {
  name: string;
  short: string;
}

export interface Timeslot {
  days: string[];
  timeStart: number;
  timeEnd: number;
  instructor: string;
  dateStart: string;
  dateEnd: string;
  location: string;
}

export interface CourseSection {
  title: string;
  subj: string;
  crse: number;
  sec: string;
  crn: number;

  credMin: number;
  credMax: number;

  cap: number;
  rem: number;

  timeslots: Timeslot[];
}

export interface Course {
  title: string;
  subj: string;
  crse: number;
  id: string;
  sections: CourseSection[];
}

export interface Department {
  name: string;
  code: string;
  courses: Course[];
}

export interface CatalogCourse {
  name: string;
  description?: string;
  subj: string;
  crse: string; // TODO: number?
  coid: string;
  url: string;
}

export interface CourseSize {
  avail: number;
  crn: number;
  num: number;
  seats: number;
  students: number;
}

/*
export interface SelectedSection {
  section: CourseSection;
  course: Course;
  dept?: Department;
  selected: boolean;
}
*/

export enum TimePreference {
  Military = "M",
  Standard = "S",
}

export interface PrerequisiteJSON {
  [crn: number]: {
    corequisites?: string[];
    cross_list_courses?: string[];
    restrictions?: Restriction;
    prerequisites?: Prerequisite;
  };
}

export interface Prerequisite {
  type: string;
  solo: string[];
  nested: Prerequisite[];
}

export interface Restriction {
  level: { must_be: string[]; may_not_be: string[] };
  major: { must_be: string[]; may_not_be: string[] };
  classification: { must_be: string[]; may_not_be: string[] };
  field_of_study: { must_be: string[]; may_not_be: string[] };
  degree: { must_be: string[]; may_not_be: string[] };
  college: { must_be: string[]; may_not_be: string[] };
  campus: { must_be: string[]; may_not_be: string[] };
}

export interface Section {
  crn: number;
  conflicts: number[];
  attribute: string;
}
