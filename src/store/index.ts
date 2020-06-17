import {
  CatalogCourse,
  CourseSize,
  Department,
  PrerequisiteJSON,
} from "@/typings";

import axios from "axios";
import createPersistedState from "vuex-persistedstate";

import Vue from "vue";
import VueAxios from "vue-axios";
import Vuex from "vuex";

import SCHOOLS_JSON from "./data/schools.json";

import settings from "./modules/settings";
import prerequisites from "./modules/prerequisites";
import schedule from "./modules/schedule";

Vue.use(Vuex);
Vue.use(VueAxios, axios);

export default new Vuex.Store({
  state: {
    schools: SCHOOLS_JSON as { [id: string]: { code: string; name: string }[] },
    departments: [] as Department[], // asynchronously loaded
    catalog: {} as { [id: string]: CatalogCourse }, // asynchronously loaded
    prerequisitesData: {} as { [id: string]: PrerequisiteJSON }, // asynchronously loaded
    courseSizes: {} as { [id: string]: CourseSize },
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
      return state.catalog !== {};
    },

    prerequisitesDataInitialized: (state) => {
      return state.prerequisitesData !== {};
    },
  },
  mutations: {
    SET_COURSE_SIZES(state, courseSizes): void {
      state.courseSizes = courseSizes;
    },

    SET_DEPARTMENTS(state, departments): void {
      state.departments = departments;
    },

    SET_CATALOG(state, catalog): void {
      state.catalog = catalog;
    },

    SET_PREREQUISITES_DATA(state, data): void {
      state.prerequisitesData = data;
    },

    setWarningMessage(state, message): void {
      state.warningMessage = message;
    },

    toggleUpdateNotice(state, newValue: boolean): void {
      state.updateAvailable = newValue;
    },
  },
  actions: {
    loadCourseSizes({ commit }): void {
      //TODO switch to better server for this over a free herokuapp instance
      axios
        .get(
          "https://vast-waters-42287.herokuapp.com/https://sis.rpi.edu/reg/rocs/YACS_202009.xml"
        )
        .then((r) => r.data)
        .then((data) => {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(data, "text/xml");

          const liveData: { [id: string]: CourseSize | {} } = {};
          const courses = xmlDoc.getElementsByTagName("SECTION");
          for (let i = 0; i < courses.length; i++) {
            liveData[courses[i].attributes[0].nodeValue || ""] = {};
            for (let j = 0; j < courses[i].attributes.length; j++) {
              const attribute = courses[i].attributes[j];
              Vue.set(
                liveData[courses[i].attributes[0].nodeValue || ""],
                attribute.nodeName,
                parseInt(attribute.nodeValue || "-1")
              );
            }
          }
          commit("SET_COURSE_SIZES", liveData);
        });
    },

    init({ commit }): void {
      import("./data/catalog.json").then((catalog) =>
        commit("SET_CATALOG", catalog)
      );

      import("./data/courses.json").then((departments) =>
        // Apparently dynamic imports import objects, so we have to cast to an array here
        commit("SET_DEPARTMENTS", Object.values(departments))
      );

      import("./data/prerequisites.json").then((prereqs) =>
        commit("SET_PREREQUISITES_DATA", prereqs)
      );
    },
  },
  modules: {
    settings,
    prerequisites,
    schedule,
  },
  plugins: [
    createPersistedState({
      paths: [
        "schedule.selectedSections",
        "schedule.storedVersion",
        "settings.timePreference",
        "settings.colorTheme",
        "settings.hidePrerequisites",
        "prerequisites.priorCourses",
        "prerequisites.enableChecking",
      ],
      rehydrated: (store) => {
        // @ts-expect-error: Typescript doesn't know that `store` can commit
        store.commit("schedule/initSelectedSetions");
        // @ts-expect-error: Typescript doesn't know that `store` can dispatch
        store.dispatch("schedule/init", false);
      },
    }),
  ],
});
