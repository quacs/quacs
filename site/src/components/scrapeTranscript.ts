interface Course {
  subject: string;
  course: string;
  title: string;
  grade: string;
  creditHours: string;
  qualityPoints?: string;
  repeatStatus?: string;
}

interface Term {
  name: string;
  courses: Course[];
  attemptHours?: string;
  passedHours?: string;
  earnedHours?: string;
  gpaHours?: string;
  qualityPoints?: string;
  gpa?: string;
}

export interface StudentData {
  name: string;
  studentType: string;
  currentProgram: string;
  college: string;
  majors: string[];
  terms: Term[];
}

const transcriptGetter =
  (transcriptRows: HTMLTableRowElement[]) =>
  (rowIdx: number, childIdx: number): string =>
    (transcriptRows[rowIdx].children[childIdx] as HTMLElement).innerText.trim();

export async function scrapeTranscript(fileId: string): Promise<StudentData> {
  const element = document.getElementById(fileId) as HTMLInputElement | null;
  if (element === null) {
    throw "invalid fileId";
  }

  const files = element.files;
  if (files === null || files.length < 1) {
    throw "missing file";
  }

  if (files[0].type !== "text/html") {
    throw `wrong type "${files[0].type}"`;
  }

  const text = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      if (e.target === null) {
        reject(e.target);
      } else {
        resolve(e.target.result);
      }
    };

    reader.onerror = function (e) {
      reject(e);
    };

    reader.readAsText(files[0]);
  });

  if (text === null) {
    throw "error reading file";
  }

  const parser = new DOMParser();
  const transcript = parser.parseFromString(text as string, "text/html");

  const transcriptTable = transcript
    .getElementsByClassName("datadisplaytable")[0]
    .getElementsByTagName("tbody")[0];
  const transcriptRows = Array.from(
    transcriptTable.getElementsByTagName("tr")
  ).filter((child) => child.parentElement === transcriptTable);

  const getTranscriptData = transcriptGetter(transcriptRows);

  const data: StudentData = {
    name: "",
    studentType: "",
    currentProgram: "",
    college: "",
    majors: [],
    terms: [],
  };

  let rowNum = 0;
  let parsingStudentInfo = true;
  while (rowNum < transcriptRows.length && parsingStudentInfo) {
    const rowText = getTranscriptData(rowNum, 0);

    switch (rowText) {
      case "Name :":
        data.name = getTranscriptData(rowNum, 1);
        break;

      case "Student Type: ":
        data.studentType = getTranscriptData(rowNum, 1);
        break;

      case "Current Program: ":
        rowNum++; // Current Program is stored in the next row, not a child element
        data.currentProgram = getTranscriptData(rowNum, 0);
        break;

      case "College:":
        data.college = getTranscriptData(rowNum, 1);
        break;

      case "Major:":
        data.majors.push(getTranscriptData(rowNum, 1));
        break;

      default:
        if (
          getTranscriptData(rowNum, 0).startsWith(
            "***Transcript type:UWEB is NOT Official ***"
          )
        ) {
          //
          parsingStudentInfo = false;
        }
        break;
    }

    rowNum++; // continue to next row
  }

  rowNum += 3; // skip over the dividers
  if (
    getTranscriptData(rowNum, 0).startsWith(
      "TRANSFER CREDIT ACCEPTED BY INSTITUTION"
    )
  ) {
    // Parse transfer terms
    rowNum++; // move off of header

    while (rowNum < transcriptRows.length) {
      if (
        getTranscriptData(rowNum, 0).startsWith("INSTITUTION CREDIT") ||
        getTranscriptData(rowNum, 0).startsWith("TRANSCRIPT TOTALS")
      ) {
        // We're done parsing transfer terms, move on to RPI courses
        break;
      }

      const termName = `${getTranscriptData(rowNum, 0).slice(
        0,
        -1
      )} (transfer from ${getTranscriptData(rowNum, 1)})`;
      rowNum++; // move off of semester/school name
      rowNum++; // move off of table headers

      // Loop over all of the courses for this semester
      const courses: Course[] = [];
      while (rowNum < transcriptRows.length) {
        const columns = transcriptRows[rowNum].getElementsByTagName("td");

        if (columns[0].innerText.trim() === "") {
          // This marks the end of the term (this element has a bunch of headers too)
          // so break out of parsing
          break;
        }

        courses.push({
          subject: columns[0].innerText.trim(),
          course: columns[1].innerText.trim(),
          title: columns[2].innerText.trim(),
          grade: columns[3].innerText.trim(),
          creditHours: columns[4].innerText.trim(),
          qualityPoints: columns[5].innerText.trim(),
          repeatStatus: columns[6].innerText.trim(),
        });

        rowNum++;
      }

      rowNum++; // move off of summary headers

      // We're now pointing at the term summary.  We technically don't need to parse
      // this data, but hey, might as well while we're here (this isn't used anywhere
      // but it may be in the future).  There's no reason to not scrape it since this
      // all stays client-side anyways, but it'll save us time later if we need it for
      // something (cough cough, quacsworks)
      const columns = transcriptRows[rowNum].getElementsByTagName("td");
      data.terms.push({
        name: termName,
        courses: courses,
        attemptHours: columns[0].innerText.trim(),
        passedHours: columns[1].innerText.trim(),
        earnedHours: columns[2].innerText.trim(),
        gpaHours: columns[3].innerText.trim(),
        qualityPoints: columns[4].innerText.trim(),
        gpa: columns[5].innerText.trim(),
      });

      // Skip over trailing rows
      rowNum += 3;
    }
  }

  // If there's institution credit, we should be pointing at it
  if (getTranscriptData(rowNum, 0).startsWith("INSTITUTION CREDIT")) {
    // Parse RPI terms
    rowNum++; // Move off of header

    while (rowNum < transcriptRows.length) {
      if (getTranscriptData(rowNum, 0).startsWith("TRANSCRIPT TOTALS")) {
        // done parsing
        break;
      }

      // We're pointing at the term name
      const termName = getTranscriptData(rowNum, 0);
      rowNum++; // move off of term name
      rowNum += 2; // move off of metadata
      while (getTranscriptData(rowNum, 0) === "Additional Standing:") {
        // skip additional metadata
        rowNum++;
      }
      rowNum++; // move off of table headers

      // Loop over all of the courses for this semester
      const courses: Course[] = [];
      while (rowNum < transcriptRows.length) {
        const columns = transcriptRows[rowNum].getElementsByTagName("td");

        if (columns.length === 0) {
          // This marks the end of the term (this element has a bunch of headers too)
          // so break out of parsing
          break;
        }

        courses.push({
          subject: columns[0].innerText.trim(),
          course: columns[1].innerText.trim(),
          title: columns[2].innerText.trim(),
          grade: columns[3].innerText.trim(),
          creditHours: columns[4].innerText.trim(),
          qualityPoints: columns[5].innerText.trim(),
          repeatStatus: columns[6].innerText.trim(),
        });

        rowNum++;
      }

      rowNum++; // move off of "Term Totals (Undergraduate)"
      rowNum++; // move off of summary headers

      // We're now pointing at the term summary.  We technically don't need to parse
      // this data, but hey, might as well while we're here (this isn't used anywhere
      // but it may be in the future).  There's no reason to not scrape it since this
      // all stays client-side anyways, but it'll save us time later if we need it for
      // something (cough cough, quacsworks)
      const columns = transcriptRows[rowNum].getElementsByTagName("td");
      data.terms.push({
        name: termName,
        courses: courses,
        attemptHours: columns[0].innerText.trim(),
        passedHours: columns[1].innerText.trim(),
        earnedHours: columns[2].innerText.trim(),
        gpaHours: columns[3].innerText.trim(),
        qualityPoints: columns[4].innerText.trim(),
        gpa: columns[5].innerText.trim(),
      });

      // Skip over trailing rows
      rowNum += 4;
    }
  }

  rowNum += 7; // skip over transcript totals
  if (getTranscriptData(rowNum, 0).startsWith("COURSES IN PROGRESS")) {
    // Parse current term
    rowNum++; // Move off of header

    // We're pointing at the term name
    const termName = getTranscriptData(rowNum, 0);
    rowNum++; // move off of term name
    rowNum++; // move off of metadata
    rowNum++; // move off of table headers

    // Loop over all of the courses for this semester
    const courses: Course[] = [];
    while (rowNum < transcriptRows.length) {
      const columns = transcriptRows[rowNum].getElementsByTagName("td");

      if (columns[0].innerText.trim() === "") {
        // This marks the end of the term (this element has a bunch of headers too)
        // so break out of parsing
        break;
      }

      courses.push({
        subject: columns[0].innerText.trim(),
        course: columns[1].innerText.trim(),
        title: columns[2].innerText.trim(),
        grade: columns[3].innerText.trim(),
        creditHours: columns[4].innerText.trim(),
      });

      rowNum++;
    }

    rowNum++; // move off of summary headers

    // We're now pointing at the term summary.
    data.terms.push({
      name: termName,
      courses: courses,
    });
  }

  return data;
}
