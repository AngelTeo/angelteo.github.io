# LoveGo · PTM Evidence Plug v1 Fixtures

These are contract fixtures, not production student records.

## F1 · Submitted SRK canonical evidence

Expected:
- source `LoveGo`
- class `B`
- stable `evidence_code`
- canonical `indicator_id`
- OD-1 context present
- `review_status = completed`
- `submitted_at` present
- `counts_for_cycle = true`
- `authoritative = true`
- `interpretation = null`

## F2 · SRK draft

Expected:
- Registry evidence may exist for draft recovery
- `review_status = draft`
- `authoritative = false`
- excluded by `buildAll({submittedOnly:true})`

## F3 · Submitted review invalidated for cycle

Expected:
- source record remains traceable
- `counts_for_cycle = false`
- `authoritative = false`
- excluded when `countsOnly = true`

## F4 · Legacy SRK review without Registry evidence

Expected:
- base v49 plug path remains available for backward compatibility
- no claim that legacy S1-S10 UX sections are canonical indicators
- no numeric 0/1/2 interpretation emitted

## F5 · Registry review with both old domains and canonical Registry payload

Expected:
- canonical Registry path wins
- old S1-S10 observations are not exported in addition to Registry evidence
- no double-counting

## F6 · Support-sensitive evidence

Expected:
- `support_response` preserves available S0-S3 / R1-R6 / familiarity context
- Support does not become developmental level
- `interpretation = null`

## F7 · Missing age/stage identity during SRK Registry submit

Expected:
- OD-1 submit gate fails closed
- no completed cloud review is written by Registry flow

## F8 · Missing runtime adapter

Expected:
- v60 end-to-end guard blocks Registry submit
- system must not silently fall back to legacy `saveReview()` validation

## F9 · Cloud round-trip

Expected:
- Registry state is stored under existing `domains.__srk_registry_v1`
- no new unknown top-level DB column is sent
- cloud pull hydrates `review.srk_registry`
- checkbox selections / Support-Response context survive reload

## F10 · Read-only plug invocation

Expected:
- calling `buildReview()` / `buildAll()` creates no Review, Assignment or PTMGo row
- no source Evidence is altered

## Contract acceptance

PASS requires all fixtures to preserve stable identity, provenance, lifecycle status, draft isolation and `interpretation = null`.
