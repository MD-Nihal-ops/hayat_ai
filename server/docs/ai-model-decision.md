# Hayat AI Chat Model Decision

**Decision (10 November 2026):** Mistral Medium 3.5 (`mistralai/mistral-medium-3.5`) is the selected xKiro chat candidate. The integration uses xKiro's OpenAI-compatible Chat Completions endpoint. This is a staged model choice, not a medical-safety endorsement or a claim that the model is currently active in the deployment.

## Evidence and rationale

- The completed synthetic benchmark recorded 21/21 successful, non-empty prompt responses for both Mistral Medium 3.5 and Mistral Small 2603. Both passed the exact JSON, synthetic tool-result, and colored-shape vision checks 3/3 times.
- Medium ranked first at 86.5%, versus Small at 85.1%. Its aggregate score is not treated as conclusive: the formula includes a failure-sensitive relative-latency component, and the benchmark has only three trials per task.
- Medium's median prompt time was 2,029 ms, close to Small's 1,967 ms. Small had the better mean (2,357 ms versus 3,324 ms), while Medium's automated heuristic checks scored 88.1% versus Small's 78.6%. Those checks are not clinically validated; both models had weak results on some family/medication format checks.
- Cohere had five empty responses among 21 successful prompt calls, and SenseNova was much slower in this run. Neither is preferred for the initial integration.
- On 10 November 2026, the public [xKiro catalog](https://xkiro.com/models) and the [Mistral Medium 3.5 model page](https://xkiro.com/models/mistralai/mistral-medium-3.5) listed the selected model as free-tier with vision and tool support. The live catalog exposed no deprecation/status field. The model page warns that free models are subject to daily allowances and that model availability may change. This is a point-in-time check, not a lifecycle guarantee.

## Privacy gate and operating limits

xKiro's published [Privacy Policy](https://xkiro.com/privacy) states that prompts are forwarded to the selected model provider and that request/response bodies are not retained, while allowing brief diagnostic capture for specific errors. Its [Terms](https://xkiro.com/terms) state that model availability may change and depends on third-party providers. The reviewed public materials do not establish the downstream model provider's applicable retention/data-use terms or a healthcare data-processing agreement. The [OpenAI-compatible API guide](https://docs.xkiro.com/guides/sdk-openai/) documents the `/v1/chat/completions` format used by the adapter.

Accordingly, `AI_CHAT_PROVIDER` defaults to `gemini` and `XKIRO_ALLOW_HEALTH_DATA` defaults to `false`. The xKiro adapter is not sent health-bearing chat content unless an operator explicitly enables the gate after appropriate privacy/legal review. When xKiro is enabled and fails, the existing Gemini path remains the fallback. No safety guarantee is inferred from the benchmark.

Before enabling xKiro for real Hayat AI conversations, verify the current xKiro and upstream provider terms, retention, processing locations, and contractual controls; configure and rotate credentials server-side; and re-check model availability and budget/allowance. Deterministic emergency and output guards remain in place.
