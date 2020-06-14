// wasm is only null until we call init().  Since that's the first thing we call and this
// is a single threaded worker, for all practical purposes it's always going to be non-null.
// below typescript fuckery stops us from needing to check if it's null in each member function.
let wasm: typeof import("@/quacs-rs") = (null as unknown) as typeof import("@/quacs-rs");

export const init = async () => {
  const start = Date.now();
  wasm = await import("../quacs-rs");
  const end = Date.now();

  // eslint-disable-next-line
  console.log(`wasm initialized, took ${end - start}ms`);

  wasm.init();
};

export const generateCurrentSchedulesAndConflicts = async () => {
  wasm.generateSchedulesAndConflicts();
};

export const setSelected = async (crn: string, selected: boolean) => {
  return wasm.setSelected(crn, selected);
};

export const getInConflict = async (crn: number) => {
  return wasm.isInConflict(crn);
};

export const getSchedule = async (idx: number) => {
  return wasm.getSchedule(idx);
};
