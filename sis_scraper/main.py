from dotenv import load_dotenv
import os
import shutil
import requests
from bs4 import BeautifulSoup
import json
import re
import math
from tqdm import tqdm
import urllib.parse
from copy import deepcopy
from itertools import combinations
from datetime import date

load_dotenv()


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
    text = re.sub(
        "\s?\([pP]\)", "", text
    )  # Remove primary instructor indicator (maybe we can use this data somewhere later but for now it is removed)
    text = re.sub("\w+\.\s+", "", text)
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


def calculate_score(columns):
    if not columns:
        return 99999999999  # some arbitrarily large number

    def column_sum(column):
        return sum(map(lambda x: len(x["depts"]) + 3, column))

    mean = sum(map(column_sum, columns)) / len(columns)
    return sum(map(lambda x: abs(mean - column_sum(x)), columns)) / len(columns)


# Recursively finds the most balanced set of columns.
# Since `best` needs to be passed by reference, it's
# actually [best], so we only manipulate best[0].
def optimize_ordering_inner(data, i, columns, best):
    if i == len(data):
        this_score = calculate_score(columns)
        best_score = calculate_score(best[0])

        if this_score < best_score:
            best[0] = deepcopy(columns)
        return

    for column in columns:
        column.append(data[i])
        optimize_ordering_inner(data, i + 1, columns, best)
        column.pop()


def optimize_column_ordering(data, num_columns=3):
    """
    Because we want the QuACS homepage to be as "square-like" as possible,
    we need to re-order departments in such a way that once they're laid out
    in multiple columns, each column is a similar height.
    """

    columns = [[] for _ in range(num_columns)]
    best_result = [[]]

    optimize_ordering_inner(data, 0, columns, best_result)

    best_result = best_result[0]

    for i in range(len(best_result)):
        best_result[i] = sorted(
            best_result[i], key=lambda s: len(s["depts"]), reverse=True
        )

    best_result = sorted(best_result, key=lambda c: len(c[0]["depts"]), reverse=True)

    flattened = []
    for column in best_result:
        flattened.extend(column)

    return flattened


payload = f'sid={os.getenv("RIN")}&PIN={urllib.parse.quote(os.getenv("PASSWORD"))}'
headers = {"Content-Type": "application/x-www-form-urlencoded"}
with requests.Session() as s:  # We purposefully don't use aiohttp here since SIS doesn't like multiple logged in connections
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

    for term in tqdm(os.listdir("data")):
        url = "https://sis.rpi.edu/rss/bwskfcls.P_GetCrse_Advanced"
        payload = f"rsts=dummy&crn=dummy&term_in={term}&sel_subj=dummy&sel_day=dummy&sel_schd=dummy&sel_insm=dummy&sel_camp=dummy&sel_levl=dummy&sel_sess=dummy&sel_instr=dummy&sel_ptrm=dummy&sel_attr=dummy&"

        with open(f"data/{term}/schools.json") as f:
            for school in json.load(f):
                for dept in school["depts"]:
                    payload += f"sel_subj={dept['code']}&"

        payload += "sel_crse=&sel_title=&sel_from_cred=&sel_to_cred=&sel_camp=%25&sel_ptrm=%25&"
        if int(term) <= 201101:  # SIS removed a field after this semester
            payload += "sel_instr=%25&"
        payload += "begin_hh=0&begin_mi=0&begin_ap=a&end_hh=0&end_mi=0&end_ap=a&SUB_BTN=Section+Search&path=1"

        # This payload is for testing. It will only return CSCI classes and will therefore be a bit faster
        # payload = f'rsts=dummy&crn=dummy&term_in={os.getenv("CURRENT_TERM")}&sel_subj=dummy&sel_day=dummy&sel_schd=dummy&sel_insm=dummy&sel_camp=dummy&sel_levl=dummy&sel_sess=dummy&sel_instr=dummy&sel_ptrm=dummy&sel_attr=dummy&sel_subj=CSCI&sel_subj=LGHT&sel_crse=&sel_title=&sel_from_cred=&sel_to_cred=&sel_camp=%25&sel_ptrm=%25&begin_hh=0&begin_mi=0&begin_ap=a&end_hh=0&end_mi=0&end_ap=a&SUB_BTN=Section+Search&path=1'

        headers = {}
        response = s.request("POST", url, headers=headers, data=payload)

        if "No classes were found that meet your search criteria" in response.text:
            print(f"Term {term} has no classes!")
            print(payload)
            shutil.rmtree(
                f"data/{term}"
            )  # This term doesn't have classes, just remove it and continue
            continue

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
                        "instructor": ", ".join(
                            [
                                x.strip()
                                for x in cleanOutAbbr(getContent(td[19])).split(",")
                            ]
                        ),
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

                if len(getContent(td[1])) == 0:
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
                    "cap": int(getContent(td[10])),
                    "act": int(getContent(td[11])),
                    "rem": int(getContent(td[12])),
                    # "wlCap":int(getContent(td[13])),
                    # "wlAct":int(getContent(td[14])),
                    # "wlRem":int(getContent(td[15])),
                    # "xlCap":getContent(td[16]),
                    # "xlAct":getContent(td[17]),
                    # "xlRem":getContent(td[18]),
                    "attribute": getContent(td[22]) if 22 < len(td) else "",
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

        with open(f"data/{term}/courses.json", "w") as outfile:
            json.dump(data, outfile, sort_keys=False, indent=2)

        # Remove schools which have no courses, then format it for the homepage
        with open(f"data/{term}/schools.json", "r") as all_schools_f:
            all_schools = json.load(all_schools_f)

        schools = []
        for possible_school in all_schools:
            res_school = {"name": possible_school["name"], "depts": []}
            for target_dept in possible_school["depts"]:
                matching_depts = list(
                    filter(lambda d: d["code"] == target_dept["code"], data)
                )
                if matching_depts:
                    res_school["depts"].append(target_dept)
            if res_school["depts"]:
                schools.append(res_school)

        school_columns = optimize_column_ordering(schools)
        with open(f"data/{term}/schools.json", "w") as schools_f:
            json.dump(school_columns, schools_f, sort_keys=False, indent=2)

        # Generate binary conflict output
        # day * 24 hours/day * 60minutes/hour = total buckets
        offset = lambda x: x * 24 * 60

        day_offsets = {
            "M": offset(0),
            "T": offset(1),
            "W": offset(2),
            "R": offset(3),
            "F": offset(4),
            "S": offset(5),
            "U": offset(6),
        }

        unique_ranges = set()
        get_date = lambda x: date(1, int(x[0]), int(x[1]))

        for dept in data:
            for course in dept["courses"]:
                for section in course["sections"]:
                    for time in section["timeslots"]:
                        start = time["dateStart"].split("/")

                        if len(start) < 2:
                            continue
                        start_date = get_date(start)
                        unique_ranges.add(start_date)
        unique_ranges = list(unique_ranges)
        unique_ranges.sort(reverse=True)

        BITS_PER_SLICE = offset(len(day_offsets))
        BIT_VEC_SIZE = BITS_PER_SLICE * len(unique_ranges)

        conflicts = {}
        crn_to_courses = {}

        # A table consisting of lists of classes that conflict on the 'x'th bit
        sem_conflict_table = []

        for _ in range(BIT_VEC_SIZE):
            sem_conflict_table.append([])
        for dept in data:
            for course in dept["courses"]:
                for section in course["sections"]:
                    conflict = [0] * BIT_VEC_SIZE
                    for time in section["timeslots"]:
                        end = time["dateEnd"].split("/")
                        start = time["dateStart"].split("/")
                        if len(end) < 2 or len(start) < 2:
                            continue
                        my_end = get_date(end)
                        my_start = get_date(start)
                        for i, date_range in enumerate(unique_ranges):
                            # check to see if we are in this range
                            if my_end < date_range:
                                continue
                            if my_start > date_range:
                                continue

                            for day in time["days"]:
                                for hour in range(0, 2400, 100):
                                    for minute in range(60):
                                        if (
                                            time["timeStart"] <= hour + minute
                                            and time["timeEnd"] > hour + minute
                                        ):
                                            minute_idx = minute
                                            hour_idx = hour // 100
                                            index = BITS_PER_SLICE * i + (
                                                day_offsets[day]
                                                + hour_idx * 60
                                                + minute_idx
                                            )
                                            conflict[index] = 1
                                            sem_conflict_table[index].append(
                                                section["crn"]
                                            )
                    if sum(conflict) == 0:
                        continue
                    crn_to_courses[section["crn"]] = course["id"]
                    conflicts[section["crn"]] = conflict
        # Compute unnecessary conflict bits - where a bit is defined as unnecessary if its removal does not affect the result conflict checking
        # The following code computes a list of candidates that fit this criteria
        unnecessary_indices = set()

        for index1 in range(BIT_VEC_SIZE):
            for index2 in range(index1 + 1, BIT_VEC_SIZE):
                if (
                    index2 not in unnecessary_indices
                    and sem_conflict_table[index1] == sem_conflict_table[index2]
                ):
                    unnecessary_indices.add(index2)

        # Reverse the list as to not break earlier offsets
        conflicts_to_prune = list(unnecessary_indices)
        conflicts_to_prune.sort(reverse=True)

        # Prune the bits in `conflicts_to_prune` from all the bitstrings
        for section_crn in conflicts:
            for bit in conflicts_to_prune:
                del conflicts[section_crn][bit]

        for x in conflicts_to_prune:
            del sem_conflict_table[x]

        BIT_VEC_SIZE -= len(unnecessary_indices)
        unnecessary_indices.clear()

        sem_conflict_dict = dict()

        for index1 in range(BIT_VEC_SIZE):
            for crn in sem_conflict_table[index1]:
                if crn not in sem_conflict_dict:
                    sem_conflict_dict[crn] = set()

                sem_conflict_dict[crn].add(index1)

        # Optimization phase 2:
        # Now that we're on a (greatly) reduced working space, we can now prune using this
        # less efficient algorithm
        for index1 in range(BIT_VEC_SIZE):
            # We want all (unordered) pairs of conflicting courses on the bit `index1`
            pair_list = [pair for pair in combinations(sem_conflict_table[index1], 2)]

            # This part essentially tries to see if some other bit(s) other than the current one will create a conflict
            # for the conflicting classes in pair_list
            # If there is, we can safely discard this bit.
            pairs_to_delete = set()
            for pair in pair_list:
                table1 = sem_conflict_dict[pair[0]]
                table2 = sem_conflict_dict[pair[1]]
                for x in table1:
                    if x != index1 and x in table2:
                        pairs_to_delete.add(pair)

            if len(pairs_to_delete) == len(pair_list):
                for pair in pair_list:
                    table1 = sem_conflict_dict[pair[0]]
                    table2 = sem_conflict_dict[pair[1]]

                    table1.discard(index1)
                    table2.discard(index1)

                unnecessary_indices.add(index1)

        # Reverse the list as to not break earlier offsets
        conflicts_to_prune = list(unnecessary_indices)
        conflicts_to_prune.sort(reverse=True)

        # Prune the bits in `conflicts_to_prune` from all the bitstrings
        for section_crn in conflicts:
            for bit in conflicts_to_prune:
                del conflicts[section_crn][bit]

            # Convert to a string for the quacs-rs rust codegen
            conflicts[section_crn] = "".join(str(x) for x in conflicts[section_crn])

        # Compute the proper bit vec length for quacs-rs
        BIT_VEC_SIZE = math.ceil((BIT_VEC_SIZE - len(unnecessary_indices)) / 64)
        with open(f"data/{term}/mod.rs", "w") as f:  # -{os.getenv("CURRENT_TERM")}
            f.write(
                """\
//This file was automatically generated. Please do not modify it directly
use ::phf::{{phf_map, Map}};

pub const BIT_VEC_LEN: usize = """
                + str(BIT_VEC_SIZE)
                + """;

pub static CRN_TIMES: Map<u32, [u64; BIT_VEC_LEN]> = phf_map! {
"""
            )

            for crn, conflict in conflicts.items():
                rust_array = f"\t{crn}u32 => ["
                for i in range(0, BIT_VEC_SIZE * 64, 64):
                    if i != 0:
                        rust_array += ", "
                    rust_array += str(int(conflict[i : i + 64], 2))
                rust_array += "],\n"

                f.write(rust_array)

            f.write(
                """
};

pub static CRN_COURSES: Map<u32, &'static str> = phf_map! {
"""
            )

            for crn, course in crn_to_courses.items():
                f.write(f'\t{crn}u32 => "{course}",\n')
            f.write("};")
