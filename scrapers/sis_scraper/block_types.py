# This scraper extracts block types (TES, LEC, REC, etc.) 

import asyncio
import json
import os
import ssl
from aiohttp import ClientSession, TCPConnector
from bs4 import BeautifulSoup
import re
from util import get_semesters_to_scrape

# Convert a number to a time string in H:MM format. 
async def convertToTime(number):
    if number > 1200:
        number -= 1200
    hours = number // 100
    minutes = number % 100
    return f"{hours}:{minutes:02}" 


async def get_block_types(term):
    url = f"https://sis.rpi.edu/reg/zs{term}.htm"

    courses_file = f"data/{term}/courses.json"
    if not os.path.exists(courses_file):
        print(f"Courses file not found: {courses_file}")
        return

    with open(courses_file, 'r') as f:
        courses_data = json.load(f)

    # Extract all the CRNs + their timeslots
    crn_timeslots = {}
    for dept in courses_data:
        for course in dept['courses']:
            for section in course['sections']:
                crn = str(section['crn'])
                crn_timeslots[crn] = section['timeslots']

    # apparently SSL verification needs to be disabled, aiohttp is weird.
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    async with ClientSession(connector=TCPConnector(ssl=ssl_context)) as session:
        async with session.get(url) as response:
            
            if response.status != 200:
                print(f"failed to fetch: {url} with status code: {response.status}")
                return
            

            txt = await response.text()
            soup = BeautifulSoup(txt, 'html.parser')

            # find all the <tr> tags. Each <tr> represents a timeslot. 
            rows = soup.find_all('tr')
            if not rows:
                print("No rows found")
                return

            # search for the matching timeslots
            for row in rows:
                cells = row.find_all('td')
                
                if len(cells) < 3:
                    continue 
                
                crn = None 

                for cell in cells:
                    text = cell.get_text()
                    match = re.search(r'\b(\d{5})\b', text)
                    if match:
                        crn = match.group(1)
                        break

                    cell_html = str(cell)
                    match = re.search(r'\b(\d{5})\b', cell_html)
                    if match:
                        crn = match.group(1)
                        break

                if not crn or crn not in crn_timeslots:
                    continue

                # extract data from the blocks
                class_type = cells[2].text.strip() if len(cells) >= 3 else ''
                days = cells[6].text.replace(' ', '').strip() if len(cells) >= 7 else ''
                start_time = cells[7].text.strip() if len(cells) >= 8 else ''

                if not class_type:
                    class_type = "Unknown"

                # try to match this HTML row to EACH timeslot for every single CRN 
                for timeslot in crn_timeslots[crn]:
                    timeslot_start = await convertToTime(timeslot['timeStart'])
                    if timeslot['days']:
                        timeslot_days = ''.join(timeslot['days'])
                    else:
                        timeslot_days = ''

                    if timeslot_days == days and timeslot_start == start_time:
                        timeslot['type'] = class_type

    # save it all
    with open(courses_file, 'w') as f:
        json.dump(courses_data, f, sort_keys=True, indent=2)


async def main():
    # second semester but should be current one 
    term = get_semesters_to_scrape()[1]
    await get_block_types(term)


if __name__ == "__main__":
    asyncio.run(main())