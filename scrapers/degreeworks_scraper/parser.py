def parse_audit(data):
    return list(map(parse_block, data["blockArray"]))


def parse_block(block):
    return {
        "title": block["title"],
        "relevant_degree": block["degree"],
        "rules": list(map(parse_rule, block["ruleArray"])),
    }


def parse_rule(rule):
    rule_type = rule["ruleType"]

    if rule_type == "IfStmt":
        requirement = parse_if(rule["requirement"])
    else:
        raise RuntimeError("Unknown rule type " + rule_type)

    return {"rule_type": rule_type, "requirement": requirement}


def parse_if(if_stmt):
    # TODO
    return


def parse_condition(condition):
    return
