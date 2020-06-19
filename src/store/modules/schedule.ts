import { Action, Module, Mutation, VuexModule } from "vuex-module-decorators";

import * as quacsWorker from "@/workers/schedule.worker";
import Vue from "vue";

// yay typescript fun
const worker = ((quacsWorker as unknown) as () => typeof quacsWorker)() as typeof quacsWorker;

@Module({ namespaced: true })
export default class Schedule extends VuexModule {
  numCurrentSchedules = 0;
  CURRENT_STORAGE_VERSION = "0.0.3";
  storedVersion = ""; // If a value is in localstorage, this will be set to that on load
  currentlyGeneratingSchedules = false;
  needToGenerateSchedules = false;
  currentTerm = 202009;
  currentPreset = "Schedule 1";
  presets: {
    [term: number]: { [preset: string]: { [crn: string]: boolean } };
  } = {};

  wasmLoaded = false;
  lastNewSchedule = Date.now();

  @Mutation
  initializeStore(): void {
    if (this.storedVersion !== this.CURRENT_STORAGE_VERSION) {
      // eslint-disable-next-line
      console.log("Out of date or uninitialized sections, clearing");

      this.storedVersion = this.CURRENT_STORAGE_VERSION;
    }

    //initialize presets if they are empty. There should never be an empty preset
    if (Object.keys(this.presets).length === 0) {
      Vue.set(this.presets, this.currentTerm, {});
    }
    if (Object.keys(this.presets[this.currentTerm]).length === 0) {
      Vue.set(this.presets, this.currentTerm, { "Schedule 1": {} });
    }
  }

  get getPresets() {
    return this.presets[this.currentTerm];
  }

  @Mutation
  switchCurrentPreset(p: { name: string }): void {
    this.currentPreset = p.name;
  }

  @Mutation
  addPreset(p: { name: string }): boolean {
    //Cannot add a preset with a name of one that exists
    if (this.presets[this.currentTerm][p.name]) {
      return false;
    }
    Vue.set(this.presets[this.currentTerm], p.name, {});

    this.currentPreset = p.name;
    return true;
  }

  @Mutation
  removePreset(p: { name: string }): boolean {
    if (Object.keys(this.presets[this.currentTerm]).length <= 1) {
      return false;
    }
    Vue.delete(this.presets[this.currentTerm], p.name);
    if (this.currentPreset === p.name) {
      this.currentPreset = Object.keys(this.presets[this.currentTerm])[0];
    }
    return true;
  }

  @Mutation
  setSelected(p: { crn: string; selected: boolean }): void {
    Vue.set(
      this.presets[this.currentTerm][this.currentPreset],
      p.crn,
      p.selected
    );
    worker.setSelected(p.crn, p.selected);
  }

  @Mutation
  setWasmLoaded(state: boolean): void {
    this.wasmLoaded = state;
  }

  @Mutation
  setLastNewSchedule(time: number): void {
    this.lastNewSchedule = time;
  }

  @Action({ rawError: true })
  async init(initWasm = true): Promise<void> {
    if (initWasm) {
      // eslint-disable-next-line
      console.log("initializing worker");
      await worker.init();
      // eslint-disable-next-line
      console.log("worker initialized");
    }

    for (const sec in this.selectedSections) {
      if (this.selectedSections[sec]) {
        await worker.setSelected(sec, true);
      }
    }

    const shouldSetWarningMessage = !this.context.rootState.shouldShowAlert;
    if (shouldSetWarningMessage) {
      this.context.commit("setWarningMessage", "Generating schedules...", {
        root: true,
      });
    }

    this.context.commit(
      "setNumSchedules",
      await worker.generateCurrentSchedulesAndConflicts()
    );

    this.context.commit("setWasmLoaded", true);

    if (shouldSetWarningMessage) {
      this.context.commit("setWarningMessage", "", {
        root: true,
      });
    }
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

  get selectedSections(): { [crn: string]: boolean } {
    return this.presets[this.currentTerm][this.currentPreset];
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

    const shouldSetWarningMessage = !this.context.rootState.shouldShowAlert;
    if (shouldSetWarningMessage) {
      this.context.commit("setWarningMessage", "Generating schedules...", {
        root: true,
      });
    }

    while (this.context.getters.getNeedToGenerateSchedules) {
      this.context.commit("setNeedToGenerateSchedules", false);

      this.context.commit(
        "setNumSchedules",
        await worker.generateCurrentSchedulesAndConflicts()
      );

      this.context.commit("setLastNewSchedule", Date.now());
    }

    if (shouldSetWarningMessage) {
      this.context.commit("setWarningMessage", "", {
        root: true,
      });
    }
  }
}
