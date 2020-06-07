import Vue from "vue";
import Vuex from "vuex";
import axios from "axios";
import VueAxios from "vue-axios";
import createPersistedState from "vuex-persistedstate";

import { Department, CatalogCourse, CourseSize } from "@/typings";

import COURSES_JSON from "./data/courses.json";
import CATALOG_JSON from "./data/catalog.json";

import sections from "./modules/sections";

Vue.use(Vuex);
Vue.use(VueAxios, axios);

export default new Vuex.Store({
  state: {
    departments: COURSES_JSON as { [id: string]: Department },
    catalog: CATALOG_JSON as { [id: string]: CatalogCourse },
    courseSizes: {} as { [id: string]: CourseSize }
  },
  mutations: {
    SET_COURSE_SIZES(state, courseSizes) {
      state.courseSizes = courseSizes;
    }
  },
  actions: {
    loadCourseSizes({ commit }) {
      //TODO switch heroku to our own proxy because this one has a rate limit
      axios
        .get(
          "https://cors-anywhere.herokuapp.com/https://sis.rpi.edu/reg/rocs/YACS_202009.xml"
        )
        .then(r => r.data)
        .then(data => {
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
    }
  },
  modules: {
    sections
  },
  plugins: [
    createPersistedState({
      paths: ["sections.selectedSections"],
      rehydrated: store => {
        // @ts-expect-error: Typescript doesn't know that `store` has commit and state attributes
        store.commit("sections/populateConflicts", store.state.departments);
      }
    })
  ]
});
