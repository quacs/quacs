const NEW_THEMES = {
  "Illuminated Manuscript": "manuscript",
  "Retro Arcade": "retro",
  "Classic Web": "web1",
  MTA: "trains",
  "Frutiger Aero": "frutiger-aero",
  Gwern: "gwern",
  "Diablo II": "diablo",
  "Liquid Glass": "liquid-glass",
  "Flappy Bird": "flappy-bird",
  Neumorphism: "neumorphism",
  Skeuomorphism: "skeuomorphism",
  Steampunk: "steampunk",
  GeoCities: "geocities",
  Malfoyd: "malfoyd",
};

// Picks a theme in the settings dialog and closes it
function selectTheme(label) {
  cy.getNav().find("svg[data-icon=cog]").click();
  cy.getOne("#colorTheme").select(label);
  cy.getOne(".modal-footer").containsOne("Close").click();
  cy.get(".modal-footer").should("not.exist");
}

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
    const lastTheme = Object.values(NEW_THEMES).slice(-1)[0];
    cy.get("html").should("have.attr", "data-theme", lastTheme);
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

  it("Loads a newer theme's CSS only once someone picks it", () => {
    // Stylesheets from other sites (the web fonts) can't be read, so those are skipped
    const hasRule = (doc, text) =>
      [...doc.styleSheets].some((sheet) => {
        try {
          return [...sheet.cssRules].some((rule) =>
            rule.cssText.includes(text)
          );
        } catch (e) {
          return false;
        }
      });
    selectTheme("Light");
    cy.document().then((doc) =>
      expect(hasRule(doc, 'data-theme="diablo"')).to.equal(false)
    );
    selectTheme("Diablo II");
    cy.get("html").should("have.attr", "data-theme", "diablo");
    cy.document().should((doc) =>
      expect(hasRule(doc, 'data-theme="diablo"')).to.equal(true)
    );
  });

  it("Shows a theme's own logo, and the regular one again after", () => {
    selectTheme("Light");
    cy.getOne("nav img")
      .should("have.attr", "src")
      .and("contain", "quacs_logo");
    selectTheme("GeoCities");
    cy.getOne("nav img")
      .should("have.attr", "src")
      .and("not.contain", "quacs_logo");
    selectTheme("Light");
    cy.getOne("nav img")
      .should("have.attr", "src")
      .and("contain", "quacs_logo");
  });

  it("Pins the Gwern theme to light or dark and remembers it", () => {
    selectTheme("Gwern");
    cy.get("html").should("not.have.attr", "data-gwern-mode");
    cy.getOne(".gwern-toolbar").contains("Dark").click();
    cy.get("html").should("have.attr", "data-gwern-mode", "dark");
    cy.reload();
    cy.get("html").should("have.attr", "data-gwern-mode", "dark");

    // Other themes never get the Gwern mode
    selectTheme("Light");
    cy.get("html").should("not.have.attr", "data-gwern-mode");
  });

  it("Opens QuACSy Bird from the Flappy Bird theme", () => {
    selectTheme("Flappy Bird");
    cy.getOne(".flappy-perch-duck").click();
    cy.getOne("canvas.flappy-canvas");
    cy.get("body").type("{esc}");
    cy.get(".flappy-game").should("not.exist");

    // Typing "flap" outside a text field opens it too
    cy.get("body").type("flap");
    cy.getOne("canvas.flappy-canvas");
    cy.getOne(".flappy-close").click();
    cy.get(".flappy-game").should("not.exist");
  });

  it("Tours RPI's departments through the GeoCities Academy's webring", () => {
    selectTheme("GeoCities");
    cy.get("html").should("have.attr", "data-theme", "geocities");
    cy.getOne(".geo-facts").containsOne("Did You Know?");

    // From the course list, Next goes to the first department, then on through the list
    cy.getOne(".geo-webring").containsOne("Next").click();
    cy.location("hash").should("match", /^#\/department\/[A-Z]{4}$/);
    cy.location("hash").then((first) => {
      cy.getOne(".geo-webring").containsOne("Next").click();
      cy.location("hash").should("not.equal", first);
      cy.getOne(".geo-webring").containsOne("Prev").click();
      cy.location("hash").should("equal", first);
    });
  });

  it("Holds the Diablo II globes in the control panel's statues", () => {
    selectTheme("Diablo II");
    // Each orb's hit area lies over its statue, so check the statues loaded, not that they show
    for (const orb of ["life", "mana"]) {
      cy.get(`.d2-orb-${orb} .d2-orb-hit`).should("be.visible");
      cy.get(`.d2-orb-${orb} .d2-orb-statue`).should(($img) =>
        expect($img[0].naturalWidth).to.be.greaterThan(0)
      );
    }
    cy.get(".d2-orb-life .d2-orb-globe")
      .should("have.attr", "style")
      .and("contain", "inset(");
    cy.get("img[src*='flaming-diablo']").should("not.exist");
  });

  it("Gives Liquid Glass a macOS menu bar, Dock and Control Centre", () => {
    selectTheme("Liquid Glass");
    cy.getOne(".lg-menubar-status .lg-clock")
      .invoke("text")
      .should("match", /\d/);
    cy.getOne(".lg-quacs-dock .lg-app-calendar").click();
    cy.location("hash").should("equal", "#/schedule");
    cy.getOne(".lg-quacs-dock .lg-app-calendar").should(
      "have.class",
      "lg-app-running"
    );

    // The Control Centre's 24-hour switch is the same setting as the one in Settings
    cy.getOne(".lg-cc-toggle").click();
    cy.getOne(".lg-cc").should("be.visible");
    cy.get(".lg-cc lg-switch input").first().check({ force: true });
    cy.get("body").type("{esc}");
    cy.get(".lg-cc").should("not.be.visible");
    cy.getNav().find("svg[data-icon=cog]").click();
    // Settings shows the setting as a glass segmented control, over the select it stands in for
    cy.getOne(".lg-seg-select");
    cy.get("#timePreference").should("have.value", "M");
    cy.getOne(".modal-footer").containsOne("Close").click();
  });

  it("Bends the duck pond through Liquid Glass panes", () => {
    selectTheme("Liquid Glass");
    cy.get(".department-cards > .card.lg-pane-copy .lg-glass-lens")
      .first()
      .should("have.attr", "style")
      .and("contain", "url(");
  });

  it("Prepares Liquid Glass buttons near the viewport and releases them offscreen", () => {
    selectTheme("Liquid Glass");
    cy.document().then((doc) => {
      const fixture = doc.createElement("div");
      fixture.id = "glass-button-fixture";
      fixture.style.cssText = "margin-top: 2000px; padding: 20px;";
      const button = doc.createElement("button");
      button.className = "btn btn-primary";
      button.textContent = "Test glass button";
      button.addEventListener("click", () => {
        button.dataset.clicked = "true";
      });
      fixture.append(button);
      doc.body.append(fixture);
    });
    cy.get("#glass-button-fixture .btn").should("not.have.class", "lg-btn");
    cy.get("#glass-button-fixture").scrollIntoView();
    cy.get("#glass-button-fixture .btn")
      .should("have.class", "lg-btn")
      .find(".lg-surface__glass")
      .should("have.attr", "style")
      .and("contain", "url(");
    cy.get("#glass-button-fixture .btn")
      .click()
      .should("have.attr", "data-clicked", "true");
    cy.scrollTo("top");
    cy.get("#glass-button-fixture .lg-surface").should("not.exist");
    // Coming back creates the same interactive glass again.
    cy.get("#glass-button-fixture").scrollIntoView();
    cy.get("#glass-button-fixture .btn").should("have.class", "lg-btn");
    cy.document().then((doc) =>
      doc.getElementById("glass-button-fixture").remove()
    );
    cy.scrollTo("top");
    selectTheme("Light");
    cy.get(".lg-btn, .lg-glass").should("not.exist");
  });

  it("Keeps the pond and glass stable through touch scrolls and viewport changes", () => {
    cy.viewport(390, 844);
    cy.visit("/", {
      onBeforeLoad(win) {
        const matchMedia = win.matchMedia.bind(win);
        cy.stub(win, "matchMedia").callsFake((query) => {
          const media = matchMedia(query);
          if (query === "(hover: none) and (pointer: coarse)") {
            Object.defineProperty(media, "matches", { value: true });
          }
          return media;
        });
        win.localStorage.setItem(
          "inter-semester-storage",
          JSON.stringify({ settings: { colorTheme: "liquid-glass" } })
        );
      },
    });
    cy.get(".department-cards > .card .lg-glass-lens")
      .first()
      .as("phoneLens")
      .should(($lens) => expect($lens[0].style.filter).to.contain("url("));
    const checkPond = ($lens) => {
      const lens = $lens[0];
      const win = lens.ownerDocument.defaultView;
      const copy = lens.querySelector(".lg-glass-copy");
      const background = win.getComputedStyle(
        lens.ownerDocument.body,
        "::before"
      );
      const pond = win.getComputedStyle(copy);
      expect(pond.backgroundImage).to.equal(background.backgroundImage);
      expect(pond.backgroundPosition).to.equal(background.backgroundPosition);
      expect(pond.backgroundAttachment.split(",")[0].trim()).to.equal("fixed");
      expect(copy.style.transform).to.equal("");
      expect(win.getComputedStyle(lens).visibility).to.equal("visible");
      expect(lens.style.filter).to.contain("url(");
    };
    cy.get("@phoneLens").should(checkPond);
    cy.scrollTo(0, 200);
    cy.get("@phoneLens").should(checkPond);
    cy.get(".lg-pane-scrolling").should("not.exist");
    cy.scrollTo("top");
    cy.get("@phoneLens").should(checkPond);
    cy.viewport(1280, 800);
    cy.get("@phoneLens").should(checkPond);
    cy.viewport(390, 844);
    cy.get("@phoneLens").should(checkPond);
  });

  it("Tracks the latest mouse position without changing Liquid Glass optics", () => {
    let optics;
    const readOptics = (pane) => {
      const win = pane.ownerDocument.defaultView;
      return [
        pane,
        ...pane.querySelectorAll(".lg-glass-lens"),
        ...pane.ownerDocument.querySelectorAll(
          ".navbar .lg-glass, .lg-quacs-dock .lg-surface__glass"
        ),
      ].map((el) => {
        const style = win.getComputedStyle(el);
        // The engine reissues filter IDs after map decode without changing the optics.
        const effect = (value) => value.replace(/-v\d+/g, "");
        return [
          effect(style.filter),
          effect(style.backdropFilter),
          style.visibility,
        ];
      });
    };
    selectTheme("Liquid Glass");
    cy.get(".department-cards > .card.lg-pane")
      .first()
      .then(($pane) => {
        const pane = $pane[0];
        const win = pane.ownerDocument.defaultView;
        // Let initial viewport/resize notifications finish before injecting input. Then wait for
        // the app's render frame instead of racing it with Cypress's next command.
        return new Cypress.Promise((resolve) => {
          win.requestAnimationFrame(() => {
            const box = pane.getBoundingClientRect();
            optics = readOptics(pane);
            // Two inputs in one frame must render the latest position.
            for (const [x, y] of [
              [20, 30],
              [100, 120],
            ]) {
              pane.dispatchEvent(
                new win.PointerEvent("pointermove", {
                  bubbles: true,
                  pointerType: "mouse",
                  clientX: box.left + x,
                  clientY: box.top + y,
                })
              );
            }
            win.requestAnimationFrame(resolve);
          });
        });
      });
    cy.get(".lg-pointer-glow").should(($glow) => {
      const win = $glow[0].ownerDocument.defaultView;
      const transform = new win.DOMMatrixReadOnly(
        win.getComputedStyle($glow[0]).transform
      );
      expect(transform.m41).to.be.closeTo(-120, 0.1);
      expect(transform.m42).to.be.closeTo(-100, 0.1);
    });
    cy.get(".lg-pointer-light").should("have.length", 1);
    // A sibling's expansion can move a pane without resizing the pane itself.
    cy.get(".department-cards > .card.lg-pane")
      .first()
      .then(($pane) => {
        const pane = $pane[0];
        const win = pane.ownerDocument.defaultView;
        const move = () => {
          const box = pane.getBoundingClientRect();
          pane.dispatchEvent(
            new win.PointerEvent("pointermove", {
              bubbles: true,
              pointerType: "mouse",
              clientX: box.left + 100,
              clientY: box.top + 120,
            })
          );
        };
        return new Cypress.Promise((resolve) => {
          win.requestAnimationFrame(() => {
            move();
            win.requestAnimationFrame(() => {
              pane.parentElement.style.paddingTop = "80px";
              move();
              win.requestAnimationFrame(resolve);
            });
          });
        });
      });
    cy.get(".lg-pointer-glow").should(($glow) => {
      const win = $glow[0].ownerDocument.defaultView;
      const transform = new win.DOMMatrixReadOnly(
        win.getComputedStyle($glow[0]).transform
      );
      expect(transform.m42).to.be.closeTo(-100, 0.1);
    });
    cy.get(".department-cards").then(($cards) => {
      $cards[0].style.paddingTop = "";
    });
    // Mouse movement must never switch from refraction to a different blur effect.
    cy.get(".department-cards > .card.lg-pane")
      .first()
      .should(($pane) => expect(readOptics($pane[0])).to.deep.equal(optics));
    selectTheme("Light");
    cy.get(".lg-pointer-light, .lg-pointer-glow").should("not.exist");
    cy.get(".lg-pane-pointer-moving").should("not.exist");
    cy.get("html").should("not.have.class", "lg-pointer-moving");
  });

  it("Stands your courses on the Skeuomorphism theme's bookshelf", () => {
    selectTheme("Skeuomorphism");
    // With nothing chosen, the shelf holds the QuACS handbook
    cy.getOne(".sk-shelf .sk-book").should("contain", "QuACS Handbook");

    // Choose a section, and its course takes the shelf, opening the course when clicked
    cy.containsOne("CSCI").click();
    cy.getBody()
      .get(".course-card")
      .first()
      .within(() => {
        cy.get(".card-header").containsOne("CSCI-1100").click();
        cy.getOne("#section-grow-CSCI-1100").within(() => {
          cy.get(".course-row").first().click();
        });
      });
    cy.getOne(".sk-shelf .sk-book").should("contain", "CSCI 1100").click();
    cy.location("hash").should("equal", "#/search?CSCI-1100");
  });

  it("Grades your course set with the Malfoyd theme's chibi", () => {
    selectTheme("Malfoyd");
    // Nothing picked yet, so she sneers. Plain get: she ignores the pointer, so Cypress
    // reads her as covered and getOne would time out on its visibility check.
    cy.get(".mf-chibi")
      .should("have.attr", "src")
      .and("contain", "chibi-sneer");

    // One picked section earns a pout
    cy.containsOne("CSCI").click();
    cy.getBody()
      .get(".course-card")
      .first()
      .within(() => {
        cy.get(".card-header").containsOne("CSCI-1100").click();
        cy.getOne("#section-grow-CSCI-1100").within(() => {
          cy.get(".course-row").first().click();
        });
      });
    cy.get(".mf-chibi").should("have.attr", "src").and("contain", "chibi-pout");
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
      ["N", "rgb(246, 188, 38)"],
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
