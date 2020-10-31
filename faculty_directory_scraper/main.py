from concurrent import futures
import asyncio
import time
import requests
import aiohttp
from bs4 import BeautifulSoup
import json


async def get_professor(s, professor, url, data):
    async with s.get(url) as response:
        soup = BeautifulSoup(await response.text("utf8"), "lxml")
        data[professor["node"]["Path"]] = {}
        professor_data = data[professor["node"]["Path"]]
        professor_data["name"] = professor["node"]["title"].strip()

        # Find all fields on the professor page and append them to the data object
        for item in soup.findAll("div", {"class": "views-field"}):
            class_parts = item["class"][1].split("-")
            if class_parts[len(class_parts) - 1] == "portrait":
                professor_data[class_parts[len(class_parts) - 1]] = item.find("img")[
                    "src"
                ].split("?")[0]
            elif item.find("div", {"class": "field-content"}):
                professor_data[class_parts[len(class_parts) - 1]] = " ".join(
                    item.find("div", {"class": "field-content"}).get_text(" ").split()
                )


async def main():
    # Gets a json object that contains all faculty and their associated urls
    faculty = requests.get("https://faculty.rpi.edu/data/peoplesearch").json()

    data = {}
    async with aiohttp.ClientSession() as s:
        await asyncio.gather(
            *(
                get_professor(
                    s,
                    professor,
                    f"https://faculty.rpi.edu{professor['node']['Path']}",
                    data,
                )
                for professor in faculty["nodes"]
            )
        )

    with open("faculty.json", "w") as outfile:
        json.dump(data, outfile, sort_keys=True, indent=2)


asyncio.run(main())
