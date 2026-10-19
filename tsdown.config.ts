import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/gpug.ts'],
  format: {
    esm: {
      fixedExtension: false,
      target: ['esnext'],
    },
    cjs: {
      target: ['node20'],
    },
  },
  exports: true,
})
