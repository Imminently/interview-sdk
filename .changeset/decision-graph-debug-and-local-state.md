---
"@imminently/interview-sdk": minor
---

Uses `@imminently/decisively-core` 0.5 and decision graphs:

- Session requests ask for the client graph as a decision graph (`clientGraphFormat: "decisionGraph"`), and decisionapi sends `clientDecisionGraph` in place of `clientGraph`: about a third of the size on the wire (0.34 MB against 0.93 MB for a client graph the size of a large release's rule graph), and the rules engine reads its bytes directly for client-side solves. Sessions holding either form keep working (`clientRuleGraph`, `clientReleaseGraph`). Requires a decisionapi that knows `clientGraphFormat`; older SDKs, which don't send it, still get `clientGraph`.
- The client-side debug solve asks the rules engine for a decision graph (the legacy `graph` element is deprecated) and still returns `graph`, built from it in the legacy shape (`legacyDebugGraph`).
- Local interviews now pass the session's state to the engine, so a solve continues from the previous one (it was passed as `{}` and ignored).
