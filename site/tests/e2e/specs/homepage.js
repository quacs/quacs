import { SCHOOLS } from "../support";

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
