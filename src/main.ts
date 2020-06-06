import Vue from "vue";
import App from "./App.vue";

import { BootstrapVue } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import { library } from "@fortawesome/fontawesome-svg-core";
import { faUserSecret } from "@fortawesome/free-solid-svg-icons";
library.add(faUserSecret);
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

import "./registerServiceWorker";
import router from "./router";
import store from "./store";

Vue.config.productionTip = false;

Vue.use(BootstrapVue);
Vue.component("font-awesim-icon", FontAwesomeIcon);

new Vue({
  router,
  store,
  render: h => h(App),
  beforeCreate() {
    this.$store.commit("sections/initializeStore");
  }
}).$mount("#app");
