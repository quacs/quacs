describe("MTA background train cars", () => {
  it("adds cars for distinct courses, not sections, in the active course set", () => {
    cy.getNav().find("svg[data-icon=cog]").click();
    cy.get("#colorTheme").select("MTA");
    cy.get(".modal-footer").contains("Close").click();
    cy.get(".modal-footer").should("not.exist");
    cy.get("#app").then(($app) => {
      const store = $app[0].__vue__.$store;
      const courses = store.state.departments.flatMap((dept) => dept.courses);
      const first = courses.find((course) => course.sections.length >= 2);
      const second = courses.find((course) => course.id !== first.id);
      cy.wrap({ store, first, second }).as("selection");
      store.commit("schedule/createNewCourseSet", {
        name: "Train length test",
      });
      store.commit("schedule/_switchCurrentCourseSet", "Train length test");
    });
    const cars = (count) =>
      cy.get(".mta-background-train").should(($trains) => {
        $trains.each((_, train) => {
          expect(train.getAttribute("data-car-count")).to.equal(String(count));
          expect(train.querySelectorAll(":scope > g").length).to.equal(count);
        });
      });
    const select = (course, section, selected) =>
      cy.get("@selection").then((state) => {
        state.store.commit("schedule/_setSelected", {
          crn: String(state[course].sections[section].crn),
          selected,
        });
      });
    cars(1);
    select("first", 0, true);
    cars(2);
    select("first", 1, true);
    cars(2);
    select("second", 0, true);
    cars(3);
    select("first", 0, false);
    cars(3);
    select("first", 1, false);
    cars(2);
    cy.get("@selection").then(({ store }) => {
      store.commit("schedule/createNewCourseSet", { name: "Empty train test" });
      store.commit("schedule/_switchCurrentCourseSet", "Empty train test");
    });
    cars(1);
  });
});
