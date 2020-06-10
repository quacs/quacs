import requests
import bs4
import json
from tqdm import tqdm
import re

regex_list = ['\s*Undergraduate level\s*', '\s*Minimum Grade of [ABCDF]\s*', '\s*Prerequisite Override 100\s*(or|and)', '(or|and)\s*Prerequisite Override 100\s*']
course_regex = re.compile("[a-zA-Z]{4}(?:-| )\d{4}")
def parse_prerequisites(prerequisites):
    clean = []
    for part in prerequisites:
        new_text = part
        for regex_match in regex_list:
            new_text = re.sub(regex_match, '', new_text)
        if(not course_regex.match(part)):
            new_text = re.sub('\s?or\s?', 'o', new_text)
            new_text = re.sub('\s?and\s?', 'a', new_text)
        if(new_text):
            clean.append(new_text)

    # print(clean)

    # output = {}
    (output, _, _) = recursive_parse(clean)
    # print(json.dumps(output, indent=4))
    # print()

    return output


def recursive_parse(prerequisites):
    output = {
      "type":"solo",
      "solo":[],
      "nested":[]
    }
    new_index = 0
    new_char_index = 0
    for (index,part) in enumerate(prerequisites):
        if(new_index):
            new_index-=1
            continue
        for (char_ind,char) in enumerate(part):
            if(char_ind<new_char_index):
                continue
            if(course_regex.match(part)):
                output['solo'].append(part)
                break
            else:
                if(char == " "):
                    pass
                elif(char == "("):
                    (new_output, new_index, new_char_index) = recursive_parse(prerequisites[index+1:])
                    new_char_index+=1
                    output['nested'].append(new_output)
                    pass
                elif(char == ")"):
                    print("going out", index, " ", char_ind)
                    return (output, index, char_ind)
                    pass
                elif(char=='o'):
                    output['type']="or"
                elif(char=='a'):
                    output['type']="and"
                else:
                    print(part, char)
                    print("ERROR: Should not be here")
                    exit(1)
    return (output, index, char_ind)

    # clean = {
    #     "type":"",
    #     "solo":[],
    #     "nested:"[]
    # }
    # level=0
    # for (level,part) in enumerate(prerequisites):
    #     if(level%2==0):
    #         for (index,char) in enumerate(part):
    #             if(char == "("):
    #                 level+=1
    #                 clean['nested'] = {
    #                     "type":"",
    #                     "solo":[],
    #                     "nested:"[]
    #                 }
    #             elif(char == ")"):
    #                 level-=1
    #             elif(char=='o' and part[index+1] == 'r'):
    #                 print("OR!!!")
    #                 pass
    #             elif(char=='a' and part[index+1] == 'n' and part[index+2] == 'd'):
    #                 print("and!!!")
    #                 pass
    #
    #     else:
    #         # literal
    #         pass



    # clean = {'items'=[], 'type'='solo'}
    # level = 1
    # split_data = []
    # for part in prerequisites:
    #     # if(part == "")
    #     for (index,char) in enumerate(part):
    #         if(char == "("):
    #             level+=1
    #             level_item = clean
    #             for i in range(level):
    #                 level_item['items'].append({'items'=[], 'type'='solo'})
    #                 level_item=level_item['items'][-1]
    #         elif(char == ")"):
    #             level-=1
    #         elif(char=='o' and part[index+1] == 'r'):
    #             print("OR!!!")
    #             pass
    #         elif(char=='a' and part[index+1] == 'n' and part[index+2] == 'd'):
    #             print("and!!!")
    #             pass
    # print(clean)


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
        data['prerequisites'] = parse_prerequisites(data['prerequisites'])

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
