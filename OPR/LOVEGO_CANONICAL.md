# LoveGo · Canonical Production Runtime

Status: **FINAL ENGINEERING BUILD · 2026-09-13**

## Production entry
- `OPR/LoveGo.html` is the only LoveGo product entry.
- Do not create another `LoveGo_vXX*.html` or numbered production entry.

## Canonical top-level modules
- `lovego-cloud.js`
- `lovego-model.js`
- `lovego-review.js`
- `lovego-assignments.js`
- `lovego-management.js`
- `lovego-ptm-evidence.js`

## Canonical internal runtime
Active extension logic lives under stable names in:
- `OPR/lovego/runtime/`
- `OPR/lovego/srk-runtime-qc.js`

The old `LoveGo_v40...v60` files under `OPR/_legacy/lovego/` are archive-only. Production code must not load any `OPR/_legacy/lovego/LoveGo_vXX*` path.

## Product scope lock
1. Departments: **ATC · GAK · SRK · SRT**.
2. LoveGo records **Class-B observation evidence**. It does not become Academic Authority and must not infer BUILDING / DEVELOPING / SECURE by itself.
3. ObsGo remains taxonomy / student-development authority. PTMGo remains downstream report/meeting consumer. AttendanceGo remains separate.
4. Teachers only work on current formally assigned students. Management owns assignment and department-level operational visibility.
5. Cloud submit remains authoritative only after server-confirmed save; draft/local data must never be presented as completed evidence.
6. SRK canonical registry, semantic guards, submit bridge, runtime QC, end-to-end guard and PTM evidence adapter are part of active production runtime.
7. Reset/test-data destruction must not be exposed in production.

## Release gate
Engineering static canonicalization is not the same as authenticated production verification. Production release is verified only after a real authorized account completes:
`open → assigned student → record → save draft → reload → submit → reload → locked/completed → evidence persistence`.

Canonicalized: 2026-09-12. Final runtime consolidation: 2026-09-13.
