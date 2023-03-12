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
    return re.sub("[\n\u00a0 ]+", " ", string).strip()


async def get_professor(session, url, data):
    async with session.get(f"{BASE_URL}/{url}") as response:
        print(url)
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
        # for example, if the data is available.
        department = soup.find("div", {"class": "field--name-field-primary-department"})
        if department:
            if title:
                entry["title"] += ", "
            entry["title"] += department.text

        # Sometimes there is no bio, focus area, etc so we use this if statement pattern.
        if bio := soup.find("div", {"class": "field--name-field-bio"}):
            entry["biography"] = clean_string(bio.text)

        if area := soup.find("div", {"class": "field--name-field-focus-area"}):
            entry["area"] = clean_string(
                area.find("div", {"class", "field__item"}).text
            )

        if primary_area := soup.find(
            "div", {"class": "field--name-field-primary-research-focus"}
        ):
            entry["primary-area"] = clean_string(
                primary_area.find("div", {"class", "field__item"}).text
            )

        if education := soup.find("div", {"class": "field--name-field-education"}):
            # The purpose of doing this is to prevent paragraphs in the
            # education block from getting smushed together.
            entry["education"] = clean_string(
                " ".join(
                    [
                        x.text.strip()
                        for x in education.find(
                            "div", {"class", "field__item"}
                        ).find_all(recursive=False)
                    ]
                )
            )

        if teaching := soup.find(
            "div", {"class": "field--name-field-teaching-summary"}
        ):
            entry["teaching"] = clean_string(teaching.text)

        if research := soup.find(
            "div", {"class": "field--name-field-research-summary"}
        ):
            entry["research"] = clean_string(research.text)

        if office := soup.find("div", {"class": "field--name-field-location"}):
            entry["office"] = clean_string(office.text)

        # Disabled to avoid making it easy to spam professors.
        # if phone := soup.find("div",{"class":"field--name-field-phone-number"}):
        #    entry["phone"] = clean_string(phone.text)

        if website := soup.find(
            "div", {"class": "field--name-field-website field--type-link"}
        ):
            entry["website"] = clean_string(website.text)

        # Disabled to avoid making it easy to spam professors.
        # Scraping the email and ORCID (see Gittens) is a bit more complicated because neither is not wrapped in a classed tag
        # if envelope_icon := soup.find("i",{"class":"fa-envelope"}):
        #    if email := envelope_icon.parent.find("a"):
        #        entry["email"] = clean_string(email.text)

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
