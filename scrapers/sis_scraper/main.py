#!/usr/bin/env python3

# Python standard library
import asyncio
from operator import itemgetter
import os
import re
import json
import sys
from datetime import datetime
from urllib.parse import urlparse, parse_qs

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


# Returns a dict with the important data for a CRN.
# {
#   "act": 0,
#   "attribute": "Communication Intensive",
#   "cap": 19,
#   "credMax": 4.0,
#   "credMin": 4.0,
#   "crn": 36663,
#   "crse": 2660,
#   "rem": 19,
#   "sec": "01",
#   "subj": "COMM",
#   "timeslots": [
#     {
#       "dateEnd": "05/08",
#       "dateStart": "01/12",
#       "days": [
#         "T",
#         "F"
#       ],
#       "instructor": "Benjamin David Gleeksman",
#       "location": "TBA",
#       "timeEnd": 950,
#       "timeStart": 800
#     }
#   ],
#   "title": "Introduction To Graphic Design"
# }
async def get_crn_details(term, crn):
    data = {}

    url = "https://sis9.rpi.edu/StudentRegistrationSsb/ssb/searchResults/{mode}"
    request_payload = {"term": term, "courseReferenceNumber": crn}

    # Get basic course information. Notably excluded here is the subject code.
    # No idea why, but I found a stupid workaround.
    async with session.post(
        url.format(mode="getClassDetails"), data=request_payload
    ) as html:
        soup = BeautifulSoup(await html.text())

        # Get credit amount
        # If it is a variable number of credits, this span tag
        # will exist. Otherwise not.
        credit_span = soup.find_all("span", {"class": "credit-hours-direction"})
        if credit_span:
            credit_data = credit_span[0].text
            credit_data = list(map(float, re.split("TO|OR", credit_data)))
        else:
            credit_data = (
                re.search(
                    r'<span class="status-bold">Credit Hours:</span>((?s:.*?))<br[/]>',
                    str(soup),
                )
                .group(1)
                .strip()
            )

        credit_min = min(credit_data)
        credit_max = max(credit_data)

        data.update(
            {
                "title": util.normalize_class_name(soup.find(id="courseTitle").text),
                "sec": soup.find(id="sectionNumber").text,
                "crse": int(soup.find(id="courseNumber").text),
                "crn": int(soup.find(id="courseReferenceNumber").text),
                "credMin": credit_min,
                "credMax": credit_max,
            }
        )

    # I hate this. The *only* way I could find of getting the subject code
    # was to scrape the bookstore link. Good lord.
    async with session.post(
        url.format(mode="getSectionBookstoreDetails"), data=request_payload
    ) as html:
        soup = BeautifulSoup(await html.text())
        data.update(
            {
                "subj": parse_qs(urlparse(soup.find_all("a")[0]["href"]).query)[
                    "department1"
                ][0]
            }
        )

    # Get course attributes. Note that we concatenate them into a string,
    # this is just for consistency with the old scraper. It is definitely
    # inefficient.
    async with session.post(
        url.format(mode="getSectionAttributes"), data=request_payload
    ) as html:
        soup = BeautifulSoup(await html.text())
        attributes = [
            tag.text.strip().split("  ")[0]
            for tag in soup.find_all("span", {"class": "attribute-text"})
        ]
        data.update({"attribute": ", ".join(attributes)})

    # Get course capacity
    async with session.post(
        url.format(mode="getEnrollmentInfo"), data=request_payload
    ) as html:
        soup = BeautifulSoup(await html.text())
        regex_string = (
            r'<span class="status-bold">{param}:</span> <span dir="ltr">(.*?)</span>'
        )
        data.update(
            {
                "act": re.search(
                    regex_string.format(param="Enrollment Actual"), str(soup)
                )
                .group(1)
                .strip(),
                "cap": re.search(
                    regex_string.format(param="Enrollment Maximum"), str(soup)
                )
                .group(1)
                .strip(),
                "rem": re.search(
                    regex_string.format(param="Enrollment Seats Available"), str(soup)
                )
                .group(1)
                .strip(),
            }
            # If desired in the future, waitlist data would be scraped here
        )

    # Get timeslots. This request returns JSON instead of HTML for some reason
    async with session.post(
        url.format(mode="getFacultyMeetingTimes"), data=request_payload
    ) as html:
        # This request gives us a ton of extraneous data, we drop most of it here
        data.update(
            {
                "timeslots": [
                    {
                        "dateEnd": e["meetingTime"]["endDate"],
                        "dateStart": e["meetingTime"]["startDate"],
                        "timeStart": int(e["meetingTime"]["beginTime"]),
                        "timeEnd": int(e["meetingTime"]["endTime"]),
                        # This is some of the grossest code I have ever written. Let me explain
                        # If there exists any faculty, then put the primary at the front of the
                        # list, and sort the remaining by last name. Then save the names
                        # with first name first, for consistency with older data.
                        "instructor": (
                            [
                                " ".join(f["displayName"].split(", ")[::-1])
                                for f in list(
                                    e
                                    for e in e["faculty"]
                                    if e["primaryIndicator"] == True
                                )
                                + sorted(
                                    list(
                                        e
                                        for e in e["faculty"]
                                        if e["primaryIndicator"] == False
                                    ),
                                    key=lambda d: d["displayName"],
                                )
                            ]
                            if e["faculty"]
                            else ""
                        ),
                        # I cannot believe the data is actually formatted like this
                        "days": list(
                            filter(
                                None,
                                [
                                    "M" if e["meetingTime"]["monday"] else None,
                                    "T" if e["meetingTime"]["tuesday"] else None,
                                    "W" if e["meetingTime"]["wednesday"] else None,
                                    "R" if e["meetingTime"]["thursday"] else None,
                                    "F" if e["meetingTime"]["friday"] else None,
                                    # If RPI ever did weekend classes for some diabolical reason
                                    # that would go here. I didn't include this even though SIS
                                    # supports it because Saturday and Sunday are both S
                                ],
                            )
                        ),
                        "location": f'{e["meetingTime"]["buildingDescription"]} {e["meetingTime"]["room"]}',
                    }
                    for e in json.loads(await html.text())["fmt"]
                ]
            }
        )
    return data



async def main():
    if sys.argv[-1] == "help" or sys.argv[-1] == "--help":
        print(f"USAGE: python3 {sys.argv[0]} [ALL_YEARS]")
        sys.exit(1)

    global session
    async with aiohttp.ClientSession(
        connector=aiohttp.TCPConnector(limit=5)
    ) as session:
        semesters = util.get_semesters_to_scrape()

        print(await get_crn_details(202601, 36982))
        print(await get_crn_details(202601, 38413))
        print(await get_crn_details(202601, 37074))
        return

        if sys.argv[-1] == "ALL_YEARS":
            print("Parsing all years")
            for term in os.listdir("data/"):
                if term not in semesters:
                    semesters.append(term)
        elif sys.argv[-1] == "OLD_YEARS":
            print("Parsing pre-2008 years only")
            # weird special case:
            # 199805 = first half summer, 199807 = second half
            # all other summers just put both in XXXX05
            # also, 199801 is not in SIS
            semesters = ["199805", "199807", "199809"]
            for year in range(1999, 2008):
                for term in ["01", "05", "09"]:
                    semesters.append(str(year) + str(term))
        elif len(sys.argv[-1]) == 6:
            print(f"Parsing {sys.argv[-1]} only")
            semesters = [sys.argv[-1]]
        else:
            print("Parsing relevant terms only")

        for semester in semesters:
            await scrape_term(semester)


if __name__ == "__main__":
    asyncio.run(main())
