#[macro_use]
extern crate anyhow;

use anyhow::Result;
use itertools::Itertools;
use roxmltree::{Node, NodeType};
use std::str::FromStr;
use std::string::ToString;

mod types;
use types::*;

fn parse_if_condition(condition: Node) -> Result<IfCondition> {
    let inner: Vec<Node> = condition
        .children()
        .filter(|node| node.node_type() == NodeType::Element)
        .collect();

    if inner.len() == 1 {
        // Parsing 'Rop' node (Major or Degree restriction)
        let rop = {
            let mut node = inner[0];

            while node.tag_name().name() == "LeftCondition" {
                let inner: Vec<Node> = node
                    .children()
                    .filter(|node| node.node_type() == NodeType::Element)
                    .collect();
                ensure!(
                    inner.len() == 1,
                    "Nested LeftCondition has multiple children"
                );
                node = inner[0];
            }

            ensure!(
                node.tag_name().name() == "Rop",
                "Expected a 'Rop' node, found {}",
                node.tag_name().name()
            );

            if Some("-COURSE-") == node.attribute("Left") {
                // This should have a single course child (we'll validate that it's a course
                // further down)
                ensure!(
                    node.children()
                        .filter(|node| node.node_type() == NodeType::Element)
                        .count()
                        == 1,
                    "'Rop' node with '-COURSE-' value has more than one child {:#?}",
                    node,
                );
            } else {
                // No one else should have children
                ensure!(!node.has_children(), "'Rop' node has children {:#?}", node);
            }

            node
        };

        let operator = match rop.attribute("Operator") {
            Some(s) => BooleanOperator::from_str(s).map_err(|e| {
                anyhow!("Error parsing boolean operator {} for {:#?}: {}", s, rop, e)
            })?,
            None => bail!("Course restriction 'With' has no operator"),
        };

        let right = rop
            .attribute("Right")
            .ok_or(anyhow!("Rop didn't have 'Right' field"))?
            .to_string();

        match rop.attribute("Left") {
            Some("MAJOR") => Ok(IfCondition::Major {
                operator,
                major: right,
            }),
            Some("1STMAJOR") => Ok(IfCondition::FirstMajor {
                operator,
                major: right,
            }),
            Some("DEGREE") => Ok(IfCondition::Degree {
                operator,
                degree: right,
            }),
            Some("CONC") => Ok(IfCondition::Concentration {
                operator,
                concentration: right,
            }),
            Some("-COURSE-") => {
                let children: Vec<Node> = rop
                    .children()
                    .filter(|node| node.node_type() == NodeType::Element)
                    .collect();
                ensure!(
                    children.len() == 1,
                    "'-COURSE-' Rop node doesn't have a single child {:#?}: {:#?}",
                    children,
                    rop
                );
                let child = children[0];
                ensure!(
                    child.tag_name().name() == "Course",
                    "'-COURSE-' Rop node's child isn't a 'Course' node.  Parent: {:#?} Child {:#?}",
                    rop,
                    child
                );

                let course = parse_course(child)?;
                let status = CourseStatus::from_str(&right).map_err(|e| {
                    anyhow!(
                        "Error parsing CourseStatus for {:#?}'s child {:#?}: {}",
                        rop,
                        child,
                        e
                    )
                })?;

                Ok(IfCondition::Course { course, status })
            }
            Some(s) => Err(anyhow!(
                "Invalid value for If condition's Left field but found {}",
                s
            )),
            None => Err(anyhow!(
                "Expected value for If condition's Left field but found nothing"
            )),
        }
    } else if inner.len() == 2 {
        let connector = match condition.attribute("Connector") {
            Some(s) => ConditionOperator::from_str(s)?,
            None => bail!("Condition with two children has no operator"),
        };

        let left = inner[0];
        ensure!(
            left.tag_name().name() == "LeftCondition",
            "Expected 'LeftCondition' as first child of multi-part condition but found '{}'",
            left.tag_name().name()
        );
        let left_cond = parse_if_condition(left)?;

        let right = inner[1];
        ensure!(
            right.tag_name().name() == "RightCondition",
            "Expected 'RightCondition' as first child of multi-part condition but found '{}'",
            right.tag_name().name()
        );
        let right_cond = parse_if_condition(right)?;

        Ok(IfCondition::Nested {
            connector,
            left_condition: Box::new(left_cond),
            right_condition: Box::new(right_cond),
        })
    } else {
        Err(anyhow!(
            "Expected either 1 or 2 nodes under If condition but found {}",
            inner.len()
        ))
    }
}

fn parse_if_rule(rule: Node) -> Result<RuleData> {
    let requirements: Vec<Node> = rule
        .children()
        .filter(|node| node.node_type() == NodeType::Element)
        .filter(|node| node.tag_name().name() == "Requirement")
        .collect();

    ensure!(
        requirements.len() != 0,
        "If rule {} has no inner requirement",
        rule.attribute("Label").unwrap()
    );

    ensure!(
        requirements.len() == 1,
        "If rule {} has multiple inner requirements",
        rule.attribute("Label").unwrap()
    );

    let mut children = requirements[0]
        .children()
        .filter(|node| node.node_type() == NodeType::Element);

    let left_cond_node = children.next().ok_or(anyhow!(
        "If requirement ran out of nodes before LeftCondition. If: {:#?}",
        requirements[0].parent()
    ))?;
    ensure!(
        left_cond_node.tag_name().name() == "LeftCondition",
        "First node in If requirement wasn't LeftCondition {:#?}",
        requirements[0].parent()
    );
    let condition = parse_if_condition(left_cond_node)?;

    let if_cond_node = children.next().ok_or(anyhow!(
        "If requirement ran out of nodes before IfPart: {:#?}",
        requirements[0].parent()
    ))?;
    ensure!(
        if_cond_node.tag_name().name() == "IfPart",
        "Second node in If requirement wasn't IfPart {:#?}",
        requirements[0].parent()
    );
    let if_rules: Vec<Node> = if_cond_node
        .children()
        .filter(|node| node.node_type() == NodeType::Element)
        .collect();
    ensure!(
        if_rules.iter().all(|node| node.tag_name().name() == "Rule"),
        "Not all nodes under IfPart are 'Rule'"
    );
    let if_branch = if_rules
        .into_iter()
        .map(|rule| parse_rule(rule))
        .try_collect()?;

    let else_branch = if let Some(else_cond_node) = children.next() {
        ensure!(
            else_cond_node.tag_name().name() == "ElsePart",
            "Third node in If requirement wasn't ElsePart {:#?}",
            requirements[0].parent()
        );
        let else_rules: Vec<Node> = else_cond_node
            .children()
            .filter(|node| node.node_type() == NodeType::Element)
            .collect();

        else_rules
            .into_iter()
            .map(|rule| parse_rule(rule))
            .try_collect()?
    } else {
        Vec::new()
    };

    Ok(RuleData::If {
        condition,
        if_branch,
        else_branch,
    })
}

fn parse_course_restriction(course: Node) -> Result<Vec<CourseRestriction>> {
    let withs: Vec<Node> = course
        .children()
        .filter(|node| node.node_type() == NodeType::Element)
        .collect();

    ensure!(
        withs.iter().all(|node| node.tag_name().name() == "With"),
        "Not all nodes under course {:#?} are 'With': {:#?}",
        course,
        withs,
    );

    withs
        .iter()
        .map(|with| {
            let operator = match with.attribute("Operator") {
                Some(s) => BooleanOperator::from_str(s).map_err(|e| {
                    anyhow!(
                        "Error parsing boolean operator {} for {:#?}: {}",
                        s,
                        with,
                        e
                    )
                })?,
                None => bail!("Course restriction 'With' has no operator"),
            };

            let values: Vec<Node> = with
                .children()
                .filter(|node| node.node_type() == NodeType::Element)
                .collect();

            ensure!(
                values.iter().all(|node| node.tag_name().name() == "Value"),
                "Non-'Value' node underneath 'With' (Array: {:?} is under {:?}",
                values,
                with
            );

            ensure!(
                values.len() != 0,
                "'With' restriction has no values: {:#?}",
                with
            );
            if Some("DWDISCIPLINE") != with.attribute("Code") {
                // DWDISCIPLINE allows for multiple values, so only check other stuff
                ensure!(
                    values.len() == 1,
                    "'With' restriction has multiple values: {:#?}",
                    with
                );
            }

            let connector = match with.attribute("Connector") {
                Some(s) => ConditionOperator::from_str(s)
                    .map_err(|e| anyhow!("Error parsing connector for {:#?}: {}", with, e))?,
                None => bail!("'With' restriction has no connector {:#?}", with),
            };

            let attribute = match with.attribute("Code") {
                Some("ATTRIBUTE") => match values[0].text() {
                    Some("COMM") => CourseAttribute::CommunicationIntensive,
                    Some("PDII") => CourseAttribute::PD2,
                    Some(s) => bail!("Unknown course attribute value {} for {:?}", s, with),
                    None => bail!("No course attribute value for {:?}", with),
                },
                Some("DWTERM") => {
                    let sem_data: Vec<&str> = values[0]
                        .text()
                        .ok_or(anyhow!("No value for DWTERM with {:?}", with))?
                        .split(" ")
                        .collect();
                    if sem_data.len() == 2 {
                        // Data is of the form 'Semester Year' (e.g. 'Fall 2019')
                        let sem = Semester::from_str(sem_data[0])?;
                        let year = sem_data[1]
                            .parse::<usize>()
                            .map_err(|e| anyhow!("Error parsing year for {:#?}: {}", with, e))?;

                        CourseAttribute::RequiredSemester { sem, year }
                    } else if sem_data.len() == 1 {
                        // Data is in a compressed form (e.g. '201909' for Fall 2019)
                        let sem_data = sem_data[0];
                        ensure!(
                            sem_data.len() == 6,
                            "Compressed semester info {} is an invalid length",
                            sem_data
                        );

                        let year = sem_data[0..4].parse::<usize>().map_err(|e| {
                            anyhow!(
                                "Error parsing year in compressed form for {:#?}: {}",
                                with,
                                e
                            )
                        })?;
                        let sem = Semester::from_compressed(&sem_data[4..6]).map_err(|e| {
                            anyhow!("Error parsing compressed semester for {:#?}: {}", with, e)
                        })?;

                        CourseAttribute::RequiredSemester { sem, year }
                    } else {
                        bail!("Semester data {:?} has a length not 1 or 2", sem_data);
                    }
                }
                Some("DWRESIDENT") => CourseAttribute::Resident(match values[0].text() {
                    Some("Y") => true,
                    Some("N") => false,
                    Some(s) => bail!("Unexpected value {} for DWRESIDENT in {:?}", s, with),
                    None => bail!("No value given for DWRESIDENT in {:?}", with),
                }),
                Some("DWCREDITS") => CourseAttribute::Credits(match values[0].text() {
                    Some(credits) => credits
                        .parse::<usize>()
                        .map_err(|e| anyhow!("Error parsing credits for {:?}: {}", with, e))?,
                    None => bail!("No value given for DWCREDITS in {:?}", with),
                }),
                Some("DWGRADELETTER")
                | Some("DWGRADE")
                | Some("DWGRADENUMBER")
                | Some("DWGRADENUM") => CourseAttribute::Grade(
                    values[0]
                        .text()
                        .ok_or(anyhow!("No value given for DWGRADELETTER in {:?}", with))?
                        .to_string(),
                ),
                Some("DWDISCIPLINE") => CourseAttribute::Disciplines(
                    values
                        .iter()
                        .map(|val| {
                            val.text()
                                .ok_or(anyhow!(
                                    "Value doesn't have text in DWDISCIPLINE field for {:#?}",
                                    with
                                ))
                                .and_then(|s| Ok(s.to_string()))
                        })
                        .try_collect()?,
                ),
                Some(s) => bail!("Unknown course restriction {} for {:?}", s, with),
                None => bail!("No course restriction for {:?}", with),
            };

            Ok(CourseRestriction::Attribute {
                operator,
                attribute,
                connector,
            })
        })
        .try_collect()
}

fn parse_course(course: Node) -> Result<Course> {
    let dept = course
        .attribute("Disc")
        .ok_or(anyhow!("Course {:#?} doesn't have 'Disc'", course))?
        .to_string();
    let crse = course
        .attribute("Num")
        .ok_or(anyhow!("Course {:#?} doesn't have 'Num'", course))?
        .to_string();
    let restriction = parse_course_restriction(course)?;

    Ok(Course {
        dept,
        crse,
        restriction,
    })
}

fn parse_course_rule(rule: Node) -> Result<RuleData> {
    let requirements: Vec<Node> = rule
        .children()
        .filter(|node| node.node_type() == NodeType::Element)
        .filter(|node| node.tag_name().name() == "Requirement")
        .collect();

    ensure!(
        requirements.len() != 0,
        "Course rule {} has no inner requirement",
        rule.attribute("Label").unwrap()
    );

    ensure!(
        requirements.len() == 1,
        "Course rule {} has multiple inner requirements",
        rule.attribute("Label").unwrap()
    );

    let req = requirements[0];
    let num_courses_needed = req
        .attribute("Classes_begin")
        .and_then(|val| Some(val.parse::<usize>().expect("Failed to parse Classes_begin")));
    let num_credits_needed = req
        .attribute("Credits_begin")
        .and_then(|val| Some(val.parse::<usize>().expect("Failed to parse Credits_begin")));

    let courses = req
        .children()
        .filter(|node| node.node_type() == NodeType::Element)
        .filter(|node| node.tag_name().name() == "Course")
        .map(|course| parse_course(course))
        .try_collect()?;

    let except = if let Some(except) = req
        .children()
        .filter(|node| node.node_type() == NodeType::Element)
        .find(|node| node.tag_name().name() == "Except")
    {
        except
            .children()
            .filter(|node| node.node_type() == NodeType::Element)
            .filter(|node| node.tag_name().name() == "Course")
            .map(|course| parse_course(course))
            .try_collect()?
    } else {
        Vec::new()
    };

    Ok(RuleData::Course {
        num_courses_needed,
        num_credits_needed,
        courses,
        except,
    })
}

fn parse_group(group: Node) -> Result<RuleData> {
    let rules: Vec<Rule> = group
        .children()
        .filter(|node| node.node_type() == NodeType::Element)
        .filter(|node| node.tag_name().name() == "Rule")
        .map(|rule| parse_rule(rule))
        .try_collect()?;

    let requirements: Vec<Node> = group
        .children()
        .filter(|node| node.node_type() == NodeType::Element)
        .filter(|node| node.tag_name().name() == "Requirement")
        .collect();

    ensure!(
        requirements.len() != 0,
        "Group rule {} has no inner requirement",
        group.attribute("Label").unwrap()
    );

    ensure!(
        requirements.len() == 1,
        "Group rule {} has multiple inner requirements",
        group.attribute("Label").unwrap()
    );

    let req = requirements[0];

    let num_needed = match group.attribute("RuleType").unwrap() {
        "Subset" => {
            ensure!(
                req.attributes().len() == 0,
                "Subset requirement has multiple attribute"
            );

            rules.len()
        }
        "Group" => req
            .attribute("NumGroups")
            .ok_or(anyhow!("Group doesn't have 'NumGroups' attribute"))?
            .parse::<usize>()
            .map_err(|e| anyhow!("Error parsing NumGroups for {:?}: {}", req, e))?,
        s => panic!("parse_group() called with RuleType '{}'", s),
    };

    Ok(RuleData::Group { rules, num_needed })
}

fn parse_rule(rule: Node) -> Result<Rule> {
    let label = rule
        .attribute("Label")
        .ok_or(anyhow!("Rule doesn't have a label!"))?
        .to_string();

    let rule_data = match rule
        .attribute("RuleType")
        .ok_or(anyhow!("Rule {} doesn't have RuleType!", label))?
    {
        "IfStmt" => parse_if_rule(rule)?,
        "Course" => parse_course_rule(rule)?,
        "Subset" | "Group" => parse_group(rule)?,
        other => bail!("Unrecognized rule type for {}: {}", label, other),
    };

    let extra_text = rule
        .children()
        .filter(|node| node.node_type() == NodeType::Element)
        .find(|node| node.tag_name().name() == "Remark")
        .and_then(|remark| {
            Some(
                remark
                    .children()
                    .filter(|node| node.node_type() == NodeType::Element)
                    .filter(|node| node.tag_name().name() == "Text")
                    .map(|text| text.text().unwrap())
                    .format(" ")
                    .to_string(),
            )
        });

    Ok(Rule {
        label,
        rule_data,
        extra_text,
    })
}

fn parse_block(block: Node) -> Result<Block> {
    let title = block
        .attribute("Title")
        .ok_or(anyhow!("Block attribute 'Title' not found!"))?
        .to_string();

    let rules = block
        .children()
        .filter(|node| node.node_type() == NodeType::Element)
        .filter(|node| node.tag_name().name() == "Rule")
        .map(|rule| parse_rule(rule))
        .try_collect()?;

    Ok(Block { title, rules })
}

fn main() -> Result<()> {
    for major in std::env::args().skip(1) {
        let xml_contents = std::fs::read_to_string(format!("{}.xml", major))?;
        let doc = roxmltree::Document::parse(&xml_contents)?;
        let audit = match doc
            .descendants()
            .find(|node| node.tag_name().name() == "Audit")
        {
            Some(node) => node,
            None => continue,
        };

        let blocks: Result<Vec<Block>> = audit
            .children()
            .filter(|node| node.node_type() == NodeType::Element)
            .filter(|node| node.tag_name().name() == "Block")
            .filter(|block| block.attribute("Req_type").unwrap() != "DEGREE") // this deals with GPA and general degree requirements which we don't want
            .map(|block| parse_block(block))
            .try_collect();

        let blocks = match blocks {
            Ok(b) => b,
            Err(e) => {
                println!("Error with {}: {}", major, e);
                continue;
            }
        };

        std::fs::write(
            format!("{}.json", major),
            serde_json::to_string_pretty(&blocks)?,
        )?;
    }

    Ok(())
}
