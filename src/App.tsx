import { useRef, useState } from 'react'
import './App.css'
import {
  ENGINE_NAME,
  MODEL_ID,
  SAMPLE_INPUT,
  buildPrompt,
  createPipeline,
  isModelConfigured,
} from './embeddedAi/transformersFallbackLab'
import type { LoadedModel } from './embeddedAi/transformersFallbackLab'
import { classifyError } from './embeddedAi/errorClassifier'
import { createDiagnosticLogEntry, formatDiagnosticLog } from './embeddedAi/diagnosticLog'
import type { DiagnosticLogEntry } from './embeddedAi/diagnosticLog'

const MODEL_ID_DISPLAY = isModelConfigured() ? MODEL_ID : 'model-id-not-configured'

function App() {
  const modelRef = useRef<LoadedModel | null>(null)
  const [status, setStatus] = useState('idle')
  const [backend, setBackend] = useState('unknown')
  const [output, setOutput] = useState('')
  const [logs, setLogs] = useState<DiagnosticLogEntry[]>([])

  function addLog(entry: DiagnosticLogEntry) {
    setLogs((prev) => [...prev, entry])
  }

  async function handleLoad() {
    setStatus('loading')
    const loadStartedAt = Date.now()
    try {
      const model = await createPipeline()
      modelRef.current = model
      setBackend(model.backend)
      setStatus('loaded')
      addLog(
        createDiagnosticLogEntry({
          engine: ENGINE_NAME,
          modelId: MODEL_ID_DISPLAY,
          backend: model.backend,
          loadStartedAt,
          loadFinishedAt: Date.now(),
          success: true,
          inputLength: 0,
          outputLength: 0,
        }),
      )
    } catch (e) {
      const c = classifyError(e, 'load')
      setStatus('error: ' + c.errorType)
      setOutput(c.suggestedAction)
      addLog(
        createDiagnosticLogEntry({
          engine: ENGINE_NAME,
          modelId: MODEL_ID_DISPLAY,
          backend,
          loadStartedAt,
          loadFinishedAt: Date.now(),
          success: false,
          errorType: c.errorType,
          errorMessage: c.message,
          inputLength: 0,
          outputLength: 0,
        }),
      )
    }
  }

  async function handleGenerate() {
    setStatus('generating')
    const generationStartedAt = Date.now()
    const inputLength = SAMPLE_INPUT.length
    try {
      const model = modelRef.current
      if (!model) throw new Error('generation-failed: model not loaded')
      const text = await model.generate(buildPrompt(SAMPLE_INPUT))
      setOutput(text)
      setStatus('done')
      addLog(
        createDiagnosticLogEntry({
          engine: ENGINE_NAME,
          modelId: MODEL_ID_DISPLAY,
          backend,
          generationStartedAt,
          generationFinishedAt: Date.now(),
          success: true,
          inputLength,
          outputLength: text.length,
        }),
      )
    } catch (e) {
      const c = classifyError(e, 'generate')
      setStatus('error: ' + c.errorType)
      setOutput(c.suggestedAction)
      addLog(
        createDiagnosticLogEntry({
          engine: ENGINE_NAME,
          modelId: MODEL_ID_DISPLAY,
          backend,
          generationStartedAt,
          generationFinishedAt: Date.now(),
          success: false,
          errorType: c.errorType,
          errorMessage: c.message,
          inputLength,
          outputLength: 0,
        }),
      )
    }
  }

  async function handleCopyLog() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(formatDiagnosticLog(logs))
    }
  }

  return (
    <main className="lab">
      <h1>Oriex Embedded AI Lab</h1>

      <p>Engine: {ENGINE_NAME}</p>
      <p>Model ID: {MODEL_ID_DISPLAY}</p>
      <p>Backend: {backend}</p>
      <p>Status: {status}</p>

      <button type="button" onClick={handleLoad}>
        Load model
      </button>
      <button type="button" onClick={handleGenerate}>
        Generate
      </button>

      <h2>Sample input</h2>
      <p className="sample">{SAMPLE_INPUT}</p>

      <h2>Output</h2>
      <pre className="output">{output || '(no output)'}</pre>

      <h2>Diagnostic log</h2>
      <button type="button" onClick={handleCopyLog} disabled={logs.length === 0}>
        Copy log
      </button>
      <pre className="log">{logs.length ? formatDiagnosticLog(logs) : '(no log)'}</pre>

      <h2>Safety notes</h2>
      <ul>
        <li>No external AI API (OpenAI / Anthropic / Gemini).</li>
        <li>No API key, no .env.</li>
        <li>Input and output text are never saved to browser storage.</li>
        <li>Diagnostic log stores lengths only, never the text.</li>
        <li>Model weights are not bundled in this repo.</li>
        <li>Inference runs in-browser (Transformers.js / WASM).</li>
      </ul>
    </main>
  )
}

export default App
