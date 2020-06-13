import { Action, Module, Mutation, VuexModule } from "vuex-module-decorators";

import {
  getInConflict,
  getSchedule,
  init,
  setSelected,
} from "@/workers/schedule.worker";
import Vue from "vue";
import store from "..";

@Module({ namespaced: true, name: "schedule" })
export default class Schedule extends VuexModule {
  selectedSections: { [crn: string]: boolean } = {};
  CURRENT_STORAGE_VERSION = "0.0.3";
  storedVersion = ""; // If a value is in localstorage, this will be set to that on load
  lastNewSchedule = 0; //Keeps track of the time the last new schedule was generated

  @Mutation
  initializeStore(): void {
    if (this.storedVersion !== this.CURRENT_STORAGE_VERSION) {
      // eslint-disable-next-line
      console.log("Out of date or uninitialized sections, clearing");

      this.storedVersion = this.CURRENT_STORAGE_VERSION;
    }
  }

  @Mutation
  setSelected(p: { crn: string; selected: boolean }): void {
    Vue.set(this.selectedSections, p.crn, p.selected);
    setSelected(p.crn, p.selected);
  }

  //does not need to be mutation
  @Mutation
  init(): void {
    init(store.state.departments);
  }

  //does not need to be mutation
  @Mutation
  initSelectedSetions() {
    for (const section in this.selectedSections) {
      setSelected(section, this.selectedSections[section]);
    }
  }

  get getInConflict(): (crn: number) => Promise<boolean> {
    return async (crn: number) => await getInConflict(crn);
  }

  get isSelected(): (crn: string) => boolean {
    return (crn: string) => this.selectedSections[crn] === true;
  }

  @Action
  async getSchedule(idx: number): Promise<number[]> {
    return await getSchedule(idx);
  }
}
