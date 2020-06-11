import { Module, Mutation, VuexModule } from "vuex-module-decorators";
import Vue from "vue";

@Module({ namespaced: true, name: "settings" })
export default class Settings extends VuexModule {
  priorCourses: { [courseId: string]: boolean } = {};

  get getPriorCourses(): () => { [courseId: string]: boolean } {
    return () => this.priorCourses;
  }

  @Mutation
  addPriorCourse(courseId: string): void {
    Vue.set(this.priorCourses, courseId, true);
  }

  @Mutation
  removePriorCourse(courseId: string): void {
    Vue.delete(this.priorCourses, courseId);
  }
}
