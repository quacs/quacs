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

  credMin: number;
  credMax: number;

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

export interface CourseSize {
  avail: number;
  crn: number;
  num: number;
  seats: number;
  students: number;
}

export interface SelectedSection {
  section: CourseSection;
  course: Course;
  dept?: Department;
  selected: boolean;
}

export interface CalendarColor {
  bg: string;
  text: string;
  border: string;
}
