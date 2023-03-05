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
        data = re.split(r"\n======*", (await request.text()))
        for term_data in data:
            # Goldschmidt uses Windows which is why we have to deal with \r,
            # which I do by just removing all of them. Then we split on
            # double-newlines, because each course "block" is split by these.
            # Sometimes course "blocks" are split by more than 2 newlines
            # so this results in empty or whitespace-only strings, which is
            # why "if line.strip()" is there, to get rid of them.
            courses = [
                line
                for line in re.split("\n\n", term_data.replace("\r", ""))
                if line.strip()
            ]
            # Sometimes Goldschmidt puts the heading of the file in brackets,
            # and sometimes he does not, so we remove the left bracket
            # and split on whitespace to find the term name.
            term = courses[0].replace("[", "").split(" ")[0]
            list_of_terms[goldschmidt_term_to_sis_term(term)] = parse_term(courses[1:])
        return list_of_terms


def parse_term(courses):
    catalog = {}
    for course in courses:
        lines = [line for line in course.split("\n") if line.strip()]
        entry = {}
        desc = [line for line in lines if line.startswith("Description:")]
        if not desc:
            desc = [lines[-1]]
        entry["description"] = re.sub(r"^Description: *", "", desc[0])
        course_title = lines[0].split(" ")
        subj = course_title[0]
        entry["subj"] = subj

        # This is because Goldschmidt sometimes includes the section
        # number and sometimes does not
        if all(elmt.isdigit() for elmt in course_title[2].split("-")):
            # if it is a section number, do not put that in the course name
            name = course_title[3:]
        else:
            name = course_title[2:]
        entry["name"] = " ".join(name).title()

        crses = course_title[1].split("/")
        for crse in crses:
            entry["crse"] = crse
            catalog["-".join([subj, crse])] = entry
    return catalog


async def main():
    global session
    async with aiohttp.ClientSession(
        connector=aiohttp.TCPConnector(limit=5)
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
            with open(f"data/{term}/csci_topics/catalog.json", "w") as outfile:
                json.dump(data, outfile, sort_keys=True, indent=2)


if __name__ == "__main__":
    asyncio.run(main())
