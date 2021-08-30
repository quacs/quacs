/* eslint-disable no-console */

import { register } from "register-service-worker";
import store from "@/store";

if (process.env.NODE_ENV === "production") {
  register(`${process.env.BASE_URL}service-worker.js`, {
    ready() {
      console.log(
        "App is being served from cache by a service worker.\n" +
          "For more details, visit https://goo.gl/AFskqB"
      );
    },
    registered() {
      console.log("Service worker has been registered.");
    },
    cached() {
      console.log("Content has been cached for offline use.");
    },
    updatefound() {
      console.log("New content is downloading.");
    },
    updated() {
      console.log("New content is available; please refresh.");
      // The 'reload' function in location has a non-standard 'forceGet' operator
      // which clears the cache. Typescript doesn't like this; however, in browsers
      // that don't support it, the extra argument is harmless.
      // @ts-expect-error: see above
      window.location.reload(true); //Force refresh as soon as there are updates
      store.commit("toggleUpdateNotice", true);
    },
    offline() {
      console.log(
        "No internet connection found. App is running in offline mode."
      );
    },
    error(error) {
      console.error("Error during service worker registration:", error);
    },
  });
}
