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
          <b-navbar-nav>
            <autocomplete
              aria-label="Search"
              placeholder="Search Courses"
              :search="filterResults"
              :get-result-value="displayResult"
              @submit="search"
              :debounce-time="200"
            ></autocomplete>
          </b-navbar-nav>
          <b-navbar-nav class="ml-auto">
            <b-navbar-nav>
              <b-nav-item
                to="/schedule"
                class="nav-text"
                :active="this.$route.path == '/schedule'"
                >Schedule</b-nav-item
              >
              <b-nav-item to="#" class="nav-text" disabled
                >Fall 2020</b-nav-item
              >
              <b-nav-item class="nav-text" v-b-modal.settings-modal>
                <i
                  class="fas fa-cog"
                  tabindex="-1"
                  title="Settings"
                  style="font-size:1.9rem"
                ></i
              ></b-nav-item>
            </b-navbar-nav>
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
    <Settings></Settings>
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

import Settings from "@/components/Settings.vue";

import { fuseSearch } from "@/searchUtilities";

// @ts-expect-error: Typescript doesn't know the types for this
import Autocomplete from "@trevoreyre/autocomplete-vue";
import "@trevoreyre/autocomplete-vue/dist/style.css";
Vue.use(Autocomplete);

@Component({
  components: {
    Settings
  }
})
export default class App extends Vue {
  searchString = "";

  filterResults(input: string) {
    this.searchString = input;
    return fuseSearch(input);
  }

  displayResult(result: { item: Course; refIndex: number }) {
    return result.item.subj + "-" + result.item.crse + " " + result.item.title;
  }

  search(result: { item: Course; refIndex: number }) {
    if (result) {
      this.searchString = this.displayResult(result);
    }
    this.$router.push("/search/" + this.searchString).catch(() => {
      return;
    });
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

.nav-text {
  font-size: 1.5rem;
}
</style>
