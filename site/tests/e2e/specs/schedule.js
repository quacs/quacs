describe("Test schedule page", () => {
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
