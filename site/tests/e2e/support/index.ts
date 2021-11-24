/* eslint-disable @typescript-eslint/no-namespace */
// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import "./commands";

declare global {
  namespace Cypress {
    interface Chainable {
      getOne(label: string): Chainable<Element>;
      containsOne(label: string | RegExp): Chainable<Element>;
      getBody(): Chainable<Element>;
      getNav(): Chainable<Element>;
    }
  }
}

export const SEMESTER = "202105";

export const SCHOOLS: { [school: string]: number } = {
  Architecture: 2,
  "Information Technology and Web Science": 1,
  Engineering: 10,
  "Management and Technology": 1,
  Science: 11,
  "Humanities, Arts, and Social Sciences": 13,
  "Interdisciplinary and Other": 5,
};

beforeEach(() => {
  cy.visit("/");
  cy.clearLocalStorage(SEMESTER);
});
