from datadog import initialize, statsd
from typing import Dict, List
import os
import json

NUMBER_OF_TERMS = 3

options = {
    'statsd_host':'127.0.0.1',
    'statsd_port':8125
}

initialize(**options)

def get_tag_list(tags:Dict[str,str]) -> List[str]:
    tag_list = []
    for key,value in tags.items():
        tag_list.append(f"{key}:{value}")
    return tag_list

# Gets the newest NUMBER_OF_TERMS terms
def get_terms() -> List[str]:
    terms = os.listdir("data/semester_data")
    terms.sort()
    return terms[-NUMBER_OF_TERMS:]

def round_down(num, divisor=1000):
    return num - (num%divisor)


tags = {}
if(os.environ.get("GITHUB_ACTIONS")):
    tags['env'] = "github"
else:
    tags['env'] = "dev"

for term in get_terms():
    with open(f"data/semester_data/{term}/courses.json") as json_file:
            courses = json.load(json_file)
            tags['term']=term
            for department in courses:
                tags['department']=department["code"]
                for course in department["courses"]:
                    tags['course']=f'{course["subj"]}-{course["crse"]}'
                    tags['level']=round_down(course["crse"])
                    for section in course["sections"]:
                        tags['title']=section["title"]
                        tags['crn']=section["crn"]
                        tags['section_number']=section["sec"]
                        tags['credits_min']=section['credMin']
                        tags['credits_max']=section['credMax']

                        print(get_tag_list(tags), "Actual:", section['act'], "Remaining:", section['rem'], "Capacity:", section['cap'])
                        statsd.gauge('quacs.section.actual', section['act'], tags=get_tag_list(tags))
                        statsd.gauge('quacs.section.remaining', section['rem'], tags=get_tag_list(tags))
                        statsd.gauge('quacs.section.capacity', section['cap'], tags=get_tag_list(tags))