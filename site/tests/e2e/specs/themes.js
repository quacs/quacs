const NEW_THEMES = {
  "Soft Modern": "soft",
  "Illuminated Manuscript": "manuscript",
  "Retro Arcade": "retro",
  "Classic Web": "web1",
  "Frutiger Aero": "aero",
  "Liquid Glass": "liquid",
};

describe("Test color themes", () => {
  it("Applies each new theme from settings and remembers it", () => {
    for (const [label, theme] of Object.entries(NEW_THEMES)) {
      cy.getNav().find("svg[data-icon=cog]").click();
      cy.getOne("#colorTheme").select(label);
      cy.get("html").should("have.attr", "data-theme", theme);
      cy.getOne(".modal-footer").containsOne("Close").click();
      cy.get(".modal-footer").should("not.exist");
    }

    cy.reload();
    cy.get("html").should("have.attr", "data-theme", "liquid");
  });

  it("Keeps the look of the existing light theme", () => {
    // The default is "Follow Device Theme", which resolves to dark on a dark-mode machine,
    // so select Light explicitly instead of assuming the default is light
    cy.getNav().find("svg[data-icon=cog]").click();
    cy.getOne("#colorTheme").select("Light");
    cy.get("html").should("have.attr", "data-theme", "light");
    cy.getOne(".modal-footer").containsOne("Close").click();
    cy.get(".modal-footer").should("not.exist");

    cy.get(".card").first().should("have.css", "border-radius", "4px");
  });
});
