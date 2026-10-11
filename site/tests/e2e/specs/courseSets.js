function openCourseSetModal(currentCourseSet) {
  cy.getNav().containsOne(currentCourseSet).click();
  cy.getOne("[data-cy=manage-course-sets]")
    .should("contain.text", "Manage Course Sets")
    .click();
  cy.getOne("#courseSet-modal");
}

function mySchedule() {
  return cy
    .window()
    .its("quacsTools")
    .then({ timeout: 30000 }, (quacsTools) =>
      quacsTools.call("get_my_schedule")
    );
}

function selectedSections() {
  return mySchedule().then((overview) =>
    overview.selected_sections.map((sec) => sec.crn)
  );
}

function currentCourseSet() {
  return mySchedule().its("course_set");
}

describe("Test course sets", () => {
  it("Renames course sets", () => {
    openCourseSetModal("Course Set 1");

    // Adding a course set switches to it
    cy.getOne("#courseSet-modal")
      .find("input[placeholder='Course Set Name']")
      .type("Plan B{enter}");
    currentCourseSet().should("equal", "Plan B");

    // Duplicate and empty names are rejected
    cy.getOne("[data-cy='rename-course-set-Course Set 1']").click();
    cy.getOne("[data-cy=rename-course-set-input]").clear().type("Plan B");
    cy.getOne("[data-cy=rename-course-set-save]").should("be.disabled");
    cy.getOne("[data-cy=rename-course-set-feedback]").containsOne(
      "Must be a unique name"
    );
    cy.getOne("[data-cy=rename-course-set-input]").clear();
    cy.getOne("[data-cy=rename-course-set-save]").should("be.disabled");
    cy.getOne("[data-cy=rename-course-set-feedback]").containsOne(
      "You must give your course set a name"
    );

    // Rename a course set that is not current
    cy.getOne("[data-cy=rename-course-set-input]").type("  My Plan  {enter}");
    cy.get("[data-cy=rename-course-set-input]").should("not.exist");
    cy.getOne("[data-cy='rename-course-set-My Plan']");
    cy.get("[data-cy='rename-course-set-Course Set 1']").should("not.exist");
    currentCourseSet().should("equal", "Plan B");

    // Rename the current course set
    cy.getOne("[data-cy='rename-course-set-Plan B']").click();
    cy.getOne("[data-cy=rename-course-set-input]").clear().type("Spring Plan");
    cy.getOne("[data-cy=rename-course-set-save]").click();
    cy.getOne("#courseSet-modal").containsOne("Close").click();
    cy.getNav().containsOne("Spring Plan");
  });

  it("Keeps selected sections when renaming", () => {
    cy.window()
      .its("quacsTools")
      .then({ timeout: 30000 }, (quacsTools) =>
        quacsTools.call("select_sections", { crns: [15982] })
      );
    selectedSections().should("deep.equal", [15982]);

    openCourseSetModal("Course Set 1");
    cy.getOne("[data-cy='rename-course-set-Course Set 1']").click();
    cy.getOne("[data-cy=rename-course-set-input]")
      .clear()
      .type("Renamed{enter}");
    cy.getOne("#courseSet-modal").containsOne("Close").click();

    cy.getNav().containsOne("Renamed");
    selectedSections().should("deep.equal", [15982]);
  });
});
