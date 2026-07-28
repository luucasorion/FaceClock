# Architecture Decision Records

Each ADR captures one load-bearing decision: the context, the choice, and its consequences.
They exist so decisions aren't re-litigated. Don't edit an accepted ADR to change the decision —
supersede it with a new one.

Format: `NNNN-short-title.md`, numbered sequentially. Status is one of
`Proposed` / `Accepted` / `Superseded by ADR-XXXX`.

## Index

| # | Title | Status |
|---|---|---|
| [0001](0001-align-with-fastapi-template-conventions.md) | Adopt selective conventions from the FastAPI full-stack template | Accepted |
| [0002](0002-clean-architecture-layering.md) | Clean-architecture layering | Accepted |
| [0003](0003-defer-rf13-dedicated-enrollment.md) | Defer RF13; dedicated enrollment endpoint is the official flow | Accepted |
| [0004](0004-role-authz-from-jwt-claim.md) | Authorize roles from the JWT claim, not a DB re-query | Accepted |
| [0005](0005-first-manager-bootstrap.md) | Bootstrap the first manager atomically on company creation | Accepted |
| [0006](0006-punch-type-by-sequence.md) | Derive punch type (entry/exit) from sequence position | Accepted |
| [0007](0007-manager-as-boolean-flag.md) | Model the manager role as a boolean, not a separate entity | Accepted |
| [0008](0008-recognition-threshold-single-source.md) | Single recognition threshold of 0.65 (BR01) | Accepted |
| [0009](0009-gitflow-lite-branching.md) | Gitflow-lite branching workflow | Accepted |
| [0010](0010-adopt-valtech-design-system.md) | Rebrand the frontend to the Valtech Design System | Accepted |
