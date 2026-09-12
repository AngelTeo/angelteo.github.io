# LoveGo · Canonical Production Runtime

Status: **ACTIVE GOVERNANCE**

## Production entry
- `OPR/LoveGo.html` is the only LoveGo product entry.

## Active runtime modules
- `lovego-cloud.js`
- `lovego-model.js`
- `lovego-review.js`
- `lovego-assignments.js`
- `lovego-management.js`
- `lovego-ptm-evidence.js`

## Governance lock
1. Do **not** create `LoveGo_vXX*` production files again.
2. Historical numbered modules live only under `OPR/_legacy/lovego/` and are implementation archive/dependencies, not product versions.
3. New engineering must modify the canonical stable modules or deliberately refactor them; never stack another numbered patch chain.
4. `LoveGo.html` remains the single public entry URL.
5. LoveGo records Class-B observation evidence only. It does not become the Academic Authority and must not infer BUILDING / DEVELOPING / SECURE by itself.
6. Production changes are not CLOSED until real authenticated production flow is verified: open → record → save → reload → submit → lock → evidence persistence.

Canonicalized: 2026-09-12.
