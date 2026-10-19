import { Buffer } from 'node:buffer'
import { Transform } from 'node:stream'

import PluginError from 'plugin-error'
import { compile, type Options } from 'pug'

interface GpugOptions extends Options {
  data?: Record<string, unknown>
}

function gpug(options: GpugOptions = {}): Transform {
  return new Transform({
    objectMode: true,
    transform(file, _enc, cb) {
      if (file.isNull()) {
        return cb(null, file)
      }

      if (file.isStream()) {
        return cb(new PluginError('gpug', 'Streams are not supported'))
      }

      if (!file.isBuffer()) {
        return cb(new PluginError('gpug', 'Unsupported file contents type', { fileName: file.path }))
      }

      const opts = { ...options, filename: file.path }
      const locals = { ...opts.data, ...file.data }

      try {
        const compiled = compile(file.contents.toString('utf8'), opts)(locals)
        file.contents = Buffer.from(compiled)
        file.extname = '.html'
        cb(null, file)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        cb(new PluginError('gpug', error, { fileName: file.path, showStack: true }))
      }
    },
  })
}

// export
export { gpug }
