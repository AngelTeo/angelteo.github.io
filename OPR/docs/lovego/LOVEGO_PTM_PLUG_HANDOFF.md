# LoveGo · PTM Plug Handoff

## Implemented

- Read-only LoveGo Evidence Plug exists.
- SRK canonical Registry evidence supersedes legacy SRK UX observations when present.
- Stable evidence codes and canonical indicator IDs are exported for Registry evidence.
- Draft vs submitted/authoritative status is explicit.
- Critical identity/provenance missing => event is non-authoritative and `submittedOnly` excludes it.
- `counts_for_cycle` controls whether a source review remains current for downstream use.
- Source Review / Assignment provenance is preserved.
- SRK Registry cloud persistence uses existing `domains` JSONB and hydrates after pull.
- OD-1 stage/age resolution is enforced before Registry submit.
- Semantic guards preserve required familiarity/opportunity context.
- Registry submit no longer uses legacy-domain completion validation.
- End-to-end runtime guard prevents silent fallback to legacy submit flow.
- Plug remains interpretation-free.

## Automated E2E status

GitHub Actions workflow: `.github/workflows/lovego-srk-e2e.yml`.

Latest verified no-cloud browser E2E: **PASS** on run `34628991936`, commit `5c30df726c32eedce6834ab2cb463598c6bd77c4`.

Verified in browser:

- Registry QC PASS;
- OD-1 `JR + actual AGE 3 -> AGE 3 / AGE_UNDER_USE_AGE`;
- Runtime QC PASS;
- End-to-end guard PASS;
- incomplete Registry submit blocked;
- empty Daily Student Life submit blocked;
- complete Registry review writes exactly once to mocked cloud path;
- submitted review becomes completed + locked;
- Registry payload is packed inside existing `domains.__srk_registry_v1` JSONB shape;
- no unknown top-level `srk_registry` DB field;
- v61 Evidence Plug loads;
- canonical Registry evidence exports without duplicate legacy path;
- submitted events become authoritative only with complete identity;
- `interpretation` remains `null`;
- canonical `indicator_id` and stable `evidence_code` are present;
- missing `source_record_id` fails closed;
- `submittedOnly` excludes identity-incomplete events.

The automated harness is mock-only and performs no Supabase writes.

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
11. `LoveGo_v61_e2e_uat.html`
12. `LoveGo_v61_e2e_uat_bootstrap.js`
13. `LoveGo_v61_e2e_uat_runner.js`

## Safety state

Production normal LoveGo UI remains unchanged unless SRK Registry feature gate is used. Registry changes are additive adapters. Installation, automated UAT and plug invocation do not create LoveGo Review rows.

Production verification after automated E2E remained:

- total LoveGo Reviews = 0
- completed Reviews = 0
- SRK Reviews = 0

## Remaining closeout verification

Before removing the feature gate, execute **real authenticated UAT** for:

- one teacher / one SRK class / a few assigned students;
- Draft save → real cloud → reload → hydration;
- Support/Response persistence through real cloud;
- OD-1 under-age class mismatch using real Student Master data;
- incomplete Registry submit blocked;
- no Daily Student Life submit blocked;
- complete Review submit succeeds;
- submitted Review locks;
- Plug `submittedOnly` exports canonical events only from real cloud Review;
- invalidated/replaced review stops counting;
- no duplicate legacy SRK events for Registry reviews;
- controlled cleanup/reset of UAT records only after UAT acceptance.

Feature-gate removal is a release decision and should occur only after real authenticated UAT PASS.
