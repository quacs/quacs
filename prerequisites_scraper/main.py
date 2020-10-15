import json
import re
from typing import List, Tuple

import bs4
import requests

# The token format is (token_name, token_text)
Token = Tuple[str, str]
Tokens = List[Token]

def tokenize(prerequisites: str) -> Tokens:
    """
    Convert a prereq expression string to a list of tokens. The last token will
    be `("END", None)`.
    """

    # Remove Prerequisite Override 100
    prerequisites = re.sub(r'Prerequisite Override 100 +or', '', prerequisites)
    prerequisites = re.sub(r'or +Prerequisite Override 100', '', prerequisites)

    # List of tokens and their regexps. Anything not matched is ignored.
    TOKENS = [
        # (name, regex)
        ('OPEN_PAREN', r'\('),
        ('CLOSE_PAREN', r'\)'),
        ('OR', r'or'),
        ('AND', r'and'),
        ('COURSE', r'[a-zA-Z]{4}(?:-| )\d{4}'),
    ]

    # Get regex that matches a token
    token_regex = '|'.join([
        f'(?P<{token_name}>{regex})' for token_name, regex in TOKENS
    ])
    token_regex = re.compile(token_regex)

    # Convert regex matches to list of tokens
    tokens = token_regex.finditer(prerequisites)
    tokens = map(
        lambda match: next(filter(
            lambda group_text: group_text[1] is not None,
            match.groupdict().items()
        )),
        tokens
    )
    tokens = list(tokens)
    tokens.append(("END", None))

    return tokens

def parse_atom(tokens: Tokens, cur_tok: int):
    """Parse a course or a parenthesized sub-expression"""
    if tokens[cur_tok][0] == "OPEN_PAREN":
        result, cur_tok = parse_tokens(tokens, cur_tok + 1)
        assert tokens[cur_tok][0] == "CLOSE_PAREN"
    else:
        result = {
            "type": "course",
            "course": tokens[cur_tok][1],
        }
    return (result, cur_tok + 1)

def parse_or(tokens: Tokens, cur_tok: int):
    """Parse a prereq expression with only OR"""
    (left, cur_tok) = parse_atom(tokens, cur_tok)
    left_list = [left]
    while tokens[cur_tok][0] == "OR":
        (right, cur_tok) = parse_atom(tokens, cur_tok + 1)
        left_list.append(right)
    if len(left_list) == 1:
        result = left
    else:
        result = {
            "type": "or",
            "nested": left_list,
        }
    return (result, cur_tok)

def parse_tokens(tokens: Tokens, cur_tok: int = 0):
    """Parse a tokenized prereq expression"""
    (left, cur_tok) = parse_or(tokens, cur_tok)
    left_list = [left]
    while tokens[cur_tok][0] == "AND":
        (right, cur_tok) = parse_or(tokens, cur_tok + 1)
        left_list.append(right)
    if len(left_list) == 1:
        result = left
    else:
        result = {
            "type": "and",
            "nested": left_list,
        }
    return (result, cur_tok)

def parse(prereqs: str):
    """Parse a prereq expression"""
    tokens = tokenize(prereqs)
    result, cur_tok = parse_tokens(tokens)
    assert tokens[cur_tok][0] == "END"
    return result

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
                continue

            if(section):
                if(el.string.strip()):
                    data[section].append(el.string.strip())


        el = el.next_sibling

    if('prerequisites' in data):
        data['prerequisites'] = parse(' '.join(data['prerequisites']))

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
            elif(part.endswith('or Concentration):')):
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


if __name__ == '__main__':
    from tqdm import tqdm

    prerequisites = {}

    # For testing
    # get_prereq_string(202009, 28329)
    # exit()

    crns = []
    with open('courses.json') as json_file:
        courses = json.load(json_file)
        for department in courses:
            for course in department['courses']:
                for section in course['sections']:
                    crns.append(section['crn'])

    for crn in tqdm(crns):
        print(crn)
        prerequisites[crn] = get_prereq_string(202009, crn)

    with open('prerequisites.json', 'w') as outfile:
        json.dump(prerequisites, outfile, indent=4)
