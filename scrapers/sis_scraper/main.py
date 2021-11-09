#!/usr/bin/env python3

# Python standard library
import asyncio
from operator import itemgetter
import os
import re
import json
import sys

# External dependnecies
import aiohttp
import bs4
import requests

# Project
import util
import conflict_logic
import prerequisites

# Wrapper for BeautifulSoup that specifies a specific parser
BeautifulSoup = lambda data: bs4.BeautifulSoup(data, features="lxml")
# ClientSession for aiohttp
session = None


async def get_section_information(section_url):
    global session
    section_dict = {}
    async with session.get(section_url) as data:
        soup = BeautifulSoup(await data.text())
        # Parse any prereqs
        try:
            section_dict["prereqs"] = prerequisites.get_prereq_string(soup)
        except:
            pass

        # Get credit amount
        credit_data = (
            re.search(r"<br/>\n(.*?) Credits\n<br/>", str(soup)).group(1).strip()
        )
        if "TO" in credit_data:
            credit_min, credit_max = (float(x.strip()) for x in credit_data.split("TO"))
        else:
            credit_min = credit_max = float(credit_data)

        section_dict["credMin"] = credit_min
        section_dict["credMax"] = credit_max

        # Unfortantely, it isn't as simple as split by "-" to retrieve all the data
        # Some classes actually have the dash in their title
        # Thus we need to locate the CRN and make everything before it be the title
        crn = section_url.split("&crn_in=")[1]
        raw_data = soup.find("th", {"class": "ddlabel"}).text
        index = raw_data.find(crn)
        raw_title = raw_data[:index][:-3]
        raw_section_data = raw_data[index:]
        # Get section metadata (name, CRN, subject, etc)
        # Remove excess whitespace
        section_data = tuple(x.strip() for x in raw_section_data.split("-"))

        subject_name, crse = section_data[1].split(" ")
        section_number = section_data[2]
        section_dict["crn"] = int(crn)
        section_dict["crse"] = int(crse)
        section_dict["subj"] = subject_name
        section_dict["sec"] = section_number
        section_dict["title"] = util.normalize_class_name(raw_title)

        # Get seat data
        seating = soup.find(
            "table",
            {"summary": "This layout table is used to present the seating numbers."},
        ).findAll("tr")

        for seat_type in seating[1:]:
            kind = seat_type.find("th").text
            capacity, actual, remaining = tuple(
                int(x.text) for x in seat_type.findAll("td")
            )

            if kind == "Seats":
                section_dict["cap"] = capacity
                section_dict["act"] = actual
                section_dict["rem"] = remaining
            elif kind == "Cross List Seats":
                section_dict["xl_rem"] = remaining

            # NOTE: Can implement logic for Waitlists / Crosslists here
    return section_dict


async def get_class_information(class_url):
    global session

    sections = []
    course_data = {}

    async with session.get(class_url) as data:
        data = BeautifulSoup(await data.text())

        # Iterate through each section in the course and retrieve appropriate data
        section_data = data.findAll("th", {"class": "ddtitle", "scope": "colgroup"})
        meeting_times = data.findAll(
            "table",
            {
                "class": "datadisplaytable",
                "summary": "This table lists the scheduled meeting times and assigned instructors for this class..",
            },
        )

        # Pad out meeting times for classes with no meeting times
        # This is pretty much just for independent study courses
        while len(meeting_times) < len(section_data):
            meeting_times.append(None)

        for section, time in zip(section_data, meeting_times):
            section_url = section.find("a")["href"]
            section_data = await get_section_information(
                f"https://sis.rpi.edu{section_url}"
            )
            sections.append(section_data)
            # Parse attributes (if applicable)
            # This is really hacky (but so is the rest of the code)
            # But I found this was the best way to approach it
            # This also makes an assumption that attributes apply across the whole
            # class and not per-section, which would be terrible (but fixable)
            search = r"""<span class="fieldlabeltext">Attributes: </span>(.*?)\n<br/>"""
            attribute = re.search(search, str(data))
            section_data["attribute"] = (
                attribute.group(1).strip() if attribute != None else ""
            )

            # We need to parse section time information here
            # As it isn't present on the per-section advanced page
            timeslots = section_data["timeslots"] = []

            if time == None:
                # Append an empty timeslot to make QuACS display the CRN
                timeslots.append(
                    {
                        "days": [],
                        "timeStart": -1,
                        "timeEnd": -1,
                        "instructor": "",
                        "location": "",
                        "dateStart": None,
                        "dateEnd": None,
                    }
                )
                continue
            for meeting in time.findAll("tr")[
                1:
            ]:  # skip the first entry as its just the elabels
                meeting_data = [x.text for x in meeting.findAll("td")]
                timeStart, timeEnd = util.time_to_military(meeting_data[1])
                days = list(meeting_data[2])
                # Empty days comes up as '\xa0', so remove that if applicable
                if len(days) > 0 and days[0] == "\xa0":
                    days = []
                location = meeting_data[3].strip()
                date = meeting_data[4].split(" - ")
                instructor = util.get_instructor_string(meeting_data[6])

                timeslots.append(
                    {
                        "days": days,
                        "timeStart": timeStart,
                        "timeEnd": timeEnd,
                        "instructor": instructor,
                        "location": location,
                        "dateStart": util.get_date(date[0]),
                        "dateEnd": util.get_date(date[1]),
                    }
                )

        # Add main course data from first section
        if len(sections) == 0:
            print(f"=== ERROR: {class_url} has no sections!")
            return None
        course_data["title"] = sections[0]["title"]
        course_data["subj"] = sections[0]["subj"]
        course_data["crse"] = sections[0]["crse"]
        course_data["id"] = f"{course_data['subj']}-{str(course_data['crse']).zfill(4)}"
        course_data["sections"] = sections
    return course_data


def parse_semester_page(text):
    soup = BeautifulSoup(text).findAll("td", {"class": "ntdefault"})

    for s in soup:
        if (link_data := s.find("a")) != None:
            link = link_data["href"]
            # These links are confused for classes
            if "p_disp_catalog_syllabus" in link:
                continue
            if link == "javascript:history.go(-1)":
                break
            yield link_data["href"]


async def get_classes_with_code(term, code):
    global session
    # Post request data was observed from: https://sis.rpi.edu/rss/bwckctlg.p_display_courses?term_in=202205&sel_crse_strt=0&sel_crse_end=9999&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=
    async with session.post(
        "https://sis.rpi.edu/rss/bwckctlg.p_display_courses",
        data=f"term_in={term}&call_proc_in=&sel_subj=dummy&sel_levl=dummy&sel_schd=dummy&sel_coll=dummy&sel_divs=dummy&sel_dept=dummy&sel_attr=dummy&sel_subj={code}&sel_crse_strt=&sel_crse_end=&sel_title=&sel_levl=%25&sel_schd=%25&sel_coll=%25&sel_divs=%25&sel_dept=%25&sel_from_cred=&sel_to_cred=&sel_attr=%25",
    ) as request:
        return await request.text()


async def scrape_subject(term, name, code):
    courses_data = {"name": name, "code": code}
    courses_data["courses"] = list(
        filter(
            lambda x: x != None,
            await asyncio.gather(
                *[
                    get_class_information(f"https://sis.rpi.edu{clazz}")
                    for clazz in parse_semester_page(
                        await get_classes_with_code(term, code)
                    )
                ]
            ),
        )
    )
    return courses_data


async def get_subjects_for_term(term):
    global session
    url = f"https://sis.rpi.edu/rss/bwckctlg.p_display_courses?term_in={term}&sel_crse_strt=0&sel_crse_end=9999&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr="
    async with session.get(url) as request:
        soup = BeautifulSoup(await request.text())
        return [
            (entry.text, entry["value"])
            for entry in soup.find("select", {"id": "subj_id"}).findAll("option")
        ]


async def scrape_term(term):
    print(f"Scraping {term}")
    courses = await asyncio.gather(
        *[scrape_subject(term, *subj) for subj in await get_subjects_for_term(term)]
    )

    # Filter any defunct / empty departments from the list
    courses = list(filter(lambda dept: len(dept["courses"]) > 0, courses))
    # If semester is too far in the future, don't do anything.
    if len(courses) == 0:
        return

    # Ensure data/{term} exists
    os.makedirs(f"data/{term}", exist_ok=True)

    with open(f"all_schools.json", "r") as all_schools_f:
        all_schools = json.load(all_schools_f)

    # Ensure schools.json is populated properly
    matched_subjects = set()
    schools = []
    for possible_school in all_schools:
        # ignore the "Uncategorized" category to avoid duplicate matching if the catalog is later changed
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
    # Determine if any department is missing from schools.json list and
    # put missing ones into an "Uncategorized" school. This has happened a few times in the past,
    # most notably when STSH and STSS merged to become STSO.
    all_subjects = set(d["code"] for d in courses)
    unmatched_subjects = all_subjects - matched_subjects
    schools.append(
        {
            "name": "Uncategorized",
            "depts": [
                {
                    "code": code,
                    "name": list(filter(lambda dept: dept["code"] == code, courses))[0][
                        "name"
                    ],
                }
                for code in unmatched_subjects
            ],
        }
    )

    # Sort the departments in each school
    for school in schools:
        school["depts"] = sorted(school["depts"], key=itemgetter("code"))

    os.makedirs(f"data/{term}", exist_ok=True)

    school_columns = util.optimize_column_ordering(schools)
    # Write out all the results of the scraper
    conflict_logic.gen(term, courses)
    # Replace all the dateStart/dateEnd with the MM/DD format used by the quacs frontend
    # Additionally, split out the prereq field into a separate json
    prerequisites = {}
    date_to_quacs = (
        lambda date: f"{str(date.month).zfill(2)}/{str(date.day).zfill(2)}"
        if date != None
        else ""
    )
    for dept in courses:
        for course in dept["courses"]:
            for section in course["sections"]:
                try:
                    prerequisites[section["crn"]] = section["prereqs"]
                    del section["prereqs"]
                except:
                    prerequisites[section["crn"]] = {}
                for timeslot in section["timeslots"]:
                    timeslot["dateStart"] = date_to_quacs(timeslot["dateStart"])
                    timeslot["dateEnd"] = date_to_quacs(timeslot["dateEnd"])
    with open(f"data/{term}/schools.json", "w") as schools_f:
        json.dump(school_columns, schools_f, sort_keys=False, indent=2)
    with open(f"data/{term}/courses.json", "w") as outfile:
        json.dump(courses, outfile, sort_keys=True, indent=2)
    with open(f"data/{term}/prerequisites.json", "w") as outfile:
        json.dump(prerequisites, outfile, sort_keys=True, indent=2)
    print("Done")


async def main():
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
        else:
            print("Parsing relevant terms only")

        for semester in semesters:
            await scrape_term(semester)


if __name__ == "__main__":
    asyncio.run(main())
