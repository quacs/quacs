import requests
import bs4
import json
from tqdm import tqdm

def get_prereq_string(term, crn):
    r = requests.get(f"https://sis.rpi.edu/rss/bwckschd.p_disp_detail_sched?term_in={term}&crn_in={crn}")
    soup = bs4.BeautifulSoup(r.text, features="lxml")

    el = soup.find(attrs={"summary" : "This layout table is used to present the seating numbers."})
    el = el.next_sibling

    section = ""
    data = {}
    while(el):
        if(el.string):
            if(el.name == 'span'):
                section = "_".join(el.string.lower().split())
                section = ''.join([i for i in section if i.isalpha() or i=="_"])
                if(section not in data):
                    data[section] = ""
                el = el.next_sibling
                continue;

            if(section):
                data[section]+=el.string


        el = el.next_sibling

    for key in data:
        data[key] = " ".join(data[key].split())

    print(json.dumps(data, indent=4))
    return data


prerequs = {}

# For testing
# get_prereq_string(202009, 25715)
# exit()

crns = []
with open('courses.json') as json_file:
    courses = json.load(json_file)
    for department in courses:
        for course in department['courses']:
            for section in course['sections']:
                crns.append(section['crn'])

for crn in tqdm(crns):
    prerequs[crn] = get_prereq_string(202009, crn)
    print(crn)

with open('prerequs.json', 'w') as outfile:
    json.dump(prerequs, outfile, indent=4)
