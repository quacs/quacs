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
