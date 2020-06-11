import { Module, Mutation, VuexModule } from "vuex-module-decorators";
import { Course, CourseSection, Department } from "@/typings";
import Vue from "vue";

function genSchedules(
  index: number, // which course you're working on
  courses: CourseSection[][],
  currScheduleConflicts: { [crn: string]: number },
  usedSections: number[] = []
): { conflicts: { [crn: string]: number }; crns: number[] }[] {
  let ret: { conflicts: { [crn: string]: number }; crns: number[] }[] = [];
  if (index >= courses.length) {
    return [
      {
        conflicts: { ...currScheduleConflicts },
        crns: [...usedSections],
      },
    ];
  }

  for (const section of courses[index]) {
    if (currScheduleConflicts[section.crn] > 0) {
      // Something in the schedule conflicts with this section, so we can't include it
      continue;
    }

    for (const conflict in section.conflicts) {
      currScheduleConflicts[conflict] =
        currScheduleConflicts[conflict] + 1 || 1;
    }

    usedSections.push(section.crn);
    ret = ret.concat(
      genSchedules(index + 1, courses, currScheduleConflicts, usedSections)
    );

    usedSections.pop();
    for (const conflict in section.conflicts) {
      currScheduleConflicts[conflict] =
        currScheduleConflicts[conflict] - 1 || 0;
    }
  }

  return ret;
}

function generateCurrentSchedules(
  selectedSections: { [crn: string]: boolean },
  crnToSections: { [crn: string]: { course: Course; sec: CourseSection } }
) {
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

  //Converts the above object into nested arrays
  const sectionsArr = Object.values(sections);
  sectionsArr.sort(function compareNumbers(a, b) {
    return a.length - b.length;
  });
  const conflicts = {};
  return genSchedules(0, sectionsArr, conflicts);
}

function calculateConflicts(
  currentSchedules: {
    conflicts: { [crn: string]: number };
    crns: number[];
  }[]
): string[] {
  if (currentSchedules.length === 0) {
    return [];
  }

  let conflictingSecArr = Object.keys(currentSchedules[0].conflicts).filter(
    (crn) => currentSchedules[0].conflicts[crn] > 0
  );

  for (const schedule of currentSchedules) {
    conflictingSecArr = conflictingSecArr.filter(
      (crn) => schedule.conflicts[crn] > 0
    );
  }

  return conflictingSecArr;
}

@Module({ namespaced: true, name: "sections" })
export default class Sections extends VuexModule {
  selectedSections: { [crn: string]: boolean } = {};
  conflictingSections: { [crn: string]: boolean } = {};
  crnToSections: { [crn: string]: { course: Course; sec: CourseSection } } = {};
  currentSchedules: {
    conflicts: { [crn: string]: number };
    crns: number[];
  }[] = [];

  CURRENT_STORAGE_VERSION = "0.0.2";
  storedVersion = ""; // If a value is in localstorage, this will be set to that on load

  get isSelected(): (crn: string) => boolean {
    return (crn: string) => this.selectedSections[crn] === true;
  }

  get isInitialized(): (crn: string) => boolean {
    return (crn: string) => crn in this.selectedSections;
  }

  get isInConflict(): (crn: string) => boolean {
    return (crn: string) => this.conflictingSections[crn];
  }

  get selectedCRNs(): readonly string[] {
    return Object.keys(this.selectedSections).filter(
      (crn: string) => this.selectedSections[(crn as unknown) as number]
    );
  }

  get schedules() {
    return this.currentSchedules;
  }

  get crnToCourseAndSection(): (
    crn: string
  ) => { course: Course; sec: CourseSection } {
    return (crn: string) => this.crnToSections[crn];
  }

  @Mutation
  setSelected(p: { crn: number; state: boolean }): void {
    Vue.set(this.selectedSections, p.crn, p.state);
  }

  @Mutation
  initializeCrnToSection(departments: readonly Department[]): void {
    if (Object.keys(this.crnToSections).length === 0) {
      for (const dept of departments) {
        for (const course of dept.courses) {
          for (const section of course.sections) {
            Vue.set(this.crnToSections, section.crn, {
              course,
              sec: section,
            });
          }
        }
      }
    }
  }

  @Mutation
  initializeStore(): void {
    if (this.storedVersion !== this.CURRENT_STORAGE_VERSION) {
      // eslint-disable-next-line
      console.log("Out of date or uninitialized sections, clearing");

      this.storedVersion = this.CURRENT_STORAGE_VERSION;
      this.selectedSections = {};
    }
  }

  @Mutation
  populateConflicts(departments: readonly Department[]): void {
    //Figure out why we even have to run this and why initializeCrnToSection() is not working on page load
    if (Object.keys(this.crnToSections).length === 0) {
      for (const dept of departments) {
        for (const course of dept.courses) {
          for (const section of course.sections) {
            Vue.set(this.crnToSections, section.crn, { course, sec: section });
          }
        }
      }
    }

    let start = new Date().getTime();
    // eslint-disable-next-line
    console.log("Generating schedules..");

    this.currentSchedules = generateCurrentSchedules(
      this.selectedSections,
      this.crnToSections
    );

    let end = new Date().getTime();
    // eslint-disable-next-line
    console.log("Schedule generation complete, took " + (end - start) + " ms");

    start = new Date().getTime();
    // eslint-disable-next-line
    console.log("Calculating conflicts..");

    this.conflictingSections = {};
    calculateConflicts(this.currentSchedules).forEach(
      (crn) => (this.conflictingSections[crn] = true)
    );

    end = new Date().getTime();
    // eslint-disable-next-line
    console.log("Conflict calculation complete, took " + (end - start) + " ms");
  }
}
