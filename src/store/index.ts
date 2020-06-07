import Vue from "vue";
import Vuex from "vuex";
import createPersistedState from "vuex-persistedstate";

import { Department, CatalogCourse } from "@/typings";

import COURSES_JSON from "./data/courses.json";
import CATALOG_JSON from "./data/catalog.json";

import sections from "./modules/sections";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    departments: COURSES_JSON as { [id: string]: Department },
    catalog: CATALOG_JSON as { [id: string]: CatalogCourse }
  },
  mutations: {},
  actions: {},
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
