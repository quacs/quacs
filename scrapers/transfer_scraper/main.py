import json
import requests
from bs4 import BeautifulSoup
import asyncio
import aiohttp
from typing import List
import sys
import re
from tqdm import tqdm

# Stores the full name of a school, nation, or state mapped from their sis id
# Example: { "NY": "New York" }
global_id_to_name_map = {}

# Takes the homepage soup and the type of id to get, and returns a list of the ids
def get_ids(homepage_soup, type: str) -> List[str]:
    global global_id_to_name_map

    selectbox_html = homepage_soup.find_all("select", {"name": type})
    assert len(selectbox_html) == 1

    values = selectbox_html[0].find_all("option")

    for id in values:
        global_id_to_name_map[id.attrs["value"] + "_" + type] = id.text

    return [id.attrs["value"] for id in values if id.attrs["value"] != ""]


# for a specific state or nation return the list of school ids
async def get_specific_school_ids(
    s, state_id: str = "", nation_id: str = ""
) -> List[str]:
    global global_id_to_name_map
    assert len(state_id) > 0 or len(nation_id) > 0
    assert not (len(state_id) > 0 and len(nation_id) > 0)

    async with s.post(
        url="https://sis.rpi.edu/rss/yhwwkwags.P_Select_Inst",
        data=f"stat_code={state_id}&natn_code={nation_id}&sbgi_code=",
    ) as results:
        homepage = BeautifulSoup(await results.text(), "html.parser")

    ids = get_ids(homepage, "sbgi_code")
    for id in ids:
        global_id_to_name_map[id] = global_id_to_name_map[
            f"{state_id}{nation_id}_{'stat_code' if state_id != '' else 'natn_code'}"
        ]

    return ids


# Get all the school ids from all states and nations
async def get_school_ids() -> List[str]:
    homepage = BeautifulSoup(
        requests.get(url="https://sis.rpi.edu/rss/yhwwkwags.P_Select_Inst").text.encode(
            "utf8"
        ),
        "html.parser",
    )
    state_ids: List[str] = get_ids(homepage, "stat_code")
    nation_ids: List[str] = get_ids(homepage, "natn_code")

    school_ids: List[str] = []
    async with aiohttp.ClientSession() as s:
        school_ids += await asyncio.gather(
            *(get_specific_school_ids(s, state_id=id) for id in state_ids)
        )
        school_ids += await asyncio.gather(
            *(get_specific_school_ids(s, nation_id=id) for id in nation_ids)
        )

    return [id for sublist in school_ids for id in sublist]


# Takes in a raw value for the operator and does some checks to make sure it is
# valid before adding it to school_data[type]
def get_operator(school_data, type, operator):
    assert type in ("transfer_operator", "rpi_operator")
    assert len(operator) <= 1

    operator = operator[0].text if operator else None
    operator = operator if operator in ("AND", "OR") else None

    # Ensure that
    assert (
        school_data[type] == None or operator == None or school_data[type] == operator
    )

    if school_data[type] == None and operator:
        school_data[type] = operator


async def get_school_data(s, id) -> None:
    async with s.post(
        url="https://sis.rpi.edu/rss/yhwwkwags.P_Select_Inst",
        data=f"stat_code=&natn_code=&sbgi_code={id}",
    ) as results:
        soup = BeautifulSoup(await results.text(), "html.parser")

        school_name = soup.find("caption", {"class": "captiontext"}).find("strong").text

        if school_name == None:
            print("Failed to find school name")
            sys.exit(1)

        full_table = soup.find("table", {"id": "TransArtTable"})
        rows = full_table.findAll("tr")
        for i in range(len(rows)):
            cells = rows[i].findAll("td")
            if len(cells) > 3:
                course_id = cells[3].text.strip()
                if course_id in ["Not Transferable", "Not Evaluated"]:
                    pass

                # gets the offsets because some data actually fills more than one row
                row_offset_up = 0
                while len(rows[i - row_offset_up].findAll("td")) > 1:
                    row_offset_up += 1
                row_offset_down = 0
                while len(rows[i + row_offset_down].findAll("td")) > 1:
                    row_offset_down += 1

                # scrape data between the offsets
                start_cell_offset = 2

                school_data = {
                    "location": global_id_to_name_map[id],
                    "school_name": school_name,
                    "transfer": [],
                    "transfer_operator": None,
                    "rpi": [],
                    "rpi_operator": None,
                }

                for offset in range(i - row_offset_up + 1, i + row_offset_down):
                    current_cells = rows[offset].findAll("td")

                    get_operator(
                        school_data, "rpi_operator", current_cells[-1].findAll("strong")
                    )
                    get_operator(
                        school_data,
                        "transfer_operator",
                        current_cells[0].findAll("strong"),
                    )

                    for j in range(
                        start_cell_offset,
                        min(
                            len(current_cells) + start_cell_offset - 1,
                            (5 + start_cell_offset),
                        ),
                    ):
                        value = current_cells[j - start_cell_offset + 1].text.strip()
                        value = re.sub(" +", " ", value)
                        if value != "":
                            index = j - start_cell_offset
                            if index == 0:  # transfer id
                                school_data["transfer"].append({"id": value})
                            elif index == 1:  # transfer name
                                school_data["transfer"][-1]["name"] = value
                            elif index == 2:  # rpi id
                                assert re.match(r"^\w{4} \d{4}$", value) != None
                                school_data["rpi"].append({"id": value})
                            elif index == 3:  # rpi name
                                school_data["rpi"][-1]["name"] = value
                            elif index == 4:  # rpi credits
                                assert (
                                    re.match(r"^\d+(?:\.\d+)? credits$", value) != None
                                )
                                school_data["rpi"][-1]["credits"] = float(
                                    re.match(r"\d+(?:\.\d+)?", value)[0]
                                )

                assert re.match(r"^\w{4} \d{4}$", course_id) != None
                if course_id not in data:
                    data[course_id] = []

                data[course_id].append(school_data)


# Takes in the school ids and
async def get_data(data, school_ids: List[str]) -> None:
    async with aiohttp.ClientSession() as s:
        # await asyncio.gather(*(get_school_data(s, id) for id in school_ids))
        # If we start running into rate limit problems, replace the asyncio.gather above with this loop
        for id in tqdm(school_ids):
            await get_school_data(s, id)


data = {}
print("Getting list of schools")
school_ids = asyncio.run(get_school_ids())
print(f"Found {len(school_ids)} schools")
print("Getting transfer data")
asyncio.run(get_data(data, school_ids))

for k, v in data.items():
    data[k] = sorted(
        v, key=lambda school_data: school_data["location"] + school_data["school_name"]
    )


with open("transfer.json", "w") as outfile:
    json.dump(data, outfile, sort_keys=True, indent=2)

print("Finished")
