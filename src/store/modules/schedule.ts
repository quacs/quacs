import { Action, Module, Mutation, VuexModule } from "vuex-module-decorators";

import * as quacsWorker from "@/workers/schedule.worker";
import Vue from "vue";

// yay typescript fun
const worker = ((quacsWorker as unknown) as () => typeof quacsWorker)() as typeof quacsWorker;

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
    worker.setSelected(p.crn, p.selected);
  }

  @Action({ rawError: true })
  async init(): Promise<void> {
    // eslint-disable-next-line
    console.log("initializing worker");
    await worker.init();
    // eslint-disable-next-line
    console.log("worker initialized");

    for (const sec in this.selectedSections) {
      if (this.selectedSections[sec]) {
        await worker.setSelected(sec, true);
      }
    }

    this.context.commit(
      "setNumSchedules",
      await worker.generateCurrentSchedulesAndConflicts()
    );
  }

  //does not need to be mutation
  @Mutation
  initSelectedSetions() {
    for (const section in this.selectedSections) {
      worker.setSelected(section, this.selectedSections[section]);
    }
  }

  get getInConflict(): (crn: number) => Promise<boolean> {
    return (crn: number) => worker.getInConflict(crn);
  }

  get isSelected(): (crn: string) => boolean {
    return (crn: string) => this.selectedSections[crn] === true;
  }

  get getSchedule() {
    return (idx: number) => worker.getSchedule(idx);
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
      await worker.generateCurrentSchedulesAndConflicts()
    );
  }
}
