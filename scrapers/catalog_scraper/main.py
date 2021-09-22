import os
import requests
from bs4 import BeautifulSoup
import json
import re
import sys
from tqdm import tqdm
import time
from shutil import copyfile

from typing import Tuple, List

import asyncio
import aiohttp

BASE_URL = "http://catalog.rpi.edu"
HEADERS = {
    "Content-Type": "application/x-www-form-urlencoded",
}

# returns [(year, courses url, schools url)]
async def get_years() -> List[Tuple[str, str, str]]:
    async with aiohttp.ClientSession() as s:
        async with s.get(f"{BASE_URL}/index.php") as homepage:
            homepage_text = await homepage.text()
            home_soup = BeautifulSoup(homepage_text.encode("utf8"), "lxml")
            dropdown_entries = home_soup.find(
                "select", {"name": "catalog"}
            ).findChildren("option", recursive=False)

            dropdown_mapped = map(lambda x: (x["value"], x.string), dropdown_entries)
            dropdown_formatted = map(
                lambda x: (x[0], x[1].split(" [")[0]), dropdown_mapped
            )
            dropdown_formatted = map(
                lambda x: (x[0], x[1].split("Catalog ")[1]), dropdown_formatted
            )

            ret = []

            for val, year in dropdown_formatted:
                async with s.post(
                    f"{BASE_URL}/index.php",
                    headers=HEADERS,
                    data={"catalog": val, "sel_cat_submit": "GO"},
                ) as year_home:
                    year_home_text = await year_home.text()
                    year_home_soup = BeautifulSoup(
                        year_home_text.encode("utf8"), "lxml"
                    )
                    courses_url = year_home_soup("a", text="Courses")[0]["href"]
                    schools_url = year_home_soup("a", text="Subject Codes")[0]["href"]
                    ret.append((year, BASE_URL + courses_url, BASE_URL + schools_url))

            return ret


async def scrape_course_data(s, url, data):
    # Try scraping this page up to 10 times
    for i in range(10):
        async with s.get(url) as course_results:
            data_soup = BeautifulSoup(await course_results.text("utf8"), "lxml")
            course = data_soup.find("h1").contents[0].split("-")
            if course[0] == "503 Service Temporarily Unavailable":
                print(f"attempt {i} failed to scrape {url}, trying again...")
                continue
            course_code = course[0].split()
            key = course_code[0].strip() + "-" + course_code[1].strip()
            data[key] = {}
            data[key]["subj"] = course_code[0].strip()
            data[key]["crse"] = course_code[1].strip()
            data[key]["name"] = course[1].strip()
            # data[key]['url'] = url
            # data[key]['coid'] = url.split('=')[-1]

            description = data_soup.find("hr")
            if description:
                description = description.parent.encode_contents().decode().strip()
                description = re.split("<\/?hr ?\/?>", description)[1]
                description = re.split("<\/?br ?\/?>\s*<strong>", description)[0]
                description = re.sub("<.*?>", "", description)
                data[key]["description"] = description.strip()

            # when_offered = data_soup.find('strong', text='When Offered:')
            # if when_offered:
            #     data[key]['when_offered'] = when_offered.nextSibling.strip()
            #
            # cross_listed = data_soup.find('strong', text='Cross Listed:')
            # if cross_listed:
            #     data[key]['cross_listed'] = cross_listed.nextSibling.strip()
            #
            # pre_req = data_soup.find('strong', text='Prerequisites/Corequisites:')
            # if pre_req:
            #     data[key]['pre_req'] = pre_req.nextSibling.strip()
            #
            # credit_hours = data_soup.find('em', text='Credit Hours:')
            # if credit_hours:
            #     credit_hours = credit_hours.nextSibling.nextSibling.text.strip()
            #     if(credit_hours == 'Variable'):
            #         data[key]['credit_hours_max'] = 0
            #         data[key]['credit_hours_min'] = 999
            #     else:
            #         data[key]['credit_hours'] = credit_hours

            # If we got here the code must have worked which means we dont need to try again and therefore we can return
            return
    raise Exception(f"Failed to scrape {url}")


# TODO: add proper rate limiting
async def scrape_catalog(s, courses_url, data):
    print(courses_url)

    # Go to the list of pages that contain courses, find the urls to every course, add them to the urls array
    urls = []
    index = 1
    while True:
        url = f"{courses_url}&filter%5Bitem_type%5D=3&filter%5Bonly_active%5D=1&filter%5B3%5D=1&filter%5Bcpage%5D={index}#acalog_template_course_filter"
        # response = requests.get(url)
        async with s.get(url) as response:
            soup = BeautifulSoup(await response.text("utf8"), "lxml")

            rows = soup.find_all(
                "a",
                {
                    "href": re.compile(
                        r"preview_course_nopop.php\?catoid=\d+?&coid=\d+?"
                    )
                },
            )

            # This page is empty, the last page must have been the last page that contained courses
            if len(rows) == 0:
                break

            for row in rows:
                await scrape_course_data(
                    s,
                    f"http://catalog.rpi.edu/preview_course.php?{row['href'].split('?')[1]}&print",
                    data,
                )
                urls.append(
                    f"http://catalog.rpi.edu/preview_course.php?{row['href'].split('?')[1]}&print"
                )

        index += 1

    # await asyncio.gather(*(scrape_course_data(s, url, data) for url in urls))


async def get_schools(s, url):
    async with s.get(url) as homepage:
        soup = BeautifulSoup(await homepage.text("utf8"), "lxml")
        schools = soup.find("h3", text="Four-Letter Subject Codes by School")
        num_schools = len(
            list(
                filter(lambda x: str(x).strip(), schools.next_siblings),
            )
        )

        school = schools
        data = {}
        departments = set()
        for _ in range(num_schools):
            school = school.findNext("p")

            strings = list(school.stripped_strings)
            school_title = strings[0]
            school_name_end = school_title.index("(") - 1
            school_name = school_title[:school_name_end]
            if school_name not in data:
                data[school_name] = []

            for dept in strings[1:]:
                first_space = dept.index(" ")
                try:
                    nbsp_idx = dept.index("\u00a0")
                except ValueError:
                    nbsp_idx = -1
                if nbsp_idx > 0 and nbsp_idx < first_space:
                    first_space = nbsp_idx
                code = dept[:first_space]
                name = dept[first_space + 1 :]
                if code not in departments:
                    data[school_name].append({"code": code, "name": name})
                departments.add(code)
        return data


# Gets the data for a year, this is either the school data or the catalog data
async def get_year(year_data):
    year, courses_url, schools_url = year_data
    async with aiohttp.ClientSession() as s:
        if sys.argv[1] == "catalog":
            data = {}
            await scrape_catalog(s, courses_url, data)
        else:
            data = await get_schools(s, schools_url)
            data = list(map(lambda x: {"name": x[0], "depts": x[1]}, data.items()))

        years = year.split("-")
        for directory in (f"{years[0]}09", f"{years[1]}01"):
            directory = "data/" + directory
            os.makedirs(directory, exist_ok=True)
            with open(f"{directory}/{sys.argv[1]}.json", "w") as outfile:
                json.dump(data, outfile, sort_keys=False, indent=2)


async def get_page_urls(years_data):
    # await asyncio.gather(*(get_year(year) for year in years_data))
    for year in tqdm(years_data):
        await get_year(year)


years = asyncio.run(get_years())

if len(sys.argv) == 1:
    print(f"USAGE: python3 {sys.argv[0]} (catalog|schools)")
    sys.exit(1)

if sys.argv[-1] == "LATEST_YEAR":
    print("Parsing single year")
    asyncio.run(get_page_urls(years[:1]))
else:
    asyncio.run(get_page_urls(years))

"""
# Duplicate the final summer semester to fall of the next year. This is for if
# the catalog does not update fast enough for the fall semester
os.makedirs(f"data/{years[0][0].split('-')[1]}09", exist_ok=True)
try:
    copyfile(
        f"data/{years[0][0].split('-')[1]}05/schools.json",
        f"data/{years[0][0].split('-')[1]}09/schools.json",
    )
except:
    print("schools.json does not exist for the final semester")

try:
    copyfile(
        f"data/{years[0][0].split('-')[1]}05/catalog.json",
        f"data/{years[0][0].split('-')[1]}09/catalog.json",
    )
except:
    print("catalog.json does not exist for the final semester")
"""
