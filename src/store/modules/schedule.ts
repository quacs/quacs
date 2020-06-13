import { Action, Module, Mutation, VuexModule } from "vuex-module-decorators";
import { Department } from "@/typings";
import {
  generateCurrentSchedulesAndConflicts,
  getInConflict,
  getSchedule,
  init,
  setSelected,
} from "@/workers/schedule.worker";
import Vue from "vue";

@Module({ namespaced: true, name: "schedule" })
export default class Schedule extends VuexModule {
  selectedSections: { [crn: string]: boolean } = {};

  @Action
  init(departments: Department[]): void {
    init(departments);
  }

  @Action
  generateCurrentSchedulesAndConflicts(): void {
    generateCurrentSchedulesAndConflicts();
  }

  @Mutation
  setSelected(crn: string, selected: boolean): void {
    Vue.set(this.selectedSections, crn, selected);
    setSelected(crn, selected);
  }

  @Action
  async getInConflict(crn: number): Promise<boolean> {
    return await getInConflict(crn);
  }

  @Action
  async getSchedule(idx: number): Promise<number[]> {
    return await getSchedule(idx);
  }
}
