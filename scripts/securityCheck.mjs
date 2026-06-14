// Security check for the embedded AI lab.
//
// Scans the repository (excluding node_modules and dist) for:
// - external AI API endpoints,
// - API key environment variable names,
// - .env files,
// - model weight files.
//
// Exits with code 1 if any forbidden content is found, 0 otherwise.

import { readdirSync, statSync, readFileSync } from 'node:fs'
import { join, extname, basename, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git'])

// Forbidden substrings to find inside text files.
const FORBIDDEN_STRINGS = [
  'api.openai.com',
  'api.anthropic.com',
  'generativelanguage.googleapis.com',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GEMINI_API_KEY',
]

// Forbidden file name patterns (env files).
function isEnvFile(name) {
  return name === '.env' || name.startsWith('.env.')
}

// Forbidden model weight extensions.
const WEIGHT_EXTS = new Set(['.safetensors', '.gguf', '.onnx', '.bin'])

// Only scan these extensions for forbidden strings (text-like files).
const TEXT_EXTS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.html',
  '.css',
  '.md',
  '.yml',
  '.yaml',
  '.txt',
])

// This script intentionally contains the forbidden strings as data; skip it.
const SELF = resolve(here, 'securityCheck.mjs')

// The test suite intentionally references the forbidden strings to assert their
// ABSENCE in the app code. Exempt the test dir from the string scan (env and
// weight-file checks still apply everywhere).
function isStringScanExempt(full, rel) {
  if (full === SELF) return true
  const norm = rel.split('\\').join('/')
  return norm === 'test' || norm.startsWith('test/')
}

const findings = []

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      walk(full)
      continue
    }
    const rel = relative(root, full)

    // Env files are forbidden by name.
    if (isEnvFile(basename(full))) {
      findings.push(`env file present: ${rel}`)
      continue
    }

    // Model weight files are forbidden by extension.
    if (WEIGHT_EXTS.has(extname(full))) {
      findings.push(`model weight file present: ${rel}`)
      continue
    }

    // Scan text files for forbidden strings (skip self and the test dir).
    if (isStringScanExempt(full, rel)) continue
    if (TEXT_EXTS.has(extname(full))) {
      let content
      try {
        content = readFileSync(full, 'utf8')
      } catch {
        continue
      }
      for (const needle of FORBIDDEN_STRINGS) {
        if (content.includes(needle)) {
          findings.push(`forbidden string "${needle}" in ${rel}`)
        }
      }
    }
  }
}

walk(root)

if (findings.length > 0) {
  console.error('Security check FAILED:')
  for (const f of findings) console.error('  - ' + f)
  process.exit(1)
}

console.log('Security check passed: no forbidden content found.')
process.exit(0)
