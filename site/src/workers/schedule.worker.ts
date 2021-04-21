import type { WasmContext } from "@/quacs-rs";

type WasmType = typeof import("@/quacs-rs");

// @ts-expect-error: after initialization, this won't be null
let ctx: WasmContext = null;
// @ts-expect-error: after initialization, this won't be null
let wasm: WasmType = null;

async function waitForInitialization(): Promise<void> {
  while (
    wasm === null ||
    ctx === null ||
    // @ts-expect-error: For some reason, the wasm context is able to be constructed before
    // it's fully initialized... We need to check for that here by digging into its internals.
    ctx.ptr === 0
  ) {
    await new Promise((resolve: (value?: unknown) => void) =>
      setTimeout(resolve, 0)
    );
  }
}

export async function init(): Promise<void> {
  const start = Date.now();

  wasm = await import("@/quacs-rs");
  wasm.init();
  ctx = new wasm.WasmContext();
  const end = Date.now();

  // eslint-disable-next-line
  console.log(`wasm initialized, took ${end - start}ms`);
}

export async function generateSchedulesAndConflicts(): Promise<number> {
  await waitForInitialization();

  return wasm.generateSchedulesAndConflicts(ctx);
}

export async function setSelected(
  crn: string,
  selected: boolean
): Promise<void> {
  await waitForInitialization();

  return wasm.setSelected(ctx, parseInt(crn), selected);
}

export async function isInConflict(crn: number): Promise<boolean> {
  await waitForInitialization();

  return wasm.isInConflict(ctx, crn);
}

export async function getSchedule(idx: number): Promise<Uint32Array> {
  await waitForInitialization();

  return wasm.getSchedule(ctx, idx);
}
