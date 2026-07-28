# ADR 0006 — Derive punch type (entry/exit) from sequence position

- **Status:** Accepted
- **Date:** 2026-06-23 (recorded here 2026-07-28)
- **Deciders:** lucas.orion

## Context

Punch history and worked-hours pairing (RF11, BR04, BR05) need each punch labelled entry or exit.
The type could be stored as a column on `BatidaPonto` or derived from order.

## Decision

Punch type is **derived from position** in the day's ordered punch sequence — **no `tipo` column**
is stored. Within a calendar day, punches ordered `batida ASC` are 1-indexed: odd = `entrada`,
even = `saida`. Worked-hours pairing consumes the same sequence by index: `(punch[0], punch[1])`
is the first entry/exit pair, and so on. An odd count leaves a trailing unpaired punch recorded as
an anomaly.

## Consequences

- **Positive:** no schema migration; a single derivation point (`_agrupamento.py`); type and
  hours calculation share one ordering.
- **Negative:** a missing punch shifts every subsequent label for that day (surfaced as an
  anomaly, not silently). No way to record a corrected/manual type without revisiting this decision.

## Related

- Worked-hours calc: `application/use_cases/relatorio/horas_trabalhadas_usecase.py`.
