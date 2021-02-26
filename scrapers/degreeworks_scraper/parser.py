# This file has a bunch of asserts and in general very little error
# checking.  If a key isn't found, that's a good thing since it means
# the data isn't meeting our expected format.


def parse_audit(data):
    return list(map(parse_block, data["blockArray"]))


def parse_block(block):
    return {
        "title": block["title"],
        "rules": parse_rule_array(block["ruleArray"]),
    }


def parse_rule_array(rule_array):
    return list(
        filter(
            lambda rule: rule is not None,
            map(parse_rule, rule_array),
        )
    )


def parse_rule(rule):
    rule_type = rule["ruleType"]

    if rule_type == "IfStmt":
        requirement = parse_if(rule["requirement"])
    elif rule_type == "Course":
        requirement = parse_course_req(rule["requirement"])
    elif rule_type == "Group":
        requirement = parse_group(rule["requirement"], rule["ruleArray"])
    elif rule_type == "Subset":
        requirement = parse_subset(rule["requirement"], rule["ruleArray"])
    elif rule_type in ["Block", "Blocktype", "Complete", "Incomplete"]:
        return None
    else:
        raise RuntimeError("Unknown rule type " + rule_type)

    return {"rule_type": rule_type, "requirement": requirement}


def parse_if(if_stmt):
    if_stmt_dict = {
        "condition": parse_condition(if_stmt["LeftCondition"]),
        "if_part": parse_rule_array(if_stmt["ifPart"]["ruleArray"]),
    }

    if "elsePart" in if_stmt_dict:
        if_stmt_dict["else_part"] = parse_rule_array(if_stmt["elsePart"]["ruleArray"])

    return if_stmt_dict


def parse_condition(condition):
    if condition is None:
        return None

    if "connector" in condition:
        connector = condition["connector"]
        assert connector in ["OR", "AND"]

        # LeftCondition should always exist, so don't call .get()
        # (we want to throw an exception if it isn't found)
        left_condition = parse_condition(condition["LeftCondition"])
        right_condition = parse_condition(condition.get("RightCondition"))

        return {"left_condition": left_condition, "right_condition": right_condition}
    else:
        return parse_inner_condition(condition)


def parse_inner_condition(inner_condition):
    if inner_condition is None:
        return None

    operator = inner_condition["relationalOperator"]["operator"]
    assert operator in ["=", ">=", "WASNOT", "WAS", "IS"]

    left = inner_condition["relationalOperator"]["left"]
    assert left in [
        "BANNERGPA",
        "-COURSE-",
        "1STMAJOR",
        "MAJOR",
        "DEGREE",
        "NUMCONCS",
        "CONC",
        "NUMMAJORS",
    ]

    right = inner_condition["relationalOperator"]["right"]
    # no assertions here since this (unfortunately) is arbitrary

    course_array = None

    if left == "BANNERGPA" and right != "NULL":
        # right should be a floating point gpa value
        right = float(right)
    elif left == "-COURSE-":
        course_array = parse_course_array(
            inner_condition["relationalOperator"]["courseArray"]
        )

    condDict = {"operator": operator, "left": left, "right": right}

    if course_array:
        condDict["course_array"] = course_array

    return condDict


def parse_course_req(course):
    return {
        "class_credit_operator": course[
            "classCreditOperator"
        ],  # TODO: do we need this?
        "course_array": parse_course_array(course["courseArray"]),
    }


def parse_course_array(course_array):
    return list(
        filter(
            lambda course: course is not None,
            map(parse_course, course_array),
        )
    )


def parse_course(course):
    discipline = dw_to_regex(course["discipline"])
    number = dw_to_regex(course["number"])

    course_dict = {"discipline": discipline, number: "number"}

    if "withArray" in course:
        course_dict["withs"] = parse_with_array(course["withArray"])

    if "qualifierArray" in course:
        course_dict["qualifiers"] = parse_with_array(course["qualifierArray"])

    return course_dict


def parse_with_array(with_array):
    return list(
        filter(
            lambda with_elem: with_elem is not None,
            map(parse_with, with_array),
        )
    )


def parse_with(with_elem):
    code = with_elem["code"]
    assert code in ["ATTRIBUTE", "DWLETTERGRADE", "DWTERM", "DWRESIDENT", "DWCREDITS"]

    operator = with_elem["operator"]
    assert operator in ["="]

    values = list(map(dw_to_regex, with_elem["valueList"]))

    return {"code": code, "operator": operator, "values": values}


def parse_qualifier_array(qualifier_array):
    return list(
        filter(
            lambda qualifier: qualifier is not None,
            map(parse_qualifier, qualifier_array),
        )
    )


def parse_qualifier(qualifier):
    return None  # TODO: check what this means with the CSCI degree


def parse_subset(requirement, rules_array):
    subset_dict = {
        "rules": parse_rule_array(rules_array),
    }

    if "qualifiers" in requirement:
        subset_dict["qualifiers"] = (
            parse_qualifier_array(requirement["qualifierArray"]),
        )

    return subset_dict


def parse_group(requirement, rules_array):
    return {
        "num_needed": int(requirement["numberOfGroups"]),
        "rules": parse_rule_array(rules_array),
    }


def dw_to_regex(dw_str):
    """
    For some reason, Degreeworks uses @ instead of regex.  Maybe that's a good idea at other
    schools, but not at RPI.  We can just use normal, run of the mill regex.
    """
    if dw_str == "@":
        return ".+"

    # TODO: check if this is all that we need
    return dw_str.replace("@", ".")
