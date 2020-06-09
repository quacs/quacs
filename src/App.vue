<template>
  <div id="app">
    <div id="wrapper">
      <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <router-link class="navbar-brand" to="/"
          ><img
            src="@/assets/images/quacs_logo_white.svg"
            alt="QuACS Home"
            style="height:40px"
        /></router-link>
        <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
        <b-collapse id="nav-collapse" is-nav>
          <autocomplete
            aria-label="Search"
            placeholder="Search Courses"
            auto-select
            :search="filterResults"
            :get-result-value="displayResult"
            @submit="search"
          ></autocomplete>
          <b-navbar-nav class="ml-auto">
            <router-link class="navbar-brand" to="/schedule"
              >Schedule</router-link
            >
          </b-navbar-nav>
        </b-collapse>
      </nav>

      <div class="container-fluid" style="margin-top: 1rem;">
        <div class="row">
          <div class="col-lg-1"></div>
          <div class="col-lg"><router-view /></div>
          <div class="col-lg-1"></div>
        </div>
      </div>
    </div>
    <footer class="footer">
      <a
        href="https://github.com/quacs/quacs"
        title="Visit our GitHub"
        aria-label="Visit our GitHub"
        ><i class="fab fa-github"></i
      ></a>
      <img
        src="@/assets/images/quacs_white.svg"
        alt="QuACS"
        style="height:40px"
      />
      <a
        href="https://discord.gg/EyGZTAP"
        title="Join our development Discord server"
        aria-label="Join our development Discord server"
        ><i class="fab fa-discord"></i
      ></a>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Course } from "@/typings";

import Fuse from "fuse.js";

// @ts-expect-error: Typescript doesn't know the types for this
import Autocomplete from "@trevoreyre/autocomplete-vue";
import "@trevoreyre/autocomplete-vue/dist/style.css";
Vue.use(Autocomplete);

@Component
export default class App extends Vue {
  searchString = "";
  fuseOptions = {
    isCaseSensitive: false,
    // includeScore: true,
    shouldSort: true,
    // includeMatches: false,
    // findAllMatches: false,
    // minMatchCharLength: 5,
    // location: 0,
    threshold: 0.2,
    // distance: 100,
    // useExtendedSearch: false,
    keys: [
      "title",
      "crse",
      "subj",
      "sections.crn",
      "sections.timeslots.instructor",
      "sections.timeslots.location"
    ]
  };

  get courses(): Course[] {
    const courses = [];
    for (const deptName in this.$store.state.departments) {
      const dept = this.$store.state.departments[deptName];
      for (const courseName in dept.courses) {
        const course = dept.courses[courseName];
        courses.push(course);
      }
    }
    return courses;
  }

  filterResults(input: string) {
    this.searchString = input;
    if (input.length === 0) return [];
    const fuse = new Fuse(this.courses, this.fuseOptions);
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(fuse.search(input));
      }, 200);
    });
  }

  displayResult(result: { item: Course; refIndex: number }) {
    return result.item.subj + "-" + result.item.crse + " " + result.item.title;
  }

  search(result: { item: Course; refIndex: number }) {
    if (result)
      this.$router
        .push("/course/" + result.item.subj + "-" + result.item.crse)
        .catch(() => {
          return;
        });
    else {
      const fuse = new Fuse(this.courses, this.fuseOptions);
      const results = fuse.search(this.searchString);
      if (results.length > 0)
        this.$router
          .push("/course/" + results[0].item.subj + "-" + results[0].item.crse)
          .catch(() => {
            return;
          });
      else if (this.searchString.match(/[A-Z]{4}-\d{4}/))
        this.$router
          .push("/course/" + this.searchString.slice(0, 9))
          .catch(() => {
            return;
          });
    }
  }
}
</script>

<style scoped>
@import "./assets/styles/main.css";

footer {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2rem;
  padding-top: 2rem;
  padding-bottom: 2rem;
  background: lightgrey;
}

footer > * {
  color: black;
  font-size: 2.4rem;
  padding: 0rem 1rem;
}

footer > a:hover {
  color: DimGrey;
}
</style>
