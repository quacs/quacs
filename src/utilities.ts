import { CourseSection, Day, Prerequisite, Timeslot } from "@/typings";
import store from "@/store";

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

//Sets the color theme to the word that is passed in
//If the string is made up of 2 words, the second word is used to set the theme accent
//The theme accent is usually used for slight modifications of a different theme
//EX: Black mode is only slightly different from dark mode
//Also the hard coded word "system" will swap between light/dark based on device reference
export function setColorTheme(colorTheme: string): void {
  let newColorTheme = colorTheme;
  if (colorTheme === "system") {
    newColorTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  document.documentElement.setAttribute(
    "data-theme",
    newColorTheme.split(" ")[0]
  );
  document.documentElement.setAttribute(
    "data-theme-accent",
    newColorTheme.split(" ")[1]
  );
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
    output += prereq.course.replace(" ", "-");
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
