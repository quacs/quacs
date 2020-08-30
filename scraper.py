import time
import os
import subprocess
import sys
from tqdm import tqdm

degrees = [
    ("ARCH", True, "BA-ARCH", "BA+Architecture"),
    ("AERO", False, "BS-AERO", "BS+Aeronautical+Engineering"),
    ("AERO", True, "BS-AERO-TR", "BS+Aeronautical+Engr/+transfer"),
    ("APHY", True, "BS-APHY", "BS+Applied+Physics"),
    ("BCBP", True, "BS-BCBP", "BS+Biochemistry+and+Biophysics"),
    ("BFMB", True, "BS-BFMB", "BS+Bioinformatics+and+Mol+Biol"),
    ("BIOL", True, "BS-BIOL", "BS+Biology"),
    ("BIAM", True, "BS-BIAM", "BS+Biology+Accelerated+Medical"),
    ("BMED", False, "BS-BMED", "BS+Biomedical+Engineering"),
    ("BLSC", True, "BS-BLSC", "BS+Building+Sciences"),
    ("BSAN", True, "BS-BSAN-TR", "BS+Business+Analytics/transfer"),
    ("BMGT", True, "BS-BMGT", "BS+Business+and+Management"),
    ("CHEG", True, "BS-CHEG", "BS+Chemical+Engineering"),
    ("CHEG", True, "BS-CHEG-TR", "BS+Chemical+Engr/+transfer"),
    ("CHEM", True, "BS-CHEM", "BS+Chemistry"),
    ("CIVL", False, "BS-CIVL", "BS+Civil+Engineering"),
    ("CIVL", True, "BS-CIVL-TR", "BS+Civil+Engineering/+transfer"),
    ("COGS", True, "BS-COGS", "BS+Cognitive+Science"),
    ("COMM", True, "BS-COMM", "BS+Communication"),
    ("CSCI", True, "BS-CSCI", "BS+Computer+Science"),
    ("CSCI", True, "BS-CSCI-TR", "BS+Computer+Science/+transfer"),
    ("CSYS", False, "BS-CSYS", "BS+Computer+And+Systems+Engr."),
    ("DSIS", True, "BS-DSIS", "BS+Dsgn,+Innovation+&+Society"),
    ("ECON", True, "BS-ECON", "BS+Economics"),
    ("ELEC", False, "BS-ELEC", "BS+Electrical+Engineering"),
    ("EART", True, "BS-EART", "BS+Electronic+Arts"),
    ("EMAC", True, "BS-EMAC", "BS+Electronic+Media/Arts/Comm"),
    ("ESCI", False, "BS-ESCI", "BS+Engineering+Science"),
    # TODO: GSAS
    ("GEOL", True, "BS-GEOL", "BS+Geology"),
    ("HGEO", True, "BS-HGEO", "BS+Hydrogeology"),
    ("MGTE", False, "BS-MGTE", "BS+Industrial+&+Management+Eng"),
    ("ISCI", True, "BS-ISCI", "BS+Interdisciplinary+Science"),
    ("MATL", False, "BS-MATL", "BS+Materials+Engineering"),
    ("MATH", True, "BS-MATH", "BS+Mathematics"),
    ("MATH", True, "BS-MATH-TR", "BS+Mathematics/+transfer"),
    ("MECL", False, "BS-MECL", "BS+Mechanical+Engineering"),
    ("MECL", True, "BS-MECL-TR", "BS+Mechanical+Eng/+transfer"),
    ("MUSIC", True, "BS-MUSIC", "BS+Music"),
    ("NUCL", False, "BS-NUCL", "BS+Nuclear+Engineering"),
    ("PHIL", True, "BS-PHIL", "BS+Philosophy"),
    ("PHYS", True, "BS-PHYS", "BS+Physics"),
    ("PHYS", True, "BS-PHYS-TR", "BS+Physics/+transfer"),
    ("PSYS", True, "BS-PSYS", "BS+Psychological+Science"),
    ("PSYC", False, "BS-PSYC", "BS+Psychology"),
    ("SSLW", True, "BS-SSLW", "BS+Science+and+Society+(Law)"),
    ("STSO", True, "BS-STSO", "BS+Science,+Tech+&+Society"),
    ("SUST", True, "BS-SUST", "BS+Sustainability+Studies"),
    ("ENGR", True, "BS-ENGR", "BS+Undeclared+Engineering"),
]

fnames = []
for year in range(2012, 2027):
    for major, blocklist, short_degree, long_degree in degrees:
        fnames.append(f"{year}-{short_degree}")


if len(sys.argv) > 2 and sys.argv[1] == "refresh_data":
    from dotenv import load_dotenv
    import requests
    from selenium import webdriver
    from selenium.webdriver.firefox.options import Options
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support import expected_conditions
    from selenium.webdriver.support.wait import WebDriverWait

    load_dotenv()
    RIN = os.getenv("RIN")
    SIS_PASS = os.getenv("PASSWORD")

    firefox_options = Options()
    firefox_options.add_argument("-headless")

    driver = webdriver.Firefox(options=firefox_options)
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

    headers = {
        "Cookie": f"PASSPORT={passport}; PASSPORT={passport}",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    cookies = dict(PASSPORT=passport)

    for year in range(2012, 2027):
        for major, blocklist, short_degree, long_degree in tqdm(
            degrees, desc=str(year)
        ):
            if blocklist:
                payload[
                    "BLOCKLIST"
                ] = f'dummy&&GOALCODE=MAJOR&GOALVALUE="{major}"&GOALCATYR=2019&'
            else:
                payload["BLOCKLIST"] = "dummy&&"

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

            with open(f"{year}-{short_degree}.xml", "w") as f:
                f.write(response.text)

subprocess.call(["cargo", "run", "--", *fnames])
