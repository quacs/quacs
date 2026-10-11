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
