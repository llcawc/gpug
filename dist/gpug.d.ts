import { Transform } from "node:stream";
import { Options } from "pug";
//#region src/gpug.d.ts
interface GpugOptions extends Options {
  data?: Record<string, unknown>;
}
declare function gpug(options?: GpugOptions): Transform;
//#endregion
export { gpug };