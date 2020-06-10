import Vue from "vue";
import App from "./App.vue";

import { BootstrapVue } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import "@/assets/styles/global.css";

// Import theme css files here
import "@/assets/styles/colors.css";
import "@/assets/styles/themes/dark.css";
import "@/assets/styles/themes/black.css";

import "./registerServiceWorker";
import router from "./router";
import store from "./store";
import { setColorTheme } from "./utilities";

Vue.config.productionTip = false;

Vue.use(BootstrapVue);

new Vue({
  router,
  store,
  render: h => h(App),
  beforeCreate() {
    this.$store.commit("sections/initializeStore");
  },
  mounted() {
    setColorTheme(this.$store.state.settings.colorTheme);
    this.$store.dispatch("loadCourseSizes");
  }
}).$mount("#app");
