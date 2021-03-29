import { Action, Module, Mutation, VuexModule } from "vuex-module-decorators";

import Vue from "vue";
import { CourseSection, CourseSets } from "@/typings";

import type { Context as ScheduleGenContext } from "@/quacs-rs";

@Module({ namespaced: true })
export default class Schedule extends VuexModule {
  numCurrentSchedules = 0;
  CURRENT_STORAGE_VERSION = "0.0.3";
  storedVersion = ""; // If a value is in localstorage, this will be set to that on load
  currentlyGeneratingSchedules = false;
  needToGenerateSchedules = false;
  currentTerm = 202009; // TODO: remove this after the current semester
  currentCourseSet = "Course Set 1";
  courseSets: {
    [term: number]: CourseSets;
  } = { 202009: { "Course Set 1": {} } };
  _scheduleGenContext: ScheduleGenContext | null = null;

  wasmLoaded = false;
  lastNewSchedule = 0;

  @Mutation
  _setScheduleGenContext(ctx: ScheduleGenContext): void {
    this._scheduleGenContext = ctx;
  }

  @Action
  async getScheduleGenContext(): Promise<ScheduleGenContext> {
    if (this._scheduleGenContext === null) {
      const wasm = await import("@/quacs-rs");
      wasm.init();
      this.context.commit("_setScheduleGenContext", new wasm.Context());
      this.context.commit("setWasmLoaded", true);
    }
    // @ts-expect-error: Force `ScheduleGenContext | null` into `ScheduleGenContext`
    return this._scheduleGenContext;
  }

  @Mutation
  initializeStore(): void {
    if (this.storedVersion !== this.CURRENT_STORAGE_VERSION) {
      // eslint-disable-next-line
      console.log("Out of date or uninitialized sections, clearing");

      this.storedVersion = this.CURRENT_STORAGE_VERSION;
    }
  }

  get getCourseSets(): CourseSets {
    return this.courseSets[this.currentTerm];
  }

  @Mutation
  async switchCurrentCourseSet(p: { name: string }): Promise<void> {
    for (const sec in this.courseSets[this.currentTerm][
      this.currentCourseSet
    ]) {
      (await this.context.dispatch("getScheduleGenContext")).setSelected(
        parseInt(sec),
        false
      );
    }
    this.currentCourseSet = p.name;
    for (const sec in this.courseSets[this.currentTerm][
      this.currentCourseSet
    ]) {
      if (this.courseSets[this.currentTerm][this.currentCourseSet][sec]) {
        (await this.context.dispatch("getScheduleGenContext")).setSelected(
          parseInt(sec),
          true
        );
      }
    }
  }

  @Mutation
  createNewCourseSet(p: { name: string }): void {
    Vue.set(this.courseSets[this.currentTerm], p.name, {});
  }

  @Action
  addCourseSet(p: { name: string }): boolean {
    //Cannot add a courseSet with a name of one that exists
    if (this.courseSets[this.currentTerm][p.name]) {
      return false;
    }
    this.context.commit("createNewCourseSet", p);
    this.context.commit("switchCurrentCourseSet", p);
    return true;
  }

  @Mutation
  deleteCourseSet(p: { name: string }): void {
    Vue.delete(this.courseSets[this.currentTerm], p.name);
  }

  @Action
  removeCourseSet(p: { name: string }): boolean {
    if (Object.keys(this.courseSets[this.currentTerm]).length <= 1) {
      return false;
    }
    this.context.commit("deleteCourseSet", p);
    if (this.currentCourseSet === p.name) {
      this.context.commit("switchCurrentCourseSet", {
        name: Object.keys(this.courseSets[this.currentTerm])[0],
      });
      this.context.dispatch("generateSchedulesAndConflicts");
    }
    return true;
  }

  @Action
  async setSelected(p: { crn: string; selected: boolean }): Promise<void> {
    Vue.set(
      this.courseSets[this.currentTerm][this.currentCourseSet],
      p.crn,
      p.selected
    );
    (await this.context.dispatch("getScheduleGenContext")).setSelected(
      parseInt(p.crn),
      p.selected
    );
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
  async init(): Promise<void> {
    for (const sec in this.courseSets[this.currentTerm][
      this.currentCourseSet
    ]) {
      if (this.courseSets[this.currentTerm][this.currentCourseSet][sec]) {
        (await this.context.dispatch("getScheduleGenContext")).setSelected(
          parseInt(sec),
          true
        );
      }
    }

    const shouldSetWarningMessage = !this.context.rootState.shouldShowAlert;
    if (shouldSetWarningMessage) {
      this.context.commit("setWarningMessage", "Generating schedules...", {
        root: true,
      });
    }

    this.context.dispatch("generateSchedulesAndConflicts");

    if (shouldSetWarningMessage) {
      this.context.commit("setWarningMessage", "", {
        root: true,
      });
    }
  }

  @Action
  async initSelectedSetions(): Promise<void> {
    //initialize courseSets if they are empty. There should never be an empty courseSet
    // if (Object.keys(this.courseSets).length === 0) {
    //   Vue.set(this.courseSets, this.currentTerm, {});
    // }
    // if (Object.keys(this.courseSets[this.currentTerm]).length === 0) {
    //   Vue.set(this.courseSets, this.currentTerm, {});
    //   Vue.set(this.courseSets[this.currentTerm], this.currentCourseSet, {});
    // }

    for (const section in this.courseSets[this.currentTerm][
      this.currentCourseSet
    ]) {
      (await this.context.dispatch("getScheduleGenContext")).setSelected(
        parseInt(section),
        this.courseSets[this.currentTerm][this.currentCourseSet][section]
      );
    }
  }

  @Action
  async isInConflict(crn: number): Promise<boolean> {
    return (await this.context.dispatch("getScheduleGenContext")).isInConflict(
      crn
    );
  }

  get isSelected(): (crn: string) => boolean {
    return (crn: string) =>
      this.courseSets[this.currentTerm][this.currentCourseSet][crn] === true;
  }

  @Action
  async getSchedule(idx: number): Promise<CourseSection[]> {
    const scheduleCrns = (
      await this.context.dispatch("getScheduleGenContext")
    ).getSchedule(idx);

    // TODO: Is it possible to refactor this to not require a triple-nested loop?
    const scheduleSections: CourseSection[] = [];

    for (const dept of this.context.rootState.departments) {
      for (const course of dept.courses) {
        for (const section of course.sections) {
          if (scheduleCrns.includes(section.crn)) {
            scheduleSections.push(section);
          }
        }
      }
    }

    return scheduleSections;
  }

  get numSchedules(): number {
    return this.numCurrentSchedules;
  }

  @Mutation
  setNumSchedules(num: number): void {
    this.numCurrentSchedules = num;
  }

  @Mutation
  setNeedToGenerateSchedules(state: boolean): void {
    this.needToGenerateSchedules = state;
  }

  @Mutation
  setCurrentlyGeneratingSchedules(state: boolean): void {
    this.currentlyGeneratingSchedules = state;
  }

  get getNeedToGenerateSchedules(): boolean {
    return this.needToGenerateSchedules;
  }

  get getCurrentlyGeneratingSchedules(): boolean {
    return this.currentlyGeneratingSchedules;
  }

  @Action({ rawError: true })
  async generateSchedulesAndConflicts(): Promise<void> {
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
        (
          await this.context.dispatch("getScheduleGenContext")
        ).generateSchedulesAndConflicts()
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
