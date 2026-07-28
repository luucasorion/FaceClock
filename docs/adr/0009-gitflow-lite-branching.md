# ADR 0009 — Gitflow-lite branching workflow

- **Status:** Accepted
- **Date:** 2026-07-28
- **Deciders:** lucas.orion

## Context

The repo already uses two long-lived branches (`main`, `dev`) plus ad-hoc feature branches, but the
workflow was never written down. Work is now tracked in [GitHub Issues](https://github.com/luucasorion/FaceClock/issues),
so branches and PRs should tie back to issues. Strict Gitflow (release/* + hotfix/* ceremony) is
heavier than this project needs; GitHub Flow (single `main`) would mean dropping `dev`.

## Decision

Adopt **Gitflow-lite**: keep `main` + `dev`, short-lived issue-named branches, PR review, and tagged
releases — without the strict release-branch ceremony.

### Branches

| Branch | Role |
|---|---|
| `main` | Production. Only receives merges from `dev` (releases) or `hotfix/*`. Every merge is tagged. |
| `dev` | Integration and the default working branch. |
| `feat/<issue>-slug` | New feature, branched off `dev`. e.g. `feat/8-domain-exceptions`. |
| `fix/<issue>-slug` | Bug fix, branched off `dev`. |
| `chore/<slug>` / `docs/<slug>` | Non-code or tooling/docs changes off `dev`. |
| `hotfix/<issue>-slug` | Urgent production fix, branched off `main`. |

### Flow

1. **Feature/fix** — branch off `dev` → open a PR into `dev` → review → merge. The PR body links the
   issue with `Closes #N`.
2. **Release** — PR `dev → main`, merge, then tag `vX.Y.Z` (semver) on `main`.
3. **Hotfix** — branch off `main` → PR into `main` → tag a patch release → **back-merge `main` into
   `dev`** so the fix isn't lost.

### Conventions

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org) — `feat:`, `fix:`,
  `docs:`, `chore:`, `refactor:`, with an optional scope (`feat(ponto): ...`). This matches existing
  history.
- **PRs:** required for anything reaching `dev` or `main`; no direct pushes to those two. Keep PRs
  small and reviewable; squash-merge to keep `dev` history linear.
- **Never** commit directly to `main`.

## Consequences

- **Positive:** clear, lightweight process; branches trace to issues; `main` stays releasable and
  tagged; history is readable.
- **Negative:** no formal release-stabilization branch, so a release picks up whatever is on `dev` at
  merge time — acceptable at current scale; revisit (toward strict Gitflow) if scheduled/parallel
  releases become a need.

## Related

- Backlog: [GitHub Issues](https://github.com/luucasorion/FaceClock/issues).
- Rule file: `/CLAUDE.md`.
