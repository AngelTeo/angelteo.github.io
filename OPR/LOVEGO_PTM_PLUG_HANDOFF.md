# LoveGo · PTM Plug Handoff

## Implemented

- Read-only LoveGo Evidence Plug exists.
- SRK canonical Registry evidence supersedes legacy SRK UX observations when present.
- Stable evidence codes and canonical indicator IDs are exported for Registry evidence.
- Draft vs submitted/authoritative status is explicit.
- `counts_for_cycle` controls whether a source review remains current for downstream use.
- Source Review / Assignment provenance is preserved.
- SRK Registry cloud persistence uses existing `domains` JSONB and hydrates after pull.
- OD-1 stage/age resolution is enforced before Registry submit.
- Semantic guards preserve required familiarity/opportunity context.
- Registry submit no longer uses legacy-domain completion validation.
- End-to-end runtime guard prevents silent fallback to legacy submit flow.
- Plug remains interpretation-free.

## Not implemented / intentionally out of scope

- PTM-wide common Evidence Contract is not declared here.
- BUILDING / DEVELOPING / SECURE is not computed here.
- Evidence sufficiency / confidence calibration is not computed here.
- Parent Report / Comment Bank composition is not performed by the plug.
- Legacy Jotform records are not migrated into new LoveGo baseline.
- Feature gate `?srk_registry=1` is not removed in this handoff.

## Source authority

- Academee IDs remain identity authority.
- LoveGo submitted Review is the source record for LoveGo evidence.
- SRK canonical behaviour-code registry is `lovego-srk-evidence-registry-v1`.
- Report identity remains cycle + department + student downstream; class is source/provenance context.

## Runtime files

1. `LoveGo_v49_evidence_plug.js`
2. `LoveGo_v53_srk_evidence_registry.js`
3. `LoveGo_v54_srk_registry_adapter.js`
4. `LoveGo_v55_srk_cloud_guard.js`
5. `LoveGo_v56_srk_od1_guard.js`
6. `LoveGo_v57_srk_registry_semantic_guard.js`
7. `LoveGo_v58_srk_runtime_qc.js`
8. `LoveGo_v59_srk_submit_bridge.js`
9. `LoveGo_v60_srk_end_to_end_guard.js`
10. `LoveGo_v61_srk_evidence_plug_adapter.js`

## Safety state

Production normal LoveGo UI remains unchanged unless SRK Registry feature gate is used. Registry changes are additive adapters. No new LoveGo Review rows should be created by installation or plug invocation itself.

## Remaining closeout verification

Before removing the feature gate, execute real authenticated UAT for:

- one teacher / one SRK class / a few assigned students;
- Draft save → reload → hydration;
- Support/Response persistence;
- OD-1 under-age class mismatch;
- incomplete Registry submit blocked;
- no Daily Student Life submit blocked;
- complete Review submit succeeds;
- submitted Review locks;
- Plug `submittedOnly` exports canonical events only;
- invalidated/replaced review stops counting;
- no duplicate legacy SRK events for Registry reviews;
- production cleanup/reset of UAT records only after UAT acceptance.

No Owner decision is required for these verification steps. Feature-gate removal is a release decision and should occur only after verified UAT PASS.
