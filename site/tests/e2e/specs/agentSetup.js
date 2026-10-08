describe("Test AI agent setup modal", () => {
  it("Opens from the navbar and copies the setup prompt", () => {
    cy.window().then((win) =>
      cy.stub(win.navigator.clipboard, "writeText").resolves().as("copy")
    );

    cy.getNav().containsOne("AI Agents").click();
    cy.getOne("#agent-setup-modal").within(() => {
      cy.containsOne("Use QuACS with AI");
      cy.getOne("[data-cy=browser-status]").should(
        "contain",
        "chrome://flags/#enable-webmcp-testing"
      );
      cy.getOne("[data-cy=agent-prompt]").should(
        "contain",
        "claude mcp add quacs -- npx -y chrome-devtools-mcp@latest"
      );

      cy.getOne("[data-cy=copy-agent-prompt]").click();
      cy.get("@copy")
        .should("have.been.calledOnce")
        .its("firstCall.args.0")
        .should("contain", "list_webmcp_tools")
        .and("contain", "/summer2021/");
      cy.getOne("[data-cy=copy-agent-prompt]").should("contain", "Copied!");
    });
  });
});
