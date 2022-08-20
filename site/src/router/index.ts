import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import Home from "@/views/Home.vue";
import Search from "@/views/Search.vue";
import Sponsors from "@/views/Sponsors.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    component: Home,
  },
  {
    path: "/department/:code",
    component: () => import("../views/Department.vue"),
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
    path: "/sponsors",
    component: Sponsors,
  },
  {
    path: "/prerequisites",
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

const initialDataSent = false;

router.afterEach((to, from) => {
  let to_path = to.fullPath.split("?")[0];
  const from_path = from.fullPath.split("?")[0];

  if (to_path === from_path && initialDataSent) {
    return;
  }

  to_path = `${process.env.BASE_URL.slice(0, -1)}${to_path}`;
});

export default router;
