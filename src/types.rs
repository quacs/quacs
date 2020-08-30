use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::str::FromStr;

/// Holds each semester a course can be offered in
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Semester {
    Fall,
    Spring,
    Summer,
}

impl FromStr for Semester {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self> {
        match s {
            "Fall" => Ok(Self::Fall),
            "Spring" => Ok(Self::Spring),
            "Summer" => Ok(Self::Summer),
            unknown => bail!("String {} is not a semester", unknown),
        }
    }
}

impl Semester {
    pub fn from_compressed(s: &str) -> Result<Self> {
        match s {
            "09" => Ok(Self::Fall),
            "01" => Ok(Self::Spring),
            "05" => Ok(Self::Summer),
            unknown => bail!("{} is not a valid compressed semester", unknown),
        }
    }
}

/// Enum of attributes which can be restricted.
#[derive(Serialize, Deserialize)]
pub enum CourseAttribute {
    /// Course must be marked at Comm Intensive
    CommunicationIntensive,

    /// Course must have been taken in this semester
    RequiredSemester { sem: Semester, year: usize },

    /// Generated from 'DWRESIDENT' flag
    Resident(bool),

    /// Course taken for a certain number of credits
    Credits(usize),

    /// Checks against grade
    Grade(String),

    /// Contains a list of disciplines
    Disciplines(Vec<String>),

    /// Course counts for PDII
    PD2,
}

/// Restriction on the metadata over a course for a Course restriction.
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
#[serde(tag = "type")]
pub enum CourseRestriction {
    /// Checks against a certain attribute of a course.
    Attribute {
        operator: BooleanOperator,
        connector: ConditionOperator,
        attribute: CourseAttribute,
    },
}

/// Restricts courses over various fields.  If a field is `None`, that means it is unrestricted.
#[derive(Serialize, Deserialize)]
pub struct Course {
    pub dept: String,
    pub crse: String,
    pub restriction: Vec<CourseRestriction>,
    // TODO: what does `NewDiscipline` mean?
}

/// Operator used for comparing different values.  This is probably only going to be Equal,
/// but it's separated into an enum to allow for more extensibility.
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum BooleanOperator {
    Equal,
    NotEqual,
    Was,
    WasNot,
}

impl FromStr for BooleanOperator {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self> {
        match s {
            "=" => Ok(Self::Equal),
            "<>" => Ok(Self::NotEqual),
            "WAS" => Ok(Self::Was),
            "WASNOT" => Ok(Self::WasNot),
            unknown => bail!("String '{}' is not a boolean operator", unknown),
        }
    }
}

/// Represents each state a course can be in for a Course IfCondition
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum CourseStatus {
    Passed,
}

impl FromStr for CourseStatus {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self> {
        match s {
            "PASSED" => Ok(Self::Passed),
            unknown => bail!("String '{}' is not a course status", unknown),
        }
    }
}

/// Enum specialized on each condition's type
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
#[serde(tag = "type")]
pub enum IfCondition {
    /// A nested If condition
    Nested {
        connector: ConditionOperator,
        left_condition: Box<IfCondition>,
        right_condition: Box<IfCondition>,
    },
    /// Checks against the user's major
    Major {
        operator: BooleanOperator,
        major: String,
    },
    /// Checks against the user's first major
    FirstMajor {
        operator: BooleanOperator,
        major: String,
    },
    /// Checks against the user's degree
    Degree {
        operator: BooleanOperator,
        degree: String,
    },
    /// Checks against the user's concentration
    Concentration {
        operator: BooleanOperator,
        concentration: String,
    },
    /// Checks that a user's course is a certain status
    Course {
        course: Course,
        status: CourseStatus,
    },
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ConditionOperator {
    Or,
    And,
    None,
}

impl FromStr for ConditionOperator {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self> {
        match s {
            "OR" => Ok(Self::Or),
            "AND" => Ok(Self::And),
            "" => Ok(Self::None),
            unknown => bail!("String '{}' is not a condition operator", unknown),
        }
    }
}

/// Enum specialized based on each type of rule
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
#[serde(tag = "type")]
pub enum RuleData {
    /// Conditional rule (e.g. "If you're major X")
    If {
        condition: IfCondition,
        if_branch: Vec<Rule>,
        else_branch: Vec<Rule>,
    },
    /// A certain number of course requirements must be met (e.g. the courses for the CSCI
    /// concentrations)
    Course {
        #[serde(skip_serializing_if = "Option::is_none")]
        num_courses_needed: Option<usize>,
        #[serde(skip_serializing_if = "Option::is_none")]
        num_credits_needed: Option<usize>,
        courses: Vec<Course>,
        except: Vec<Course>,
        // qualifier: TODO (XML key: 'Qualifier')
    },
    /// Group of rules which must have a certain number be met.
    /// Note: There's a Degreeworks RuleType "Subset" which is a `Group` where
    /// every rule must be met.
    Group {
        num_needed: usize, // number needed
        rules: Vec<Rule>,
    },
}

/// Wrapper for an individual rule
#[derive(Serialize, Deserialize)]
pub struct Rule {
    //pub per_complete: usize, // TODO: is this needed?
    pub label: String,
    pub rule_data: RuleData,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub extra_text: Option<String>,
}

/// Holds a collection of rules (e.g. "Communication Intensive Courses")
#[derive(Serialize, Deserialize)]
pub struct Block {
    pub rules: Vec<Rule>,
    pub title: String,
}
