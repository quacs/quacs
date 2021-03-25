#!/usr/bin/env python3

"""
Scrape the list of HASS Integrative Pathways.
Basically everything is an edge case
and the data is very unstructured so this doesn't work super well.
"""

import json
import requests
import sys
from bs4 import BeautifulSoup


def parse_pathway_names(soup):
    """
    Given a BeautifulSoup of the pathways page,
    return a list of pathway names
    """
    return [
        next(next(tag.children).children).contents[0]
        for tag in soup.find_all(name="div", attrs={"class": "field-type-text"})
    ]


def parse_pathway_bodies(soup):
    """
    Given a BeautifulSoup of the pathways page,
    return a list of parsed pathway body dicts
    """
    return [
        parse_pathway_body(tag)
        for tag in soup.find_all(name="div", attrs={"class": "field-type-text-long"})
    ]


def parse_pathway_body(tag):
    """
    Given a BeautifulSoup of the body of a pathway entry,
    return a dict with information about the pathway
    """
    content = list(next(next(tag.children).children).children)
    content = [
        child
        for child in content
        if child not in ("\n", "\xa0") and child.get_text() not in ("\n", "\xa0")
    ]

    # Parse description
    body = {"description": content[0].get_text()}

    # Parse first section,
    # which should have major restrictions and a number of credits
    next_idx = 1
    while True:
        tag = content[next_idx]
        txt = tag.get_text()
        if "restricted" in txt:
            body["restrictions"] = txt
        elif "credits" in txt and "num_credits" not in body:
            body["num_credits"] = txt
        elif txt[-1] == ":":
            break
        else:
            body["description"] += txt
        next_idx += 1

    # Parse second section, which should be a list of headers
    for header, value in zip(content[next_idx::2], content[next_idx + 1 :: 2]):
        header = header.get_text().replace("\xa0", " ")
        value_list = [
            li.get_text() for li in value.children if li not in ("\n", "\xa0")
        ]
        if header == "Required:":
            body["required"] = value_list
        elif "12 credit" in header.lower() or "remaining credit" in header.lower():
            body["remaining_header"] = header
            body["remaining"] = value_list
        elif "one of" in header.lower():
            body["one_of"] = value_list
        elif "compatible minor" in header.lower():
            body["minor"] = value_list
        elif len(header.strip()) == 0:
            continue
        else:
            body["description"] += f"\n\n{header}"

    return body


def parse_pathways(soup):
    """Given a BeautifulSoup of the pathways page, return a parsed dict"""
    return {
        name: body
        for name, body in zip(parse_pathway_names(soup), parse_pathway_bodies(soup))
    }


def main():
    """Download the pathways page and print a parsed json"""
    print("Beginning HASS pathway scraping", file=sys.stderr)
    r = requests.get(
        "https://info.rpi.edu/hass-pathways/pathways-topics/",
        headers={"User-Agent": "Mozilla"},  # It 403 errors without this
    )
    print("Retrieved pathways..", file=sys.stderr)
    soup = BeautifulSoup(r.text)
    pathways = parse_pathways(soup)
    print("Pathways parsed successfully..", file=sys.stderr)
    print(json.dumps(pathways, indent=4, sort_keys=True))


if __name__ == "__main__":
    main()
