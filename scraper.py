import time
import os

from dotenv import load_dotenv
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions
from selenium.webdriver.support.wait import WebDriverWait

load_dotenv()
RIN = os.getenv("RIN")
SIS_PASS = os.getenv("PASSWORD")

driver = webdriver.Firefox()
driver.get("https://sis.rpi.edu/rss/twbkwbis.P_WWWLogin")
driver.set_window_size(959, 1054)
driver.find_element(By.ID, "UserID").send_keys(RIN)
driver.find_element(By.NAME, "PIN").send_keys(SIS_PASS)
driver.find_element(By.CSS_SELECTOR, "p > input:nth-child(1)").click()
wait = WebDriverWait(driver, timeout=30)
wait.until(
    expected_conditions.presence_of_element_located((By.LINK_TEXT, "Student Menu"))
)
driver.find_element(By.LINK_TEXT, "Student Menu").click()
driver.find_element(By.LINK_TEXT, "Degree Works").click()
time.sleep(3)
passport = driver.get_cookie("PASSPORT")["value"]
print(f"Cookie: {passport}")

payload = {
    "SERVICE": "SCRIPTER",
    "SCRIPT": "SD2GETAUD",
    "ACTION": "WHATIFAUDIT",
    "USERID": RIN,
    "STUID": RIN,
    "DEGREETERM": "ACTV",
    "INTNOTES": "Y",
    "DEGINTEREST": "",
    "INPROGRESS": "Y",
    "CUTOFFTERM": "9999",
    "REFRESH": "N",
    "WHATIF": "Y",
    "BLOCKLIST": "********* CUSTOM *********",
    "SCHOOL": "UG",  # TODO: support grad school?
    "DEGREE": "********* CUSTOM *********",
    "SCHOOLLIT": "Undergraduate",  # TODO: support grad school?
    "DEGREELIT": "********* CUSTOM *********",
    "CATYEAR": "********* CUSTOM *********",
    "PROGRAM": "",
    "DEBUG": "OFF",
    "ContentType": "xml",
    "CLASSLIST": "",
    "REPORT": "WEB31",
    "InProgress": "on",
    "CutOffTerm": "on",
}

degrees = [("CSCI", "BS-CSCI", "BS+Computer+Science")]

headers = {
    "Cookie": f"PASSPORT={passport}; PASSPORT={passport}",
    "Content-Type": "application/x-www-form-urlencoded",
}

cookies = dict(PASSPORT=passport)

for year in range(2018, 2020):
    for major, short_degree, long_degree in degrees:
        payload[
            "BLOCKLIST"
        ] = f'dummy&&GOALCODE=MAJOR&GOALVALUE="{major}"&GOALCATYR=2019&'
        payload["DEGREE"] = short_degree
        payload["DEGREELIT"] = long_degree
        payload["CATYEAR"] = str(year)

        response = requests.request(
            "POST",
            "https://degwx-webprd.server.rpi.edu/IRISLink.cgi",
            headers=headers,
            cookies=cookies,
            data=payload,
        )

        with open(f"{major}.xml", "w") as f:
            f.write(response.text)
