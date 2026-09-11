# LoveGo · PTM Evidence Plug v1 Contract

Status: SRK canonical adapter implemented behind `?srk_registry=1`; legacy departments remain on existing LoveGo plug path.

## Role

LoveGo is a Class-B observational evidence source. The plug exports what was observed and its provenance. It does **not** decide BUILDING / DEVELOPING / SECURE and does not generate Parent Report language.

## Stable identity / provenance

Each output event carries, where available:

- `schema_version`
- `event_id`
- `source_system = LoveGo`
- `source_class = B`
- `source_record_id`
- `student_id`
- `department`
- `cycle_id` / `cloud_cycle_id`
- `class_id`
- `teacher_id`
- `assignment_id`
- `evidence_code`
- `indicator_id` for canonical SRK Registry evidence
- `taxonomy_version`
- `registry_version`
- `adapter_version`
- `teacher_section`
- `polarity`
- `context_snapshot`
- `support_response`
- `review_status`
- `submitted_at`
- `counts_for_cycle`
- `authoritative`
- `captured_at`
- `interpretation = null`
- `plug_version`

## Authoritative status

`authoritative = true` only when the LoveGo source review is completed, has `submitted_at`, and `counts_for_cycle !== false`.

Draft evidence may be exported for recovery/debugging only when a caller explicitly does not request submitted-only output. Draft is never authoritative PTM evidence.

## SRK canonical routing

When a review contains SRK Registry evidence (`review.srk_registry` or `domains.__srk_registry_v1`), the plug exports that canonical evidence path and does not fall back to the old S1-S10 UI observations for the same review.

This prevents double-counting and prevents legacy UX grouping from becoming Academic Authority.

## Lifecycle / correction propagation

- submitted source review = authoritative while `counts_for_cycle !== false`;
- invalidated/replaced source reviews remain traceable but must not be counted when `counts_for_cycle = false`;
- downstream systems must consume current authoritative state, not cache a permanently valid copy;
- `source_record_id` / `assignment_id` preserve traceability back to LoveGo.

## Versioning

Current SRK adapter output schema: `lovego-evidence-v1.1`.

Meaning-affecting metadata is preserved separately (`taxonomy_version`, `registry_version`, `adapter_version`, `plug_version`). Missing source fields are nullable; the plug must not fabricate versions or IDs.

## Read-only contract

`LoveGoEvidencePlug.buildReview()` and `LoveGoEvidencePlug.buildAll()` are read/export operations. They do not create Review records, do not change Evidence, do not submit Reviews, and do not write PTMGo data.

## Fail-closed principles

A downstream consumer must not treat an event as authoritative when critical identity/provenance/status is absent. SRK Registry submission itself is separately fail-closed by OD-1, semantic, runtime and end-to-end guards.

## Current implementation

- base plug: `LoveGo_v49_evidence_plug.js`
- SRK canonical adapter: `LoveGo_v61_srk_evidence_plug_adapter.js`
- canonical registry: `LoveGo_v53_srk_evidence_registry.js`
- cloud packing/hydration: `LoveGo_v55_srk_cloud_guard.js`
- OD-1 resolver: `LoveGo_v56_srk_od1_guard.js`
- semantic guard: `LoveGo_v57_srk_registry_semantic_guard.js`
- runtime QC: `LoveGo_v58_srk_runtime_qc.js`
- submit bridge: `LoveGo_v59_srk_submit_bridge.js`
- end-to-end guard / v61 loader: `LoveGo_v60_srk_end_to_end_guard.js`

This is LoveGo's source-specific plug. It does not declare itself the final PTM-wide common contract.
