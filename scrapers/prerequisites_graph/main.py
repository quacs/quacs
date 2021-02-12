"""
This script builds a graph of prerequisites in the form of an adjacency list.
It assumes that courses.json and prerequisites.json already exist for all semesters,
and it stores its output in prereq_graph.json.
"""

import json
import os
import functools
import operator


def sem_add_courses(sem_dir: str, adj_list):
    """
    Using the semester in the `sem_dir` directory,
    update the graph in `adj_list`.
    """

    # Load the JSONs
    with open(f"{sem_dir}/courses.json", "r") as f:
        sem_courses = json.load(f)
    with open(f"{sem_dir}/prerequisites.json", "r") as f:
        sem_prereqs = json.load(f)

    # Populate `courses`
    for dept in sem_courses:
        for course in dept["courses"]:

            course_id = course["id"].replace("-", " ")
            prereqs = get_prereq_course_ids(
                sem_prereqs[str(course["sections"][0]["crn"])]
            )

            # Only add courses that have prereqs, to make the json smaller
            if len(prereqs) == 0:
                # This course has no prereqs,
                # but may have had prereqs in the past,
                # so try to delete the course.
                # Semester iteration order is from older to newer,
                # so this should work okay.
                adj_list.pop(course_id, None)
            else:
                # Since this is a dict and iteration order is from older to newer,
                # this should have the most updated data.
                # NOTE: Some sections have different prereqs.
                # This is more uncommon than common,
                # so hopefully this will never be an issue.
                adj_list[course_id] = {
                    "title": course["title"],
                    "prereqs": prereqs,
                }


def get_prereq_course_ids(prereqs):
    """
    Given the `prereqs` of a course in the format of the courses.json file,
    return a list of all prerequisite courses mentioned.
    Boolean operators like "and" and "or" are ignored for now.
    """

    prereqs = prereqs.get("prerequisites", prereqs)
    try:
        typ = prereqs["type"]
    except KeyError:
        return []
    if typ == "course":
        return [prereqs["course"]]
    if typ in ["and", "or"]:
        return list(
            set(
                functools.reduce(
                    operator.add, map(get_prereq_course_ids, prereqs["nested"]), []
                )
            )
        )


def generate(semester_data_path: str):
    """
    Generate the prerequisite graph adjacency list.
    The parameter `semester_data_path` is the path to the semester-specific data.
    """

    # Map from course ID to title and prereqs.
    # This is an adjacency list.
    adj_list = dict()

    # List of semester paths
    sem_dirs = list(
        map(
            lambda sem_dir: f"{semester_data_path}/{sem_dir}",
            # Need to sort so new semester data replaces old data
            sorted(os.listdir(semester_data_path)),
        )
    )

    for sem_dir in sem_dirs:
        sem_add_courses(sem_dir, adj_list)

    return adj_list


if __name__ == "__main__":
    graph = generate("data/")

    with open("prereq_graph.json", "w") as f:
        json.dump(graph, f, indent=2)
