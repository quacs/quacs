<template>
  <div id="app">
    <div id="wrapper">
      <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <router-link class="navbar-brand" to="/"
          ><img
            src="@/assets/images/quacs_logo_white_duck.svg"
            alt="QuACS Home"
            style="height: 40px;"
        /></router-link>
        <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
        <b-collapse id="nav-collapse" is-nav>
          <b-input-group prepend="?">
            <input
              placeholder="Search"
              v-on:input="search($event.target.value)"
            />
            <b-spinner
              label="Loading"
              v-if="searching"
              class="search-spinner"
            ></b-spinner>
          </b-input-group>
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
                <font-awesome-icon :icon="['fas', 'cog']"></font-awesome-icon>
              </b-nav-item>
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
        ><font-awesome-icon :icon="['fab', 'github']"></font-awesome-icon>
      </a>
      <img
        src="@/assets/images/quacs_white.svg"
        alt="QuACS"
        style="height: 40px;"
      />
      <a
        href="https://discord.gg/EyGZTAP"
        title="Join our development Discord server"
        aria-label="Join our development Discord server"
        ><font-awesome-icon :icon="['fab', 'discord']"></font-awesome-icon>
      </a>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Settings from "@/components/Settings.vue";

@Component({
  components: {
    Settings,
  },
})
export default class App extends Vue {
  searchCallback: number | null = null;
  searching = false;

  search(input: string) {
    this.searching = true;

    if (this.searchCallback !== null) {
      clearTimeout(this.searchCallback as number);
    }

    this.searchCallback = setTimeout(() => {
      if (input.length > 0) {
        this.$router.push("/search?" + input).catch(() => {
          return;
        });
      }
      this.searching = false;
    }, 250);
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
  background: var(--footer-background);
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

.search-spinner {
  display: block;
  position: fixed;
  z-index: 1031; /* High z-index so it is on top of the page */
  top: 50%;
  right: 50%; /* or: left: 50%; */
  margin-top: -5rem; /* half of the elements height */
  margin-right: -5rem; /* half of the elements widht */

  width: 10rem;
  height: 10rem;
}
</style>
