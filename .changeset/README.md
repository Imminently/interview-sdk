# Changesets

This directory manages versioning and publishing for `@imminently/interview-sdk` and `@imminently/interview-ui` via [Changesets](https://github.com/changesets/changesets).

The two packages are in a `fixed` group, so they always share the same version: bumping either one bumps both.

You shouldn't need to touch it directly. Run `bun run publish:sdk` from the repo root instead, which walks you through:

1. Picking the semver bump (patch/minor/major) and writing a summary for the changelog.
2. Bumping versions and updating changelogs.
3. Building the changed package(s).
4. Publishing to GitHub Packages.

See [scripts/publish-sdk.ts](../scripts/publish-sdk.ts) for the orchestration.
