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

import CATALOG_JSON from "./data/catalog.json";
import COURSES_JSON from "./data/courses.json";
import SCHOOLS_JSON from "./data/schools.json";
import PREREQUISITES_JSON from "./data/prerequisites.json";

import settings from "./modules/settings";
import prerequisites from "./modules/prerequisites";
import schedule from "./modules/schedule";

Vue.use(Vuex);
Vue.use(VueAxios, axios);

export default new Vuex.Store({
  state: {
    departments: COURSES_JSON as Department[],
    catalog: CATALOG_JSON as { [id: string]: CatalogCourse },
    schools: SCHOOLS_JSON as { [id: string]: { code: string; name: string }[] },
    prerequisitesData: PREREQUISITES_JSON as { [id: string]: PrerequisiteJSON },
    courseSizes: {} as { [id: string]: CourseSize },
    lastNewSchedule: 0,
    warningMessage: "",
  },
  getters: {
    shouldShowAlert: (state) => {
      return state.warningMessage !== "";
    },

    warningMessage: (state) => {
      return state.warningMessage;
    },
  },
  mutations: {
    SET_COURSE_SIZES(state, courseSizes) {
      state.courseSizes = courseSizes;
    },

    setWarningMessage(state, message) {
      state.warningMessage = message;
    },
  },
  actions: {
    loadCourseSizes({ commit }) {
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
        "prerequisites.priorCourses",
      ],
      rehydrated: (store) => {
        // @ts-expect-error: Typescript doesn't know that `store` can commit
        store.commit("schedule/initSelectedSetions");
        // @ts-expect-error: Typescript doesn't know that `store` can dispatch
        store.dispatch("schedule/generateCurrentSchedulesAndConflicts");
      },
    }),
  ],
});
