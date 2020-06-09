import { Module, Mutation, VuexModule } from "vuex-module-decorators";
import { CalendarColor, Department, SelectedSection } from "@/typings";
import Vue from "vue";

const BG_COLORS = [
  "#ffd4df",
  "#ceeffc",
  "#fff4d0",
  "#dcf7da",
  "#f7e2f7",
  "#ede6df",
  "#ffe9cf"
];
const TEXT_COLORS = [
  "#d1265d",
  "#1577aa",
  "#bf8a2e",
  "#008a2e",
  "#853d80",
  "#9d5733",
  "#d9652b"
];
const BORDER_COLORS = [
  "#ff2066",
  "#00aff2",
  "#ffcb45",
  "#48da58",
  "#d373da",
  "#a48363",
  "#ff9332"
];
const NUM_COLORS = 7;

@Module({ namespaced: true, name: "sections" })
export default class Sections extends VuexModule {
  selectedSections: { [crn: number]: SelectedSection } = {};
  conflictingSectionCounts: { [crn: number]: number } = {};

  CURRENT_STORAGE_VERSION = "0.0.2";
  storedVersion = ""; // If a value is in localstorage, this will be set to that on load

  get isSelected(): (crn: number) => boolean {
    return (crn: number) =>
      this.isInitialized(crn) && this.selectedSections[crn].selected;
  }

  get isInitialized(): (crn: number) => boolean {
    return (crn: number) => crn in this.selectedSections;
  }

  get isInConflict(): (crn: number) => boolean {
    return (crn: number) => this.conflictingSectionCounts[crn] > 0;
  }

  get selected(): readonly SelectedSection[] {
    return Object.keys(this.selectedSections)
      .map((k: string) => this.selectedSections[(k as unknown) as number])
      .filter((selected: SelectedSection) => selected.selected);
  }

  @Mutation
  setSelected(p: SelectedSection): void {
    Vue.set(this.selectedSections, p.section.crn, p);
  }

  @Mutation
  updateConflicts(p: { crn: number; conflicts: readonly number[] }): void {
    for (const conflict in p.conflicts)
      if (this.selectedSections[p.crn])
        Vue.set(
          this.conflictingSectionCounts,
          conflict,
          this.conflictingSectionCounts[conflict] + 1 || 1
        );
      else
        Vue.set(
          this.conflictingSectionCounts,
          conflict,
          this.conflictingSectionCounts[conflict] - 1 || 0
        );
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
    const start = new Date().getTime();

    // eslint-disable-next-line
    console.log("Generating conflicts..");
    for (const dept of departments)
      for (const course of dept.courses)
        for (const section of course.sections) {
          if (!this.selectedSections[Number(section.crn)]) continue;

          for (const conflict in section.conflicts)
            Vue.set(
              this.conflictingSectionCounts,
              conflict,
              this.conflictingSectionCounts[Number(conflict)] + 1 || 1
            );
        }

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
        border: BORDER_COLORS[idx % NUM_COLORS]
      };
    };
  }
}
