import Vue from "vue";
import App from "@/App.vue";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import AsyncComputedPlugin from "vue-async-computed";
Vue.use(AsyncComputedPlugin);

import "@/assets/styles/global.css";

// Import theme css files here
import "@/assets/styles/colors.css";
import "@/assets/styles/themes/dark.css";
import "@/assets/styles/themes/black.css";
import "@/assets/styles/themes/yacs.css";
import "@/assets/styles/themes/true-dark.css";
import "@/assets/styles/themes/manuscript.css";
import "@/assets/styles/themes/retro.css";
import "@/assets/styles/themes/web1.css";
import "@/assets/styles/themes/nyan.css";
import "@/assets/styles/themes/artisanal.css";
import "@/assets/styles/themes/luma.css";
import "@/assets/styles/themes/wingdings.css";
import "@/assets/styles/themes/trains.css";
// The newer themes load their CSS when picked instead (THEME_STYLES in utilities.ts)

import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faCalendar,
  faCaretRight,
  faCheck,
  faCog,
  faEdit,
  faExclamationTriangle,
  faFileExport,
  faHeart,
  faInfoCircle,
  faLaptopHouse,
  faPen,
  faPlus,
  faRobot,
  faTrash,
  faUser,
  faUserSlash,
} from "@fortawesome/free-solid-svg-icons";
import { faDiscord, faGithub } from "@fortawesome/free-brands-svg-icons";

library.add(
  faCalendar,
  faCaretRight,
  faCheck,
  faCog,
  faDiscord,
  faEdit,
  faExclamationTriangle,
  faFileExport,
  faGithub,
  faHeart,
  faInfoCircle,
  faLaptopHouse,
  faPen,
  faPlus,
  faRobot,
  faTrash,
  faUser,
  faUserSlash
);

import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
Vue.component("font-awesome-icon", FontAwesomeIcon);

import "./registerServiceWorker";
import router from "@/router";
import store from "@/store";
import { loadThemeStyles, resolveColorTheme, setColorTheme } from "@/utilities";
import { registerWebMcpTools } from "@/webmcp";

Vue.config.productionTip = false;

// "random" is resolved once, so the theme whose CSS the page waits for is the one it shows
const savedColorTheme: string = store.getters["settings/getColorTheme"]();
const firstColorTheme = resolveColorTheme(savedColorTheme);
// Started before the router loads the page's own CSS, so the theme's CSS comes first, like the
// other themes' CSS in the main bundle
const firstThemeStyles = loadThemeStyles(firstColorTheme);

const app = new Vue({
  router,
  store,
  render: (h) => h(App),
  beforeCreate() {
    this.$store.dispatch("init");
    this.$store.commit("schedule/initializeStore");
    this.$store.dispatch("schedule/init");
  },
  mounted() {
    const colorTheme = this.$store.state.settings.colorTheme;
    setColorTheme(
      colorTheme,
      colorTheme === savedColorTheme ? firstColorTheme : undefined
    );
  },
});

// Mount once the theme's CSS is in, so the page never paints in the wrong theme. Only the newer
// themes have CSS to wait for.
firstThemeStyles
  .catch(() => {
    // Mount anyway if it can't load (e.g. offline); the page then shows the default theme
  })
  .then(() => app.$mount("#app"));

registerWebMcpTools(store);
