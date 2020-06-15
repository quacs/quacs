let wasm: typeof import("@/quacs-rs") | null = null;

export const init = async () => {
  const start = Date.now();
  wasm = await import("../quacs-rs");
  const end = Date.now();

  // eslint-disable-next-line
  console.log(`wasm initialized, took ${end - start}ms`);

  wasm.init();
};

export const generateCurrentSchedulesAndConflicts = async () => {
  while (wasm === null) {
    await new Promise((resolve: (value?: unknown) => void) =>
      setTimeout(resolve, 0)
    );
  }
  wasm.generateSchedulesAndConflicts();
};

export const setSelected = async (crn: string, selected: boolean) => {
  while (wasm === null) {
    await new Promise((resolve: (value?: unknown) => void) =>
      setTimeout(resolve, 0)
    );
  }
  return wasm.setSelected(parseInt(crn), selected);
};

export const getInConflict = async (crn: number) => {
  while (wasm === null) {
    await new Promise((resolve: (value?: unknown) => void) =>
      setTimeout(resolve, 0)
    );
  }
  return wasm.isInConflict(crn);
};

export const getSchedule = async (idx: number) => {
  while (wasm === null) {
    await new Promise((resolve: (value?: unknown) => void) =>
      setTimeout(resolve, 0)
    );
  }
  return wasm.getSchedule(idx);
};
