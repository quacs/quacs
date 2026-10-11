import { SEMESTER } from "../support";

// Stand in for the RUM agent, ignoring the real one when it loads
function visitWithRum() {
  cy.visit("/", {
    onBeforeLoad(win) {
      const rum = {
        onReady: (callback) => callback(),
        init: cy.stub(),
        startSessionReplayRecording: cy.stub(),
        addAction: cy.stub().as("addAction"),
      };
      Object.defineProperty(win, "DD_RUM", {
        get: () => rum,
        set: cy.stub(),
      });
    },
  });
}

function callTool(name, input = {}) {
  return cy
    .window()
    .its("quacsTools")
    .then({ timeout: 30000 }, (quacsTools) => quacsTools.call(name, input));
}

function openTransferModal() {
  cy.getNav().containsOne("Course Set 1").click();
  cy.getOne("[data-cy=course-set-transfer]").click();
}

function importFile(data) {
  cy.get("[data-cy=import-course-sets-file]").selectFile(
    {
      contents: Cypress.Buffer.from(JSON.stringify(data)),
      fileName: "course_sets.json",
    },
    { force: true }
  );
}

describe("Test course set export and import", () => {
  beforeEach(visitWithRum);

  it("Exports a course set and imports it as a new one", () => {
    callTool("select_sections", { course_ids: ["CSCI-1100", "MATH-2010"] });

    openTransferModal();
    cy.getOne("[data-cy=export-course-set]").click();
    cy.getOne("[data-cy=course-set-transfer-message]").should(
      "contain",
      'Exported "Course Set 1".'
    );
    cy.get("@addAction").should(
      "have.been.calledWithMatch",
      "course_sets_exported",
      { count: 1 }
    );

    cy.readFile(
      `${Cypress.config("downloadsFolder")}/quacs_${SEMESTER}_course_set_1.json`
    ).then((file) => {
      expect(file.quacs_course_sets).to.equal(1);
      expect(file.semester).to.equal(SEMESTER);
      expect(file.course_sets).to.have.length(1);
      expect(file.course_sets[0].name).to.equal("Course Set 1");
      expect(file.course_sets[0].crns).to.include.members([15982, 16350]);

      // Add a CRN that does not exist so it gets skipped
      file.course_sets[0].crns.push(99999);
      importFile(file);
    });

    cy.getOne("[data-cy=course-set-transfer-message]")
      .should("contain", 'Imported "Course Set 1 (imported)"')
      .and("contain", "Skipped 1 section");
    cy.get("@addAction").should(
      "have.been.calledWithMatch",
      "course_sets_imported",
      { count: 1, skipped_crns: 1 }
    );

    callTool("get_my_schedule").then((schedule) => {
      expect(schedule.course_set).to.equal("Course Set 1 (imported)");
      expect(schedule.all_course_sets).to.have.members([
        "Course Set 1",
        "Course Set 1 (imported)",
      ]);
      expect(schedule.courses).to.have.members(["CSCI-1100", "MATH-2010"]);
      expect(schedule.num_possible_schedules).to.equal(2);
    });
  });

  it("Rejects invalid files and asks before importing another semester", () => {
    openTransferModal();

    cy.get("[data-cy=import-course-sets-file]").selectFile(
      { contents: Cypress.Buffer.from("not json"), fileName: "bad.json" },
      { force: true }
    );
    cy.getOne("[data-cy=course-set-transfer-message]").should(
      "contain",
      "not valid JSON"
    );

    cy.on("window:confirm", (message) => {
      expect(message).to.contain("This file is from Fall 2020");
      return false;
    });
    importFile({
      quacs_course_sets: 1,
      semester: "202009",
      course_sets: [{ name: "Old", crns: [15982] }],
    });
    cy.get("[data-cy=course-set-transfer-message]").should("not.exist");
    callTool("get_my_schedule")
      .its("all_course_sets")
      .should("deep.equal", ["Course Set 1"]);
  });
});
