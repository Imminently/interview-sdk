# Changelog

## v5.0.0-alpha.1

### Added

- Added `SessionBackend` as the SDK backend abstraction, with `RemoteSessionBackend` for server-backed interviews and `LocalSessionBackend` for locally processed interview page turns.
- Added local interview support that starts sessions on the backend, receives pruned `localReleaseData` and `clientGraph`, runs page turns through the local rules engine, and syncs completion back to the backend.
- Added caller-provided `LocalSessionBackendStorage` with `load()` and `save()` so consumers can share local session/interaction state across cloned managers or multiple screens.
- Added `SessionManager.clone()` for creating a manager around an existing session snapshot without creating or loading a new server session.
- Added object navigation targets via `{ stepId, instancePath }`, while keeping string step IDs supported at the SDK boundary.
- Added session lifecycle events for session start, session update, active-session changes, reset, and errors.
- Added Playwright timeline/test generation helpers and expanded response override support.
- Added SDK and UI test coverage across controls, containers, validation, lifecycle hooks, reporting, response overrides, local backend behaviour, and utility functions.
- Added a richer UI debug panel with tabs for overview, controls, form state, sequence, session data, steps, and validations.
- Added `Interview.Reset`, `Interview.Title`, `DataContainer`, `NumberOfInstancesControl`, `Switch`, numerical utilities, and form-sync helpers.
- Added SDK skill documentation covering configuration, customization, examples, patterns, session manager usage, UI components, and validation.

### Changed

- Split the old API manager implementation into `backend/backend.ts`, `backend/remote-backend.ts`, and `backend/local-backend.ts`.
- Deprecated `apiManager` manager options in favour of `backend`; `ApiManager` remains as an alias for `RemoteSessionBackend`.
- Renamed the backend concept around session backends rather than API managers, while preserving compatibility exports.
- Moved client graph handling to the backend/session flow so local page turns use the server-provided client graph rather than embedding the whole rule graph in release data.
- Refactored `SessionManager` to use the backend abstraction for create, load, submit, navigate, back, simulate, chat, connected data, rules engine loading, and timeline export.
- Refactored UI validation from one large validation module into per-control validation modules.
- Updated the interview form/provider flow so submit buttons use provider-owned form submission and avoid accidentally passing DOM events into `manager.next`.
- Improved debug settings persistence and debug UI rendering.
- Updated number, currency, date/time, radio, entity, file, option, and text control handling and validation behaviour.
- Updated package metadata and build/test configuration for the v5 package structure.

### Fixed

- Fixed client-side dynamic construction from pre-processed state and reporting attribute handling.
- Fixed several form validation, default value, numerical parsing, and entity/container rendering edge cases.
- Fixed local rules engine loading so the runtime is cached and checksum-based script loading is stable.
- Fixed local interview parity with remote interviews for server-started sessions, initial data, client graphs, full session data baselines, completion syncing, and `serverSideDynamic: false`.
- Fixed local backend construction so `releaseData` is no longer accepted; release data must come from backend `localReleaseData`.
- Fixed local navigation serialization so Rust receives normalized navigation options instead of mixed string/object payloads.

### Breaking

- `SessionManager` now requires `backend` or deprecated `apiManager`; constructing a remote backend from missing/undefined options is no longer supported.
- `apiManager` is deprecated and consumers should pass `backend` instead.
- `LocalSessionBackend` no longer accepts `releaseData`; local release data must be returned by backend session create/load responses.
- Local interview navigation is normalized to an options object for Rust (`{ stepId, instancePath }`), so lower-level engine integrations should no longer send a bare string to Rust interview response elements.
- Validation internals and several UI control utilities moved to new module paths.
