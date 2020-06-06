import { Module, VuexModule, Mutation } from "vuex-module-decorators";
import Vue from "vue";

@Module({ namespaced: true, name: "sections" })
export default class Sections extends VuexModule {
  selectedSections: { [id: number]: boolean } = {};
  conflictingSectionCounts: { [id: number]: number } = {};

  version = "0.0.1";

  get isSelected() {
    return (crn: number) => this.selectedSections[crn];
  }

  get isInitialized() {
    return (crn: number) => crn in this.selectedSections;
  }

  get isInConflict() {
    return (crn: number) => this.conflictingSectionCounts[crn] > 0;
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
    if (localStorage.getItem("selectedSections") !== null) {
      const stored: {
        data?: string;
        sections?: { [id: string]: boolean };
      } = JSON.parse(localStorage.getItem("selectedSections") as string);

      if (stored.data === this.version && stored.sections) {
        this.selectedSections = stored.sections;
      }
    }
  }
}
