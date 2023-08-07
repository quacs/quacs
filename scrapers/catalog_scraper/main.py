from typing import Dict, List, Tuple
import requests
import sys
from lxml import html
import os
from tqdm import tqdm
import json
from lxml import etree

# The api key is public so it does not need to be hidden in a .env file
BASE_URL = "http://rpi.apis.acalog.com/v1/"
# It is ok to publish this key because I found it online already public
DEFAULT_QUERY_PARAMS = "?key=3eef8a28f26fb2bcc514e6f1938929a1f9317628&format=xml"
CHUNK_SIZE = 100

# returns the list of catalogs with the newest one being first
# each catalog is a tuple (year, catalog_id) ex: ('2020-2021', 21)
def get_catalogs() -> List[Tuple[str, int]]:
    catalogs_xml = html.fromstring(
        requests.get(
            f"{BASE_URL}content{DEFAULT_QUERY_PARAMS}&method=getCatalogs"
        ).text.encode("utf8")
    )
    catalogs = catalogs_xml.xpath("//catalogs/catalog")

    ret: List[Tuple[str, int]] = []
    # For each catalog get its year and id and add that as as tuples to ret
    for catalog in catalogs:
        catalog_id: int = catalog.xpath("@id")[0].split("acalog-catalog-")[1]
        catalog_year: str = catalog.xpath(".//title/text()")[0].split(
            "Rensselaer Catalog "
        )[1]
        ret.append((catalog_year, catalog_id))

    # sort so that the newest catalog is always first
    ret.sort(key=lambda tup: tup[0], reverse=True)
    return ret


# Returns a list of course ids for a given catalog
def get_course_ids(catalog_id: str) -> List[str]:
    courses_xml = html.fromstring(
        requests.get(
            f"{BASE_URL}search/courses{DEFAULT_QUERY_PARAMS}&method=listing&options[limit]=0&catalog={catalog_id}"
        ).text.encode("utf8")
    )
    return courses_xml.xpath("//id/text()")


# Finds and returns a cleaned up description of the course
def get_catalog_description(fields, course_name):
    found_name = False
    # The description is always the next full field after the course name field
    # Iterate through the fields until we find the course name field and then return the next filled field
    for field in fields:
        if found_name == False:
            name = field.xpath(".//*/text()")
            if name and name[0] == course_name:
                found_name = True
        else:
            description = field.xpath(".//*/text()")
            if description:
                clean_description = " ".join(" ".join(description).split())
                # Short descriptions are usually false positives
                if clean_description.startswith("Prerequisite"):
                    return ""
                elif len(clean_description) > 10:
                    return clean_description

    return ""


def get_course_data(course_ids: List[str]) -> Dict:
    data = {}
    # Break the courses into chunks of CHUNK_SIZE to make the api happy
    course_chunks = [
        course_ids[i : i + CHUNK_SIZE] for i in range(0, len(course_ids), CHUNK_SIZE)
    ]
    for chunk in course_chunks:
        ids = "".join([f"&ids[]={id}" for id in chunk])
        url = f"{BASE_URL}content{DEFAULT_QUERY_PARAMS}&method=getItems&options[full]=1&catalog={catalog_id}&type=courses{ids}"

        response = requests.get(url)
        response.raise_for_status()
        courses_xml = html.fromstring(
            response.content.decode(response.apparent_encoding)
        )
        courses = courses_xml.xpath("//courses/course[not(@child-of)]")
        for course in courses:
            subj = course.xpath("./content/prefix/text()")[0].strip()
            crse = course.xpath("./content/code/text()")[0].strip()
            course_name = course.xpath("./content/name/text()")[0].strip()
            fields = course.xpath("./content/field")

            data[f"{subj}-{crse}"] = {
                "subj": subj,
                "crse": crse,
                "name": course.xpath("./content/name/text()")[0].strip(),
                "description": get_catalog_description(fields, course_name),
                "source": "Acalog",
            }

    return data


# Saves the catalog to the 3 semesters for that year
def save_catalog(data: Dict, year: str):
    years = year.split("-")
    for directory in (f"{years[0]}09", f"{years[1]}01", f"{years[1]}05"):
        directory = "data/" + directory
        os.makedirs(directory, exist_ok=True)
        with open(f"{directory}/catalog.json", "w") as outfile:
            json.dump(data, outfile, sort_keys=True, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    if sys.argv[-1] == "help" or sys.argv[-1] == "--help":
        raise SystemExit(f"USAGE: python3 {sys.argv[0]} [ALL_YEARS]")

    catalogs = get_catalogs()

    if sys.argv[-1] != "ALL_YEARS":
        print("Parsing single year")
        catalogs = catalogs[:1]
    else:
        print("Parsing all years")

    for index, (year, catalog_id) in enumerate(tqdm(catalogs)):
        course_ids = get_course_ids(catalog_id)
        data = get_course_data(course_ids)
        if not data:
            raise SystemExit("Catalog API returned blank, not saving")

        save_catalog(data, year)

        # Save the final catalog for the next year to account for delays in uploading the catalog
        if index == 0:
            years = year.split("-")
            save_catalog(data, f"{int(years[0])+1}-{int(years[1])+1}")
