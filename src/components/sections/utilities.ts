import { CourseSection, Timeslot, Day } from "@/typings";
import store from "@/store";

export function getSessions() {
  return (section: CourseSection, day: Day): Timeslot[] => {
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

function formatTime(time: number): string {
  const hour = Math.floor(time / 100);
  const minute = (time % 100).toString();

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
  return (timeslot: Timeslot) =>
    timeslot.timeStart >= 0
      ? formatTime(timeslot.timeStart) + "-" + formatTime(timeslot.timeEnd)
      : "";
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
