import requests
from bs4 import BeautifulSoup
import json
from tqdm import tqdm


# response = requests.get(url='https://faculty.rpi.edu/data/peoplesearch')
# soup = BeautifulSoup(response.text.encode('utf8'), "html")

faculty = requests.get('https://faculty.rpi.edu/data/peoplesearch').json()

data = {}
for professor in tqdm(faculty['nodes']):
    response = requests.get(url=f"https://faculty.rpi.edu{professor['node']['Path']}")
    soup = BeautifulSoup(response.text.encode('utf8'), "lxml")
    data[professor['node']['title'].strip()] = {}
    professor_data = data[professor['node']['title'].strip()]
    professor_data['url'] = professor['node']['Path']
    for item in soup.findAll("div", {"class": "views-field"}):
        class_parts = item['class'][1].split('-')
        if class_parts[len(class_parts)-1] == 'portrait':
            professor_data[class_parts[len(class_parts)-1]] = item.find("img")['src'].split('?')[0]
        elif item.find("div", {"class": "field-content"}):
            professor_data[class_parts[len(class_parts)-1]] = " ".join(item.find("div", {"class": "field-content"}).get_text(" ").split())


with open(f"faculty.json", "w") as outfile:
    json.dump(data , outfile, sort_keys=False, indent=2)
