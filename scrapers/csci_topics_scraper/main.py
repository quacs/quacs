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
        return out


async def scrape_all_txts(links):
    list_of_terms = {}
    for link in links:
        await scrape_txt(link, list_of_terms)
    return list_of_terms


def goldy_term_to_sis_term(term):
    term = term.lower()
    if term[0] == "s":
        postfix = "01"
    elif term[0] == "u":
        postfix = "05"
    elif term[0] == "f":
        postfix = "09"
    else:
        # placeholder
        postfix = "00"
    return "20" + term[1:] + postfix


async def scrape_txt(filename, list_of_terms):
    global session
    url = f"https://www.cs.rpi.edu/~goldsd/docs/{filename}"
    async with session.get(url) as request:
        data = re.split(r"\n======*", (await request.text()))
        for term_data in data:
            courses = [
                line
                for line in re.split("\n\n", term_data.replace("\r", ""))
                if line.strip()
            ]
            term = courses[0].replace("[", "").split(" ")[0]
            list_of_terms[goldy_term_to_sis_term(term)] = scrape_term(courses[1:])
        return list_of_terms


def scrape_term(courses):
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

        # This is because Goldy sometimes includes the section
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
        links = await get_topics_txts()
        # had to do it like this because summer and fall are
        # put together in the same file
        all_terms = await scrape_all_txts(links)
        for term, data in all_terms.items():
            with open(f"data/{term}/csci_topics/catalog.json", "w") as outfile:
                json.dump(data, outfile, sort_keys=True, indent=2)


if __name__ == "__main__":
    asyncio.run(main())
