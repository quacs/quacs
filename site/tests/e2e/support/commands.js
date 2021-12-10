// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

function getSubject(subject) {
  return subject ? cy.wrap(subject) : cy;
}

Cypress.Commands.add(
  "getOne",
  {
    prevSubject: "optional",
  },
  (subject, label) => {
    return getSubject(subject)
      .get(label)
      .should("have.length", 1)
      .should("be.visible");
  }
);

Cypress.Commands.add(
  "containsOne",
  {
    prevSubject: "optional",
  },
  (subject, label) => {
    return getSubject(subject)
      .contains(label)
      .should("have.length", 1)
      .should("be.visible");
  }
);

Cypress.Commands.add("getBody", () => {
  return cy.getOne("div.container-fluid");
});

Cypress.Commands.add("getNav", () => {
  return cy.getOne("nav");
});
