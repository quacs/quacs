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
                    data[section] = []
                el = el.next_sibling
                continue;

            if(section):
                if(el.string.strip()):
                    data[section].append(el.string.strip())


        el = el.next_sibling

    if('prerequisites' in data):
        pass

    if('corequisites' in data):
        data['corequisites'] = [ "-".join(course.split()) for course in data['corequisites'] ]

    if('cross_list_courses' in data):
        data['cross_list_courses'] = [ "-".join(course.split()) for course in data['cross_list_courses'] ]

    if('restrictions' in data):
        data['restrictions_clean'] = {}
        section = ""
        subsection = ""
        for part in data['restrictions']:
            if(part.endswith('Majors:')):
                section = "major"
                data['restrictions_clean'][section] = {}
            elif(part.endswith('Levels:')):
                section = "level"
                data['restrictions_clean'][section] = {}
            elif(part.endswith('Classifications:')):
                section = "classification"
                data['restrictions_clean'][section] = {}
            elif(part.endswith('Fields of Study (Major, Minor, or Concentration):')):
                section = "field_of_study"
                data['restrictions_clean'][section] = {}
            elif(part.endswith('Degrees:')):
                section = "degree"
                data['restrictions_clean'][section] = {}
            elif(part.endswith('Colleges:')):
                section = "college"
                data['restrictions_clean'][section] = {}
            elif(part.endswith('Campuses:')):
                section = "campus"
                data['restrictions_clean'][section] = {}

            if(part.startswith('Must be enrolled')):
                subsection = "must_be"
                data['restrictions_clean'][section]['must_be'] = []
                continue
            elif(part.startswith('May not be enrolled')):
                subsection = "may_not_be"
                data['restrictions_clean'][section]['may_not_be'] = []
                continue




            if(section):
                data['restrictions_clean'][section][subsection].append(part)
        data['restrictions'] = data['restrictions_clean']
        del data['restrictions_clean']


    print(json.dumps(data, indent=4))
    return data


prerequs = {}

# For testing
get_prereq_string(202009, 28655)
exit()

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
