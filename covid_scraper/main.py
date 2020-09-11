import os
import requests
from bs4 import BeautifulSoup
import json

res = requests.get("https://covid19.rpi.edu/dashboard")
soup = BeautifulSoup(res.text.encode("utf8"), "lxml")

data = {}

dashboard = soup.find("div", "dashboard-stats").find("div", "field__items")

for div in dashboard.find_all("div", "field__item", recursive=False):
    field_name = div.find("div", "field--name-field-stat-description").text
    field_stat = div.find("div", "field--name-field-stat").text
    data[field_name] = field_stat

data["caption"] = soup.find("div", "field--name-field-stats-caption").text

with open(f"covid.json", "w") as outfile:
    json.dump(data, outfile, sort_keys=False, indent=4)
