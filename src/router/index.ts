import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import Home from "../views/Home.vue";
import Department from "../views/Department.vue";
import Schedule from "../views/Schedule.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    component: Home
  },
  {
    path: "/department/:code",
    component: Department,
    props: true
  },
  {
    path: "/schedule",
    component: Schedule
  }
];

const router = new VueRouter({
  routes
});

export default router;
