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
  currentlyGeneratingSchedules = false;
  needToGenerateSchedules = false;

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

  @Mutation
  setNeedToGenerateSchedules(state: boolean) {
    this.needToGenerateSchedules = state;
  }

  @Mutation
  setCurrentlyGeneratingSchedules(state: boolean) {
    this.currentlyGeneratingSchedules = state;
  }

  get getNeedToGenerateSchedules() {
    return this.needToGenerateSchedules;
  }

  get getCurrentlyGeneratingSchedules() {
    return this.currentlyGeneratingSchedules;
  }

  @Action({ rawError: true })
  async generateCurrentSchedulesAndConflicts(): Promise<void> {
    this.context.commit("setNeedToGenerateSchedules", true);

    if (this.context.getters.currentlyGeneratingSchedules) {
      // We've marked that we need to generate the schedule again,
      // so the function call currently running will take it from here
      return;
    }

    this.context.commit("setCurrentlyGeneratingSchedules", true);
    this.context.commit("setWarningMessage", "Generating schedules...", {
      root: true,
    });

    while (this.context.getters.getNeedToGenerateSchedules) {
      this.context.commit("setNeedToGenerateSchedules", false);

      this.context.commit(
        "setNumSchedules",
        await worker.generateCurrentSchedulesAndConflicts()
      );
    }

    /*
    setTimeout(() => {
      this.context.commit("setWarningMessage", "", {
        root: true,
      });

      this.context.commit("schedule/setCurrentlyGeneratingSchedules", false, {
        root: true,
      });
    }, 10000);
    */
  }
}
