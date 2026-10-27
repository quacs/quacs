#!/usr/bin/env python3

# Python standard library
import asyncio
from operator import itemgetter
import os
import re
import json
import sys
import copy

# External dependnecies
import aiohttp
import bs4
import requests

BeautifulSoup = lambda data: bs4.BeautifulSoup(data, features="lxml")


async def get_topics_txts():
    global session
    url = "https://www.cs.rpi.edu/~goldsd/docs/"
    async with session.get(url) as request:
        soup = BeautifulSoup(await request.text())
        links = soup.find("table").findAll("a")
        out = []
        for link in links:
            if "topics-courses" in link["href"]:
                out.append(link["href"])
        # sorts reverse chronologically
        return sorted(out, reverse=True, key=lambda x: (x[1:3] + str.lower(x[0])))


def goldschmidt_term_to_sis_term(term):
    term = term.lower()
    if term[0] == "s":
        postfix = "01"
    elif term[0] == "u":
        postfix = "05"
    elif term[0] == "f":
        postfix = "09"
    else:
        # This shouldn't be possible
        raise Exception(f"Invalid term code {term}")
    return "20" + term[1:] + postfix


async def scrape_txt(filename, list_of_terms):
    global session
    url = f"https://www.cs.rpi.edu/~goldsd/docs/{filename}"
    async with session.get(url) as request:
        data = re.split(r"\n======*", await request.text("Windows-1252"))
        for term_data in data:
            # Goldschmidt uses Windows which is why we have to deal with \r,
            # which I do by just removing all of them. Then we split on
            # double-newlines, because each course "block" is split by these.
            # Sometimes course "blocks" are split by more than 2 newlines
            # so this results in empty or whitespace-only strings, which is
            # why "if line.strip()" is there, to get rid of them.
            courses = [
                line.strip()
                for line in re.split("\n\n", term_data.replace("\r", ""))
                if line.strip()
            ]
            # Sometimes Goldschmidt puts the heading of the file in brackets,
            # and sometimes he does not, so we remove the left bracket
            # and split on whitespace to find the term name.
            term = courses[0].replace("[", "").split(" ")[0]
            catalog = parse_term(courses[1:])
            if catalog:
                list_of_terms[goldschmidt_term_to_sis_term(term)] = catalog
        return list_of_terms


# Matches the course codes at the start of a course block's first line, like
# "CSCI 4962/6962 SAFE AUTONOMY" or "CSCI 4966/ITWS 4966 ..."
COURSE_HEADER = re.compile(r"^[A-Z]{4} \d{4}(/([A-Z]{4} )?\d{4})* ")
COURSE_CODE = re.compile(r"(?:([A-Z]{4}) )?(\d{4})")
DESCRIPTION = re.compile(r"^(Course )?Description: *", re.IGNORECASE)
# Lines like "Credits: 4" or "Cross-listed from: COGS 4960/6960"
METADATA = re.compile(r"^[A-Za-z][A-Za-z -]*: ")


def parse_term(courses):
    catalog = {}
    for course in courses:
        lines = [line.strip() for line in course.split("\n") if line.strip()]
        # Skip placeholder blocks like "<none>" for terms without topics courses
        if not COURSE_HEADER.match(lines[0]):
            continue
        entry = {}
        desc = [line for line in lines if DESCRIPTION.match(line)]
        if desc:
            entry["description"] = DESCRIPTION.sub("", desc[0])
        elif len(lines) > 1 and not METADATA.match(lines[-1]):
            # Older files sometimes have an unlabeled note like "[see COGS 4410]"
            entry["description"] = lines[-1]
        # Otherwise leave the description out so the SIS one is kept when merged

        # Drop tags like "[CI]" (communication intensive) from the title
        title = re.sub(r" *\[[^\]]*\]", "", lines[0])
        codes = COURSE_HEADER.match(title).group(0)
        course_title = title[len(codes) :].split(" ")

        # This is because Goldschmidt sometimes includes the section
        # number and sometimes does not
        if all(elmt.isdigit() for elmt in course_title[0].split("-")):
            # if it is a section number, do not put that in the course name
            course_title = course_title[1:]
        entry["name"] = " ".join(course_title).title()
        entry["source"] = "CSCI topics"

        subj = None
        for code_subj, crse in COURSE_CODE.findall(codes):
            # "4962/6962" reuses the subject of the code before it
            subj = code_subj or subj
            entry["subj"] = subj
            entry["crse"] = crse
            catalog["-".join([subj, crse])] = copy.deepcopy(entry)
    return catalog


async def main():
    global session
    async with aiohttp.ClientSession(
        connector=aiohttp.TCPConnector(limit=5, ssl=False)
    ) as session:
        filenames = await get_topics_txts()

        if sys.argv[-1] != "ALL_YEARS":
            print("Scraping most recent terms only")
            filenames = filenames[:2]
        else:
            print("Scraping all years possible")

        terms = {}
        for filename in filenames:
            await scrape_txt(filename, terms)

        for term, data in terms.items():
            filename = f"data/{term}/csci_topics/catalog.json"
            os.makedirs(os.path.dirname(filename), exist_ok=True)
            with open(filename, "w") as outfile:
                json.dump(data, outfile, sort_keys=True, indent=2)


if __name__ == "__main__":
    asyncio.run(main())
