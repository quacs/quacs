export enum Day {
  Monday = "M",
  Tuesday = "T",
  Wednesday = "W",
  Thursday = "R",
  Friday = "F"
}

export interface Timeslot {
  days: Day[];
  time_start: number;
  time_end: number;
  instructor: string;
  date_start: string;
  date_end: string;
  location: string;
}

export interface CourseSection {
  title: string;
  subj: string;
  crse: number;
  sec: string;
  crn: number;

  cred_min: number;
  cred_max: number;

  cap: number;
  rem: number;

  timeslots: Timeslot[];

  conflicts: { [id: string]: boolean };
}

export interface Course {
  title: string;
  subj: string;
  crse: number;
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
