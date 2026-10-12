describe("Responsive navbar", () => {
  for (const theme of ["Light", "MTA"]) {
    it(`keeps Settings accessible in ${theme} at narrow desktop widths`, () => {
      cy.viewport(1440, 800);
      cy.getNav().find("svg[data-icon=cog]").click();
      cy.get("#colorTheme").select(theme);
      cy.get(".modal-footer").contains("Close").click();
      cy.get(".modal-footer").should("not.exist");
      for (const width of [992, 1100, 1199, 1200, 1280, 1440]) {
        cy.viewport(width, 800);
        // BootstrapVue synchronizes collapse state after the resize event.
        cy.wait(250);
        if (width < 1200) {
          cy.get(".navbar-toggler").should("be.visible");
          cy.get("#nav-collapse").then(($menu) => {
            if (!$menu.is(":visible")) cy.get(".navbar-toggler").click();
          });
        }
        cy.get("svg[data-icon=cog]")
          .should("be.visible")
          .then(($gear) => {
            const bounds = $gear[0].getBoundingClientRect();
            expect(bounds.left).to.be.at.least(0);
            expect(bounds.right).to.be.at.most(width);
          });
        cy.get(".navbar").then(($nav) => {
          expect($nav[0].scrollWidth).to.be.at.most(width);
        });
        if (width < 1200) {
          cy.get(".navbar-toggler").click();
          cy.get("#nav-collapse").should("not.be.visible");
        }
      }
    });
  }
});
