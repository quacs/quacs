// eslint-disable-next-line
export async function scrapeTranscript(fileId) {
  const files = document.getElementById(fileId).files;
  if (files.length < 1) {
    throw "missing file";
  }

  if (files[0].type !== "text/html") {
    throw `wrong type "${files[0].type}"`;
  }

  const text = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    // Wait till complete
    reader.onload = function (e) {
      resolve(e.target.result);
    };
    // Make sure to handle error states
    reader.onerror = function (e) {
      reject(e);
    };
    reader.readAsText(files[0]);
  });

  const parser = new DOMParser();
  const transcript = parser.parseFromString(text, "text/html");

  const rows = transcript
    .getElementsByClassName("datadisplaytable")[0]
    .getElementsByTagName("tbody")[0]
    .getElementsByTagName("tr");

  const data = {};

  //STUDENT INFORMATION
  data.majors = [];
  let rowNum = 0;
  for (; rowNum < rows.length; rowNum++) {
    if (rows[rowNum].children[0].innerText === "Name :") {
      data.name = rows[rowNum].children[1].innerText.trim();
    } else if (rows[rowNum].children[0].innerText === "Student Type:") {
      data.studentType = rows[rowNum].children[1].innerText.trim();
    } else if (rows[rowNum].children[0].innerText === "Current Program") {
      rowNum++;
      data.currentProgram = rows[rowNum].children[0].innerText.trim();
    } else if (rows[rowNum].children[0].innerText === "College:") {
      data.college = rows[rowNum].children[1].innerText.trim();
    } else if (rows[rowNum].children[0].innerText.startsWith("Major")) {
      data.majors.push(rows[rowNum].children[1].innerText.trim());
    } else if (
      rows[rowNum].children[0].innerText.startsWith(
        "***Transcript type:UWEB is NOT Official ***"
      )
    ) {
      break;
    }
  }

  data.terms = [];
  rowNum += 4;
  //TRANSFER CREDIT ACCEPTED BY INSTITUTION
  if (!rows[rowNum].children[0].innerText.startsWith("INSTITUTION CREDIT")) {
    rowNum += 1;

    while (
      !rows[rowNum].children[0].innerText.startsWith("INSTITUTION CREDIT")
    ) {
      rowNum += 2;
      const courses = [];
      for (; rowNum < rows.length; rowNum++) {
        const columns = rows[rowNum].getElementsByTagName("td");
        if (!columns[0].innerText.trim()) {
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
      }
      rowNum++;
      const columns = rows[rowNum].getElementsByTagName("td");
      data.terms.push({
        term: "ap",
        courses: courses,
        attemptHours: columns[0].innerText.trim(),
        passedHours: columns[1].innerText.trim(),
        earnedHours: columns[2].innerText.trim(),
        gpaHours: columns[3].innerText.trim(),
        qualityPoints: columns[4].innerText.trim(),
        gpa: columns[5].innerText.trim(),
      });
      rowNum += 4;
    }
  }

  rowNum += 1;
  //INSTITUTION CREDIT
  while (!rows[rowNum].children[0].innerText.startsWith("TRANSCRIPT TOTALS")) {
    const termData = {};
    termData.term = rows[rowNum].children[0].innerText
      .split("Term: ")[1]
      .trim();

    while (rows[rowNum].children[0].innerText !== "Subject") {
      rowNum++;
      if (rows[rowNum].children[0].innerText === "Major:") {
        termData.major = rows[rowNum].children[1].innerText.trim();
      } else if (rows[rowNum].children[0].innerText === "Academic Standing:") {
        termData.academicStanding = rows[rowNum].children[1].innerText.trim();
      } else if (
        rows[rowNum].children[0].innerText === "Additional Standing:"
      ) {
        termData.additionalStanding = rows[rowNum].children[1].innerText.trim();
      }
    }
    rowNum++;

    const courses = [];
    for (; rowNum < rows.length; rowNum++) {
      const columns = rows[rowNum].getElementsByTagName("td");
      if (rows[rowNum].children[0].innerText.includes("Term Totals")) {
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
    }

    termData.courses = courses;

    rowNum += 2;
    let columns = rows[rowNum].getElementsByTagName("td");
    termData.currentTerm = {};
    termData.currentTerm.attemptHours = columns[0].innerText.trim();
    termData.currentTerm.passedHours = columns[1].innerText.trim();
    termData.currentTerm.earnedHours = columns[2].innerText.trim();
    termData.currentTerm.gpaHours = columns[3].innerText.trim();
    termData.currentTerm.qualityPoints = columns[4].innerText.trim();
    termData.currentTerm.gpa = columns[5].innerText.trim();

    rowNum++;
    columns = rows[rowNum].getElementsByTagName("td");
    termData.cumulative = {};
    termData.cumulative.attemptHours = columns[0].innerText.trim();
    termData.cumulative.passedHours = columns[1].innerText.trim();
    termData.cumulative.earnedHours = columns[2].innerText.trim();
    termData.cumulative.gpaHours = columns[3].innerText.trim();
    termData.cumulative.qualityPoints = columns[4].innerText.trim();
    termData.cumulative.gpa = columns[5].innerText.trim();

    data.terms.push(termData);
    rowNum += 4; //There is a hiden nested table with a tr that makes this 4 and not 3. Thank you sis
  }

  rowNum += 2;
  let columns = rows[rowNum].getElementsByTagName("td");
  data.totalInstitution = {};
  data.totalInstitution.attemptHours = columns[0].innerText.trim();
  data.totalInstitution.passedHours = columns[1].innerText.trim();
  data.totalInstitution.earnedHours = columns[2].innerText.trim();
  data.totalInstitution.gpaHours = columns[3].innerText.trim();
  data.totalInstitution.qualityPoints = columns[4].innerText.trim();
  data.totalInstitution.gpa = columns[5].innerText.trim();

  rowNum++;
  columns = rows[rowNum].getElementsByTagName("td");
  data.totalTransfer = {};
  data.totalTransfer.attemptHours = columns[0].innerText.trim();
  data.totalTransfer.passedHours = columns[1].innerText.trim();
  data.totalTransfer.earnedHours = columns[2].innerText.trim();
  data.totalTransfer.gpaHours = columns[3].innerText.trim();
  data.totalTransfer.qualityPoints = columns[4].innerText.trim();
  data.totalTransfer.gpa = columns[5].innerText.trim();

  rowNum++;
  columns = rows[rowNum].getElementsByTagName("td");
  data.overall = {};
  data.overall.attemptHours = columns[0].innerText.trim();
  data.overall.passedHours = columns[1].innerText.trim();
  data.overall.earnedHours = columns[2].innerText.trim();
  data.overall.gpaHours = columns[3].innerText.trim();
  data.overall.qualityPoints = columns[4].innerText.trim();
  data.overall.gpa = columns[5].innerText.trim();

  data.inProgressTerms = [];

  rowNum += 5;
  for (; rowNum < rows.length; rowNum++) {
    const termData = {};
    termData.term = rows[rowNum].children[0].innerText
      .split("Term: ")[1]
      .trim();
    while (rows[rowNum].children[0].innerText !== "Subject") {
      rowNum++;
      if (rows[rowNum].children[0].innerText === "Major:") {
        termData.major = rows[rowNum].children[1].innerText.trim();
      }
    }
    rowNum++;

    const courses = [];
    for (; rowNum < rows.length; rowNum++) {
      const morecolumns = rows[rowNum].getElementsByTagName("td");
      if (!morecolumns[0].innerText.trim()) {
        break;
      }
      courses.push({
        subject: morecolumns[0].innerText.trim(),
        course: morecolumns[1].innerText.trim(),
        level: morecolumns[2].innerText.trim(),
        title: morecolumns[3].innerText.trim(),
        creditHours: morecolumns[4].innerText.trim(),
      });
    }
    termData.courses = courses;

    data.inProgressTerms.push(termData);
    rowNum += 2;
  }

  return data;
}
