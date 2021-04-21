import type { WasmContext } from "@/quacs-rs";

type WasmType = typeof import("@/quacs-rs");

// @ts-expect-error: after initialization, this won't be null
let ctx: WasmContext = null;
// @ts-expect-error: after initialization, this won't be null
let wasm: WasmType = null;

function isInitialized(): boolean {
  return (
    wasm !== null &&
    ctx !== null &&
    // @ts-expect-error: For some reason, the wasm context is able to be constructed before
    // it's fully initialized... We need to check for that here by digging into its internals.
    ctx.ptr !== 0
  );
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
  while (!isInitialized()) {
    await new Promise((resolve: (value?: unknown) => void) =>
      setTimeout(resolve, 0)
    );
  }

  return wasm.generateSchedulesAndConflicts(ctx);
}

export async function setSelected(
  crn: string,
  selected: boolean
): Promise<void> {
  while (!isInitialized()) {
    await new Promise((resolve: (value?: unknown) => void) =>
      setTimeout(resolve, 0)
    );
  }

  return wasm.setSelected(ctx, parseInt(crn), selected);
}

export async function isInConflict(crn: number): Promise<boolean> {
  while (!isInitialized()) {
    await new Promise((resolve: (value?: unknown) => void) =>
      setTimeout(resolve, 0)
    );
  }

  return wasm.isInConflict(ctx, crn);
}

export async function getSchedule(idx: number): Promise<Uint32Array> {
  while (!isInitialized()) {
    await new Promise((resolve: (value?: unknown) => void) =>
      setTimeout(resolve, 0)
    );
  }

  return wasm.getSchedule(ctx, idx);
}
