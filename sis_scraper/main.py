from dotenv import load_dotenv
import os
import requests
from bs4 import BeautifulSoup
import json
import re

load_dotenv()


def addConflicts(data):
    for department in data:
        for course in department["courses"]:
            for section in course["sections"]:
                section["conflicts"] = getConflict(
                    data, section["timeslots"], section["subj"] + str(section["crse"])
                )


def getConflict(data, check_timeslots, course_code):
    conflicts = {}

    for department in data:
        for course in department["courses"]:
            for section in course["sections"]:
                for timeslot in section["timeslots"]:
                    for day in timeslot["days"]:
                        # Dont conflict with other sections of the same course (or with self)
                        if course_code == section["subj"] + str(section["crse"]):
                            continue

                        # If this course does not have a timeslot just skip it
                        if timeslot["timeStart"] == -1 or timeslot["timeEnd"] == -1:
                            continue

                        for check_timeslot in check_timeslots:
                            # If this course does not have a timeslot just skip it
                            if (
                                check_timeslot["timeStart"] == -1
                                or check_timeslot["timeEnd"] == -1
                            ):
                                continue

                            # If not happening on the same day skip it
                            if day not in check_timeslot["days"]:
                                continue

                            # If the dates dont overlap skip it
                            if not max(
                                check_timeslot["dateStart"], timeslot["dateStart"]
                            ) < min(check_timeslot["dateEnd"], timeslot["dateEnd"]):
                                continue

                            # There is a conflict
                            if max(
                                check_timeslot["timeStart"], timeslot["timeStart"]
                            ) < min(check_timeslot["timeEnd"], timeslot["timeEnd"]):
                                # JSON does not support hashtables without a value so the value
                                # is always set to true even though just by being in the conflicts
                                # hash table is enough to know it conflicts
                                conflicts[section["crn"]] = True

    return conflicts


# We decided not to use this but I left it just in case
# def reformatJson(data):
#     departments_copy = data
#     reformat = {}
#     for department in departments_copy:
#         reformat[department['code']] = department
#         course_copy = department['courses']
#         reformat[department['code']]['courses'] = {}
#         for course in course_copy:
#             reformat[department['code']]['courses'][f"{course['subj']}-{course['crse']}"] = course
#             sections_copy = course['sections']
#             reformat[department['code']]['courses'][f"{course['subj']}-{course['crse']}"]['sections'] = {}
#             for section in sections_copy:
#                 reformat[department['code']]['courses'][f"{course['subj']}-{course['crse']}"]['sections'][section['crn']] = section
#
#
#     return reformat
#


def getContent(element):
    return " ".join(
        element.encode_contents().decode().strip().replace("&amp;", "&").split()
    )


def getContentFromChild(element, childType):
    if len(element.findAll(childType)) > 0:
        element = element.findAll(childType)[0]
    return getContent(element)


def cleanOutAbbr(text):
    text = re.sub("<abbr.*?>", "", text)
    text = re.sub("<\/abbr>", "", text)
    return text


def timeToMilitary(time, useStartTime):
    if "TBA" in time:
        return -1
    if useStartTime:
        time = time.split("-")[0]
    else:
        time = time.split("-")[1]

    offset = 0
    if "pm" in time and "12:" not in time:
        offset = 1200
    return int("".join(time.strip().split(":"))[:4]) + offset


def toTitle(text):
    text = text.title()
    regex = r"\b[iI]+\b"
    matches = re.finditer(regex, text)
    for matchNum, match in enumerate(matches, start=1):
        text = (
            text[: match.start()]
            + text[match.start() : match.end()].upper()
            + text[match.end() :]
        )

    text = text.replace("'S", "'s")

    return text


payload = f'sid={os.getenv("RIN")}&PIN={os.getenv("PASSWORD")}'
headers = {"Content-Type": "application/x-www-form-urlencoded"}
with requests.Session() as s:
    s.get(url="https://sis.rpi.edu/rss/twbkwbis.P_WWWLogin")
    response = s.request(
        "POST",
        "https://sis.rpi.edu/rss/twbkwbis.P_ValLogin",
        headers=headers,
        data=payload,
    )

    if b"Welcome" not in response.text.encode("utf8"):
        print("Failed to log into sis")
        exit(1)

    url = "https://sis.rpi.edu/rss/bwskfcls.P_GetCrse_Advanced"
    payload = f'rsts=dummy&crn=dummy&term_in={os.getenv("CURRENT_TERM")}&sel_subj=dummy&sel_day=dummy&sel_schd=dummy&sel_insm=dummy&sel_camp=dummy&sel_levl=dummy&sel_sess=dummy&sel_instr=dummy&sel_ptrm=dummy&sel_attr=dummy&sel_subj=ADMN&sel_subj=USAF&sel_subj=ARCH&sel_subj=ARTS&sel_subj=ASTR&sel_subj=BCBP&sel_subj=BIOL&sel_subj=BMED&sel_subj=CHME&sel_subj=CHEM&sel_subj=CIVL&sel_subj=COGS&sel_subj=COMM&sel_subj=CSCI&sel_subj=ENGR&sel_subj=ERTH&sel_subj=ECON&sel_subj=ECSE&sel_subj=ESCI&sel_subj=ENVE&sel_subj=GSAS&sel_subj=ISYE&sel_subj=ITWS&sel_subj=IENV&sel_subj=IHSS&sel_subj=ISCI&sel_subj=LANG&sel_subj=LGHT&sel_subj=LITR&sel_subj=MGMT&sel_subj=MTLE&sel_subj=MATP&sel_subj=MATH&sel_subj=MANE&sel_subj=USAR&sel_subj=USNA&sel_subj=PHIL&sel_subj=PHYS&sel_subj=PSYC&sel_subj=STSH&sel_subj=STSS&sel_subj=WRIT&sel_crse=&sel_title=&sel_from_cred=&sel_to_cred=&sel_camp=%25&sel_ptrm=%25&begin_hh=0&begin_mi=0&begin_ap=a&end_hh=0&end_mi=0&end_ap=a&SUB_BTN=Section+Search&path=1'

    # This payload is for testing. It will only return CSCI classes and will therefore be a bit faster
    # payload = f'rsts=dummy&crn=dummy&term_in={os.getenv("CURRENT_TERM")}&sel_subj=dummy&sel_day=dummy&sel_schd=dummy&sel_insm=dummy&sel_camp=dummy&sel_levl=dummy&sel_sess=dummy&sel_instr=dummy&sel_ptrm=dummy&sel_attr=dummy&sel_subj=CSCI&sel_subj=LGHT&sel_crse=&sel_title=&sel_from_cred=&sel_to_cred=&sel_camp=%25&sel_ptrm=%25&begin_hh=0&begin_mi=0&begin_ap=a&end_hh=0&end_mi=0&end_ap=a&SUB_BTN=Section+Search&path=1'

    headers = {}
    response = s.request("POST", url, headers=headers, data=payload)

    data = []

    # print(response.text.encode('utf8'))
    soup = BeautifulSoup(response.text.encode("utf8"), "html.parser")
    table = soup.findAll("table", {"class": "datadisplaytable"})[0]
    rows = table.findAll("tr")
    current_department = None
    current_code = None
    current_courses = None

    last_subject = None
    last_course_code = None
    for row in rows:
        th = row.findAll("th")
        if len(th) != 0:
            if "ddtitle" in th[0].attrs["class"]:
                # if(current_department):
                data.append(
                    {"name": toTitle(getContent(th[0])), "code": "", "courses": []}
                )
        else:
            td = row.findAll("td")
            if "TBA" not in getContent(td[8]):
                timeslot_data = {
                    "days": list(getContent(td[8])),
                    "timeStart": timeToMilitary(
                        getContentFromChild(td[9], "abbr"), True
                    ),
                    "timeEnd": timeToMilitary(
                        getContentFromChild(td[9], "abbr"), False
                    ),
                    "instructor": cleanOutAbbr(getContent(td[19])),
                    "dateStart": getContentFromChild(td[20], "abbr").split("-")[0],
                    "dateEnd": getContentFromChild(td[20], "abbr").split("-")[1],
                    "location": getContentFromChild(td[21], "abbr"),
                }
            else:
                timeslot_data = {
                    "dateEnd": "",
                    "dateStart": "",
                    "days": [],
                    "instructor": "",
                    "location": "",
                    "timeEnd": -1,
                    "timeStart": -1,
                }

            if len(getContent(td[0])) == 0:
                data[-1]["courses"][-1]["sections"][-1]["timeslots"].append(
                    timeslot_data
                )
                continue

            credit_min = float(getContent(td[6]).split("-")[0])
            credit_max = credit_min
            if len(getContent(td[6]).split("-")) > 1:
                credit_max = float(getContent(td[6]).split("-")[1])

            section_data = {
                # "select":getContentFromChild(td[0], 'abbr'),
                "crn": int(getContentFromChild(td[1], "a")),
                "subj": getContent(td[2]),
                "crse": int(getContent(td[3])),
                "sec": getContent(td[4]),
                # "cmp":getContent(td[5]),
                "credMin": credit_min,
                "credMax": credit_max,
                "title": toTitle(getContent(td[7])),
                # "cap": int(getContent(td[10])),
                # "act":int(getContent(td[11])),
                # "rem": int(getContent(td[12])),
                # "wlCap":int(getContent(td[13])),
                # "wlAct":int(getContent(td[14])),
                # "wlRem":int(getContent(td[15])),
                # "xlCap":getContent(td[16]),
                # "xlAct":getContent(td[17]),
                # "xlRem":getContent(td[18]),
                "attribute":getContent(td[22]) if 22 < len(td) else "",
                "timeslots": [timeslot_data],
            }

            if (
                section_data["subj"] == last_subject
                and section_data["crse"] == last_course_code
            ):
                data[-1]["courses"][-1]["sections"].append(section_data)
                continue

            last_subject = getContent(td[2])
            last_course_code = int(getContent(td[3]))
            data[-1]["courses"].append(
                {
                    "title": toTitle(getContent(td[7])),
                    "subj": getContent(td[2]),
                    "crse": int(getContent(td[3])),
                    "id": getContent(td[2]) + "-" + getContent(td[3]),
                    "sections": [section_data],
                }
            )

            if len(getContent(td[2])) > 0:
                data[-1]["code"] = getContent(td[2])

    # This is for the old conflict method that has a list for each class that it conflicts with
    # addConflicts(data)

    # data = reformatJson(data)

    # print(json.dumps(data,sort_keys=False,indent=2))
    with open(f"courses.json", "w") as outfile:  # -{os.getenv("CURRENT_TERM")}
        json.dump(data, outfile, sort_keys=False, indent=2)

    # Generate binary conflict output
    # (32bit crn + 3*64bit conflicts 5am-midnight(by 30min))for every course
    day_offsets = {
        "M": 0 * 19 * 2,
        "T": 1 * 19 * 2,
        "W": 2 * 19 * 2,
        "R": 3 * 19 * 2,
        "F": 4 * 19 * 2,
    }

    conflicts = {}
    crn_to_courses = {}
    for dept in data:
        for course in dept["courses"]:
            for section in course["sections"]:
                crn_to_courses[section["crn"]] = course["id"]

                conflict = [0] * (64 * 3)
                for time in section["timeslots"]:
                    for day in time["days"]:
                        for i in range(500, 2400, 100):
                            if time["timeStart"] <= i and time["timeEnd"] > i:
                                conflict[day_offsets[day] + (int)(2 * i / 100) - 5] = 1
                            if time["timeStart"] <= i + 30 and time["timeEnd"] > i + 30:
                                conflict[
                                    day_offsets[day] + 1 + (int)(2 * i / 100) - 5
                                ] = 1

                conflicts[section["crn"]] = "".join(str(e) for e in conflict)

    with open("parsed.rs", "w") as f:  # -{os.getenv("CURRENT_TERM")}
        f.write(
            """\
//This file was automatically generated. Please do not modify it directly
use ::phf::{phf_map, Map};
pub static CRN_TIMES: Map<u32, [u64; 3]> = phf_map! {
"""
        )

        for crn, conflict in conflicts.items():
            f.write(
                f"\t{crn}u32 => [{int(conflict[:64], 2)}, {int(conflict[64:128], 2)}, {int(conflict[128:], 2)}],\n"
            )

        f.write(
            """
};

pub static CRN_COURSES: Map<u32, &'static str> = phf_map! {
"""
        )

        for crn, course in crn_to_courses.items():
            f.write(f'\t{crn}u32 => "{course}",\n')
        f.write("};")
