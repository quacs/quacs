// Browsers used for testing don't ship WebMCP yet, so stand in for
// document.modelContext and call the registered tools directly.
function visitWithModelContext() {
  cy.visit("/", {
    onBeforeLoad(win) {
      win.webmcpTools = {};
      Object.defineProperty(win.document, "modelContext", {
        configurable: true,
        value: {
          registerTool(tool) {
            win.webmcpTools[tool.name] = tool;
            return Promise.resolve();
          },
        },
      });
    },
  });
}

function callTool(name, input = {}) {
  return cy
    .window()
    .its(`webmcpTools.${name}`)
    .then({ timeout: 30000 }, (tool) => tool.execute(input));
}

describe("Test WebMCP tools", () => {
  beforeEach(visitWithModelContext);

  it("Registers every tool", () => {
    cy.window()
      .its("webmcpTools")
      .should((tools) => {
        expect(Object.keys(tools)).to.have.members([
          "get_term_info",
          "list_departments",
          "search_courses",
          "list_department_courses",
          "get_course",
          "get_section",
          "find_sections",
          "get_my_schedule",
          "get_generated_schedule",
          "select_sections",
          "switch_course_set",
          "set_prior_courses",
          "get_help_and_feedback",
          "switch_semester",
        ]);
        expect(tools.get_course.annotations.readOnlyHint).to.equal(true);
        expect(tools.select_sections.annotations).to.equal(undefined);
      });
  });

  it("Looks up courses and sections", () => {
    callTool("get_term_info").its("semester").should("equal", "Summer 2021");

    callTool("search_courses", { query: "Computer Science I" })
      .its("courses")
      .then((courses) =>
        expect(courses.map((course) => course.course_id)).to.include(
          "CSCI-1100"
        )
      );

    callTool("get_course", { course_id: "csci 1100" }).then((course) => {
      expect(course.title).to.equal("Computer Science I");
      expect(course.credits).to.equal("4");
      expect(course.sections).to.have.length(2);
      expect(course.sections[0]).to.include({
        crn: 15982,
        seats_remaining: 4,
        capacity: 30,
      });
      expect(course.sections[0].meetings[0]).to.include({
        days: "Monday, Thursday",
        time: "10:30-12:10",
      });
    });

    callTool("get_course", { course_id: "CSCI-2600" })
      .its("sections.0.prerequisites")
      .should("equal", "CSCI-1200 and CSCI-2200");

    callTool("get_section", { crn: 16350 })
      .its("course_id")
      .should("equal", "CSCI-1100");
  });

  it("Filters sections", () => {
    callTool("find_sections", {
      department: "CSCI",
      not_on_days: ["Monday"],
      start_after: "1pm",
    })
      .its("sections")
      .then((sections) => {
        const courseIds = sections.map((section) => section.course_id);
        expect(courseIds).to.include("CSCI-2960");
        expect(courseIds).not.to.include("CSCI-1100");
        sections.forEach((section) =>
          section.meetings.forEach((meeting) => {
            expect(meeting.days).not.to.contain("Monday");
            expect(meeting.time >= "13:00").to.equal(true);
          })
        );
      });
  });

  it("Builds schedules", () => {
    callTool("switch_course_set", {
      name: "Agent draft",
      create_if_missing: true,
    })
      .its("course_set")
      .should("equal", "Agent draft");

    callTool("select_sections", {
      course_ids: ["CSCI-1100", "MATH-2010"],
    }).then((schedule) => {
      expect(schedule.courses).to.have.members(["CSCI-1100", "MATH-2010"]);
      expect(schedule.total_credits).to.equal("8");
      expect(schedule.num_possible_schedules).to.equal(2);
    });

    callTool("get_generated_schedule", { index: 1 }).then((schedule) => {
      expect(schedule.total_schedules).to.equal(2);
      expect(schedule.crns).to.have.length(2);
      expect(schedule.weekly_layout.Tuesday[0]).to.contain("MATH-2010");
    });

    // CSCI-2600 meets at the same time as CSCI-1100
    callTool("select_sections", { course_ids: ["CSCI-2600"] }).then(
      (schedule) => {
        expect(schedule.num_possible_schedules).to.equal(0);
        expect(schedule.note).to.contain("No conflict-free schedule");
      }
    );
    callTool("find_sections", { no_conflict_with_my_schedule: true })
      .its("error")
      .should("contain", "already conflict");

    // MATH-2010 needs MATH-1020 and CSCI-2600 needs CSCI-1200 and CSCI-2200
    callTool("set_prior_courses", {
      add: ["MATH-1020", "CSCI-1200"],
      enable_prerequisite_checking: true,
    });
    callTool("get_my_schedule")
      .its("courses_missing_prerequisites")
      .should("deep.equal", ["CSCI-2600"]);

    callTool("set_prior_courses", { add: ["CSCI-2200"] })
      .its("prior_courses")
      .should("deep.equal", ["CSCI-1200", "CSCI-2200", "MATH-1020"]);
    callTool("get_my_schedule").then((schedule) =>
      expect(schedule.courses_missing_prerequisites).to.equal(undefined)
    );

    callTool("select_sections", {
      course_ids: ["CSCI-2600"],
      selected: false,
    })
      .its("num_possible_schedules")
      .should("equal", 2);
  });

  it("Handles semester switching", () => {
    callTool("get_term_info")
      .its("other_semesters")
      .should("include", "Spring 2021");
    callTool("switch_semester", { semester: "summer-2021" })
      .its("already_here")
      .should("equal", true);
    callTool("switch_semester", { semester: "Fall 1999" })
      .its("error")
      .should("contain", 'no "Fall 1999" semester');
  });

  it("Points people to the Discord", () => {
    callTool("get_help_and_feedback")
      .its("discord")
      .should("equal", "https://discord.gg/yXaHkwU");
  });

  it("Returns errors as results", () => {
    callTool("get_course", { course_id: "nope" })
      .its("error")
      .should("contain", "is not a course id");
    callTool("select_sections", { crns: [1] })
      .its("error")
      .should("equal", "No section with CRN 1 this semester.");
  });
});
