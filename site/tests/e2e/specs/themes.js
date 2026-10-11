const NEW_THEMES = {
  "Illuminated Manuscript": "manuscript",
  "Retro Arcade": "retro",
  "Classic Web": "web1",
  MTA: "trains",
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
    cy.get("html").should("have.attr", "data-theme", "trains");
  });

  it("Keeps the transit layout scoped to MTA on desktop and mobile", () => {
    cy.getNav().find("svg[data-icon=cog]").click();
    cy.getOne("#colorTheme").select("MTA");
    cy.getOne(".modal-footer").containsOne("Close").click();
    cy.get(".transit-masthead").should("be.visible");
    cy.get(".department-cards .card")
      .first()
      .should("have.css", "border-radius", "0px");

    cy.viewport(390, 844);
    cy.get(".transit-masthead").should("be.visible");
    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(390);
    });
    cy.get(".department-link").first().click();
    cy.get(".course-card").should("exist");
    cy.get(".navbar-brand").click();
    cy.get(".transit-masthead").should("be.visible");

    cy.viewport(1280, 800);
    cy.getNav().contains("Schedule").click();
    cy.get(".day-label")
      .first()
      .should("have.css", "color", "rgb(255, 255, 255)");
    cy.get(".navbar > .navbar-brand").click();
    cy.getNav().find("svg[data-icon=cog]").click();
    cy.getOne("#colorTheme").select("Light");
    cy.getOne(".modal-footer").containsOne("Close").click();
    cy.get(".transit-masthead").should("not.be.visible");
    cy.get(".department-cards .card")
      .first()
      .should("have.css", "border-radius", "4px");
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

  it("Applies Wingdings without saving it, so a reload restores the saved theme", () => {
    cy.getNav().find("svg[data-icon=cog]").click();
    cy.getOne("#colorTheme").select("Light");
    cy.get("html").should("have.attr", "data-theme", "light");
    cy.getOne("#colorTheme").select("Wingdings");
    cy.get("html").should("have.attr", "data-theme", "wingdings");
    cy.get("body")
      .should("have.css", "font-family")
      .and("contain", "Wingdings Lookalike");
    cy.getOne(".modal-footer").containsOne("Close").click();
    cy.get(".modal-footer").should("not.exist");

    cy.reload();
    cy.get("html").should("have.attr", "data-theme", "light");
  });

  it("Picks a usable theme on every load when Random is saved", () => {
    const excluded = ["random", "system", "true-dark", "wingdings"];
    cy.getNav().find("svg[data-icon=cog]").click();
    cy.get("#colorTheme option").then((options) => {
      // data-theme is the first word of the option value, e.g. "dark black" -> "dark"
      const usable = [...options]
        .map((option) => option.value)
        .filter((value) => !excluded.includes(value))
        .map((value) => value.split(" ")[0]);
      cy.getOne("#colorTheme").select("Random");
      cy.getOne(".modal-footer").containsOne("Close").click();
      cy.get(".modal-footer").should("not.exist");

      for (let i = 0; i < 5; i++) {
        cy.reload();
        cy.get("html").invoke("attr", "data-theme").should("be.oneOf", usable);
        cy.getNav().find("svg[data-icon=cog]").click();
        cy.getOne("#colorTheme").should("have.value", "random");
        cy.getOne(".modal-footer").containsOne("Close").click();
        cy.get(".modal-footer").should("not.exist");
      }
    });
  });

  it("Falls back to the default theme when a saved theme is not an option", () => {
    for (const removed of [
      "soft",
      "aero",
      "liquid",
      "light colorful",
      "flowing",
      "not-a-theme",
    ]) {
      // Seed storage before the app boots, so the running app cannot overwrite it first
      cy.visit("/", {
        onBeforeLoad(win) {
          win.localStorage.setItem(
            "inter-semester-storage",
            JSON.stringify({ settings: { colorTheme: removed } })
          );
        },
      });
      // The default is "Follow Device Theme", which resolves to light or dark
      cy.window().then((win) => {
        const expected = win.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
        cy.get("html").should("have.attr", "data-theme", expected);
      });
      cy.window()
        .its("localStorage")
        .invoke("getItem", "inter-semester-storage")
        .then((raw) =>
          expect(JSON.parse(raw).settings.colorTheme).to.equal("system")
        );
    }
  });

  it("Records the picked theme in RUM", () => {
    cy.visit("/", {
      onBeforeLoad(win) {
        // Stand in for the RUM agent, ignoring the real one when it loads
        const rum = {
          onReady: (callback) => callback(),
          init: cy.stub(),
          startSessionReplayRecording: cy.stub(),
          addAction: cy.stub().as("addAction"),
          setGlobalContextProperty: cy.stub().as("setGlobal"),
        };
        Object.defineProperty(win, "DD_RUM", {
          get: () => rum,
          set: cy.stub(),
        });
      },
    });
    cy.getNav().find("svg[data-icon=cog]").click();
    cy.getOne("#colorTheme").select("Retro Arcade");
    cy.get("@addAction").should("have.been.calledWithMatch", "theme_selected", {
      theme: "retro",
    });
    cy.get("@setGlobal").should(
      "have.been.calledWith",
      "selected_theme",
      "retro"
    );
    cy.get("@setGlobal").should(
      "have.been.calledWith",
      "applied_theme",
      "retro"
    );
  });
});

describe("MTA route badges", () => {
  it("uses real routes with their matching official colors", () => {
    cy.getNav().find("svg[data-icon=cog]").click();
    cy.get("#colorTheme").select("MTA");
    cy.get(".modal-footer").contains("Close").click();
    const routes = [
      ["1", "rgb(216, 34, 51)"],
      ["2", "rgb(216, 34, 51)"],
      ["4", "rgb(0, 153, 82)"],
      ["7", "rgb(154, 56, 161)"],
      ["B", "rgb(235, 104, 0)"],
      ["A", "rgb(0, 98, 207)"],
      ["Q", "rgb(246, 188, 38)"],
      ["G", "rgb(121, 149, 52)"],
    ];
    cy.get(".department-cards .card-header").each(($header, index) => {
      const badge = $header[0].ownerDocument.defaultView.getComputedStyle(
        $header[0],
        "::before"
      );
      const [route, color] = routes[index % routes.length];
      expect(badge.content).to.equal(`"${route}"`);
      expect(badge.backgroundColor).to.equal(color);
    });
    cy.get(".transit-schedule-link .transit-bullet").should(
      "have.css",
      "background-color",
      "rgb(124, 133, 140)"
    );
  });
});
