import { SCHOOLS } from "../support";

describe("Test navbar", () => {
  it("Clicks on navbar page links", () => {
    cy.getNav().containsOne("Schedule").click();
    cy.getBody().containsOne(
      "It looks like you have not selected any courses yet"
    );
    cy.get("nav").containsOne("Prerequisites").click();
    cy.getBody().containsOne("Prerequisites");
    cy.get("nav").getOne("img").click();

    cy.getBody().get(".card-header").containsOne(Object.keys(SCHOOLS)[0]);
  });
});
