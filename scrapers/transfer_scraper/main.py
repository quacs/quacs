import json
import requests
from bs4 import BeautifulSoup
import asyncio
import aiohttp
from typing import List
import sys
import re
from tqdm import tqdm

# Stores the full name of a school, nation, or state based on their sis id
global_id_to_name_map = {}

# Takes the homepage soup and the type of id to get, and returns a list of the ids
def get_ids(homepage_soup, type: str) -> List[str]:
    global global_id_to_name_map

    selectbox_html = homepage_soup.find_all("select", {"name": type})
    # print(homepage_soup)
    assert len(selectbox_html) == 1
    values = selectbox_html[0].find_all("option")

    for id in values:
        global_id_to_name_map[id.attrs["value"]]=id.text

    return [id.attrs["value"] for id in values if id.attrs["value"] != ""]

# for a specific state or nation return the list of school ids
async def get_specific_school_ids(state_id: str = "", nation_id: str = "") -> List[str]:
    global global_id_to_name_map
    assert len(state_id) > 0 or len(nation_id) > 0
    assert not (len(state_id) > 0 and len(nation_id) > 0)
    # print(state_id + nation_id)
    async with aiohttp.ClientSession() as s:
        async with s.post(
            url="https://sis.rpi.edu/rss/yhwwkwags.P_Select_Inst",
            data=f"stat_code={state_id}&natn_code={nation_id}&sbgi_code=",
        ) as results:
            homepage = BeautifulSoup(await results.text(), "html.parser")

    ids = get_ids(homepage, "sbgi_code")
    for id in ids:
        global_id_to_name_map[id]=global_id_to_name_map[state_id+nation_id]

    return ids


# Get all the school ids for all states and nations
async def get_school_ids():
    homepage = BeautifulSoup(
        requests.get(url="https://sis.rpi.edu/rss/yhwwkwags.P_Select_Inst").text.encode(
            "utf8"
        ),
        "html.parser",
    )
    state_ids = get_ids(homepage, "stat_code")
    nation_ids = get_ids(homepage, "natn_code")

    school_ids = []
    school_ids += await asyncio.gather(
        *(get_specific_school_ids(state_id=id) for id in state_ids)
    )
    school_ids += await asyncio.gather(
        *(get_specific_school_ids(nation_id=id) for id in nation_ids)
    )
    return [id for sublist in school_ids for id in sublist]


async def get_school_data(id) -> None:
    async with aiohttp.ClientSession() as s:
        async with s.post(
            url="https://sis.rpi.edu/rss/yhwwkwags.P_Select_Inst",
            data=f"stat_code=&natn_code=&sbgi_code={id}",
        ) as results:
            soup = BeautifulSoup(await results.text(), "html.parser")

            school_name = (
                soup.find("caption", {"class": "captiontext"}).find("strong").text
            )

            if school_name == None:
                print("Failed to find school name")
                sys.exit(1)

            full_table = soup.find("table", {"id": "TransArtTable"})
            rows = full_table.findAll("tr")
            for i in range(len(rows)):
                cells = rows[i].findAll("td")
                if len(cells) > 3:
                    course_id = cells[3].text.strip()
                    if(course_id in ["Not Transferable", "Not Evaluated"]):
                        continue

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
                        "location":global_id_to_name_map[id],
                        "name":"",
                        "transfer_id":"",
                        "transfer_name":"",
                        "rpi_id":"",
                        "rpi_name":"",
                        "rpi_credits":""

                    }

                    row_titles = [
                    "transfer_id",
                    "transfer_name",
                    "rpi_id",
                    "rpi_name",
                    "rpi_credits"]

                    output_line[0] = "real_name"
                    school_data['name'] = school_name
                    for offset in range(i - row_offset_up + 1, i + row_offset_down):
                        current_cells = rows[offset].findAll("td")
                        for j in range(
                            start_cell_offset,
                            min(
                                len(current_cells) + start_cell_offset - 1,
                                (5 + start_cell_offset),
                            ),
                        ):
                            temp = current_cells[j - start_cell_offset + 1].text.strip()
                            if temp != "":
                                school_data[row_titles[j-start_cell_offset]] += re.sub(" +", " ", temp) + "\n"

                    # remove extra \n at the end of a cell
                    school_data = {k: v.strip() for k, v in school_data.items()}

                    if(school_data['rpi_credits']):
                        school_data['rpi_credits'] = int(re.match(r'\d+', school_data['rpi_credits'])[0])

                    if(course_id not in data):
                        data[course_id] = []

                    data[course_id].append(school_data)





async def get_data(data, school_ids: List[str]) -> None:
    # TODO add a rate limit to get this to work without crashing
    # await asyncio.gather(*(get_school_data(id) for id in school_ids))
    for id in tqdm(school_ids):
        await get_school_data(id)


data = {}
school_ids = asyncio.run(get_school_ids())
# print(school_ids)
asyncio.run(get_data(data, school_ids))

print(data)
