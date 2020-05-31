'use strict';

async function scrape_transcript(file_id) {
  const files = $('#' + file_id).prop('files');
  if (files.length < 1) {
    alert("Missing File");
    return;
  }

  if (files[0].type != 'text/html') {
    alert(`ERROR: file must be of type "text/html", your file was of type "${files[0].type}"`);
  }

  const parser = new DOMParser();
  const transcript = parser.parseFromString(await files[0].text(), "text/html");

  const rows = transcript.getElementsByClassName("datadisplaytable")[0].getElementsByTagName('tbody')[0].getElementsByTagName('tr');

  const data = {}

  //STUDENT INFORMATION
  data.majors = []
  let row_num = 0;
  for (; row_num < rows.length; row_num++) {
    if (rows[row_num].children[0].innerText === 'Name :') {
      data.name = rows[row_num].children[1].innerText.trim();
    } else if (rows[row_num].children[0].innerText === 'Student Type:') {
      data.student_type = rows[row_num].children[1].innerText.trim();
    } else if (rows[row_num].children[0].innerText === 'Current Program') {
      row_num++;
      data.current_program = rows[row_num].children[0].innerText.trim();
    } else if (rows[row_num].children[0].innerText === 'College:') {
      data.college = rows[row_num].children[1].innerText.trim();
    } else if (rows[row_num].children[0].innerText.startsWith('Major')) {
      data.majors.push(rows[row_num].children[1].innerText.trim());
    } else if (rows[row_num].children[0].innerText.startsWith('***Transcript type:UWEB is NOT Official ***')) {
      break;
    }
  }


  data.terms = []

  //TRANSFER CREDIT ACCEPTED BY INSTITUTION
  row_num += 4;
  if (rows[row_num].children[0].innerText.includes('TRANSFER CREDIT ACCEPTED BY INSTITUTION')) {
    row_num += 3;
    const courses = []
    for (; row_num < rows.length; row_num++) {
      const columns = rows[row_num].getElementsByTagName('td');
      if (!columns[0].innerText.trim()) {
        break;
      }
      courses.push({
        subject: columns[0].innerText.trim(),
        course: columns[1].innerText.trim(),
        title: columns[2].innerText.trim(),
        grade: columns[3].innerText.trim(),
        credit_hours: columns[4].innerText.trim(),
        quality_points: columns[5].innerText.trim(),
        repeat_status: columns[6].innerText.trim(),
      })
    }
    row_num++;
    const columns = rows[row_num].getElementsByTagName('td');
    data.terms.push({
      term: 'ap',
      courses: courses,
      attempt_hours: columns[0].innerText.trim(),
      passed_hours: columns[1].innerText.trim(),
      earned_hours: columns[2].innerText.trim(),
      gpa_hours: columns[3].innerText.trim(),
      quality_points: columns[4].innerText.trim(),
      gpa: columns[5].innerText.trim(),
    })
  }

  //INSTITUTION CREDIT
  row_num += 5;
  while (!rows[row_num].children[0].innerText.startsWith('TRANSCRIPT TOTALS')) {
    const term_data = {}
    term_data.term = rows[row_num].children[0].innerText.split('Term: ')[1].trim();

    while (rows[row_num].children[0].innerText !== 'Subject') {
      row_num++;
      if (rows[row_num].children[0].innerText === 'Major:') {
        term_data.major = rows[row_num].children[1].innerText.trim();
      } else if (rows[row_num].children[0].innerText === 'Academic Standing:') {
        term_data.academic_standing = rows[row_num].children[1].innerText.trim();
      } else if (rows[row_num].children[0].innerText === 'Additional Standing:') {
        term_data.additional_standing = rows[row_num].children[1].innerText.trim();
      }
    }
    row_num++;

    const courses = []
    for (; row_num < rows.length; row_num++) {
      const columns = rows[row_num].getElementsByTagName('td');
      if (rows[row_num].children[0].innerText.includes('Term Totals')) {
        break;
      }
      courses.push({
        subject: columns[0].innerText.trim(),
        course: columns[1].innerText.trim(),
        title: columns[2].innerText.trim(),
        grade: columns[3].innerText.trim(),
        credit_hours: columns[4].innerText.trim(),
        quality_points: columns[5].innerText.trim(),
        repeat_status: columns[6].innerText.trim()
      })
    }

    term_data.courses = courses;

    row_num += 2;
    let columns = rows[row_num].getElementsByTagName('td');
    term_data.current_term = {};
    term_data.current_term.attempt_hours = columns[0].innerText.trim();
    term_data.current_term.passed_hours = columns[1].innerText.trim();
    term_data.current_term.earned_hours = columns[2].innerText.trim();
    term_data.current_term.gpa_hours = columns[3].innerText.trim();
    term_data.current_term.quality_points = columns[4].innerText.trim();
    term_data.current_term.gpa = columns[5].innerText.trim();

    row_num++;
    columns = rows[row_num].getElementsByTagName('td');
    term_data.cumulative = {};
    term_data.cumulative.attempt_hours = columns[0].innerText.trim();
    term_data.cumulative.passed_hours = columns[1].innerText.trim();
    term_data.cumulative.earned_hours = columns[2].innerText.trim();
    term_data.cumulative.gpa_hours = columns[3].innerText.trim();
    term_data.cumulative.quality_points = columns[4].innerText.trim();
    term_data.cumulative.gpa = columns[5].innerText.trim();

    data.terms.push(term_data);
    row_num += 4; //There is a hiden nested table with a tr that makes this 4 and not 3. Thank you sis
  }

  row_num += 2;
  let columns = rows[row_num].getElementsByTagName('td');
  data.total_institution = {};
  data.total_institution.attempt_hours = columns[0].innerText.trim();
  data.total_institution.passed_hours = columns[1].innerText.trim();
  data.total_institution.earned_hours = columns[2].innerText.trim();
  data.total_institution.gpa_hours = columns[3].innerText.trim();
  data.total_institution.quality_points = columns[4].innerText.trim();
  data.total_institution.gpa = columns[5].innerText.trim();

  row_num++;
  columns = rows[row_num].getElementsByTagName('td');
  data.total_transfer = {};
  data.total_transfer.attempt_hours = columns[0].innerText.trim();
  data.total_transfer.passed_hours = columns[1].innerText.trim();
  data.total_transfer.earned_hours = columns[2].innerText.trim();
  data.total_transfer.gpa_hours = columns[3].innerText.trim();
  data.total_transfer.quality_points = columns[4].innerText.trim();
  data.total_transfer.gpa = columns[5].innerText.trim();

  row_num++;
  columns = rows[row_num].getElementsByTagName('td');
  data.overall = {};
  data.overall.attempt_hours = columns[0].innerText.trim();
  data.overall.passed_hours = columns[1].innerText.trim();
  data.overall.earned_hours = columns[2].innerText.trim();
  data.overall.gpa_hours = columns[3].innerText.trim();
  data.overall.quality_points = columns[4].innerText.trim();
  data.overall.gpa = columns[5].innerText.trim();

  data.in_progress_terms = []

  row_num += 5;
  for (; row_num < rows.length; row_num++) {
    const term_data = {}
    term_data.term = rows[row_num].children[0].innerText.split('Term: ')[1].trim()
    while (rows[row_num].children[0].innerText !== 'Subject') {
      row_num++;
      if (rows[row_num].children[0].innerText === 'Major:') {
        term_data.major = rows[row_num].children[1].innerText.trim();
      }
    }
    row_num++;

    const courses = []
    for (; row_num < rows.length; row_num++) {
      const columns = rows[row_num].getElementsByTagName('td');
      if (!columns[0].innerText.trim()) {
        break;
      }
      courses.push({
        subject: columns[0].innerText.trim(),
        course: columns[1].innerText.trim(),
        level: columns[2].innerText.trim(),
        title: columns[3].innerText.trim(),
        credit_hours: columns[4].innerText.trim(),
      })
    }
    term_data.courses = courses;

    data.in_progress_terms.push(term_data);
    row_num += 2;
  }


  console.log(JSON.stringify(data, null, 4));
  console.log(data);
  return data;
}
