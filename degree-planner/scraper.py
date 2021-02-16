import itertools
import json
import os

from dotenv import load_dotenv
import requests
from tqdm import tqdm

import urllib.parse
from bs4 import BeautifulSoup

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

LOGIN_BASE_PARAMS = f"username={os.getenv('RIN')}&password={urllib.parse.quote(os.getenv('PASSWORD'))}&_eventId=submit"
headers = {
    "Content-Type": "application/x-www-form-urlencoded",
}
with requests.Session() as s:
    login_url = "https://cas-auth-ent.rpi.edu/cas/login?service=https%3A%2F%2Fdegreeworksprd.rpi.edu%3A8708%2Fdegwx%2FRespDashboard%2Flogin%2Fcas"
    login_page = s.get(url=login_url)
    login_soup = BeautifulSoup(login_page.text.encode("utf8"), "html.parser")
    csrf = login_soup.find("input", attrs={"name": "execution"})["value"]
    login_params = LOGIN_BASE_PARAMS + f"&execution={csrf}"

    response = s.request(
        "POST",
        login_url,
        headers=headers,
        data=login_params,
    )
    if b"dashboard.bundle.js" not in response.text.encode("utf8"):
        print(response.text.encode("utf8"))
        print("Failed to authenticate CAS")
        exit(1)

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
