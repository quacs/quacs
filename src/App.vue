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
          <b-input-group>
            <input
              id="search-bar"
              placeholder="Search Courses"
              aria-label="Search Courses"
              v-on:input="search($event.target.value)"
              v-on:keyup.enter="search($event.target.value, 0)"
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
                to="#"
                class="nav-text text-nowrap"
                v-b-tooltip.hover
                title="Multiple semester support coming soon!"
                >Fall 2020</b-nav-item
              >
              <b-nav-item class="nav-text desktop-only" disabled>|</b-nav-item>
              <b-nav-item
                to="/prerequisites"
                class="nav-text"
                :active="this.$route.path == '/prerequisites'"
                >Prerequisites</b-nav-item
              >
              <b-nav-item
                to="/schedule"
                class="nav-text"
                :active="this.$route.path == '/schedule'"
                >Schedule</b-nav-item
              >
              <b-nav-item class="nav-text" v-b-modal.settings-modal>
                <font-awesome-icon
                  title="Settings"
                  :icon="['fas', 'cog']"
                ></font-awesome-icon>
              </b-nav-item>
            </b-navbar-nav>
          </b-navbar-nav>
        </b-collapse>
      </nav>

      <div class="container-fluid" style="margin-top: 1rem;">
        <div class="row">
          <div class="col-lg-1"></div>
          <div class="col-lg">
            <router-view :key="wasmLoaded" />
            <b-alert
              variant="warning"
              show
              class="fixed-bottom sticky-top"
              :class="{ invisible: !shouldShowAlert }"
              ><b-spinner
                style="width: 1.5rem; height: 1.5rem;"
                label="Spinning"
              ></b-spinner
              ><span class="warning-message">{{
                warningMessage
              }}</span></b-alert
            >
          </div>
          <div class="col-lg-1"></div>
        </div>
      </div>
    </div>
    <Settings></Settings>
    <footer class="footer">
      <div class="footer-links">
        <a
          href="https://github.com/quacs/quacs"
          title="Visit our GitHub"
          aria-label="Visit our GitHub"
          target="_blank"
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
          target="_blank"
          ><font-awesome-icon :icon="['fab', 'discord']"></font-awesome-icon>
        </a>
      </div>
      <div class="footer-copyright">
        &copy; 2020 - Questionably Accurate Course Scheduler
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { mapGetters, mapState } from "vuex";
import Settings from "@/components/Settings.vue";

@Component({
  components: {
    Settings,
  },
  computed: {
    ...mapGetters(["shouldShowAlert", "warningMessage"]),
    ...mapState("schedule", ["wasmLoaded"]),
  },
})
export default class App extends Vue {
  searchCallback: number | null = null;
  searching = false;

  search(input: string, searchTimeout = 250) {
    this.searching = true;

    if (this.searchCallback !== null) {
      clearTimeout(this.searchCallback as number);
    }

    if (input.length === 0) {
      this.searching = false;
      this.$router.push("/").catch(() => {
        return;
      });
    } else {
      this.searchCallback = setTimeout(() => {
        this.$router.push("/search?" + input).catch(() => {
          this.searching = false;
          return;
        });
        this.searching = false;
      }, searchTimeout);
    }
  }
}
</script>

<style scoped>
@import "./assets/styles/main.css";

footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 2rem;
  padding-top: 2rem;
  padding-bottom: 2rem;
  background: var(--footer-background);
}

.footer-links > * {
  color: var(--global-text);
  font-size: 2.4rem;
  padding: 0rem 1rem;
}

.footer-links > a:hover {
  color: DimGrey;
}

.footer-links {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.footer-copyright {
  color: var(--global-text);
  font-size: 1rem;
  padding: 0rem 1rem;
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
  font-size: 3rem;
}

#search-bar {
  width: 400px;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 12px 12px 12px 48px;
  box-sizing: border-box;
  position: relative;
  font-size: 16px;
  line-height: 1.5;
  /* flex: 1; */
  background-color: #eee;
  background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTEiIGN5PSIxMSIgcj0iOCIvPjxwYXRoIGQ9Ik0yMSAyMWwtNC00Ii8+PC9zdmc+");
  background-repeat: no-repeat;
  background-position: 12px;
}

#search-bar:focus {
  border-color: rgba(0, 0, 0, 0.12);
  background-color: #fff;
  outline: none;
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.16);
}

.warning-message {
  font-size: 1.5rem;
  margin-left: 1.5rem;
}

.invisible {
  visibility: hidden;
}
</style>
