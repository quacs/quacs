import os
import requests
from bs4 import BeautifulSoup
import json
import re

import pprint

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
        print(data_url)

        course_results = requests.get(data_url)
        data_soup = BeautifulSoup(course_results.text.encode('utf8'), "lxml")
        course = data_soup.find('h1').contents[0].split('-')[0].split()
        # course_name = course[0]
        # course_code = course[1]
        key = course[0].strip()+"-"+course[1].strip()
        data[key] = {}
        data[key]['subj'] = course[0].strip()
        data[key]['crse'] = course[1].strip()
        # data[key]['description'] = current_element.nextSibling.nextSibling.strip()

        description = data_soup.find('hr')
        if description:
            data[key]['description'] = description.nextSibling.strip()
            print(data[key]['description'])
        else:
            print("error")

        when_offered = data_soup.find('strong', text='When Offered:')
        if when_offered:
            data[key]['when_offered'] = when_offered.nextSibling.strip()

        cross_listed = data_soup.find('strong', text='Cross Listed:')
        if cross_listed:
            data[key]['cross_listed'] = cross_listed.nextSibling.strip()

        pre_req = data_soup.find('strong', text='Prerequisites/Corequisites:')
        if pre_req:
            data[key]['pre_req'] = pre_req.nextSibling.strip()

        credit_hours = data_soup.find('em', text='Credit Hours:')
        if credit_hours:
            print(credit_hours.nextSibling.nextSibling.text)
            credit_hours = credit_hours.nextSibling.nextSibling.text.split("to")
            if len(credit_hours) > 1:
                data[key]['credit_hours_max'] = int(credit_hours[1])
            data[key]['credit_hours_min'] = int(credit_hours[0])

        # pprint.pprint(data)

    next_page = final_row.findChildren('strong')[0].findNext('a', recursive=False)
    if next_page['href'] != '#':
        return next_page['href']
    return None


base_url = 'http://catalog.rpi.edu'
next_url = '/content.php?catoid=20&navoid=498'
data = {}
while True:
    if next_url == None:
        break
    # print(base_url+next_url)
    next_url = scrapePage(base_url+next_url, data)
