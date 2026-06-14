import { useRef, useState } from 'react'
import './App.css'
import {
  ENGINE_NAME,
  SAMPLE_INPUT,
  buildPrompt,
  createPipeline,
} from './embeddedAi/transformersFallbackLab'
import type { LoadedModel } from './embeddedAi/transformersFallbackLab'
import { MODEL_CANDIDATES, DEFAULT_CANDIDATE_ID, getCandidate } from './embeddedAi/modelCandidates'
import { classifyError } from './embeddedAi/errorClassifier'
import { createDiagnosticLogEntry, formatDiagnosticLog } from './embeddedAi/diagnosticLog'
import type { DiagnosticLogEntry } from './embeddedAi/diagnosticLog'

// Columns shown in the benchmark table. Deliberately excludes any body text:
// only ids, timings, lengths and environment fields are listed.
const LOG_COLUMNS: { key: keyof DiagnosticLogEntry; label: string }[] = [
  { key: 'modelId', label: 'modelId' },
  { key: 'success', label: 'success' },
  { key: 'errorType', label: 'errorType' },
  { key: 'loadDurationMs', label: 'load ms' },
  { key: 'generationDurationMs', label: 'gen ms' },
  { key: 'inputLength', label: 'inLen' },
  { key: 'outputLength', label: 'outLen' },
  { key: 'deviceMemory', label: 'devMem' },
  { key: 'hardwareConcurrency', label: 'cores' },
  { key: 'secureContext', label: 'secure' },
  { key: 'hasIndexedDb', label: 'idb' },
]

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '-'
  return String(value)
}

function App() {
  const modelRef = useRef<LoadedModel | null>(null)
  // Selection is kept in component state only; never written to any storage.
  const [selectedId, setSelectedId] = useState(DEFAULT_CANDIDATE_ID)
  const selected = getCandidate(selectedId)
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
      const model = await createPipeline(selected.modelId, selected.timeoutMs)
      modelRef.current = model
      setBackend(model.backend)
      setStatus('loaded')
      addLog(
        createDiagnosticLogEntry({
          engine: ENGINE_NAME,
          modelId: selected.modelId,
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
          modelId: selected.modelId,
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
          modelId: selected.modelId,
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
          modelId: selected.modelId,
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

  // Clears the in-memory log only. No storage is used anywhere.
  function handleClearLog() {
    setLogs([])
  }

  const lastLog = logs.length > 0 ? logs[logs.length - 1] : null

  return (
    <main className="lab">
      <h1>Oriex Embedded AI Lab</h1>

      <p>Engine: {ENGINE_NAME}</p>
      <p>Model ID: {selected.modelId}</p>
      <p>Backend: {backend}</p>
      <p>Status: {status}</p>

      <h2>Model candidate</h2>
      <select
        aria-label="Model candidate"
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        {MODEL_CANDIDATES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
      <p className="note">Language: {selected.language}</p>
      <p className="note">Size: {selected.sizeNote}</p>
      <p className="note">Quality: {selected.qualityNote}</p>
      <p className="note">Risk: {selected.riskNote}</p>
      <p className="note">Timeout: {Math.round(selected.timeoutMs / 1000)}s</p>
      {selected.timeoutMs > 60000 ? (
        <p className="warning">This model may take several minutes or fail on some devices.</p>
      ) : null}

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

      <div className="summary">
        <strong>Last result:</strong>{' '}
        {lastLog ? (lastLog.success ? 'success' : `failed (${lastLog.errorType ?? 'unknown'})`) : '-'}
        {' | '}
        <strong>Load:</strong> {formatCell(lastLog?.loadDurationMs)} ms
        {' | '}
        <strong>Generate:</strong> {formatCell(lastLog?.generationDurationMs)} ms
        {' | '}
        <strong>Model:</strong> {lastLog?.modelId ?? '-'}
      </div>

      <div className="log-actions">
        <button type="button" onClick={handleCopyLog} disabled={logs.length === 0}>
          Copy log (JSON)
        </button>
        <button type="button" onClick={handleClearLog} disabled={logs.length === 0}>
          Clear log
        </button>
      </div>

      {logs.length > 0 ? (
        <div className="logtable-wrap">
          <table className="logtable">
            <thead>
              <tr>
                {LOG_COLUMNS.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((entry, i) => (
                <tr key={i}>
                  {LOG_COLUMNS.map((col) => (
                    <td key={col.key}>{formatCell(entry[col.key])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="note">(no log)</p>
      )}

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
