import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import Home from "../views/Home.vue";
import Search from "../views/Search.vue";
import { trackView, shortSemToURL } from "@/utilities";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    //TODO does this redirect break any of the website loading in json code????
    name: "home",
    path: "/",
    redirect: {
      name: "semester",
      params: { semester: shortSemToURL()(process.env.VUE_APP_CURR_SEM) },
    },
  },
  {
    name: "semester",
    path: "/:semester/",
    component: Home,
  },
  {
    name: "department",
    path: "/:semester/department/:code",
    component: () => import("../views/Department.vue"),
    props: true,
  },
  {
    name: "schedule",
    path: "/:semester/schedule",
    component: () => import("../views/Schedule.vue"),
  },
  {
    name: "search",
    path: "/:semester/search",
    component: Search,
  },
  {
    name: "prerequisites",
    path: "/:semester/prerequisites",
    component: () => import("../views/Prerequisites.vue"),
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

let initialDataSent = false;

router.afterEach((to, from) => {
  const to_path = to.fullPath.split("?")[0];
  const from_path = from.fullPath.split("?")[0];

  if (to_path === from_path && initialDataSent) {
    return;
  }

  const formatted_to_path = `${process.env.BASE_URL.slice(0, -1)}${to_path}`;
  if (initialDataSent) {
    // Don't track referrers for subsequent page changes
    trackView(formatted_to_path, "");
  } else {
    initialDataSent = true;
    trackView(formatted_to_path);
  }

  //TODO make sure this works when coming from the default `/` url where you dont have a semester
  //When switching semesters, do a hard refresh of the browser to automatically update all the required semester files
  if (from.params.semester && to.params.semester != from.params.semester) {
    router.go(0);
  }
});

export default router;
