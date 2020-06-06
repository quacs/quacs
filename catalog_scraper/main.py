import os
import requests
from bs4 import BeautifulSoup
import json
import re
import sys


def scrapePage(url, data):
    response = requests.get(url=url)
    soup = BeautifulSoup(response.text.encode('utf8'), "lxml")

    rows = soup.find("div", {"id": "advanced_filter_section"}).nextSibling.nextSibling.findAll('tr')
    final_row = None
    for row in rows:
        final_row = row
        if len(row.findAll('td')) <= 1:
            continue
        data_url_end = row.findAll('td')[1].findChildren("a", recursive=False)[0]['href'].split('?')[1]
        data_url = f'http://catalog.rpi.edu/preview_course.php?{data_url_end}&print'
        # print(data_url)

        course_results = requests.get(data_url)
        data_soup = BeautifulSoup(course_results.text.encode('utf8'), "lxml")
        course = data_soup.find('h1').contents[0].split('-')
        course_code = course[0].split()
        key = course_code[0].strip()+"-"+course_code[1].strip()
        data[key] = {}
        data[key]['subj'] = course_code[0].strip()
        data[key]['crse'] = course_code[1].strip()
        data[key]['name'] = course[1].strip()
        data[key]['url'] = data_url
        data[key]['coid'] = data_url_end.split('=')[-1]

        description = data_soup.find('hr')
        if description:
            description = description.parent.encode_contents().decode().strip()
            description = re.split('<\/?hr ?\/?>', description)[1]
            description = re.split('<\/?br ?\/?>\s*<strong>', description)[0]
            description = re.sub("<.*?>", "", description)
            data[key]['description'] = description.strip()

        # when_offered = data_soup.find('strong', text='When Offered:')
        # if when_offered:
        #     data[key]['when_offered'] = when_offered.nextSibling.strip()
        #
        # cross_listed = data_soup.find('strong', text='Cross Listed:')
        # if cross_listed:
        #     data[key]['cross_listed'] = cross_listed.nextSibling.strip()
        #
        # pre_req = data_soup.find('strong', text='Prerequisites/Corequisites:')
        # if pre_req:
        #     data[key]['pre_req'] = pre_req.nextSibling.strip()
        #
        # credit_hours = data_soup.find('em', text='Credit Hours:')
        # if credit_hours:
        #     credit_hours = credit_hours.nextSibling.nextSibling.text.strip()
        #     if(credit_hours == 'Variable'):
        #         data[key]['credit_hours_max'] = 0
        #         data[key]['credit_hours_min'] = 999
        #     else:
        #         data[key]['credit_hours'] = credit_hours

    next_page = final_row.findChildren('strong')[0].findNext('a', recursive=False)
    if next_page['href'] != '#' and next_page['href'] != 'javascript:void(0);':
        return next_page['href']
    return None


base_url = 'http://catalog.rpi.edu'
next_url = '/content.php?catoid=20&navoid=498'
data = {}
while True:
    if next_url == None:
        break
    next_url = scrapePage(base_url+next_url, data)

print(json.dumps(data, indent=4, sort_keys=True))
