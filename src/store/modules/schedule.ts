import { Action, Module, Mutation, VuexModule } from "vuex-module-decorators";

import {
  generateCurrentSchedulesAndConflicts as workerGenerateCurrentSchedulesAndConflicts,
  getInConflict as workerGetInConflict,
  getSchedule as workerGetSchedule,
  init as workerInit,
  setSelected as workerSetSelected,
} from "@/workers/schedule.worker";
import Vue from "vue";
import store from "..";

@Module({ namespaced: true })
export default class Schedule extends VuexModule {
  selectedSections: { [crn: string]: boolean } = {};
  numCurrentSchedules = 0;
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
    workerSetSelected(p.crn, p.selected);
  }

  //does not need to be mutation
  @Mutation
  init(): void {
    workerInit(store.state.departments);
  }

  //does not need to be mutation
  @Mutation
  initSelectedSetions() {
    for (const section in this.selectedSections) {
      workerSetSelected(section, this.selectedSections[section]);
    }
  }

  get getInConflict(): (crn: number) => Promise<boolean> {
    return (crn: number) => workerGetInConflict(crn);
  }

  get isSelected(): (crn: string) => boolean {
    return (crn: string) => this.selectedSections[crn] === true;
  }

  @Action({ rawError: true })
  getSchedule(idx: number): Promise<number[]> {
    return workerGetSchedule(idx);
  }

  get numSchedules() {
    return this.numCurrentSchedules;
  }

  @Mutation
  setNumSchedules(num: number) {
    this.numCurrentSchedules = num;
    this.lastNewSchedule = Date.now();
  }

  @Action({ rawError: true })
  async generateCurrentSchedulesAndConflicts(): Promise<void> {
    this.context.commit(
      "setNumSchedules",
      await workerGenerateCurrentSchedulesAndConflicts()
    );
  }
}
