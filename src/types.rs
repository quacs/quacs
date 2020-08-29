/// Enum of attributes which can be restricted.
pub enum CourseAttribute {
    CommunicationIntensive,
}

/// Restriction on the metadata over a course for a Course restriction.
pub enum CourseRestriction {
    /// Checks against a certain attribute of a course.
    Attribute {
        operator: BooleanOperator,
        attribute: CourseAttribute,
    },
}

/// Restricts courses over various fields.  If a field is `None`, that means it is unrestricted.
pub struct Course {
    dept: Option<String>,
    crse: Option<String>,
    restriction: Option<CourseRestriction>,
    // TODO: what does `NewDiscipline` mean?
}

/// Operator used for comparing different values.  This is probably only going to be Equal,
/// but it's separated into an enum to allow for more extensibility.
pub enum BooleanOperator {
    Equal,
}

/// Enum specialized on each condition's type
pub enum IfConditionValue {
    /// A nested If condition
    Nested(IfCondition),
    /// Checks against the user's major
    Major {
        connector: BooleanOperator,
        major: String,
    },
    /// Checks against the user's degree
    Degree {
        connector: BooleanOperator,
        degree: String,
    },
}

pub enum ConditionOperator {
    Or,
    And,
}

/// Condition for an If rule variant
pub struct IfCondition {
    connector: ConditionOperator,
    left_condition: Box<IfConditionValue>,
    right_condition: Box<IfConditionValue>,
}

/// Enum specialized based on each type of rule
pub enum RuleData {
    /// Conditional rule (e.g. "If you're major X")
    If {
        condition: IfCondition,
        if_part: Box<Rule>,
        else_part: Box<Rule>,
    },
    /// A certain number of course requirements must be met (e.g. the courses for the CSCI
    /// concentrations)
    Course {
        num_needed: usize,
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
pub struct Rule {
    per_complete: usize, // TODO: is this needed?
    label: String,
    data: RuleData,
    extra_text: Option<String>,
}

/// Holds a collection of rules (e.g. "Communication Intensive Courses")
pub struct Block {
    rules: Vec<Rule>,
    title: String,
}
