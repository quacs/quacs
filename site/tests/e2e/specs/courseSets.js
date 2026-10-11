describe("Test course sets", () => {
  it("Keeps Course Set 1 deleted after a reload", () => {
    cy.getNav().containsOne("Course Set 1").click();
    cy.get("nav").contains("a.dropdown-item", "Edit").click();
    cy.getOne("#courseSet-modal input").type("Set B{enter}");
    cy.getNav().containsOne("Set B");

    cy.get("#courseSet-modal")
      .contains("div", "Course Set 1")
      .find(".trash-btn")
      .click();
    cy.get("#courseSet-modal").contains("Course Set 1").should("not.exist");
    cy.get("#courseSet-modal").contains("button", "Close").click();

    cy.reload();
    cy.getNav().containsOne("Set B").click();
    cy.get("nav").contains("Course Set 1").should("not.exist");
  });
});
