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


async def get_professor(session, url, data):
    async with session.get(f"{BASE_URL}/{url}") as response:
        print(f"Scraping {url}...")
        soup = BeautifulSoup(await response.text("utf8"), "lxml")
        entry = {}
        entry["name"] = soup.find("span", {"class": "field--name-title"}).text
        entry["portrait"] = BASE_URL + soup.find("img", {"class": "img-fluid"})["src"]

        # Sometimes the title is in field--name-field-title, and sometimes
        # it is in field--name-field-alternate-title. No explanation for that.
        if not (title := soup.find("div", {"class", "field--name-field-title"})):
            title = soup.find("div", {"class", "field--name-field-alternate-title"})

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

        # Scraping the ORCID (see Gittens) is a bit more complicated
        # because it isn't wrapped in a tag that is easily findable
        if orcid_icon := soup.find("i", {"class": "fa-orcid"}):
            entry["orcid"] = clean_string(orcid_icon.parent.text)

        data[url] = entry


async def entry_to_professor(session, url, faculty_list):
    async with session.get(f"{BASE_URL}/{url}") as response:
        soup = BeautifulSoup(await response.text("utf8"), "lxml")
        canonical_url = (
            "/" + soup.find("link", {"rel": "canonical"})["href"].split("/")[-1]
        )

        # If we are not at a search page, then we are at a faculty page.
        # So add it to the list.
        if canonical_url != "/search":
            faculty_list.append(canonical_url)
            return

        # If we are at a search page, then we selected a name that has multiple professors.
        # e.g. Michael Klein
        # so we need to add both

        # Getting each entry in the search results
        for entry in soup.findAll("div", {"class": "views-field-title"}):
            faculty_list.append(entry.find("a")["href"])


async def main():
    # Gets the faculty directory page
    response = requests.get(BASE_URL)
    faculty_entries = html.fromstring(
        response.content.decode(response.apparent_encoding)
    ).xpath('//select[@data-drupal-facet-id="name"]/option/@value')

    async with aiohttp.ClientSession() as session:
        # when two professors have the same name, the faculty_entries variable
        # only has one entry for both, so we need to account for this
        faculty_list = []
        for faculty_url in faculty_entries:
            await entry_to_professor(session, faculty_url, faculty_list)
        # now that we actually have a list of professors, we will fill in the
        # data object with the relevant information
        data = {}
        for professor_url in faculty_list:
            await get_professor(session, professor_url, data)

    with open("faculty.json", "w") as outfile:
        json.dump(data, outfile, sort_keys=True, indent=2)


asyncio.run(main())
