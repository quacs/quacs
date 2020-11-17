import os
import re
import json
from itertools import combinations
from datetime import datetime
from collections import namedtuple
from typing import List, Dict, Sized

from tqdm import tqdm

Range = namedtuple("Range", ["start", "end"])


# As of right now by importing this file it also runs the code
# import main

# Uses regex to extract out the crns and bitpacks from the rust mod.rs file
def get_bitpacks(path):
    bitpacks = {}
    with open(path, "r") as file:
        modrs = file.read()
        matches = re.finditer(
            r"^\s+?(\d+?)u32 => (\[(?:\d+?(?:, )?)+\]),", modrs, re.MULTILINE
        )
        for match in matches:
            assert len(match.groups()) == 2
            crn = int(match.groups()[0])
            bitpack = json.loads(match.groups()[1])
            bitpacks[crn] = bitpack
    return bitpacks


# Checks if a timeslot is defined
def invalid_timeslot(ts):
    return len(ts["days"]) == 0 or ts["timeStart"] < 0 or ts["timeEnd"] < 0


def get_date(year, ts) -> Range:
    return Range(
        start=datetime(
            year,
            int(ts["dateStart"].split("/")[0]),
            int(ts["dateStart"].split("/")[1]),
        ),
        end=datetime(
            year,
            int(ts["dateEnd"].split("/")[0]),
            int(ts["dateEnd"].split("/")[1]),
        ),
    )


# returns true if timeslot dateranges are not overlapping
def dateranges_dont_overlap(year, ts1, ts2):
    # date comparision code adapted from here https://stackoverflow.com/a/9044111/7589854
    r1 = get_date(year, ts1)
    r2 = get_date(year, ts2)
    latest_start = max(r1.start, r2.start)
    earliest_end = min(r1.end, r2.end)
    delta = (earliest_end - latest_start).days + 1
    overlap = max(0, delta) > 0
    return overlap


# returns if sections conflict based on neieve method
def naive_section_conflict(a, b, year):
    for ts1 in a["timeslots"]:
        if invalid_timeslot(ts1):
            continue
        for ts2 in b["timeslots"]:
            if invalid_timeslot(ts2):
                continue

            # If the days they happen in the semester don't overlap, skip it
            if dateranges_dont_overlap(year, ts1, ts2):
                continue

            for day in ts1["days"]:
                # If not happening on the same day, skip it
                if day not in ts2["days"]:
                    continue

                # There is a conflict
                if max(ts2["timeStart"], ts1["timeStart"]) < min(
                    ts2["timeEnd"], ts1["timeEnd"]
                ):
                    return True
    return False


# returns if sections conflict based on if bitpack method
def bitpack_section_conflict(bp1, bp2):
    assert len(bp1) == len(bp2)
    for bp1_elem, bp2_elem in zip(bp1, bp2):
        if bp1_elem & bp2_elem:
            return True
    return False


# Tests that the bitpacks generated for each crn correctly conflict with all other
# courses. This compares the bitpack results to the results from neieve comparision
def test_conflict_bitpacks():
    for term in os.listdir("data"):
        bitpacks = get_bitpacks(f"data/{term}/mod.rs")
        sections = []
        with open(f"data/{term}/courses.json") as f:
            for school in json.load(f):
                for course in school["courses"]:
                    for section in course["sections"]:
                        sections.append(section)

        year = int(str(term)[:4])
        # the total length here is an estimate
        for section1, section2 in tqdm(
            combinations(sections, 2), total=(len(sections) ** 2) / 2
        ):
            naive_conflict = naive_section_conflict(section1, section2, year)
            bitpack_conflict = False
            if section1["crn"] in bitpacks and section2["crn"] in bitpacks:
                bitpack_conflict = bitpack_section_conflict(
                    bitpacks[section1["crn"]], bitpacks[section2["crn"]]
                )
            assert naive_conflict == bitpack_conflict


if __name__ == "__main__":
    test_conflict_bitpacks()
    print("Everything passed")
