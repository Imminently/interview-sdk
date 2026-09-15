# Changelog

## v5.0.0

### Added

- Added local interview backend support for server-started sessions, local page turns, shared storage, manager cloning, and object navigation targets.
- Added `MockInterviewBackend` and `createMockInterviewSession()` for SDK and consumer tests.

### Changed

- Reworked `SessionManager` to use the `InterviewBackend` abstraction across remote, local, and mock interview backends.
- `RemoteInterviewBackend` now swaps to `MockInterviewBackend` in test environments so tests can use the real SDK surface without HTTP calls.
