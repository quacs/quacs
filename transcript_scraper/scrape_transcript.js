async function scrape_transcript(file_id){
  let file = $('#'+file_id).prop('files');
  if(file.length < 1){
    alert("Missing File");
    return;
  }
  file = file[0];

  if(file.type != 'text/html'){
    alert(`ERROR: file must be of type "text/html", your file was of type "${file.type}"`);
  }

  let parser = new DOMParser();
  let transcript = parser.parseFromString(await file.text(), "text/html");

  let rows = transcript.getElementsByClassName("datadisplaytable")[0].getElementsByTagName('tbody')[0].getElementsByTagName('tr');

  let data = {}

  //STUDENT INFORMATION
  //TODO refactor this to use hard coded offsets to be consistent with the rest of the program
  data.majors = []
  let row_num=0;
  for(;row_num<rows.length;row_num++){
    if(rows[row_num].children[0].innerText === 'Name :'){
      data.name = rows[row_num].children[1].innerText.trim();
    }else if(rows[row_num].children[0].innerText === 'Student Type:'){
      data.student_type = rows[row_num].children[1].innerText.trim();
    }else if(rows[row_num].children[0].innerText === 'Current Program'){
      row_num++;
      data.current_program = rows[row_num].children[0].innerText.trim();
    }else if(rows[row_num].children[0].innerText === 'College:'){
      data.college = rows[row_num].children[1].innerText.trim();
    }else if(rows[row_num].children[0].innerText.startsWith('Major')){
      data.majors.push(rows[row_num].children[1].innerText.trim());
    }else if(rows[row_num].children[0].innerText.startsWith('***Transcript type:UWEB is NOT Official ***')){
      break;
    }
  }


  data.terms = []

  //TRANSFER CREDIT ACCEPTED BY INSTITUTION
  row_num+=4;
  if(rows[row_num].children[0].innerText.includes('TRANSFER CREDIT ACCEPTED BY INSTITUTION')){
    row_num+=3;
    let courses = []
    for(;row_num<rows.length;row_num++){
      let columns = rows[row_num].getElementsByTagName('td');
      if(!columns[0].innerText.trim()){
        break;
      }
      courses.push({
        subject:columns[0].innerText.trim(),
        course:columns[1].innerText.trim(),
        title:columns[2].innerText.trim(),
        grade:columns[3].innerText.trim(),
        credit_hours:columns[4].innerText.trim(),
        quality_points:columns[5].innerText.trim(),
        repeat_status:columns[6].innerText.trim(),
      })
    }
    row_num++;
    let columns = rows[row_num].getElementsByTagName('td');
    data.terms.push({
      term:'ap',
      courses:courses,
      attempt_hours:columns[0].innerText.trim(),
      passed_hours:columns[1].innerText.trim(),
      earned_hours:columns[2].innerText.trim(),
      gpa_hours:columns[3].innerText.trim(),
      quality_points:columns[4].innerText.trim(),
      gpa:columns[5].innerText.trim(),
    })
  }

  //INSTITUTION CREDIT
  row_num+=5;
  while(!rows[row_num].children[0].innerText.startsWith('TRANSCRIPT TOTALS')){
    let term = rows[row_num].children[0].innerText.split('Term: ')[1].trim()
    //TODO add the extra data like Major, Academic Standing, etc. instead of just skipping it
    row_num+=5;

    let courses = []
    for(;row_num<rows.length;row_num++){
      let columns = rows[row_num].getElementsByTagName('td');
      if(rows[row_num].children[0].innerText.includes('Term Totals')){
        break;
      }
      courses.push({
        subject:columns[0].innerText.trim(),
        course:columns[1].innerText.trim(),
        title:columns[2].innerText.trim(),
        grade:columns[3].innerText.trim(),
        credit_hours:columns[4].innerText.trim(),
        quality_points:columns[5].innerText.trim(),
        repeat_status:columns[6].innerText.trim()
      })
    }
    row_num+=2;
    let columns = rows[row_num].getElementsByTagName('td');
    data.terms.push({
      term:term,
      courses:courses,
      attempt_hours:columns[0].innerText.trim(),
      passed_hours:columns[1].innerText.trim(),
      earned_hours:columns[2].innerText.trim(),
      gpa_hours:columns[3].innerText.trim(),
      quality_points:columns[4].innerText.trim(),
      gpa:columns[5].innerText.trim(),
    })

    row_num+=5;//There is a hiden nested table with a tr that makes this 5 and not 4. Thank you sis
    //TODO dont skip the Cumulative data
  }


  //TODO scrape the totals as well as the courses in progress


  console.log(data)
}
