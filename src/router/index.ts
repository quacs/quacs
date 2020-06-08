import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import Home from "../views/Home.vue";
import Department from "../views/Department.vue";
import Coursepage from "../views/Coursepage.vue";

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
    component: () => import("../views/Schedule.vue")
  },
  {
    path: "/course/:courseid",
    component: Coursepage,
    props: true
  }
];

const router = new VueRouter({
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    else return { x: 0, y: 0 };
  }
});

export default router;
