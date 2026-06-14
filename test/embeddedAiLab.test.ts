import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve, extname } from 'node:path'

import {
  classifyError,
  suggestedActionFor,
  SUGGESTED_ACTIONS,
} from '../src/embeddedAi/errorClassifier'
import type { EmbeddedAiErrorType } from '../src/embeddedAi/errorClassifier'
import { createDiagnosticLogEntry } from '../src/embeddedAi/diagnosticLog'
import { SAMPLE_INPUT } from '../src/embeddedAi/transformersFallbackLab'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

function listFiles(dir: string, exts: string[] | null): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      out.push(...listFiles(full, exts))
    } else if (!exts || exts.includes(extname(full))) {
      out.push(full)
    }
  }
  return out
}

function readSrc(): string {
  return listFiles(join(root, 'src'), ['.ts', '.tsx'])
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n')
}

const srcText = readSrc()
const labText = readFileSync(join(root, 'src/embeddedAi/transformersFallbackLab.ts'), 'utf8')

describe('transformers package loading', () => {
  it('is never statically imported at the top level', () => {
    const staticImport = /^\s*import\b[^\n]*['"]@huggingface\/transformers['"]/m
    expect(staticImport.test(srcText)).toBe(false)
  })

  it('is loaded only via a dynamic import', () => {
    expect(labText).toContain('@huggingface/transformers')
    expect(/import\s*\(/.test(labText)).toBe(true)
    expect(/import\s*\(\s*\/\*[^*]*\*\/\s*['"]@huggingface\/transformers['"]/.test(labText)).toBe(
      true,
    )
  })
})

describe('privacy of diagnostic log', () => {
  it('stores lengths only, never the input or output text', () => {
    const entry = createDiagnosticLogEntry({
      engine: 'Transformers.js / WASM fallback',
      modelId: 'model-id-not-configured',
      inputLength: SAMPLE_INPUT.length,
      outputLength: 42,
    })
    const serialized = JSON.stringify(entry)
    expect(serialized).not.toContain(SAMPLE_INPUT)
    expect(Object.keys(entry)).toContain('inputLength')
    expect(Object.keys(entry)).toContain('outputLength')
    expect(Object.keys(entry)).not.toContain('inputText')
    expect(Object.keys(entry)).not.toContain('outputText')
    expect(Object.keys(entry)).not.toContain('prompt')
    expect(Object.keys(entry)).not.toContain('generatedText')
  })
})

describe('no forbidden persistence or services', () => {
  it('does not save the prompt to localStorage', () => {
    expect(srcText).not.toContain('localStorage')
  })

  it('does not use Firebase', () => {
    expect(srcText.toLowerCase()).not.toContain('firebase')
    const pkg = readFileSync(join(root, 'package.json'), 'utf8').toLowerCase()
    expect(pkg).not.toContain('firebase')
  })

  it('has no external AI API endpoints', () => {
    expect(srcText).not.toContain('api.openai.com')
    expect(srcText).not.toContain('api.anthropic.com')
    expect(srcText).not.toContain('generativelanguage.googleapis.com')
  })
})

describe('no unsafe DOM rendering', () => {
  it('does not use dangerouslySetInnerHTML', () => {
    expect(srcText).not.toContain('dangerouslySetInnerHTML')
  })

  it('does not use innerHTML', () => {
    expect(srcText).not.toContain('innerHTML')
  })
})

describe('no model weights in the repo', () => {
  it('has no weight files outside node_modules / dist', () => {
    const weightExts = ['.onnx', '.safetensors', '.bin', '.gguf', '.wasm']
    const skip = new Set(['node_modules', 'dist', '.git'])
    const found: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        if (skip.has(name)) continue
        const full = join(dir, name)
        const st = statSync(full)
        if (st.isDirectory()) walk(full)
        else if (weightExts.includes(extname(full))) found.push(full)
      }
    }
    walk(root)
    expect(found).toEqual([])
  })
})

describe('vite base', () => {
  it('is /oriex-embedded-ai-lab/', () => {
    const cfg = readFileSync(join(root, 'vite.config.ts'), 'utf8')
    expect(cfg).toContain("base: '/oriex-embedded-ai-lab/'")
  })
})

describe('error classifier', () => {
  it('maps a string error type directly', () => {
    expect(classifyError('model-id-not-configured').errorType).toBe('model-id-not-configured')
  })

  it('detects a missing module as transformers-not-installed', () => {
    expect(classifyError(new Error('Failed to resolve module specifier')).errorType).toBe(
      'transformers-not-installed',
    )
  })

  it('detects a timeout', () => {
    expect(classifyError(new Error('operation timed out')).errorType).toBe('load-timeout')
  })

  it('falls back to generation-failed during the generate phase', () => {
    expect(classifyError(new Error('weird'), 'generate').errorType).toBe('generation-failed')
  })

  it('returns a non-empty suggested action for every error type', () => {
    const types = Object.keys(SUGGESTED_ACTIONS) as EmbeddedAiErrorType[]
    for (const t of types) {
      expect(suggestedActionFor(t).length).toBeGreaterThan(0)
    }
  })
})
