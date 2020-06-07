export enum ShortDay {
  Monday = "M",
  Tuesday = "T",
  Wednesday = "W",
  Thursday = "R",
  Friday = "F"
}

export interface Day {
  name: string;
  short: string;
}

export interface Timeslot {
  days: ShortDay[];
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
  sections: { [id: string]: CourseSection };
}

export interface Department {
  name: string;
  code: string;
  courses: { [id: string]: Course };
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
