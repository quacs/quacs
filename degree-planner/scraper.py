import itertools
import json
import os
import subprocess
import sys
import time

from dotenv import load_dotenv
import requests
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions
from selenium.webdriver.support.wait import WebDriverWait
from tqdm import tqdm


def get_dw_data(s: requests.Session, url: str, key: str):
    raw_data = s.get(url).json()
    return list(
        map(
            lambda data: (data["key"], data["description"]),
            filter(
                lambda data: data["isVisibleInWhatif"],
                raw_data["_embedded"][key],
            ),
        )
    )


load_dotenv()
RIN = os.getenv("RIN")
SIS_PASS = os.getenv("PASSWORD")

firefox_options = Options()
firefox_options.add_argument("-headless")

driver = webdriver.Firefox(options=firefox_options)
driver.get(
    "https://cas-auth-ent.rpi.edu/cas/login?service=https%3A%2F%2Fbannerapp04-bnrprd.server.rpi.edu%3A443%2Fssomanager%2Fc%2FSSB"
)
driver.find_element(By.ID, "username").send_keys(RIN)
driver.find_element(By.ID, "password").send_keys(SIS_PASS)
driver.find_element(By.NAME, "submit").click()
wait = WebDriverWait(driver, timeout=30)
wait.until(
    expected_conditions.presence_of_element_located((By.LINK_TEXT, "Student Menu"))
)
driver.find_element(By.LINK_TEXT, "Student Menu").click()
driver.find_element(By.LINK_TEXT, "Degree Works").click()

wait = WebDriverWait(driver, timeout=30)
wait.until(expected_conditions.presence_of_element_located((By.ID, "what-if")))
driver.find_element(By.ID, "what-if").click()

wait = WebDriverWait(driver, timeout=30)
wait.until(expected_conditions.presence_of_element_located((By.ID, "WhatIfGoals")))

with requests.Session() as s:
    # Add X-AUTH-TOKEN to cookies
    s.cookies = requests.cookies.cookiejar_from_dict(
        {cookie["name"]: cookie["value"] for cookie in driver.get_cookies()},
        s.cookies,
    )

    years = get_dw_data(
        s,
        "https://degreeworksprd.rpi.edu:8708/degwx/RespDashboard/api/catalogYears",
        "catalogYears",
    )

    degrees = get_dw_data(
        s,
        "https://degreeworksprd.rpi.edu:8708/degwx/RespDashboard/api/degrees",
        "degrees",
    )

    levels = get_dw_data(
        s,
        "https://degreeworksprd.rpi.edu:8708/degwx/RespDashboard/api/schools",
        "schools",
    )

    # Majors, minors, and concentrations aren't currently used, but they're pulled for if we want them later
    majors = get_dw_data(
        s,
        "https://degreeworksprd.rpi.edu:8708/degwx/RespDashboard/api/majors-whatif",
        "majors",
    )

    minors = get_dw_data(
        s,
        "https://degreeworksprd.rpi.edu:8708/degwx/RespDashboard/api/minors-whatif",
        "minors",
    )

    concentrations = get_dw_data(
        s,
        "https://degreeworksprd.rpi.edu:8708/degwx/RespDashboard/api/concentrations",
        "concentrations",
    )

    # Afaik, degreeworks doesn't actually use these values when deciding what rules to return
    # Unfortunately, they're still required parameters :(
    dummy_major = majors[0][0]
    dummy_level = levels[0][0]

    for (year, _), (degree, _) in tqdm(
        itertools.product(years, degrees), total=len(years) * len(degrees)
    ):
        payload = {
            "studentId": RIN,
            "isIncludeInprogress": True,
            "isIncludePreregistered": True,
            "isKeepCurriculum": False,
            "school": dummy_level,
            "catalogYear": year,
            "degree": degree,
            "goals": [{"code": "MAJOR", "value": dummy_major}],
            "classes": [],
        }

        res = s.post(
            "https://degreeworksprd.rpi.edu:8708/degwx/RespDashboard/api/audit",
            headers={"Origin": "https://degreeworksprd.rpi.edu:8708"},
            json=payload,
        )

        with open(f"data/{year}_{degree}.json", "w") as out_f:
            json.dump(res.json(), out_f, indent=2)


# subprocess.call(["cargo", "run", "--", *fnames])
