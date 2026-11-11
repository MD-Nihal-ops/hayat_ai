# Hayat AI Model Benchmark

Standalone evaluation only. It does not import into or change the production chatbot. All prompts, tool data, and vision pixels are synthetic.

## Current API capability snapshot

`model-capabilities.json` is copied from the public `https://api.xkiro.com/v1/models` listing, checked 2026-11-10. The four requested model IDs are listed as free, and the listing advertises vision, tools, and reasoning for each. It reports:

| Model ID | Context | Maximum output | Advertised reasoning efforts |
|---|---:|---:|---|
| `mistralai/mistral-small-2603` | 256,000 | 65,536 | none, high |
| `cohere/command-a-plus` | 436,000 | 64,000 | high |
| `sensenova/sensenova-6.8-flash-lite` | 262,144 | 65,536 | none, low, medium, high |
| `mistralai/mistral-medium-3.5` | 256,000 | 65,536 | none, high |

The listing does not declare structured-JSON support. The runner probes JSON response-format acceptance and validates the exact requested output. Advertised capabilities are not treated as guaranteed runtime behavior.

## Credentials and safety

The API key previously shown in terminal context must be revoked/rotated before running. The runner requires `XKIRO_BENCHMARK_KEY_ROTATED=1` as an explicit confirmation; without it, it writes blocked/empty output files and makes no requests. It never prints request headers or credential values.

The runner loads server environment values with the existing `dotenv` dependency. Enter a newly rotated xKiro key via masked PowerShell input, not as a command literal:

```powershell
$secure = Read-Host "Rotated xKiro API key" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
    $env:XKIRO_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    $env:XKIRO_BENCHMARK_KEY_ROTATED = "1"
    node server/scripts/ai-benchmark/run.js
}
finally {
    $env:XKIRO_API_KEY = $null
    $env:XKIRO_BENCHMARK_KEY_ROTATED = $null
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    $secure.Dispose()
}
```

The optional Gemini baseline uses `AI_API_KEY` and `AI_MODEL_PRIMARY` from the existing server environment, calls that primary model directly, and does not use Gemini fallback. If those values are unavailable, xKiro tests still run and Gemini is omitted. The key stays server-side.

## Measurements

The runner calls models sequentially for prompts A-G, tool, vision, and reasoning probes, with three runs per test and a 512-token output cap. Text, JSON, tool-call-first-turn, and vision requests use streaming for TTFT where supported. Tool results are fixed synthetic data from `get_demo_wellness_info`; the vision PNG is generated in memory (red square, blue circle, green triangle). Reasoning-control acceptance is recorded from API success; unsupported settings remain failed measurements rather than being silently skipped.

Automated safety flags are heuristic and require human review. They do not change production safety controls. API errors are recorded without authorization headers; model text is synthetic benchmark output.

Outputs are overwritten under `server/scripts/ai-benchmark/output/`:

- `results.csv`
- `raw-measurements.json`
- `comparison.md`

Run syntax-only validation with `node --check server/scripts/ai-benchmark/run.js`. Do not run the benchmark until the exposed credential has been rotated.
