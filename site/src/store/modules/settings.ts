import { Module, Mutation, VuexModule } from "vuex-module-decorators";
import { TimePreference } from "@/typings";
import { setColorTheme } from "@/utilities";

@Module({ namespaced: true, name: "settings" })
export default class Settings extends VuexModule {
  timePreference: TimePreference = TimePreference.Standard; // If a value is in localstorage, this will be set to that on load
  colorTheme = "system";
  hidePrerequisites = false;
  enableTracking = true;

  get isMilitaryTime(): () => boolean {
    return () => this.timePreference === "M";
  }

  @Mutation
  setTimePreference(newVal: TimePreference): void {
    this.timePreference = newVal;
  }

  get getColorTheme(): () => string {
    return () => this.colorTheme;
  }

  @Mutation
  setColorTheme(newVal: string): void {
    if (newVal != "true-dark") {
      this.colorTheme = newVal;
    }
    setColorTheme(newVal);
  }

  @Mutation
  toggleHiddenPrerequisites(state: boolean): void {
    this.hidePrerequisites = state;
  }

  get hidePrerequisitesState(): boolean {
    return this.hidePrerequisites;
  }

  @Mutation
  setTracking(newVal: boolean): void {
    this.enableTracking = newVal;
  }

  getTracking(): boolean {
    return this.enableTracking;
  }
}
