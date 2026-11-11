# xKiro Four-Model Benchmark

- Run status: completed
- Generated: 2026-11-10T18:02:53.865Z
- Runs per test: 3
- Output cap: 512 tokens
- Baseline: existing Gemini primary model only; no fallback
- Synthetic inputs only. No production chatbot behavior was changed.

> Sequential synthetic benchmark; no real user, patient, production database, or clinic data used.

## Capability Snapshot

See [model-capabilities.json](../model-capabilities.json). The xKiro public model-list metadata advertises vision, tools, reasoning levels, context lengths, and output ceilings. It does not declare structured-JSON support, which is measured by `response_format` acceptance and exact-value validation. Advertised support is not treated as guaranteed runtime support.

## Results

| Model | Prompt success | Mean total ms | Median total ms | Exact JSON | Tool call + result | Vision | Safety checks |
|---|---:|---:|---:|---:|---:|---:|---:|
| mistralai/mistral-small-2603 | 100.0% | 2356.71 | 1966.95 | 100.0% | 100.0% (median 1846.46 ms) | 100.0% (median 926.39 ms) | 78.6% |
| cohere/command-a-plus | 100.0% | 3312.32 | 3501.88 | 100.0% | 100.0% (median 3342.74 ms) | 100.0% (median 3710.03 ms) | 90.5% |
| sensenova/sensenova-6.8-flash-lite | 100.0% | 13452.11 | 8823.56 | 100.0% | 100.0% (median 5251.08 ms) | 100.0% (median 4753.06 ms) | 85.7% |
| mistralai/mistral-medium-3.5 | 100.0% | 3324.31 | 2029.02 | 100.0% | 100.0% (median 2074.47 ms) | 100.0% (median 993.39 ms) | 88.1% |
| google/gemini-3.6-flash | 33.3% | 2391.95 | 628.17 | 0.0% | 0.0% (median 321.89 ms) | 33.3% (median 392.28 ms) | 45.2% |

## Answers

1. Fastest by median total response time: google/gemini-3.6-flash.
2. Lowest median total response time: google/gemini-3.6-flash.
3. Highest prompt reliability: mistralai/mistral-small-2603.
4. Best exact structured-output performance: mistralai/mistral-small-2603.
5. Best tool-calling performance: mistralai/mistral-small-2603.
6. Best vision performance: mistralai/mistral-small-2603.
7. Most consistent on automated medical-safety checks: cohere/command-a-plus. Manual review is still required.
8. Overall replacement candidate: mistralai/mistral-medium-3.5 . This is an evaluation ranking only and does not change or recommend a production switch without human review.

## Ranking

1. mistralai/mistral-medium-3.5: 86.5% overall (weighted equally across available reliability, safety, JSON, tools, vision, and relative latency metrics).
2. mistralai/mistral-small-2603: 85.1% overall (weighted equally across available reliability, safety, JSON, tools, vision, and relative latency metrics).
3. cohere/command-a-plus: 84.7% overall (weighted equally across available reliability, safety, JSON, tools, vision, and relative latency metrics).
4. sensenova/sensenova-6.8-flash-lite: 82.1% overall (weighted equally across available reliability, safety, JSON, tools, vision, and relative latency metrics).
5. google/gemini-3.6-flash: 35.3% overall (weighted equally across available reliability, safety, JSON, tools, vision, and relative latency metrics).

## Method Notes

- Text prompts A-G are identical across model requests; each was run sequentially 3 times where available.
- Time to first token is measured from request start to the first non-empty streamed content/tool delta.
- Tool tests use only the fixed synthetic `get_demo_wellness_info` function and fixed sample data.
- Vision tests use an in-memory generated PNG containing a red square, blue circle, and green triangle.
- Reasoning controls are requested only for xKiro reasoning tests using `none` and `high`, then acceptance is recorded from HTTP success. Cohere Command A+ advertises `high` only, so `none` may be rejected.
- Gemini reasoning controls are reported as not tested because the benchmark uses its direct existing SDK baseline without guessing a provider-specific setting.
- Failures are retained as result rows; subsequent model calls continue.
