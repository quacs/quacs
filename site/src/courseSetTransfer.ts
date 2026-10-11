// Export and import course sets as JSON files so they can be moved between
// devices or browsers. A file looks like:
// {
//   "quacs_course_sets": 1,
//   "semester": "202101",
//   "course_sets": [{ "name": "Course Set 1", "crns": [12345, 12346] }]
// }
import { CourseSets } from "@/typings";

export const COURSE_SETS_FORMAT_VERSION = 1;

export interface ExportedCourseSet {
  name: string;
  crns: number[];
}

export interface CourseSetsFile {
  quacs_course_sets: number;
  semester: string;
  exported_at?: string;
  course_sets: ExportedCourseSet[];
}

export function buildCourseSetsFile(
  semester: string,
  courseSets: CourseSets,
  names: string[]
): CourseSetsFile {
  return {
    quacs_course_sets: COURSE_SETS_FORMAT_VERSION,
    semester,
    exported_at: new Date().toISOString(),
    course_sets: names.map((name) => ({
      name,
      crns: Object.keys(courseSets[name] || {})
        .filter((crn) => courseSets[name][crn])
        .map((crn) => parseInt(crn)),
    })),
  };
}

// Throws an Error with a user facing message if the file is not valid
export function parseCourseSetsFile(text: string): CourseSetsFile {
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error("This file is not valid JSON.");
  }
  if (
    data === null ||
    typeof data !== "object" ||
    typeof data.quacs_course_sets !== "number" ||
    !Array.isArray(data.course_sets)
  ) {
    throw new Error("This file is not a QuACS course set export.");
  }
  if (data.quacs_course_sets > COURSE_SETS_FORMAT_VERSION) {
    throw new Error(
      "This file was exported by a newer version of QuACS. Try refreshing the page."
    );
  }

  const courseSets: ExportedCourseSet[] = [];
  for (const set of data.course_sets) {
    if (set === null || typeof set !== "object" || !Array.isArray(set.crns)) {
      throw new Error("This file has a course set with no list of CRNs.");
    }
    courseSets.push({
      name: typeof set.name === "string" ? set.name.trim() : "",
      crns: set.crns
        .map((crn: unknown) => Number(crn))
        .filter((crn: number) => Number.isInteger(crn)),
    });
  }
  if (courseSets.length === 0) {
    throw new Error("This file does not contain any course sets.");
  }

  return {
    quacs_course_sets: data.quacs_course_sets,
    semester: String(data.semester ?? ""),
    course_sets: courseSets,
  };
}

// Picks a name that is not taken, e.g. "Name (imported)" or "Name (imported 2)"
export function uniqueCourseSetName(name: string, taken: string[]): string {
  const base = name || "Imported Course Set";
  if (!taken.includes(base)) {
    return base;
  }
  let candidate = `${base} (imported)`;
  for (let i = 2; taken.includes(candidate); i++) {
    candidate = `${base} (imported ${i})`;
  }
  return candidate;
}
