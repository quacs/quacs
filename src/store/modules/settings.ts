import { Module, Mutation, VuexModule } from "vuex-module-decorators";
import { TimePreference } from "@/typings";

@Module({ namespaced: true, name: "settings" })
export default class Settings extends VuexModule {
  timePreference: TimePreference | "" = ""; // If a value is in localstorage, this will be set to that on load

  get isMilitaryTime(): () => boolean {
    return () => this.timePreference === "M";
  }

  @Mutation
  initializeStore(): void {
    if (this.timePreference === "")
      this.timePreference = TimePreference.Standard;
  }

  @Mutation
  setTimePreference(newVal: TimePreference): void {
    this.timePreference = newVal;
  }
}
