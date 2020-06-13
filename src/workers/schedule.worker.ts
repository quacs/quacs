import { Course, CourseSection, Department, Section } from "@/typings";

const crnToSections: {
  [crn: string]: { course: Course; sec: CourseSection };
} = {};
const selectedSections: { [crn: string]: boolean } = {};
let currentSchedules: number[][] = [];
let conflictingSections: { [crn: string]: boolean } = {};

export const init = async (departments: Department[]) => {
  for (const dept of departments) {
    for (const course of dept.courses) {
      for (const section of course.sections) {
        crnToSections[section.crn] = { course, sec: section };
      }
    }
  }
};

function calculateConflicts(): number[] {
  if (currentSchedules.length === 0) {
    return [];
  }

  let conflictingSecArr = new Set<number>(
    currentSchedules[0]
      .map((crn) => crnToSections[crn].sec)
      .map((sec) => Object.keys(sec.conflicts).map((crn) => parseInt(crn)))
      .flat()
  );

  for (const schedule of currentSchedules) {
    conflictingSecArr = new Set(
      schedule
        .map((crn) => crnToSections[crn].sec)
        .map((sec) =>
          Object.keys(sec.conflicts)
            .map((crn) => parseInt(crn))
            .filter((crn) => conflictingSecArr.has(crn))
        )
        .flat()
    );
  }

  return [...conflictingSecArr];
}

function genSchedules(
  index: number, // which course you're working on
  courses: Section[][],
  usedSections: Set<number> = new Set()
): number[][] {
  let ret: number[][] = [];
  if (index >= courses.length) {
    return [[...usedSections]];
  }

  for (const section of courses[index]) {
    if (section.conflicts.some((crn) => usedSections.has(crn))) {
      // Something in the schedule conflicts with this section, so we can't include it
      continue;
    }

    usedSections.add(section.crn);
    ret = ret.concat(genSchedules(index + 1, courses, usedSections));

    usedSections.delete(section.crn);
  }

  return ret;
}

function generateCurrentSchedules() {
  //Fills a object mapping course to an array of sections
  const sections: { [courseCode: string]: CourseSection[] } = {};
  for (const crn in selectedSections) {
    if (!selectedSections[crn]) {
      continue;
    }

    const courseCode =
      crnToSections[crn].sec.subj + "-" + crnToSections[crn].sec.crse;

    if (!sections[courseCode]) {
      sections[courseCode] = [];
    }

    sections[courseCode].push(crnToSections[crn].sec);
  }

  const slimSections: Section[][] = Object.values(sections).map(
    (secs: CourseSection[]) =>
      secs.map((section: CourseSection) => {
        return {
          crn: section.crn,
          conflicts: Object.keys(section.conflicts)
            .filter((conflict) => selectedSections[conflict])
            .map((conflict) => parseInt(conflict)),
        };
      })
  );

  //Converts the above object into nested arrays
  slimSections.sort((arr1, arr2) => arr1.length - arr2.length);
  return genSchedules(0, slimSections);
}

export const generateCurrentSchedulesAndConflicts = async () => {
  if (Object.keys(crnToSections).length === 0) {
    return;
  }
  let start = Date.now();
  // eslint-disable-next-line
  console.log("Generating schedules..");

  currentSchedules = generateCurrentSchedules();

  let end = Date.now();
  // eslint-disable-next-line
  console.log("Schedule generation complete, took " + (end - start) + " ms");

  start = Date.now();
  // eslint-disable-next-line
  console.log("Calculating conflicts..");

  conflictingSections = {};
  calculateConflicts().forEach(
    (crn: string | number) => (conflictingSections[crn] = true)
  );

  end = Date.now();
  // eslint-disable-next-line
  console.log("Conflict calculation complete, took " + (end - start) + " ms");
  return currentSchedules.length;
};

export const setSelected = async (crn: string, selected: boolean) => {
  selectedSections[crn] = selected;
};

export const getInConflict = async (crn: number) => {
  return conflictingSections[crn] === true;
};

export const getSchedule = async (idx: number) => {
  return currentSchedules[idx];
};
