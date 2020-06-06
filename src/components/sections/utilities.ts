import { CourseSection, Timeslot, Day } from "../../typings";

export function getSessions() {
  return (section: CourseSection, day: Day): Timeslot[] => {
    const sessions = [];

    for (const timeslot of section.timeslots) {
      if (timeslot.days.includes(day)) {
        sessions.push(timeslot);
      }
    }

    sessions.sort((a, b) => {
      return a.time_start - b.time_start;
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
    formatTime(timeslot.time_start) + "-" + formatTime(timeslot.time_end);
}
