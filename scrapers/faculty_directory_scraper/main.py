from concurrent import futures
import asyncio
import time
import requests
import aiohttp
from lxml import html
from lxml import etree
from bs4 import BeautifulSoup
import json
import re


BASE_URL = "https://faculty.rpi.edu"


def clean_string(string):
    # Remove newlines and nbsp, as well as repeated spaces.
    string = re.sub("[\n\u00a0 ]+", " ", string)
    # "founder of lightexture , where she designs"
    # =>
    # "founder of lightexture, where she designs"
    # https://faculty.rpi.edu/yael-erel
    return re.sub(" +([,.])", r"\1", string).strip()


def scrape_professor(soup):
    entry = {}
    entry["name"] = soup.find("span", {"class": "field--name-title"}).text
    entry["portrait"] = BASE_URL + soup.find("img", {"class": "img-fluid"})["src"]

    # Sometimes the title is in field--name-field-title, and sometimes
    # it is in field--name-field-alternate-title. No explanation for that.
    title = soup.find("div", {"class", "field--name-field-title"}) or soup.find(
        "div", {"class", "field--name-field-alternate-title"}
    )

    # There will also sometimes not be a title.
    if title:
        entry["title"] = title.text
    else:
        entry["title"] = ""

    # This makes it so that professors are listed as
    # "Associate Professor, Computer Science"
    # for example, if the data is available. If there is no title but there
    # is a department, then it just lists the department.
    department = soup.find("div", {"class": "field--name-field-primary-department"})
    if department:
        if title:
            entry["title"] += ", "
        entry["title"] += department.text

    for key, cl in {
        "area": "focus-area",
        "primary-area": "primary-research-focus",
        "education": "education",
    }.items():
        if tag := soup.find("div", {"class": f"field--name-field-{cl}"}):
            entry[key] = clean_string(
                tag.find("div", {"class", "field__item"}).get_text(" ")
            )

    for key, cl in {
        "biography": "bio",
        "teaching": "teaching-summary",
        "office-hours": "office-hours",
        "current-teaching": "current-teaching",
        "research": "research-summary",
        "office": "location",
        "website": "website",
    }.items():
        if tag := soup.find("div", f"field--name-field-{cl}"):
            entry[key] = clean_string(tag.get_text(" "))

    # Scraping the ORCID and LinkedIn is a bit more complicated
    # because they aren't wrapped in a tag that is easily findable
    if orcid_icon := soup.find("i", {"class": "fa-orcid"}):
        entry["orcid"] = clean_string(orcid_icon.parent.text)
    if linkedin_icon := soup.find("i", {"class": "fa-linkedin"}):
        entry["linkedin"] = clean_string(linkedin_icon.parent["href"])

    return entry


async def get_professor(session, url, data):
    async with session.get(f"{BASE_URL}/{url}") as response:
        soup = BeautifulSoup(await response.text("utf8"), "lxml")
        canonical_path = (
            "/" + soup.find("link", {"rel": "canonical"})["href"].split("/")[-1]
        )

        # If we are not at a search page, then we are at a faculty page,
        # so scrape it. The URL is a mess so we use the canonical path.
        # /search?faculty%5B0%5D=name%3AAbby%20Kinchy => /abby-kinchy
        if canonical_path != "/search":
            print(f"Scraping {canonical_path}...")
            data[canonical_path] = scrape_professor(soup)

        # If we are at a search page, then we selected a name that has multiple professors.
        # e.g. Michael Klein
        # So we need to go to each of their pages first and scrape them

        # Getting each entry in the search results
        for canonical_path in map(
            lambda x: x.find("a")["href"],
            soup.findAll("div", {"class": "views-field-title"}),
        ):
            print(f"Scraping {canonical_path}...")
            async with session.get(f"{BASE_URL}{canonical_path}") as response:
                data[canonical_path] = scrape_professor(
                    BeautifulSoup(await response.text("utf8"), "lxml")
                )


async def main():
    # Gets the faculty directory page
    response = requests.get(BASE_URL)
    faculty_entries = html.fromstring(
        response.content.decode(response.apparent_encoding)
    ).xpath('//select[@data-drupal-facet-id="name"]/option/@value')

    async with aiohttp.ClientSession() as session:
        data = {}
        for faculty_url in faculty_entries:
            await get_professor(session, faculty_url, data)

    with open("faculty.json", "w") as outfile:
        json.dump(data, outfile, sort_keys=True, indent=2)


asyncio.run(main())
