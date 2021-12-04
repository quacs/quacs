describe("Test department page", () => {
  it("Clicks on navbar page links", () => {
    cy.containsOne("CSCI").click();
    cy.getBody().containsOne("CSCI: Computer Science");

    cy.getBody()
      .get(".course-card")
      .first()
      .within(() => {
        cy.get(".card-header").within(() => {
          cy.containsOne("Computer Science I");
          cy.containsOne("4 credits");
          cy.containsOne("Introductory Level Course");
          cy.containsOne(
            "An introduction to computer programming algorithm design and analysis"
          );
          cy.containsOne("CSCI-1100").click();
        });

        cy.getOne("#section-grow-CSCI-1100").within(() => {
          cy.containsOne("Toggle all sections");
          cy.get(".course-row").should("have.length", 2);

          cy.get(".course-row")
            .first()
            .within(() => {
              cy.containsOne("01-15982");
              cy.containsOne("Uzma Mushtaque, Shianne Hulbert");
              cy.containsOne("05/24 - 08/20");
              cy.containsOne("4/30 seats available");
              cy.getOne(".time-cell-M").containsOne("10:30a-12:10p");
              cy.getOne(".time-cell-T").find("span").should("have.length", 0);
              cy.getOne(".time-cell-W").containsOne("10:30a-12:35p");
              cy.getOne(".time-cell-R").containsOne("10:30a-12:10p");
              cy.getOne(".time-cell-R").containsOne("4:10p-6:15p");
              cy.getOne(".time-cell-F").find("span").should("have.length", 0);

              // Open the section info modal
              cy.getOne(".info-icon").click();
            });
        });
      });
  });
});
