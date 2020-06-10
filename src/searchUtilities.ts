import Fuse from "fuse.js";
import { Course } from "./typings";
import store from "@/store";

const fuseOptions = {
  isCaseSensitive: false,
  // includeScore: true,
  shouldSort: true,
  // includeMatches: false,
  // findAllMatches: false,
  // minMatchCharLength: 5,
  // location: 0,
  threshold: 0.2,
  // distance: 100,
  // useExtendedSearch: false,
  keys: [
    "title",
    "crse",
    "subj",
    "id",
    "sections.crn",
    "sections.timeslots.instructor",
    "sections.timeslots.location"
  ]
};

let fuseCourses: Course[] = [];
function getFuseCourses(): Course[] {
  if (fuseCourses.length !== 0) {
    return fuseCourses;
  }
  const courses = [];
  for (const deptName in store.state.departments) {
    const dept = store.state.departments[deptName];
    for (const courseName in dept.courses) {
      courses.push(dept.courses[courseName]);
    }
  }
  fuseCourses = courses;
  return courses;
}

export function instantFuseSearch(searchString: string): Course[] {
  if (searchString.length === 0) {
    return [];
  }
  const fuse = new Fuse(getFuseCourses(), fuseOptions);
  return fuse.search(searchString).map(res => res.item);
}

export function fuseSearch(searchString: string): Promise<Course[]> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(instantFuseSearch(searchString));
    }, 1);
  });
}
