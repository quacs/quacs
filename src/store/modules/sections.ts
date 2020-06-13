// import { Module, Mutation, VuexModule } from "vuex-module-decorators";
// import { Course, CourseSection, Department } from "@/typings";
// import Vue from "vue";
//
// interface Section {
//   crn: number;
//   conflicts: number[];
// }
//
// function genSchedules(
//   index: number, // which course you're working on
//   courses: Section[][],
//   usedSections: Set<number> = new Set()
// ): number[][] {
//   let ret: number[][] = [];
//   if (index >= courses.length) {
//     return [[...usedSections]];
//   }
//
//   for (const section of courses[index]) {
//     if (section.conflicts.some((crn) => usedSections.has(crn))) {
//       // Something in the schedule conflicts with this section, so we can't include it
//       continue;
//     }
//
//     usedSections.add(section.crn);
//     ret = ret.concat(genSchedules(index + 1, courses, usedSections));
//
//     usedSections.delete(section.crn);
//   }
//
//   return ret;
// }
//
// function generateCurrentSchedules(
//   selectedSections: { [crn: string]: boolean },
//   crnToSections: { [crn: string]: { course: Course; sec: CourseSection } }
// ) {
//   //Fills a object mapping course to an array of sections
//   const sections: { [courseCode: string]: CourseSection[] } = {};
//   for (const crn in selectedSections) {
//     if (!selectedSections[crn]) {
//       continue;
//     }
//
//     const courseCode =
//       crnToSections[crn].sec.subj + "-" + crnToSections[crn].sec.crse;
//
//     if (!sections[courseCode]) {
//       sections[courseCode] = [];
//     }
//
//     sections[courseCode].push(crnToSections[crn].sec);
//   }
//
//   const slimSections: Section[][] = Object.values(sections).map(
//     (secs: CourseSection[]) =>
//       secs.map((section: CourseSection) => {
//         return {
//           crn: section.crn,
//           conflicts: Object.keys(section.conflicts)
//             .filter((conflict) => selectedSections[conflict])
//             .map((conflict) => parseInt(conflict)),
//         };
//       })
//   );
//
//   //Converts the above object into nested arrays
//   slimSections.sort((arr1, arr2) => arr1.length - arr2.length);
//   return genSchedules(0, slimSections);
// }
//
// function calculateConflicts(
//   currentSchedules: number[][],
//   crnToSections: { [crn: string]: { course: Course; sec: CourseSection } }
// ): number[] {
//   if (currentSchedules.length === 0) {
//     return [];
//   }
//
//   let conflictingSecArr = new Set<number>(
//     currentSchedules[0]
//       .map((crn) => crnToSections[crn].sec)
//       .map((sec) => Object.keys(sec.conflicts).map((crn) => parseInt(crn)))
//       .flat()
//   );
//
//   for (const schedule of currentSchedules) {
//     conflictingSecArr = new Set(
//       schedule
//         .map((crn) => crnToSections[crn].sec)
//         .map((sec) =>
//           Object.keys(sec.conflicts)
//             .map((crn) => parseInt(crn))
//             .filter((crn) => conflictingSecArr.has(crn))
//         )
//         .flat()
//     );
//   }
//
//   return [...conflictingSecArr];
// }
//
// @Module({ namespaced: true, name: "sections" })
// export default class Sections extends VuexModule {
//   selectedSections: { [crn: string]: boolean } = {};
//   conflictingSections: { [crn: string]: boolean } = {};
//   crnToSections: { [crn: string]: { course: Course; sec: CourseSection } } = {};
//   courseIdToCourse: { [id: string]: { course: Course } } = {};
//   currentSchedules: number[][] = [];
//
//   CURRENT_STORAGE_VERSION = "0.0.2";
//   storedVersion = ""; // If a value is in localstorage, this will be set to that on load
//
//   get isSelected(): (crn: string) => boolean {
//     return (crn: string) => this.selectedSections[crn] === true;
//   }
//
//   get isInitialized(): (crn: string) => boolean {
//     return (crn: string) => crn in this.selectedSections;
//   }
//
//   get isInConflict(): (crn: string) => boolean {
//     return (crn: string) => this.conflictingSections[crn];
//   }
//
//   get selectedCRNs(): readonly string[] {
//     return Object.keys(this.selectedSections).filter(
//       (crn: string) => this.selectedSections[(crn as unknown) as number]
//     );
//   }
//
//   get schedules() {
//     return this.currentSchedules;
//   }
//
//   get crnToCourseAndSection(): (
//     crn: string
//   ) => { course: Course; sec: CourseSection } {
//     return (crn: string) => this.crnToSections[crn];
//   }
//
//   @Mutation
//   setSelected(p: { crn: number; state: boolean }): void {
//     Vue.set(this.selectedSections, p.crn, p.state);
//   }
//
//   @Mutation
//   initializeDataMappings(departments: readonly Department[]): void {
//     if (Object.keys(this.crnToSections).length === 0) {
//       for (const dept of departments) {
//         for (const course of dept.courses) {
//           Vue.set(this.courseIdToCourse, course.id, course);
//           for (const section of course.sections) {
//             Vue.set(this.crnToSections, section.crn, {
//               course,
//               sec: section,
//             });
//           }
//         }
//       }
//     }
//   }
//
// @Mutation
// initializeStore(): void {
//   if (this.storedVersion !== this.CURRENT_STORAGE_VERSION) {
//     // eslint-disable-next-line
//     console.log("Out of date or uninitialized sections, clearing");
//
//     this.storedVersion = this.CURRENT_STORAGE_VERSION;
//   }
// }
//
//   @Mutation
//   populateConflicts(departments: readonly Department[]): void {
//     //Figure out why we even have to run this and why initializeCrnToSection() is not working on page load
//     if (Object.keys(this.crnToSections).length === 0) {
//       for (const dept of departments) {
//         for (const course of dept.courses) {
//           for (const section of course.sections) {
//             Vue.set(this.crnToSections, section.crn, { course, sec: section });
//           }
//         }
//       }
//     }
//
//     let start = new Date().getTime();
//     // eslint-disable-next-line
//     console.log("Generating schedules..");
//
//     this.currentSchedules = generateCurrentSchedules(
//       this.selectedSections,
//       this.crnToSections
//     );
//
//     let end = new Date().getTime();
//     // eslint-disable-next-line
//     console.log("Schedule generation complete, took " + (end - start) + " ms");
//
//     start = new Date().getTime();
//     // eslint-disable-next-line
//     console.log("Calculating conflicts..");
//
//     this.conflictingSections = {};
//     calculateConflicts(this.currentSchedules, this.crnToSections).forEach(
//       (crn) => (this.conflictingSections[crn] = true)
//     );
//
//     end = new Date().getTime();
//     // eslint-disable-next-line
//     console.log("Conflict calculation complete, took " + (end - start) + " ms");
//   }
// }
