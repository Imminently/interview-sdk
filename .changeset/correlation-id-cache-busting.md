---
"@imminently/interview-sdk": patch
---

Every session request now carries a fresh correlation id, so a browser or proxy cache can no longer replay an earlier response and leave an interview stuck on a screen:

- `RemoteInterviewBackend` sends the id as the `X-Correlation-Id` header and as a `correlationId` query param on create, load, submit, chat, navigate, back, simulate and exportTimeline. The query param gives every request a unique URL.
- The id decisionapi echoes back (response header, then body) must match the one sent, otherwise the request throws the new `StaleResponseError`. A missing echo is accepted, so this works against decisionapi versions that don't echo the id yet.
- Dynamic (simulate) updates now drop out-of-order responses by correlation id. `SimulateOptions` accepts an optional `correlationId`.
- Exported `createCorrelationId`, `withCorrelation`, `getEchoedCorrelationId`, `assertCorrelated`, `StaleResponseError`, `CORRELATION_HEADER` and `CORRELATION_PARAM`.
