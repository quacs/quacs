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
  attribute: string;
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

export type Prerequisite = GroupPrerequisite | CoursePrerequisite;

export interface GroupPrerequisite {
  type: "and" | "or";
  nested: Prerequisite[];
}

export interface CoursePrerequisite {
  type: "course";
  course: string;
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

export interface CourseSets {
  [courseSet: string]: { [crn: string]: boolean };
}

// Prerequisite graph stored as an adjacency list
export interface PrereqAdjList {
  [courseCode: string]: {
    title: string;
    prereqs: string[];
  };
}
