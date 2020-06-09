import { CourseSection, Day, ShortDay, Timeslot } from "@/typings";
import store from "@/store";

export const DAYS: Day[] = [
  {
    name: "Monday",
    short: ShortDay.Monday
  },
  {
    name: "Tuesday",
    short: ShortDay.Tuesday
  },
  {
    name: "Wednesday",
    short: ShortDay.Wednesday
  },
  {
    name: "Thursday",
    short: ShortDay.Thursday
  },
  {
    name: "Friday",
    short: ShortDay.Friday
  }
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

  if (isMilitaryTime) return hour + ":" + ("0" + minute).slice(-2);

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
  return function(crn: string): string {
    if (crn in store.state.courseSizes) {
      return (
        store.state.courseSizes[crn].avail +
        "/" +
        store.state.courseSizes[crn].seats
      );
    }

    return "";
  };
}

export function minuteTimeToHour(minuteTime: number): string {
  const hour = Math.floor(minuteTime / 60);
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
