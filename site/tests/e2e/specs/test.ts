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

describe("Test homepage", () => {
  it("Check that the homepage has all the departments listed", () => {
    cy.getBody()
      .get(".card-header")
      .should("have.length", Object.keys(SCHOOLS).length);
    Object.keys(SCHOOLS).forEach((school) => {
      cy.getBody()
        .get(".card-header")
        .containsOne(new RegExp(`^${school}$`, "g"))
        .next(".card-body")
        .find(".department-link")
        .should("have.length", SCHOOLS[school]);
    });
  });
});

describe("Test department page", () => {
  it("Clicks on navbar page links", () => {
    cy.containsOne("CSCI").click();
  });
});
