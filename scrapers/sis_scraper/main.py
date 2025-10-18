#!/usr/bin/env python3

# Python standard library
import asyncio
from operator import itemgetter
import os
import re
import json
import sys
from datetime import datetime
import html

# External dependencies
import aiohttp
import bs4

# Project
import util
import conflict_logic
import prerequisites

# ClientSession for aiohttp
session = None


def parse_faculty(faculty_list):
    """Parse faculty list from new API format"""
    if not faculty_list:
        return ""

    # Sort by primary indicator first, then by display name
    faculty_list = sorted(faculty_list, key=lambda x: (not x.get('primaryIndicator', False), x.get('displayName', '')))

    names = []
    for faculty in faculty_list:
        display_name = faculty.get('displayName', '')
        if display_name:
            # Convert "Last, First" to "First Last"
            if ',' in display_name:
                parts = display_name.split(',')
                display_name = f"{parts[1].strip()} {parts[0].strip()}"
            names.append(display_name)

    return ", ".join(names)


def parse_meeting_times(meetings_faculty):
    """Parse meeting times from new API format"""
    timeslots = []

    if not meetings_faculty:
        # Empty timeslot for courses with no meeting times
        return [{
            "days": [],
            "timeStart": -1,
            "timeEnd": -1,
            "instructor": "",
            "location": "",
            "dateStart": None,
            "dateEnd": None,
        }]

    for meeting in meetings_faculty:
        meeting_time = meeting.get('meetingTime', {})
        faculty = meeting.get('faculty', [])

        # Parse time
        begin_time = meeting_time.get('beginTime')
        end_time = meeting_time.get('endTime')

        if begin_time and end_time:
            # Convert from HHMM format to military time
            time_start = int(begin_time.replace(':', '')[:4])
            time_end = int(end_time.replace(':', '')[:4])
        else:
            time_start = -1
            time_end = -1

        # Parse days
        days = []
        for day, full_day in [('monday', 'M'), ('tuesday', 'T'), ('wednesday', 'W'),
                               ('thursday', 'R'), ('friday', 'F'), ('saturday', 'S'), ('sunday', 'U')]:
            if meeting_time.get(day, False):
                days.append(full_day)

        # Parse location
        building = meeting_time.get('buildingDescription', '') or meeting_time.get('building', '') or ''
        room = meeting_time.get('room', '') or ''
        location = f"{building} {room}".strip() if building or room else "TBA"

        # Parse dates
        start_date_str = meeting_time.get('startDate')
        end_date_str = meeting_time.get('endDate')

        date_start = None
        date_end = None
        if start_date_str:
            try:
                date_start = datetime.strptime(start_date_str, '%m/%d/%Y').date()
            except:
                pass
        if end_date_str:
            try:
                date_end = datetime.strptime(end_date_str, '%m/%d/%Y').date()
            except:
                pass

        # Parse instructor from faculty list
        instructor = parse_faculty(faculty)

        timeslots.append({
            "days": days,
            "timeStart": time_start,
            "timeEnd": time_end,
            "instructor": instructor,
            "location": location,
            "dateStart": date_start,
            "dateEnd": date_end,
        })

    return timeslots if timeslots else [{
        "days": [],
        "timeStart": -1,
        "timeEnd": -1,
        "instructor": "",
        "location": "",
        "dateStart": None,
        "dateEnd": None,
    }]


async def get_section_prerequisites(term, crn):
    """Fetch prerequisites from the old SIS endpoint"""
    global session

    url = f"https://sis.rpi.edu/rss/bwckschd.p_disp_detail_sched?term_in={term}&crn_in={crn}"

    try:
        async with session.get(url) as response:
            if response.status != 200:
                return {}

            text = await response.text()
            soup = bs4.BeautifulSoup(text, features="lxml")

            # Use the existing prerequisites parser
            return prerequisites.get_prereq_string(soup)
    except Exception:
        # If we fail to get prereqs for any reason, return empty dict
        return {}


async def get_section_information(section_data, main_faculty, term):
    """Parse section information from new API format"""
    section_dict = {}

    # Basic section info
    crn = section_data.get('courseReferenceNumber', '')
    subject = section_data.get('subject', '')
    course_number = section_data.get('courseNumber', '')
    sequence_number = section_data.get('sequenceNumber', '')
    title = html.unescape(section_data.get('courseTitle', ''))

    section_dict['crn'] = int(crn)
    section_dict['crse'] = int(course_number)
    section_dict['subj'] = subject
    section_dict['sec'] = sequence_number
    section_dict['title'] = util.normalize_class_name(title)

    # Credit hours
    credit_hours = section_data.get('creditHours')
    credit_hour_high = section_data.get('creditHourHigh')
    credit_hour_low = section_data.get('creditHourLow')

    if credit_hour_high is not None:
        section_dict['credMin'] = float(credit_hour_low or 0)
        section_dict['credMax'] = float(credit_hour_high)
    elif credit_hours is not None:
        section_dict['credMin'] = float(credit_hours)
        section_dict['credMax'] = float(credit_hours)
    else:
        section_dict['credMin'] = 0.0
        section_dict['credMax'] = 0.0

    # Seat information
    section_dict['cap'] = section_data.get('maximumEnrollment', 0)
    section_dict['act'] = section_data.get('enrollment', 0)
    section_dict['rem'] = section_data.get('seatsAvailable', 0)

    # Cross-list information
    if section_data.get('crossListAvailable') is not None:
        section_dict['xl_rem'] = section_data.get('crossListAvailable', 0)

    # Attributes
    attributes = section_data.get('sectionAttributes', [])
    if attributes:
        # Join multiple attributes if they exist
        section_dict['attribute'] = ', '.join([attr.get('description', '') for attr in attributes if attr.get('description')])
    else:
        section_dict['attribute'] = ""

    # Parse timeslots
    meetings_faculty = section_data.get('meetingsFaculty', [])
    # Use the main faculty list if meetings don't have instructors
    if main_faculty and not any(m.get('faculty') for m in meetings_faculty):
        # Add main faculty to first meeting
        if meetings_faculty:
            meetings_faculty[0]['faculty'] = main_faculty

    section_dict['timeslots'] = parse_meeting_times(meetings_faculty)

    # Fetch prerequisites from old endpoint
    section_dict['prereqs'] = await get_section_prerequisites(term, crn)

    return section_dict


async def get_all_sections_for_term(term):
    """Fetch all sections for a term using pagination"""
    global session

    search_url = 'https://sis9.rpi.edu/StudentRegistrationSsb/ssb/searchResults/searchResults'

    # We need to paginate through all results
    page_size = 500
    page_offset = 0
    all_sections = []

    while True:
        search_params = {
            'txt_term': term,
            'pageOffset': page_offset,
            'pageMaxSize': page_size,
            'sortColumn': 'subjectDescription',
            'sortDirection': 'asc'
        }

        async with session.get(search_url, params=search_params) as response:
            if response.status != 200:
                print(f"Error fetching sections: {response.status}")
                break

            result = await response.json()
            data = result.get('data', [])

            if not data:
                break

            all_sections.extend(data)

            # Check if we've got all the data
            total_count = result.get('totalCount', 0)
            if len(all_sections) >= total_count:
                break

            page_offset += page_size

    return all_sections


async def get_subjects_for_term(term):
    """Get list of all subjects/departments for a term"""
    global session

    # The subjects are available from a different endpoint
    subjects_url = 'https://sis9.rpi.edu/StudentRegistrationSsb/ssb/classSearch/get_subject'

    async with session.get(subjects_url, params={'term': term, 'offset': 1, 'max': 500}) as response:
        if response.status != 200:
            print(f"Error fetching subjects: {response.status}")
            return []

        subjects = await response.json()
        return {subj['code']: subj['description'] for subj in subjects}


async def scrape_term(term):
    print(f"Scraping {term}")

    global session

    # Initialize session with term selection page
    async with session.get('https://sis9.rpi.edu/StudentRegistrationSsb/ssb/term/termSelection?mode=search') as response:
        pass

    # Select the term
    async with session.post(
        'https://sis9.rpi.edu/StudentRegistrationSsb/ssb/term/search?mode=search',
        data={'term': term}
    ) as response:
        if response.status != 200:
            print(f"Error selecting term {term}: {response.status}")
            return

    # Get subject code -> name mapping
    subject_names = await get_subjects_for_term(term)

    if not subject_names:
        print(f"No subjects found for term {term}")
        return

    # Get all sections for the term
    print("Fetching all sections...")
    all_sections = await get_all_sections_for_term(term)
    print(f"Found {len(all_sections)} sections")

    # Fetch prerequisites for all sections in parallel (in batches)
    print("Fetching prerequisites...")
    crns = [section['courseReferenceNumber'] for section in all_sections]

    # Batch the prerequisite fetches to avoid overwhelming the server
    batch_size = 50
    all_prereqs = {}
    for i in range(0, len(crns), batch_size):
        batch_crns = crns[i:i+batch_size]
        prereq_results = await asyncio.gather(
            *[get_section_prerequisites(term, crn) for crn in batch_crns]
        )
        for crn, prereq in zip(batch_crns, prereq_results):
            all_prereqs[crn] = prereq
        print(f"  Fetched {min(i+batch_size, len(crns))}/{len(crns)} prerequisites")

    # Group sections by subject and course
    courses_by_subject = {}
    for section in all_sections:
        subject_code = section['subject']

        if subject_code not in courses_by_subject:
            courses_by_subject[subject_code] = {}

        course_number = section['courseNumber']
        course_key = f"{subject_code}-{course_number}"

        if course_key not in courses_by_subject[subject_code]:
            courses_by_subject[subject_code][course_key] = {
                'title': html.unescape(section['courseTitle']),
                'subj': subject_code,
                'crse': int(course_number),
                'id': course_key,
                'sections': []
            }

        # Get main faculty list for this section
        main_faculty = section.get('faculty', [])
        crn = section['courseReferenceNumber']

        # Parse section without fetching prereqs (we already have them)
        section_dict = {}
        section_dict['crn'] = int(crn)
        section_dict['crse'] = int(course_number)
        section_dict['subj'] = subject_code
        section_dict['sec'] = section['sequenceNumber']
        section_dict['title'] = util.normalize_class_name(html.unescape(section['courseTitle']))

        # Credit hours
        credit_hours = section.get('creditHours')
        credit_hour_high = section.get('creditHourHigh')
        credit_hour_low = section.get('creditHourLow')

        if credit_hour_high is not None:
            section_dict['credMin'] = float(credit_hour_low or 0)
            section_dict['credMax'] = float(credit_hour_high)
        elif credit_hours is not None:
            section_dict['credMin'] = float(credit_hours)
            section_dict['credMax'] = float(credit_hours)
        else:
            section_dict['credMin'] = 0.0
            section_dict['credMax'] = 0.0

        # Seat information
        section_dict['cap'] = section.get('maximumEnrollment', 0)
        section_dict['act'] = section.get('enrollment', 0)
        section_dict['rem'] = section.get('seatsAvailable', 0)

        # Cross-list information
        if section.get('crossListAvailable') is not None:
            section_dict['xl_rem'] = section.get('crossListAvailable', 0)

        # Attributes
        attributes = section.get('sectionAttributes', [])
        if attributes:
            section_dict['attribute'] = ', '.join([attr.get('description', '') for attr in attributes if attr.get('description')])
        else:
            section_dict['attribute'] = ""

        # Parse timeslots
        meetings_faculty = section.get('meetingsFaculty', [])
        if main_faculty and not any(m.get('faculty') for m in meetings_faculty):
            if meetings_faculty:
                meetings_faculty[0]['faculty'] = main_faculty

        section_dict['timeslots'] = parse_meeting_times(meetings_faculty)

        # Add prerequisites from our batch fetch
        section_dict['prereqs'] = all_prereqs.get(crn, {})

        courses_by_subject[subject_code][course_key]['sections'].append(section_dict)

    # Build department list
    courses = []
    for subject_code, courses_dict in courses_by_subject.items():
        dept_data = {
            'code': subject_code,
            'name': subject_names.get(subject_code, subject_code),
            'courses': list(courses_dict.values())
        }
        courses.append(dept_data)

    # Registration dates - use placeholder for now
    beginning_of_time = datetime.fromtimestamp(0)
    registration_dates = (beginning_of_time, beginning_of_time)

    registration_dates_json = {
        "registration_opens": registration_dates[0].strftime("%Y-%m-%d"),
        "registration_closes": registration_dates[1].strftime("%Y-%m-%d"),
    }

    # Filter empty departments
    courses = list(filter(lambda dept: len(dept["courses"]) > 0, courses))

    if len(courses) == 0:
        print("Semester is empty - skipping it!")
        return

    # Ensure data/{term} exists
    os.makedirs(f"data/{term}", exist_ok=True)

    with open(f"all_schools.json", "r") as all_schools_f:
        all_schools = json.load(all_schools_f)

    # Build schools.json
    matched_subjects = set()
    schools = []
    for possible_school in all_schools:
        if possible_school["name"] == "Uncategorized":
            continue
        res_school = {"name": possible_school["name"], "depts": []}
        for target_dept in possible_school["depts"]:
            matching_depts = list(
                filter(lambda d: d["code"] == target_dept["code"], courses)
            )
            if matching_depts:
                res_school["depts"].append(target_dept)
        if res_school["depts"]:
            matched_subjects.update(d["code"] for d in res_school["depts"])
            schools.append(res_school)

    # Add uncategorized subjects
    all_subjects = set(d["code"] for d in courses)
    unmatched_subjects = all_subjects - matched_subjects
    if unmatched_subjects:
        schools.append(
            {
                "name": "Uncategorized",
                "depts": [
                    {
                        "code": code,
                        "name": list(
                            filter(lambda dept: dept["code"] == code, courses)
                        )[0]["name"],
                    }
                    for code in unmatched_subjects
                ],
            }
        )

    # Sort departments
    for school in schools:
        school["depts"] = sorted(school["depts"], key=itemgetter("code"))

    school_columns = util.optimize_column_ordering(schools)

    # Generate conflict data
    conflict_logic.gen(term, courses)

    # Process dates and prerequisites
    prerequisites_data = {}
    date_to_quacs = lambda date: (
        f"{str(date.month).zfill(2)}/{str(date.day).zfill(2)}" if date != None else ""
    )

    for dept in courses:
        for course in dept["courses"]:
            for section in course["sections"]:
                try:
                    prerequisites_data[section["crn"]] = section["prereqs"]
                    del section["prereqs"]
                except:
                    prerequisites_data[section["crn"]] = {}
                for timeslot in section["timeslots"]:
                    timeslot["dateStart"] = date_to_quacs(timeslot["dateStart"])
                    timeslot["dateEnd"] = date_to_quacs(timeslot["dateEnd"])

    # Write output files
    with open(f"data/{term}/schools.json", "w") as schools_f:
        json.dump(school_columns, schools_f, sort_keys=False, indent=2)
    with open(f"data/{term}/courses.json", "w") as outfile:
        json.dump(courses, outfile, sort_keys=True, indent=2)
    with open(f"data/{term}/prerequisites.json", "w") as outfile:
        json.dump(prerequisites_data, outfile, sort_keys=True, indent=2)
    with open(f"data/{term}/registration_dates.json", "w") as outfile:
        json.dump(registration_dates_json, outfile, sort_keys=True, indent=2)

    print("Done")


async def scrape_term_catalog(term):
    """Scrape catalog data for a term - placeholder for now"""
    if not os.path.isdir(f"data/{term}"):
        print(f"Term does not exist in data yet, skipping {term} catalog scraping...")
        return
    print(f"Catalog scraping not yet implemented for new SIS")
    # TODO: Implement catalog scraping if needed


async def main():
    if sys.argv[-1] == "help" or sys.argv[-1] == "--help":
        print(f"USAGE: python3 {sys.argv[0]} [ALL_YEARS]")
        sys.exit(1)

    global session
    async with aiohttp.ClientSession(
        connector=aiohttp.TCPConnector(limit=5)
    ) as session:
        semesters = util.get_semesters_to_scrape()

        if sys.argv[-1] == "ALL_YEARS":
            print("Parsing all years")
            for term in os.listdir("data/"):
                if term not in semesters:
                    semesters.append(term)
        elif sys.argv[-1] == "OLD_YEARS":
            print("OLD_YEARS not supported with new SIS")
            sys.exit(1)
        elif len(sys.argv[-1]) == 6:
            print(f"Parsing {sys.argv[-1]} only")
            semesters = [sys.argv[-1]]
        else:
            print("Parsing relevant terms only")

        for semester in semesters:
            await scrape_term(semester)
            await scrape_term_catalog(semester)


if __name__ == "__main__":
    asyncio.run(main())
