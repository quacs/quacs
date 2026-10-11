// Select courses through window.quacsTools, then manage them from the schedule
function visitScheduleWithCourses(courseIds) {
  cy.visit("/", {
    onBeforeLoad(win) {
      // Stand in for the RUM agent, ignoring the real one when it loads
      const rum = {
        onReady: (callback) => callback(),
        init: cy.stub(),
        startSessionReplayRecording: cy.stub(),
        addAction: cy.stub().as("addAction"),
      };
      Object.defineProperty(win, "DD_RUM", {
        get: () => rum,
        set: cy.stub(),
      });
    },
  });
  cy.window()
    .its("quacsTools")
    .then({ timeout: 30000 }, (quacsTools) =>
      quacsTools.call("select_sections", { course_ids: courseIds })
    );
  cy.getNav().containsOne("Schedule").click();
}

describe("Test removing courses from the schedule", () => {
  it("Removes a single course", () => {
    visitScheduleWithCourses(["CSCI-1100", "CSCI-2600"]);
    cy.get(".course-card").should("have.length", 2);

    cy.contains(".course-card", "CSCI-1100")
      .find("[data-cy=remove-course]")
      .click();

    cy.get(".course-card").should("have.length", 1);
    cy.getBody().get(".course-card").containsOne("CSCI-2600");
    cy.get("@addAction").should(
      "have.been.calledWithMatch",
      "schedule_course_removed",
      { course: "CSCI-1100" }
    );

    // The removal is saved
    cy.reload();
    cy.get(".course-card").should("have.length", 1);
    cy.getBody().get(".course-card").containsOne("CSCI-2600");
  });

  it("Clears all courses after confirming", () => {
    visitScheduleWithCourses(["CSCI-1100", "CSCI-2600"]);
    cy.get(".course-card").should("have.length", 2);

    // Cancelling keeps everything
    cy.getOne("[data-cy=clear-schedule]").click();
    cy.getOne(".modal-footer").containsOne("Cancel").click();
    cy.get(".modal-footer").should("not.exist");
    cy.get(".course-card").should("have.length", 2);

    cy.getOne("[data-cy=clear-schedule]").click();
    cy.getOne(".modal-footer").containsOne("Clear all").click();
    cy.get(".course-card").should("have.length", 0);
    cy.getBody().containsOne(
      "It looks like you have not selected any courses yet"
    );
    cy.get("@addAction").should(
      "have.been.calledWithMatch",
      "schedule_cleared",
      { sections: 4 }
    );
  });
});

function shouldShowScheduleNum(text) {
  cy.getOne(".schedule-num").should(($el) => {
    expect($el.text().trim()).to.equal(text);
  });
}

describe("Test schedule page", () => {
  it("Keeps a single schedule counter while cycling schedules", () => {
    cy.containsOne("CSCI").click();
    cy.getBody()
      .get(".course-card")
      .first()
      .within(() => {
        cy.get(".card-header").within(() => {
          cy.containsOne("CSCI-1100").click();
        });
        cy.getOne("#section-grow-CSCI-1100").within(() => {
          cy.containsOne("Toggle all sections").click();
        });
      });

    cy.getNav().containsOne("Schedule").click();
    shouldShowScheduleNum("Viewing schedule 1 out of 2 generated schedules");

    // Simulate a stray text node left behind in the counter (see
    // https://github.com/quacs/quacs/issues/1235); cycling should replace it
    cy.get(".schedule-num").then(($el) => {
      $el[0].appendChild(
        $el[0].ownerDocument.createTextNode(
          " Viewing schedule 1 out of 2 generated schedules"
        )
      );
    });

    cy.get(".schedule-select-button").last().click();
    shouldShowScheduleNum("Viewing schedule 2 out of 2 generated schedules");

    cy.get(".schedule-select-button").last().click();
    shouldShowScheduleNum("Viewing schedule 1 out of 2 generated schedules");
  });
});

describe("Test current schedule section markers", () => {
  it("Marks the sections used by the current schedule", () => {
    // Select both CSCI-1100 sections, which gives two generated schedules
    cy.containsOne("CSCI").click();
    cy.get("#section-grow-CSCI-1100")
      .parents(".course-card")
      .within(() => {
        cy.containsOne("CSCI-1100").click();
        cy.containsOne("Toggle all sections").click();
      });

    // Section markers only show up on the schedule page
    cy.get("[data-cy=current-schedule-section]").should("have.length", 0);

    cy.getNav().containsOne("Schedule").click();
    cy.containsOne("Viewing schedule 1 out of 2 generated schedules");
    cy.containsOne("CSCI-1100").click();

    const expectMarkedSection = (crn) => {
      cy.getOne(".crn-list .crn").should("have.text", crn);
      cy.getOne("[data-cy=current-schedule-section]")
        .parents(".course-row")
        .should("contain", crn);
    };

    expectMarkedSection("16350");
    cy.get(".schedule-select-button").last().click();
    cy.containsOne("Viewing schedule 2 out of 2 generated schedules");
    expectMarkedSection("15982");
  });
});
