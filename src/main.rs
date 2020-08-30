#[macro_use]
extern crate anyhow;

use anyhow::Result;
use itertools::Itertools;
use roxmltree::{Node, NodeType};
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

            node
        };

        let operator = match rop.attribute("Operator") {
            Some("=") => BooleanOperator::Equal,
            Some(s) => bail!("Unknown boolean operator '{}'", s),
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
            Some("DEGREE") => Ok(IfCondition::Degree {
                operator,
                degree: right,
            }),
            Some(s) => Err(anyhow!(
                "Expected 'MAJOR' or 'DEGREE' for If condition's Left field but found {}",
                s
            )),
            None => Err(anyhow!(
                "Expected value for If condition's Left field but found nothing"
            )),
        }
    } else if inner.len() == 2 {
        let connector = match condition.attribute("Connector") {
            Some("OR") => ConditionOperator::Or,
            Some("AND") => ConditionOperator::And,
            Some(s) => bail!("Unknown condition operator '{}'", s),
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
        .map(|with| match with.attribute("Code") {
            Some(attr @ "ATTRIBUTE") | Some(attr @ "DWTERM") => {
                let operator = match with.attribute("Operator") {
                    Some("=") => BooleanOperator::Equal,
                    Some(s) => bail!("Unknown boolean operator '{}'", s),
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

                ensure!(values.len() != 0, "'With' restriction has no values");
                ensure!(values.len() == 1, "'With' restriction has multiple values");

                let attribute = match values[0].text() {
                    Some("COMM") => CourseAttribute::CommunicationIntensive,
                    Some(s) => {
                        if attr == "DWTERM" {
                            CourseAttribute::RequiredSemester
                        } else {
                            bail!("Unknown course attribute '{}'", s)
                        }
                    }
                    None => bail!("Course restriction value has no text"),
                };

                Ok(CourseRestriction::Attribute {
                    operator,
                    attribute,
                })
            }
            Some(s) => bail!("Unknown course restriction '{}'", s),
            None => bail!("'With' has no Code"),
        })
        .try_collect()
}

fn parse_course(course: Node) -> Result<Course> {
    //let dept = course.attribute("Disc").or(Some("@")).unwrap().to_string();
    //let crse = course.attribute("Num").or(Some("@")).unwrap().to_string();
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
        let audit = doc
            .descendants()
            .find(|node| node.tag_name().name() == "Audit")
            .unwrap();

        let blocks: Vec<Block> = audit
            .children()
            .filter(|node| node.node_type() == NodeType::Element)
            .filter(|node| node.tag_name().name() == "Block")
            .filter(|block| block.attribute("Req_type").unwrap() != "DEGREE") // this deals with GPA and general degree requirements which we don't want
            .map(|block| parse_block(block))
            .try_collect()?;

        std::fs::write(
            format!("{}.json", major),
            serde_json::to_string_pretty(&blocks)?,
        )?;
    }

    Ok(())
}
