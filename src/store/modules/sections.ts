import { Module, Mutation, VuexModule } from "vuex-module-decorators";
import { CalendarColor, CourseSection, Department } from "@/typings";
import Vue from "vue";

const BG_COLORS = [
  "#ffd4df",
  "#ceeffc",
  "#fff4d0",
  "#dcf7da",
  "#f7e2f7",
  "#ede6df",
  "#ffe9cf",
];
const TEXT_COLORS = [
  "#000000",
  "#000000",
  "#000000",
  "#000000",
  "#000000",
  "#000000",
  "#000000",
  /*
  "#d1265d",
  "#1577aa",
  "#bf8a2e",
  "#008a2e",
  "#853d80",
  "#9d5733",
  "#d9652b"
  */
];
const BORDER_COLORS = [
  "#ff2066",
  "#00aff2",
  "#ffcb45",
  "#48da58",
  "#d373da",
  "#a48363",
  "#ff9332",
];
const NUM_COLORS = 7;

function genSchedules(
  index: number, // which course you're working on
  courses: CourseSection[][],
  currScheduleConflicts: { [crn: string]: number },
  usedSections: number[]
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

@Module({ namespaced: true, name: "sections" })
export default class Sections extends VuexModule {
  selectedSections: { [crn: number]: boolean } = {};
  conflictingSectionCounts: { [crn: number]: number } = {};
  crnToSection: { [crn: string]: CourseSection } = {};

  CURRENT_STORAGE_VERSION = "0.0.1";
  storedVersion = ""; // If a value is in localstorage, this will be set to that on load

  get isSelected(): (crn: number) => boolean {
    return (crn: number) => this.selectedSections[crn] === true;
  }

  get isInitialized(): (crn: number) => boolean {
    return (crn: number) => crn in this.selectedSections;
  }

  get isInConflict(): (crn: number) => boolean {
    return (crn: number) => this.conflictingSectionCounts[crn] > 0;
  }

  get selectedCRNs(): readonly string[] {
    return Object.keys(this.selectedSections).filter(
      (crn: string) => this.selectedSections[(crn as unknown) as number]
    );
  }

  @Mutation
  setSelected(p: { crn: number; state: boolean }): void {
    Vue.set(this.selectedSections, p.crn, p.state);
  }

  // @Mutation
  // updateConflicts(p: { crn: number; conflicts: readonly number[] }): void {
  //   for (const conflict in p.conflicts) {
  //     if (this.selectedSections[p.crn]) {
  //       Vue.set(
  //         this.conflictingSectionCounts,
  //         conflict,
  //         this.conflictingSectionCounts[conflict] + 1 || 1
  //       );
  //     } else {
  //       Vue.set(
  //         this.conflictingSectionCounts,
  //         conflict,
  //         this.conflictingSectionCounts[conflict] - 1 || 0
  //       );
  //     }
  //   }
  // }

  @Mutation
  initializeCrnToSection(departments: readonly Department[]): void {
    for (const dept of departments) {
      for (const course of dept.courses) {
        for (const section of course.sections) {
          Vue.set(this.crnToSection, section.crn, section);
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

  //  selectedSections: { [crn: number]: boolean } = {};
  @Mutation
  populateConflicts(departments: readonly Department[]): void {
    for (const dept of departments) {
      for (const course of dept.courses) {
        for (const section of course.sections) {
          Vue.set(this.crnToSection, section.crn, section);
        }
      }
    }

    const start = new Date().getTime();
    // eslint-disable-next-line
    console.log("Generating conflicts..");

    //Fills a object maping course to an array of sections
    const sections: { [course: string]: CourseSection[] } = {};
    for (const crn in this.selectedSections) {
      if (!this.selectedSections[crn]) {
        continue;
      }

      if (
        !sections[
          this.crnToSection[crn].subj + "-" + this.crnToSection[crn].crse
        ]
      ) {
        sections[
          this.crnToSection[crn].subj + "-" + this.crnToSection[crn].crse
        ] = [];
      }
      sections[
        this.crnToSection[crn].subj + "-" + this.crnToSection[crn].crse
      ].push(this.crnToSection[crn]);
    }

    //Converts the above object into nested arrays
    const sectionsArr = [];
    for (const course in sections) {
      const courseSections = [];
      for (const section of sections[course]) {
        courseSections.push(section);
      }
      sectionsArr.push(courseSections);
    }

    const conflicts = {};
    const usedSections: number[] = [];
    const schedules: {
      conflicts: { [crn: string]: number };
      crns: number[];
    }[] = genSchedules(0, sectionsArr, conflicts, usedSections);

    // eslint-disable-next-line
    console.log(schedules);

    const end = new Date().getTime();
    // eslint-disable-next-line
    console.log("Conflict generation complete, took " + (end - start) + " ms");
  }

  // COLORS!!!
  get colors(): (idx: number) => CalendarColor {
    return (idx: number) => {
      return {
        bg: BG_COLORS[idx % NUM_COLORS],
        text: TEXT_COLORS[idx % NUM_COLORS],
        border: BORDER_COLORS[idx % NUM_COLORS],
      };
    };
  }
}
