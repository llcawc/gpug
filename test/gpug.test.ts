import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Transform } from 'node:stream'

import { describe, expect, it } from 'vitest'

import { gpug } from '../src/gpug'

/**
 * Минимальная имитация vinyl-файла, на котором работает gulp-плагин.
 */
interface FakeFile {
  isNull(): boolean
  isStream(): boolean
  isBuffer(): boolean
  path: string
  contents: unknown
  data: Record<string, unknown>
  extname?: string
}

function createFile(options: Partial<FakeFile> = {}): FakeFile {
  return {
    isNull: () => false,
    isStream: () => false,
    isBuffer: () => true,
    path: '/tmp/example.pug',
    contents: Buffer.from('p Hello, world!'),
    data: {},
    ...options,
  }
}

/** Прогоняет файл через transform-плагин и возвращает результат. */
function run(plugin: Transform, file: FakeFile): Promise<FakeFile> {
  return new Promise((resolve, reject) => {
    plugin.once('data', resolve)
    plugin.once('error', reject)
    plugin.end(file)
  })
}

/** Компилирует pug-разметку с переданными данными. */
async function compile(
  contents: string,
  options: Parameters<typeof gpug>[0] = {},
  data: Record<string, unknown> = {},
): Promise<FakeFile> {
  const file = createFile({ contents: Buffer.from(contents), data })
  return run(gpug(options), file)
}

describe('gpug', () => {
  it('компилирует pug в html и меняет расширение файла', async () => {
    const file = await compile('p Hello, world!')

    expect(file.contents!.toString()).toBe('<p>Hello, world!</p>')
    expect(file.extname).toBe('.html')
  })

  it('передаёт данные в шаблон из file.data и options.data', async () => {
    const file = await compile(
      'p= name + ", " + tagline',
      { data: { tagline: 'gpug' } },
      { name: 'Vitest' },
    )

    expect(file.contents!.toString()).toBe('<p>Vitest, gpug</p>')
  })

  it('file.data имеет приоритет над options.data', async () => {
    const file = await compile('p= lang', { data: { lang: 'pug' } }, { lang: 'jade' })

    expect(file.contents!.toString()).toBe('<p>jade</p>')
  })

  it('поддерживает атрибуты, интерполяцию и миксины', async () => {
    const file = await compile(
      [
        'mixin item(name)',
        '  li= name',
        '',
        'div(class="list").container',
        '  h1= title',
        '  ul',
        '    +item("first")',
        '    +item("second")',
      ].join('\n'),
      {},
      { title: 'Sample' },
    )

    expect(file.contents!.toString()).toBe(
      '<div class="list container"><h1>Sample</h1><ul><li>first</li><li>second</li></ul></div>',
    )
  })

  it('использует path файла как filename и раскрывает include с диска', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'gpug-'))
    try {
      writeFileSync(join(dir, 'partial.pug'), 'p Partial content')
      const index = join(dir, 'index.pug')
      writeFileSync(index, 'include partial\np Main')

      const file = createFile({ path: index, contents: Buffer.from('include partial\np Main') })
      const result = await run(gpug(), file)

      expect(result.contents!.toString()).toBe('<p>Partial content</p><p>Main</p>')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('пропускает null-файлы без изменений', async () => {
    const file = createFile({ contents: null, isNull: () => true })

    const result = await run(gpug(), file)

    expect(result).toBe(file)
    expect(result.contents).toBeNull()
    expect(result.extname).toBeUndefined()
  })

  it('возвращает PluginError для stream-файлов', async () => {
    const file = createFile({ contents: 'string, not buffer', isStream: () => true })

    await expect(run(gpug(), file)).rejects.toMatchObject({ plugin: 'gpug' })
  })

  it('возвращает PluginError для неподдерживаемого типа содержимого', async () => {
    const file = createFile({ contents: 42 })

    await expect(run(gpug(), file)).rejects.toMatchObject({ plugin: 'gpug' })
  })

  it('оборачивает ошибки компиляции в PluginError с путём файла', async () => {
    const file = createFile({ path: '/tmp/broken.pug', contents: Buffer.from('p(class=') })

    await expect(run(gpug(), file)).rejects.toMatchObject({
      plugin: 'gpug',
      fileName: '/tmp/broken.pug',
    })
  })
})
