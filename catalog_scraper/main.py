import os
import requests
from bs4 import BeautifulSoup
import json
import re
import sys
from tqdm import tqdm
from copy import deepcopy

from typing import Tuple, List

import asyncio
import aiohttp


async def scrapePage(s, url, data):
    async with s.get(url) as response:
        response_text = await response.text()
        soup = BeautifulSoup(response_text.encode("utf8"), "lxml")

        rows = soup.find(
            "div", {"id": "advanced_filter_section"}
        ).nextSibling.nextSibling.findAll("tr")
        final_row = None
        for row in rows:
            final_row = row
            if len(row.findAll("td")) <= 1:
                continue
            data_url_end = (
                row.findAll("td")[1]
                .findChildren("a", recursive=False)[0]["href"]
                .split("?")[1]
            )
            data_url = f"http://catalog.rpi.edu/preview_course.php?{data_url_end}&print"
            # print(data_url)

            async with s.get(data_url) as course_results:
                results_text = await course_results.text()
                data_soup = BeautifulSoup(results_text.encode("utf8"), "lxml")
                course = data_soup.find("h1").contents[0].split("-")
                course_code = course[0].split()
                key = course_code[0].strip() + "-" + course_code[1].strip()
                data[key] = {}
                data[key]["subj"] = course_code[0].strip()
                data[key]["crse"] = course_code[1].strip()
                data[key]["name"] = course[1].strip()
                # data[key]['url'] = data_url
                # data[key]['coid'] = data_url_end.split('=')[-1]

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

        next_page = final_row.findChildren("strong")[0].findNext("a", recursive=False)
        if next_page["href"] != "#" and next_page["href"] != "javascript:void(0);":
            return BASE_URL + next_page["href"]
        return None


BASE_URL = "http://catalog.rpi.edu"


async def get_schools(s, url):
    async with s.get(url) as homepage:
        homepage_text = await homepage.text()
        soup = BeautifulSoup(homepage_text.encode("utf8"), "lxml")
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
                code = dept[:first_space]
                name = dept[first_space + 1 :]
                if code not in departments:
                    data[school_name].append({"code": code, "name": name})
                departments.add(code)
        return data


def calculate_score(columns):
    if not columns:
        return 99999999999  # some arbitrarily large number

    def column_sum(column):
        return sum(map(lambda x: len(x["depts"]), column))

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


def optimize_ordering(data, num_columns=3):
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
                "select", {"title": "Select a Catalog"}
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


async def parse_year(s, year_data):
    year, courses_url, schools_url = year_data

    if sys.argv[1] == "catalog":
        data = {}
        while True:
            if courses_url is None:
                break
            courses_url = await scrapePage(s, courses_url, data)
    else:
        data = await get_schools(s, schools_url)
        data = list(map(lambda x: {"name": x[0], "depts": x[1]}, data.items()))
        data = optimize_ordering(data)

    years = year.split("-")
    for directory in (f"{years[0]}09", f"{years[1]}01", f"{years[1]}05"):
        directory = "data/" + directory
        os.makedirs(directory, exist_ok=True)
        with open(f"{directory}/{sys.argv[1]}.json", "w") as outfile:
            json.dump(data, outfile, sort_keys=False, indent=2)


async def parse_years(years_data):
    async with aiohttp.ClientSession() as s:
        await asyncio.gather(*(parse_year(s, year_data) for year_data in years_data))


years = asyncio.run(get_years())

if len(sys.argv) == 1:
    print(f"USAGE: python3 {sys.argv[0]} (catalog|schools)")
    sys.exit(1)

if sys.argv[-1] == "LATEST_YEAR":
    print("Parsing single year")
    asyncio.run(parse_years(years[:1]))
else:
    asyncio.run(parse_years(years))
