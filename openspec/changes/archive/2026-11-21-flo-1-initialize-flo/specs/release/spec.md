# Spec Delta

## Purpose

How a version of flo is released: what pull requests check, which pushes to `main` publish to npm, how each npm version maps to a git tag and a GitHub release, and what happens when part of a release already exists.

## ADDED Requirements

### Requirement: Pull requests check the package

Every pull request to `main` SHALL run the tests and `npm pack --dry-run`, and SHALL NOT publish, tag or create a release.

#### Scenario: A pull request is opened or updated

- **WHEN** a pull request targeting `main` is opened or pushed to
- **THEN** a check named `test` runs the tests and `npm pack --dry-run`, and fails if either fails
- **AND** nothing is published to npm, and no tag or GitHub release is created

### Requirement: A push to main publishes a new version

On every push to `main`, after the tests pass, the version in `package.json` SHALL be published to npm as `flo-ai` if npm doesn't have it yet. A push whose version is already on npm SHALL publish nothing.

#### Scenario: Version bumped

- **GIVEN** `package.json` says `0.2.0` and npm has `0.1.0`
- **WHEN** the commit is pushed to `main`
- **THEN** `flo-ai@0.2.0` is published to npm with provenance and becomes `latest`

#### Scenario: No bump

- **GIVEN** `package.json` says `0.1.0` and npm already has `0.1.0`
- **WHEN** a commit is pushed to `main`
- **THEN** nothing is published, and the run says the version is already on npm

#### Scenario: Tests fail

- **WHEN** a push to `main` fails its tests
- **THEN** nothing is published, tagged or released

### Requirement: Versions only move forward

A release SHALL refuse a version lower than npm's current `latest`, and a version that isn't plain `major.minor.patch`. A refusal SHALL fail the run before anything is published or tagged.

#### Scenario: Lower than latest

- **GIVEN** npm's `latest` is `0.2.0` and `package.json` says `0.1.5`
- **WHEN** the commit is pushed to `main`
- **THEN** the run fails, saying the version is lower than `latest`, and nothing is published or tagged

#### Scenario: Pre-release version

- **GIVEN** `package.json` says `0.2.0-beta.1`
- **WHEN** the commit is pushed to `main`
- **THEN** the run fails, and nothing is published or tagged

### Requirement: Each released version has a tag and a GitHub release

After its version is on npm, a push to `main` SHALL make sure tag `v<version>` exists on the pushed commit and that a GitHub release for that tag exists, with generated notes. No release SHALL commit to `main`.

#### Scenario: First release of a version

- **WHEN** `0.2.0` is published from commit `abc123` on `main`
- **THEN** tag `v0.2.0` points at `abc123`, and a GitHub release titled `v0.2.0` exists with generated notes

#### Scenario: Nothing is committed back

- **WHEN** any release runs
- **THEN** `main` has no new commits afterwards

### Requirement: A rerun finishes only what's missing

Each release step SHALL check whether it's already done before acting, so rerunning a failed or partial run completes the release without repeating what succeeded.

#### Scenario: Published but not tagged

- **GIVEN** `0.2.0` is on npm, but tag `v0.2.0` doesn't exist
- **WHEN** the release runs again
- **THEN** it doesn't publish again, and it creates the tag and the GitHub release

#### Scenario: Publish fails

- **WHEN** publishing to npm fails, for example because npm rejects the credentials
- **THEN** the run fails, and no tag or GitHub release is created for that version

### Requirement: Only main can publish, without a stored token

Publishing SHALL use npm trusted publishing from the release workflow, in a GitHub environment that only `main` can deploy to. No npm token SHALL be stored in the repository or its settings.

#### Scenario: A pull request changes the workflow

- **WHEN** a pull request edits the release workflow to publish from its own run
- **THEN** npm rejects the publish, because the run isn't in the `main`-only environment

#### Scenario: No token exists

- **WHEN** the repository's secrets and workflow files are inspected
- **THEN** none holds an npm token

### Requirement: Release tags can't be moved or deleted

Once created, a `v*` tag SHALL NOT be moved to another commit or deleted, by anyone. Creating new `v*` tags SHALL remain possible for the release workflow.

#### Scenario: Moving a tag

- **WHEN** anyone, including a repository admin, force-pushes an existing `v*` tag to another commit
- **THEN** GitHub rejects the push

#### Scenario: Creating a tag

- **WHEN** the release workflow creates a new `v<version>` tag
- **THEN** GitHub accepts it
