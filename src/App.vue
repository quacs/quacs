<template>
  <div id="app">
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <router-link class="navbar-brand" to="/"
        ><img src="@/assets/images/quacs_40.png" alt="QuACS" style="height:40px"
      /></router-link>
      <router-link class="navbar-brand" to="/schedule">Schedule</router-link>
      <form class="form-inline my-2 my-lg-0" @submit="search()">
        <autocomplete :search="filterResults" @submit="search()"></autocomplete>
        <button class="btn btn-outline-success my-2 my-sm-0" type="submit">
          Search
        </button>
      </form>
    </nav>

    <div class="container-fluid" style="margin-top: 1rem;">
      <div class="row">
        <div class="col-lg-1"></div>
        <div class="col-lg"><router-view /></div>
        <div class="col-lg-1"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Fuse from "fuse.js";
import Autocomplete from "@trevoreyre/autocomplete-vue";
import "@trevoreyre/autocomplete-vue/dist/style.css";
Vue.use(Autocomplete);

@Component({
  computed: {
    courses: function() {
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
  }
})
export default class App extends Vue {
  searchValue = "";
  fuse = null;
  fuseOptions = {
    isCaseSensitive: false,
    includeScore: true,
    shouldSort: true,
    // includeMatches: false,
    // findAllMatches: false,
    // minMatchCharLength: 5,
    // location: 0,
    threshold: 0.3,
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

  filterResults(input) {
    if (this.fuse == null) {
      this.fuse = new Fuse(this.courses, this.fuseOptions);
    }
    const fuseResults = this.fuse.search(input);
    const results = [];
    for (const result of fuseResults) {
      results.push(result.item.title);
    }
    return results;
  }

  search() {
    this.$router.replace("/search:" + this.searchValue);
  }
}
</script>

<style scoped>
@import "./assets/styles/main.css";
</style>
