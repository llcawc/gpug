# gpug

> Gulp plugin for compiling [Pug](https://pugjs.org) templates to HTML.

`gpug` is a tiny, focused Gulp plugin that pipes your `.pug` files through the official Pug compiler and emits ready-to-serve HTML. It is a modern, dependency-light alternative to `gulp-pug`, built for ESM-first Gulp 4 pipelines with full TypeScript support.

## Features

- Compiles Pug templates to HTML using the official [pug](https://www.npmjs.com/package/pug) compiler (v3).
- Renames output files to `.html`.
- Resolves `include` / `extends` relative to the source file — `file.path` is passed to Pug as `filename`.
- Provides template locals from `options.data` and the Vinyl `file.data` (`file.data` takes precedence).
- Passes every Pug compile option through: `pretty`, `doctype`, `basedir`, `filters`, `globals`, and more.
- Correct Gulp plugin semantics: null files pass through, stream files are rejected, and errors are wrapped in `PluginError` with the file path and stack trace.
- Dual package (ESM + CJS) with type declarations for both module systems.

## Install

```sh
npm install --save-dev @pasmurno/gpug
```

Requires Node.js 20+ and Gulp 4.

## Usage

### Basic

`gulpfile.mjs`:

```js
import { src, dest } from "gulp";
import { gpug } from "@pasmurno/gpug";

export function html() {
  return src("src/pug/**/*.pug").pipe(gpug()).pipe(dest("dist"));
}

export default html;
```

`src/pug/index.pug`:

```pug
doctype html
html
  head
    title Hello, gpug!
  body
    p Hello, world!
```

Run:

```sh
gulp
```

Output: `dist/index.html` with the compiled markup.

### Passing data to templates

Global data goes into `options.data`; per-file data goes into the Vinyl `file.data`. On a naming conflict, `file.data` wins:

```js
import { src, dest } from "gulp";
import { gpug } from "@pasmurno/gpug";

export function html() {
  return src("src/pug/**/*.pug")
    .pipe(
      gpug({
        pretty: true,
        data: {
          siteName: "gpug",
          year: new Date().getFullYear(),
        },
      }),
    )
    .pipe(dest("dist"));
}
```

`src/pug/index.pug`:

```pug
footer &copy; #{year} #{siteName}
```

### Files with include / extends

Since `file.path` is passed to Pug as `filename`, relative `include` and `extends` resolve next to the source file automatically:

`src/pug/page.pug`:

```pug
include partials/head.pug
p Main content
```

`src/pug/partials/head.pug`:

```pug
head
  title Page
```

For absolute paths, provide `basedir`:

```js
import path from "node:path";
import { src, dest } from "gulp";
import { gpug } from "@pasmurno/gpug";

export function html() {
  return src("src/pug/**/*.pug")
    .pipe(gpug({ basedir: path.resolve("src/pug") }))
    .pipe(dest("dist"));
}
```

### Error reporting

Compile errors are wrapped in a `PluginError` with `plugin: 'gpug'`, the offending file path in `fileName`, and the stack trace enabled (`showStack: true`), so Gulp reports the exact template and the reason.

## API

### `gpug(options?: GpugOptions): Transform`

Creates a Vinyl transform stream. Accepts the same options as the Pug compiler, plus `data`.

### Options

`GpugOptions` extends Pug's `Options`:

| Option                   | Type                                        | Default     | Description                                                                                           |
| ------------------------ | ------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------- |
| `data`                   | `Record<string, unknown>`                   | `{}`        | Globals available in every template as locals. Merged with `file.data`; `file.data` takes precedence. |
| `filename`               | `string`                                    | `file.path` | Always overridden — Pug resolves relative `include` / `extends` against the source file path.         |
| `basedir`                | `string`                                    | —           | Root directory used to resolve absolute `include` / `extends` paths.                                  |
| `doctype`                | `string`                                    | `'html'`    | Default doctype for the compiled HTML.                                                                |
| `pretty`                 | `boolean` / `string`                        | `false`     | Pretty-print the output.                                                                              |
| `filters`                | `Record<string, (text, options) => string>` | —           | Custom Pug filters.                                                                                   |
| `globals`                | `string[]`                                  | —           | Names of global objects to expose in templates.                                                       |
| `self`                   | `boolean`                                   | `false`     | Use a `self` namespace instead of locals.                                                             |
| `compileDebug` / `debug` | `boolean`                                   | —           | Pug debug options.                                                                                    |

Any other Pug `Options` values are accepted and forwarded to the compiler as-is.

## Behavior

- **Output**: file contents are replaced with the compiled HTML and `file.extname` becomes `.html`.
- **Null files** (for example, directories passed through the pipeline) pass through unchanged.
- **Stream files** are rejected with `PluginError('Streams are not supported')` — use buffered files (the default for `gulp.src()`).
- **Other content types** produce `PluginError('Unsupported file contents type')`.
- **Compile errors** are wrapped in `PluginError` including the file path and stack trace.

## TypeScript

The package ships type declarations for both ESM and CommonJS consumers:

```ts
import { gpug } from "@pasmurno/gpug";

gpug({
  data: { siteName: "gpug" },
  pretty: true,
});
```

## Keywords

gulp, pug, jade, templates, compile, html

## License

[MIT](./LICENSE) ©2026 pasmurno by llcawc (github.com/llcawc). Made with <span style="color:red;">❤</span> for beautiful architecture.
