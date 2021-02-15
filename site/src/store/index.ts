import {
  CatalogCourse,
  Department,
  PrereqAdjList,
  PrerequisiteJSON,
} from "@/typings";

import axios from "axios";
import createPersistedState from "vuex-persistedstate";

import Vue from "vue";
import VueAxios from "vue-axios";
import Vuex from "vuex";

import DATA_STATS_JSON from "./data/meta.json";
import PREREQ_GRAPH_JSON from "./data/prereq_graph.json";

import settings from "./modules/settings";
import prerequisites from "./modules/prerequisites";
import schedule from "./modules/schedule";

Vue.use(Vuex);
Vue.use(VueAxios, axios);

export default new Vuex.Store({
  state: {
    schools: {} as {
      name: string;
      depts: { code: string; name: string }[];
    }[],
    dataStats: DATA_STATS_JSON as { last_updated: string },
    departments: [] as Department[], // asynchronously loaded
    catalog: {} as { [id: string]: CatalogCourse }, // asynchronously loaded
    prerequisitesData: {} as { [id: string]: PrerequisiteJSON }, // asynchronously loaded
    prereqGraph: PREREQ_GRAPH_JSON as PrereqAdjList,
    lastNewSchedule: 0,
    warningMessage: "",
    updateAvailable: false,
  },
  getters: {
    shouldShowAlert: (state) => {
      return state.warningMessage !== "";
    },

    warningMessage: (state) => {
      return state.warningMessage;
    },

    departmentsInitialized: (state) => {
      return state.departments.length > 0;
    },

    catalogInitialized: (state) => {
      return Object.keys(state.catalog).length !== 0;
    },

    prerequisitesDataInitialized: (state) => {
      return state.prerequisitesData !== {};
    },
  },
  mutations: {
    SET_DEPARTMENTS_DATA(state, departments): void {
      state.departments = departments;
    },

    SET_CATALOG_DATA(state, catalog): void {
      state.catalog = catalog;
    },

    SET_PREREQUISITES_DATA(state, data): void {
      state.prerequisitesData = data;
    },

    SET_SCHOOLS_DATA(state, schools): void {
      state.schools = schools;
    },

    setWarningMessage(state, message): void {
      state.warningMessage = message;
    },

    toggleUpdateNotice(state, newValue: boolean): void {
      state.updateAvailable = newValue;
    },
  },
  actions: {
    init({ commit }): void {
      console.log(window.localStorage.test, `./robots.txt`);
      console.log(this.state);
      import(
        `./data/semester_data/${this.state.settings.currentTerm}/catalog.json`
      ).then((catalog) => commit("SET_CATALOG_DATA", catalog));

      import(
        `./data/semester_data/${this.state.settings.currentTerm}/courses.json`
      ).then((departments) =>
        commit("SET_DEPARTMENTS_DATA", departments.default)
      );

      import(
        `./data/semester_data/${this.state.settings.currentTerm}/prerequisites.json`
      ).then((prereqs) => commit("SET_PREREQUISITES_DATA", prereqs));

      import(
        `./data/semester_data/${this.state.settings.currentTerm}/schools.json`
      ).then((catalog) => commit("SET_SCHOOLS_DATA", catalog));
    },
  },
  modules: {
    settings,
    prerequisites,
    schedule,
  },
  plugins: [
    createPersistedState({
      key: "inter-semester-storage",
      paths: [
        "settings.timePreference",
        "settings.colorTheme",
        "settings.hidePrerequisites",
        "settings.enableTracking",
        "settings.currentTerm",
        "prerequisites.priorCourses",
        "prerequisites.enableChecking",
      ],
    }),
    createPersistedState({
      key: window.localStorage["inter-semester-storage"]
        ? JSON.parse(window.localStorage["inter-semester-storage"]).settings
            .currentTerm
        : process.env.VUE_APP_NEWEST_SEM,
      paths: [
        "schedule.storedVersion",
        "schedule.currentTerm",
        "schedule.currentCourseSet",
        "schedule.courseSets",
      ],
      rehydrated: (store) => {
        store.commit("schedule/initSelectedSetions");
        store.dispatch("schedule/init", false);
      },
    }),
  ],
});
