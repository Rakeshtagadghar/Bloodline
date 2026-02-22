# Commit Message Strategy (Conventional Commits)

This repo uses **Conventional Commits** for a predictable history and easier release notes.

## Format

`type(scope): short summary`

Examples:

- `feat(web): add royal tree canvas selection and minimap`
- `fix(core): reject parent-child cycles during dataset validation`
- `test(renderer): add hit-test coverage for empty space`
- `docs(deploy): add free-tier hosting guidance`

## Allowed Types

- `feat`: new feature
- `fix`: bug fix
- `docs`: documentation only
- `style`: formatting only (no logic)
- `refactor`: code change without behavior change
- `perf`: performance improvement
- `test`: tests added/updated
- `build`: build/tooling/dependency changes
- `ci`: CI workflow changes
- `chore`: maintenance tasks
- `revert`: revert a previous commit

## Scope Guidelines

Recommended scopes in this repo:

- `web`
- `core`
- `renderer`
- `e2e`
- `deps`
- `repo`
- `docs`

## Breaking Changes

Use either:

- `feat(core)!: change dataset relationship API`

or a footer:

- `BREAKING CHANGE: relationship.kind now requires explicit value`

## Validation

Run locally:

- `pnpm commitlint` (checks the latest commit)
- `pnpm commitlint:range` (checks the last 10 commits)

## Practical Defaults

- Keep subject in imperative mood (`add`, `fix`, `refactor`)
- Keep subject short and specific
- Put rationale/details in the body when needed
