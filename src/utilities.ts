import { CourseSection, Day, ShortDay, Timeslot } from "@/typings";
import store from "@/store";

export const DAYS: Day[] = [
  {
    name: "Monday",
    short: ShortDay.Monday,
  },
  {
    name: "Tuesday",
    short: ShortDay.Tuesday,
  },
  {
    name: "Wednesday",
    short: ShortDay.Wednesday,
  },
  {
    name: "Thursday",
    short: ShortDay.Thursday,
  },
  {
    name: "Friday",
    short: ShortDay.Friday,
  },
];

export function getSessions() {
  return (section: CourseSection, day: ShortDay): Timeslot[] => {
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
  return (timeslot: Timeslot, isMilitaryTime: boolean) => {
    return timeslot.timeStart >= 0
      ? formatTime(timeslot.timeStart, isMilitaryTime) +
          "-" +
          formatTime(timeslot.timeEnd, isMilitaryTime)
      : "";
  };
}

export function formatCourseSize() {
  return function (crn: string): string {
    if (crn in store.state.courseSizes) {
      return (
        store.state.courseSizes[crn].avail +
        "/" +
        store.state.courseSizes[crn].seats +
        " seats"
      );
    }

    return "";
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
