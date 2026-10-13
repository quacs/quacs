import Vue from "vue";
import { CourseSection, Day, Prerequisite, Timeslot } from "@/typings";
import store from "@/store";
import { applyTicker } from "@/themeTicker";

export const DAYS: Day[] = [
  {
    name: "Monday",
    short: "M",
  },
  {
    name: "Tuesday",
    short: "T",
  },
  {
    name: "Wednesday",
    short: "W",
  },
  {
    name: "Thursday",
    short: "R",
  },
  {
    name: "Friday",
    short: "F",
  },
  {
    name: "Saturday",
    short: "S",
  },
  {
    name: "Sunday",
    short: "U",
  },
];

export function getSessions() {
  return (section: CourseSection, day: string): Timeslot[] => {
    const sessions = [];

    for (const timeslot of section.timeslots) {
      if (timeslot.days.includes(day)) {
        sessions.push(timeslot);
      }
    }

    sessions.sort((a, b) => {
      return a.timeStart - b.timeStart;
    });

    return sessions;
  };
}

function formatTime(time: number, isMilitaryTime: boolean): string {
  const hour = Math.floor(time / 100);
  const minute = (time % 100).toString();

  if (isMilitaryTime) {
    return hour + ":" + ("0" + minute).slice(-2);
  }

  let output = "";
  if (hour > 12) {
    output = String(hour - 12);
  } else {
    output = String(hour);
  }

  output += ":" + ("0" + minute).slice(-2);

  if (hour > 11) {
    output += "p";
  } else {
    output += "a";
  }

  return output;
}

export function timestampToString(timestamp: number): string {
  const monthsShortStr = [
    "Jan.",
    "Feb.",
    "Mar.",
    "Apr.",
    "May",
    "June",
    "July",
    "Aug.",
    "Sep.",
    "Oct.",
    "Nov.",
    "Dec.",
  ];

  const date = new Date(timestamp);
  return `${monthsShortStr[date.getMonth() - 1]} ${date.getDate()}`;
}

export function formatTimeslot() {
  return (timeslot: Timeslot, isMilitaryTime: boolean): string => {
    return timeslot.timeStart >= 0
      ? formatTime(timeslot.timeStart, isMilitaryTime) +
          "-" +
          formatTime(timeslot.timeEnd, isMilitaryTime)
      : "";
  };
}

export function formatCourseSize() {
  return function (section: CourseSection): string {
    return section.rem + "/" + section.cap + " seats available";
  };
}

export function minuteTimeToHour(
  minuteTime: number,
  isMilitaryTime: boolean
): string {
  const hour = Math.floor(minuteTime / 60);
  if (isMilitaryTime) {
    return ("0" + hour).slice(-2).toString() + ":00";
  }
  if (hour < 12) {
    return hour + " AM";
  } else if (hour === 12) {
    return "Noon";
  } else {
    return hour - 12 + " PM";
  }
}

// Converts a timeslot time into minutes since midnight
export function toMinutes(time: number): number {
  const hour = Math.floor(time / 100);
  const minute = Math.floor(time % 100);
  return hour * 60 + minute;
}

export function getDuration(timeslot: Timeslot): number {
  return toMinutes(timeslot.timeEnd) - toMinutes(timeslot.timeStart);
}

export function timeslotStartEndUnix(
  timeslot: Timeslot
): [number, number] | [null, null] {
  if (timeslot.dateStart === "" || timeslot.dateEnd === "") {
    // This timeslot doesn't have dates associated with it
    return [null, null];
  }

  // Dates are in the form MM/DD, so we can just split the array
  const [startMonth, startDay] = timeslot.dateStart
    .split("/")
    .map((x) => Number.parseInt(x));
  const [endMonth, endDay] = timeslot.dateEnd
    .split("/")
    .map((x) => Number.parseInt(x));

  const year = Number.parseInt(
    shortSemToLongSem()(process.env.VUE_APP_CURR_SEM).slice(-4)
  );

  const start = new Date(year, startMonth, startDay).getTime();
  const end = new Date(year, endMonth, endDay).getTime();

  return [start, end];
}

//Sets the color theme to the word that is passed in
//If the string is made up of 2 words, the second word is used to set the theme accent
//The theme accent is usually used for slight modifications of a different theme
//EX: Black mode is only slightly different from dark mode
//Also the hard coded word "system" will swap between light/dark based on device reference
// Web fonts for the themes that need them. Each loads the first time its theme is picked
const THEME_FONT_QUERIES: { [theme: string]: string } = {
  manuscript: "family=IM+Fell+English:ital@0;1&family=UnifrakturMaguntia",
  retro: "family=Press+Start+2P&family=VT323",
  artisanal: "family=Comic+Neue:wght@400;700",
  gwern: "family=Source+Sans+3:wght@400;600",
  "liquid-glass": "family=Inter:wght@400;500;600;700",
  "flappy-bird": "family=Pixelify+Sans:wght@400;600",
  neumorphism: "family=Nunito:wght@400;600;700;800;900",
  skeuomorphism:
    "family=Arimo:ital,wght@0,400;0,700;1,400&family=Patrick+Hand&family=Roboto+Condensed:wght@700",
  steampunk:
    "family=Cinzel:wght@600;700&family=Cinzel+Decorative:wght@700&family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&family=Special+Elite&family=Nixie+One",
};

function loadThemeFont(theme: string): void {
  const query = THEME_FONT_QUERIES[theme];
  const id = `theme-font-${theme}`;
  if (query === undefined || document.getElementById(id) !== null) {
    return;
  }
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?${query}&display=swap`;
  document.head.appendChild(link);
}

export const SYSTEM_THEME = "system";
export const RANDOM_THEME = "random";
export const ARTISANAL_THEME = "artisanal";
// The theme used when nothing valid is saved
export const DEFAULT_THEME = SYSTEM_THEME;

const LOGO_DIR = `${shortSemToURL()(process.env.VUE_APP_CURR_SEM)}/img/logos/`;

// The GeoCities homepage themes, so far just the QuACS Academy (theme "geocities"). They share their
// decorations (GeocitiesDecor.vue) and base styles (themes/geocities.css).
export const GEOCITIES_PAGES = ["geocities"] as const;
export type GeocitiesPage = typeof GEOCITIES_PAGES[number];

export interface ThemeOption {
  value: string;
  text: string;
  // false means the theme is applied but never saved, so a reload restores the previously saved theme
  saved: boolean;
  // Navbar logo for this theme, shown instead of the regular or holiday logo
  logo?: string;
}

//Add color theme option here, in the order the settings dropdown shows them
export const THEME_OPTIONS: ThemeOption[] = [
  { value: SYSTEM_THEME, text: "Follow Device Theme", saved: true },
  { value: "light", text: "Light", saved: true },
  { value: "dark", text: "Dark", saved: true },
  { value: "dark black", text: "Black", saved: true },
  { value: RANDOM_THEME, text: "Random", saved: true },
  { value: "yacs", text: "YACS", saved: true },
  { value: "true-dark", text: "True Dark", saved: false },
  { value: "manuscript", text: "Illuminated Manuscript", saved: true },
  { value: "retro", text: "Retro Arcade", saved: true },
  { value: "web1", text: "Classic Web", saved: true },
  { value: "nyan", text: "Nyan Cat", saved: true },
  { value: ARTISANAL_THEME, text: "Artisanal", saved: true },
  { value: "luma", text: "Luma (Calico)", saved: true },
  { value: "trains", text: "MTA", saved: true },
  {
    value: "frutiger-aero",
    text: "Frutiger Aero",
    saved: true,
    logo: require("@/assets/images/aero/logo.png"),
  },
  {
    value: "gwern",
    text: "Gwern",
    saved: true,
    logo: require("@/assets/images/gwern/logo.svg"),
  },
  {
    value: "diablo",
    text: "Diablo II",
    saved: true,
    logo: require("@/assets/images/diablo/logo.webp"),
  },
  { value: "liquid-glass", text: "Liquid Glass", saved: true },
  {
    value: "flappy-bird",
    text: "Flappy Bird",
    saved: true,
    logo: require("@/assets/images/flappy/logo.gif"),
  },
  { value: "neumorphism", text: "Neumorphism", saved: true },
  {
    value: "skeuomorphism",
    text: "Skeuomorphism",
    saved: true,
    logo: require("@/assets/images/skeuomorphism/logo.png"),
  },
  {
    value: "steampunk",
    text: "Steampunk",
    saved: true,
    logo: require("@/assets/images/steampunk/logo.png"),
  },
  {
    value: "geocities",
    text: "GeoCities",
    saved: true,
    logo: require("@/assets/images/geocities/logo-mortarboard.png"),
  },
  { value: "wingdings", text: "Wingdings", saved: false },
];

// The theme that is showing right now, after "system" and "random" are resolved. It is reactive,
// so components can follow theme changes (see ThemeDecor.vue and the logo in App.vue).
export const themeState = Vue.observable({ applied: "" });

// The Gwern theme follows the device's dark mode unless its toolbar pins light or dark
// (GwernDecor.vue). The pinned mode is applied here, with the theme, so the page never flashes.
export const GWERN_MODE_KEY = "gwern-mode";

export function applyGwernMode(theme: string): void {
  let mode: string | null = null;
  try {
    mode = localStorage.getItem(GWERN_MODE_KEY);
  } catch (e) {
    // Storage can be blocked; that just means auto
  }
  if (theme === "gwern" && (mode === "light" || mode === "dark")) {
    document.documentElement.setAttribute("data-gwern-mode", mode);
  } else {
    document.documentElement.removeAttribute("data-gwern-mode");
  }
}

export function themeLogo(theme: string): string | undefined {
  return THEME_OPTIONS.find((option) => option.value.split(" ")[0] === theme)
    ?.logo;
}

// Themes that are applied but never saved, so a reload restores the previously saved theme
export const UNSAVED_THEMES = THEME_OPTIONS.filter(
  (option) => !option.saved
).map((option) => option.value);

// Themes "random" may pick from. Unsaved themes are left out so random never lands on one
const RANDOM_THEMES = THEME_OPTIONS.filter(
  (option) =>
    option.saved &&
    option.value !== RANDOM_THEME &&
    option.value !== SYSTEM_THEME
).map((option) => option.value);

// The newer themes bring a lot of CSS, so each one's CSS loads when someone picks it, instead of
// every visitor downloading all of it with the page. Their CSS can load after a page's own CSS, so
// don't rely on source order to beat a page's rules.
const THEME_STYLES: { [theme: string]: () => Promise<unknown> } = {
  "frutiger-aero": () =>
    import(
      /* webpackChunkName: "theme-frutiger-aero" */ "@/assets/styles/themes/frutiger-aero.css"
    ),
  gwern: () =>
    import(
      /* webpackChunkName: "theme-gwern" */ "@/assets/styles/themes/gwern.css"
    ),
  diablo: () =>
    import(
      /* webpackChunkName: "theme-diablo" */ "@/assets/styles/themes/diablo.css"
    ),
  "liquid-glass": () =>
    import(
      /* webpackChunkName: "theme-liquid-glass" */ "@/assets/styles/themes/liquid-glass.css"
    ),
  "flappy-bird": () =>
    import(
      /* webpackChunkName: "theme-flappy-bird" */ "@/assets/styles/themes/flappy-bird.css"
    ),
  neumorphism: () =>
    import(
      /* webpackChunkName: "theme-neumorphism" */ "@/assets/styles/themes/neumorphism.css"
    ),
  skeuomorphism: () =>
    import(
      /* webpackChunkName: "theme-skeuomorphism" */ "@/assets/styles/themes/skeuomorphism.css"
    ),
  steampunk: () =>
    import(
      /* webpackChunkName: "theme-steampunk" */ "@/assets/styles/themes/steampunk.css"
    ),
  geocities: () =>
    import(
      /* webpackChunkName: "theme-geocities" */ "@/assets/styles/themes/geocities-ring.css"
    ),
};
const loadedThemeStyles = new Set<() => Promise<unknown>>();

// Turns "system" and "random" into the theme to show, e.g. "dark" or "dark black"
export function resolveColorTheme(colorTheme: string): string {
  if (colorTheme === SYSTEM_THEME) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } else if (colorTheme === RANDOM_THEME) {
    return RANDOM_THEMES[Math.floor(Math.random() * RANDOM_THEMES.length)];
  }
  return colorTheme;
}

function themeStylesLoaded(theme: string): boolean {
  const load = THEME_STYLES[theme];
  return load === undefined || loadedThemeStyles.has(load);
}

// Starts loading a theme's web font, and its CSS if it has its own (THEME_STYLES). Resolves once
// the CSS is in, which is right away for themes without their own CSS.
export function loadThemeStyles(colorTheme: string): Promise<void> {
  const theme = colorTheme.split(" ")[0];
  loadThemeFont(theme);
  const load = THEME_STYLES[theme];
  if (themeStylesLoaded(theme)) {
    return Promise.resolve();
  }
  return load().then(() => {
    loadedThemeStyles.add(load);
  });
}

// Counts setColorTheme calls, so a theme whose CSS finishes loading late doesn't replace a later pick
let themeRequest = 0;

// newColorTheme is colorTheme with "system" and "random" resolved, for when that's already done
export function setColorTheme(
  colorTheme: string,
  newColorTheme = resolveColorTheme(colorTheme)
): void {
  const request = ++themeRequest;
  if (themeStylesLoaded(newColorTheme.split(" ")[0])) {
    applyColorTheme(colorTheme, newColorTheme);
    return;
  }
  // The current theme stays until the new one's CSS is in, so nothing shows half styled
  loadThemeStyles(newColorTheme).then(
    () => {
      if (request === themeRequest) {
        applyColorTheme(colorTheme, newColorTheme);
      }
    },
    () => {
      // The CSS couldn't load (e.g. offline), so the current theme stays
    }
  );
}

function applyColorTheme(colorTheme: string, newColorTheme: string): void {
  const theme = newColorTheme.split(" ")[0];
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.toggleAttribute(
    "data-geocities",
    (GEOCITIES_PAGES as readonly string[]).includes(theme)
  );
  applyGwernMode(theme);
  themeState.applied = theme;
  if (theme === ARTISANAL_THEME) {
    applyTicker();
  }
  loadThemeFont(theme);
  document.documentElement.setAttribute(
    "data-theme-accent",
    newColorTheme.split(" ")[1]
  );
  const rum = window.DD_RUM;
  rum?.onReady(() => {
    if (typeof rum.setGlobalContextProperty === "function") {
      rum.setGlobalContextProperty("selected_theme", colorTheme);
      rum.setGlobalContextProperty("applied_theme", newColorTheme);
    }
  });
}

function meetsPrerequisite(
  priorCourses: { [crn: string]: boolean },
  prereq: Prerequisite
): boolean {
  if (prereq.type === "course") {
    return prereq.course.replace(" ", "-") in priorCourses;
  } else if (prereq.type === "and") {
    return prereq.nested.every((childPrereq) =>
      meetsPrerequisite(priorCourses, childPrereq)
    );
  } else if (prereq.type === "or") {
    return prereq.nested.some((childPrereq) =>
      meetsPrerequisite(priorCourses, childPrereq)
    );
  } else {
    throw "Invalid prerequisite type";
  }
}

export function hasMetAllPrerequisites() {
  return function (crn: string): boolean {
    if (
      !store.getters.prerequisitesDataInitialized ||
      !(crn in store.state.prerequisitesData)
    ) {
      // Not initialized yet, don't warn them
      return true;
    }

    if ("prerequisites" in store.state.prerequisitesData[crn]) {
      return meetsPrerequisite(
        store.getters["prerequisites/getPriorCourses"](),
        // @ts-expect-error: I check that this exists already so we can ignore typescript
        store.state.prerequisitesData[crn].prerequisites
      );
    }
    //Return true because this section has no prerequisites
    return true;
  };
}

function getPrerequisiteFormatHtml(
  priorCourses: { [crn: string]: boolean },
  prereq: Prerequisite,
  topLevel = true
): string {
  let output = "";

  if (prereq.type === "course") {
    if (meetsPrerequisite(priorCourses, prereq)) {
      output += `<span style="color: var(--taken-course);">`;
    } else {
      output += `<span style="color: var(--not-taken-course);">`;
    }

    const title = store.state.prereqGraph[prereq.course]?.title;
    output += prereq.course.replace(" ", "-");
    if (title) {
      output += " " + title;
    }

    output += "</span>";
  } else {
    if (!topLevel) {
      output += "(";
    }

    output += prereq.nested
      .map((childPrereq) =>
        getPrerequisiteFormatHtml(priorCourses, childPrereq, false)
      )
      .join(` ${prereq.type} `);

    if (!topLevel) {
      output += ")";
    }
  }

  return output;
}

export function formatPrerequisites() {
  return function (crn: string): string {
    if (!store.getters.prerequisitesDataInitialized) {
      // Not initialized yet, don't give any info
      return "";
    }

    if ("prerequisites" in store.state.prerequisitesData[crn]) {
      return getPrerequisiteFormatHtml(
        store.getters["prerequisites/getPriorCourses"](),
        // @ts-expect-error: I check that this exists already so we can ignore typescript
        store.state.prerequisitesData[crn].prerequisites
      );
    } else {
      return "";
    }
  };
}

export function shortSemToLongSem() {
  return function (shortSem: string): string {
    const year = shortSem.substring(0, 4);

    const semNum = shortSem.substring(4);
    let sem = "";
    if (semNum === "01") {
      sem = "Spring";
    } else if (semNum === "09") {
      sem = "Fall";
    } else if (semNum === "05") {
      sem = "Summer";
    } else if (semNum === "12") {
      sem = "Winter Enrichment";
    } else {
      sem = semNum;
    }

    return `${sem} ${year}`;
  };
}

// THIS FUNCTION IS DUPLICATED IN vue.config.js BECAUSE
// I DON'T KNOW HOW TO IMPORT IT.  ANY CHANGES MUST ALSO
// BE MADE THERE.
export function shortSemToURL() {
  return function (shortSem: string): string {
    const year = shortSem.substring(0, 4);

    const semNum = shortSem.substring(4);
    let sem = "";
    if (semNum === "01") {
      sem = "spring";
    } else if (semNum === "09") {
      sem = "fall";
    } else if (semNum === "05") {
      sem = "summer";
    } else if (semNum === "12") {
      sem = "winter-enrichment";
    } else {
      sem = semNum;
    }

    return `/${sem}${year}`;
  };
}

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 *
 * Modified from https://stackoverflow.com/a/6274381
 */
export function shuffleArray<T>(a: T[]): T[] {
  let j, x;
  for (let i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

export function getLogo(): string {
  const defaultLogo = ["quacs_logo_white_duck.svg"];

  // Returns a date in the current year with the specified month and day
  // Note: Uses 1-indexing for months (e.g. 1=January, 12=December).
  const createDate = (month: number, day: number): Date => {
    const date = new Date();
    date.setMonth(month - 1);
    date.setDate(day);
    return date;
  };

  // The holidayRange is an array of tuples that contain:
  // 1. a start date
  // 2. an end date
  // 3. a list of logos that can be used
  const holidayRange: [Date, Date, string[]][] = [
    [createDate(12, 20), createDate(12, 31), ["quacs_logo_christmas.svg"]], // christmas
    [createDate(11, 20), createDate(11, 31), ["quacs_logo_thanksgiving.svg"]], // thanksgiving
    [createDate(10, 20), createDate(11, 2), ["quacs_logo_halloween.svg"]], // halloween
  ];

  // Find a fitting range
  let logos = defaultLogo;
  const today = new Date();

  for (let i = 0; i < holidayRange.length; ++i) {
    const holiday = holidayRange[i];
    const start = holiday[0];
    const end = holiday[1];

    if (start <= today && today <= end) {
      logos = holiday[2];
      break;
    }
  }

  // Randomly shuffle and select the first element
  shuffleArray(logos);
  return `${LOGO_DIR}${logos[0]}`;
}
