# @imminently/interview-sdk

## 5.2.2

### Patch Changes

- 815bfc2: Every session request now carries a fresh correlation id, so a browser or proxy cache can no longer replay an earlier response and leave an interview stuck on a screen:
  
  - `RemoteInterviewBackend` sends the id as the `X-Correlation-Id` header and as a `correlationId` query param on create, load, submit, chat, navigate, back, simulate and exportTimeline. The query param gives every request a unique URL.
  - The id decisionapi echoes back (response header, then body) must match the one sent, otherwise the request throws the new `StaleResponseError`. A missing echo is accepted, so this works against decisionapi versions that don't echo the id yet.
  - Dynamic (simulate) updates now drop out-of-order responses by correlation id. `SimulateOptions` accepts an optional `correlationId`.
  - Exported `createCorrelationId`, `withCorrelation`, `getEchoedCorrelationId`, `assertCorrelated`, `StaleResponseError`, `CORRELATION_HEADER` and `CORRELATION_PARAM`.

## 5.2.1

No changes in this release.

## 5.2.0

### Minor Changes

- Updating to changeset for publishing

## 5.1.0

### Minor Changes

- Added `SessionManager.findAttributeNode`, `getAttributeText` and `describeAttribute` for resolving an attribute's description and entity from the client graph. `describeAttribute` reports `foundInGraph` so callers can tell a resolved description apart from fallback text.
- Added `SessionManager.downloadGraph()` to download the decompressed client graph for the active session.
- Added and exported `isGuidShaped`, for telling a backend-generated GUID node id apart from a canonical-text attribute name.
- Added and exported `generateEntityInstanceId`. Entity instances now get readable ids (`<entityName>-<index>-<shortId>`) instead of raw UUIDs.

### Patch Changes

- Restored time-control normalization (`normalizeSessionControls`) in the remote backend, which was lost when the backends were split, so string `minutes_increment` values work again. The local backend now applies it too.
- `ApiManager` and `ApiManagerOptions` are now deprecated aliases of `RemoteInterviewBackend` and `RemoteInterviewBackendOptions`, replacing the duplicated class.
- `attributeToFieldName` now always resolves nested entity paths by `@id` and encodes literal `.` characters, fixing canonical attribute names containing `.` that were mis-resolved.
- Removed the unused, deprecated internal `api` module.

## 5.0.0

### Major Changes

- Reworked `SessionManager` to use the `InterviewBackend` abstraction across remote, local, and mock interview backends.
- Added support for canonical ids: attributes can now be identified by their canonical text name rather than only a GUID. Characters that react-hook-form strips or splits on (`%`, `"`, `'`, `.`, `[`, `]`, `|`) are percent-encoded in field names, via the new exported `encodeFieldSegment`, `decodeFieldSegment`, `encodeFieldPath`, `decodeFieldPath` and `decodeFormData` helpers.
- Replaced `attributeToPath` with `attributeToFieldName`, which returns react-hook-form-safe encoded field names. Values read back from the form must be decoded (see `decodeFieldPath` / `decodeFormData`) before being passed to the manager.

### Minor Changes

- Added local interview backend support for server-started sessions, local page turns, shared storage, manager cloning, and object navigation targets.
- Added `MockInterviewBackend` and `createMockInterviewSession()` for SDK and consumer tests.
- `RemoteInterviewBackend` now swaps to `MockInterviewBackend` in test environments so tests can use the real SDK surface without HTTP calls.
- Added and exported `baseAttributeId`, which returns the last `/` segment of an attribute path.

### Patch Changes

- Attribute paths are now split on `/` only, so a `.` is always treated as a literal character in a canonical attribute name. This fixes dynamic solve throwing or placing values in the wrong spot for entity-pathed attributes with a dotted name.
- `getExplanation` now splits the attribute on `/` instead of `.`, matching how `session.explanations` is keyed.
