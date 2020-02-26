from dotenv import load_dotenv
import os
import requests
from bs4 import BeautifulSoup
import json


load_dotenv()



def getContent(element):
    return element.encode_contents().decode().strip().replace('&amp;', '&')

def getContentFromChild(element, childType):
    return getContent(element.findAll(childType)[0])


payload = f'sid={os.getenv("RIN")}&PIN={os.getenv("PASSWORD")}'
headers = {
  'Content-Type': 'application/x-www-form-urlencoded'
}
with requests.Session() as s:
    s.get(url='https://sis.rpi.edu/rss/twbkwbis.P_WWWLogin')
    response = s.request("POST", "https://sis.rpi.edu/rss/twbkwbis.P_ValLogin", headers=headers, data = payload)


    if(b"Welcome" not in response.text.encode('utf8')):
        print("Failed to log into sis")
        exit(1)


    url = "https://sis.rpi.edu/rss/bwskfcls.P_GetCrse_Advanced"
    payload = 'rsts=dummy&crn=dummy&term_in=202005&sel_subj=dummy&sel_day=dummy&sel_schd=dummy&sel_insm=dummy&sel_camp=dummy&sel_levl=dummy&sel_sess=dummy&sel_instr=dummy&sel_ptrm=dummy&sel_attr=dummy&sel_subj=ADMN&sel_subj=ARCH&sel_subj=ARTS&sel_subj=ASTR&sel_subj=BCBP&sel_subj=BIOL&sel_subj=BMED&sel_subj=CHME&sel_subj=CHEM&sel_subj=CIVL&sel_subj=COGS&sel_subj=COMM&sel_subj=CSCI&sel_subj=ENGR&sel_subj=ERTH&sel_subj=ECON&sel_subj=ECSE&sel_subj=ENVE&sel_subj=GSAS&sel_subj=ISYE&sel_subj=ISCI&sel_subj=LANG&sel_subj=LGHT&sel_subj=LITR&sel_subj=MGMT&sel_subj=MTLE&sel_subj=MATH&sel_subj=MANE&sel_subj=PHIL&sel_subj=PHYS&sel_subj=PSYC&sel_subj=STSH&sel_subj=STSS&sel_subj=WRIT&sel_crse=&sel_title=&sel_from_cred=&sel_to_cred=&sel_camp=%25&sel_ptrm=%25&begin_hh=0&begin_mi=0&begin_ap=a&end_hh=0&end_mi=0&end_ap=a&SUB_BTN=Section+Search&path=1'
    headers = {
    }
    response = s.request("POST", url, headers=headers, data = payload)

    data = {}
    data['departments'] = []

    # print(response.text.encode('utf8'))
    soup = BeautifulSoup(response.text.encode('utf8'), "html.parser")
    table = soup.findAll("table", {'class':'datadisplaytable'})[0]
    rows = table.findAll("tr")
    current_department = None
    current_code = None
    current_courses = None

    # current_class = None
    # current_sections = None
    for row in rows:
        th = row.findAll("th")
        if len(th) != 0:
            if 'ddtitle' in th[0].attrs['class']:
                # if(current_department):
                data['departments'].append({
                    "name": getContent(th[0]),
                    "code": "",
                    "courses": []
                })
                # current_department = getContent(th[0])
                # current_courses = []
                # data['departments'].append({
                #     "name": current_department,
                #     "code": "",
                #     "courses": []
                # })
        else:
            td = row.findAll("td")

            timeslot_data = {
                "Days":getContent(td[8]).split(),
                "Time-start":getContent(td[9]),
                "Time-end":getContent(td[9]),
                "Instructor":getContent(td[19]),
                "Date-start":getContent(td[20]),
                "Date-end":getContent(td[20]),
                "Location":getContent(td[21])
            }

            if len(getContent(td[0])) == 0:
                data['departments'][-1]['courses'][-1]['Sections']['timeslots'].append(timeslot_data)
                continue;


            section_data = {
                "Select":getContentFromChild(td[0], 'abbr'),
                "CRN":int(getContentFromChild(td[1], 'a')),
                "Subj":getContent(td[2]),
                "Crse":int(getContent(td[3])),
                "Sec":getContent(td[4]),
                "Cmp":getContent(td[5]),
                "Cred":float(getContent(td[6]).split('-')[0]),
                "Title":getContent(td[7]),
                "Cap":int(getContent(td[10])),
                "Act":int(getContent(td[11])),
                "Rem":int(getContent(td[12])),
                "WL Cap":int(getContent(td[13])),
                "WL Act":int(getContent(td[14])),
                "WL Rem":int(getContent(td[15])),
                "XL Cap":int(getContent(td[16])),
                "XL Act":int(getContent(td[17])),
                "XL Rem":int(getContent(td[18])),
                "Attribute":getContent(td[22]),
                "timeslots":[timeslot_data]
            }

            data['departments'][-1]['courses'].append({
                "Title":getContent(td[7]),
                "Subj":getContent(td[2]),
                "Crse":int(getContent(td[3])),
                "Sections":section_data
            })

    print(json.dumps(data, indent=4, sort_keys=True))
