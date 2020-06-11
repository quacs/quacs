import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import Home from "../views/Home.vue";
import Department from "../views/Department.vue";
import Search from "../views/Search.vue";
import Prerequisites from "../views/Prerequisites.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    component: Home,
  },
  {
    path: "/department/:code",
    component: Department,
    props: true,
  },
  {
    path: "/schedule",
    component: () => import("../views/Schedule.vue"),
  },
  {
    path: "/search",
    component: Search,
  },
  {
    path: "/prerequisites",
    component: Prerequisites,
  },
];

const router = new VueRouter({
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else if (to.path !== "/schedule" && from.path !== "/schedule") {
      // Don't move around on the schedule since we change the page
      // around if you switch sections or schedules
      return { x: 0, y: 0 };
    }
  },
});

export default router;
