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

export const SEMESTER = "202105";

export const SCHOOLS = {
  Architecture: 2,
  Engineering: 9,
  "Management and Technology": 2,
  Science: 9,
  "Humanities, Arts, and Social Sciences": 13,
  "Interdisciplinary and Other": 1,
};

beforeEach(() => {
  cy.visit("/");
  cy.clearLocalStorage(SEMESTER);
});
