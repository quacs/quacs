import { Module, VuexModule, Mutation } from "vuex-module-decorators";
import Vue from "vue";

import { Department } from "@/typings";

@Module({ namespaced: true, name: "sections" })
export default class Sections extends VuexModule {
  selectedSections: { [id: number]: boolean } = {};
  conflictingSectionCounts: { [id: number]: number } = {};

  CURRENT_STORAGE_VERSION = "0.0.1";
  storedVersion = ""; // If a value is in localstorage, this will be set to that on load

  get isSelected() {
    return (crn: number) => this.selectedSections[crn];
  }

  get isInitialized() {
    return (crn: number) => crn in this.selectedSections;
  }

  get isInConflict() {
    return (crn: number) => this.conflictingSectionCounts[crn] > 0;
  }

  get selectedCRNs() {
    const selected = [];
    for (const crn in this.selectedSections) {
      if (this.selectedSections[crn]) {
        selected.push(crn);
      }
    }

    return selected;
  }

  @Mutation
  setSelected(p: { crn: number; selected: boolean }) {
    Vue.set(this.selectedSections, p.crn, p.selected);
  }

  @Mutation
  updateConflicts(p: { crn: number; conflicts: readonly number[] }) {
    for (const conflict in p.conflicts) {
      if (this.selectedSections[p.crn]) {
        Vue.set(
          this.conflictingSectionCounts,
          conflict,
          this.conflictingSectionCounts[conflict] + 1 || 1
        );
      } else {
        Vue.set(
          this.conflictingSectionCounts,
          conflict,
          this.conflictingSectionCounts[conflict] - 1 || 0
        );
      }
    }
  }

  @Mutation
  initializeStore() {
    if (this.storedVersion !== this.CURRENT_STORAGE_VERSION) {
      console.log("Out of date or uninitialized sections, clearing");

      this.storedVersion = this.CURRENT_STORAGE_VERSION;
      this.selectedSections = {};
    }
  }

  @Mutation
  populateConflicts(departments: { [id: string]: Department }) {
    const start = new Date().getTime();

    console.log("Generating conflicts..");
    for (const deptName in departments) {
      const dept = departments[deptName];

      for (const courseName in dept.courses) {
        const course = dept.courses[courseName];

        for (const crn in course.sections) {
          if (!this.selectedSections[Number(crn)]) {
            continue;
          }

          const section = course.sections[crn];

          for (const conflict in section.conflicts) {
            Vue.set(
              this.conflictingSectionCounts,
              conflict,
              this.conflictingSectionCounts[Number(conflict)] + 1 || 1
            );
          }
        }
      }
    }

    const end = new Date().getTime();

    console.log("Conflict generation complete, took " + (end - start) + " ms");
  }
}
