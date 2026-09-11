# LoveGo · SRK Legacy Reconciliation v1

Date: 2026-09-11
Status: ACTIVE SOURCE CONTROL
Scope: SRK only

## Objective
Preserve useful evidence from the old LOVE LOVE / PTM workflow without forcing teachers to repeat work or restoring subjective/stereotyping fields.

Teacher input remains:
Student → Long-term Observation → Daily Student Life → Submit

Report language is downstream/system-derived. Teachers do not re-pick a second set of report-card comments after entering evidence.

## Source inventory
### LOVE LOVE PROGRAMME 2024
- BB1: https://form.jotform.com/SmartReader/love-love-1-ptm-2024bb1
- JR1: https://form.jotform.com/SmartReader/love-love-1-ptm-2024-JR1
- JR2: https://form.jotform.com/SmartReader/love-love-1-ptm-2024-JR2
- IN1: https://form.jotform.com/SmartReader/love-love-1-ptm-2024-IN1
- IN2: https://form.jotform.com/SmartReader/love-love-1-ptm-2024-IN2
- IN3: https://form.jotform.com/SmartReader/love-love-1-ptm-2024-IN3
- SR1: https://form.jotform.com/SmartReader/love-love-1-ptm-2024-SR1
- SR2: https://form.jotform.com/SmartReader/love-love-1-ptm-2024-SR2
- SR3: https://form.jotform.com/251070740966458

### PTM CARD COMMENT 2025
- BB: https://form.jotform.com/SmartReader/ptm-card-comment-BB-2025
- JR: https://form.jotform.com/SmartReader/ptm-card-comment-JR-2025
- IN: https://form.jotform.com/SmartReader/ptm-card-comment-IN-2025
- SR: https://form.jotform.com/SmartReader/ptm-card-comment-SR-2025

## Source retrieval status in this audit
Readable in current web retrieval:
- LOVE LOVE IN3
- PTM CARD COMMENT BB
- PTM CARD COMMENT JR
- PTM CARD COMMENT IN

Unavailable/404 in current web retrieval:
- LOVE LOVE BB1 / JR1 / JR2 / IN1 / IN2 / SR1 / SR2 / SR3
- PTM CARD COMMENT SR

Unavailable URLs are retained as authority-source references and must not be silently reconstructed from memory.

## Reconciliation map

| Legacy construct | Current LoveGo handling | Decision |
|---|---|---|
| Positive/negative character labels | S3/S4/S5/S6 observable behaviour | Do not restore trait-label picking |
| Student-type labels (e.g. class clown/day dreamer/etc.) | Specific observable domains + Daily Student Life | Exclude stereotypes |
| Water drinking | S11 Self-Care | Restore as age-calibrated observable evidence |
| Eating/feeding | S11 Self-Care | Restore as age-calibrated observable evidence |
| Washroom expression/independence | S11 Self-Care | Restore; sensitive details internal-only |
| Personal hygiene | S11 + S4 where organisation is involved | Restore only observable, parent-useful behaviours |
| Social-emotional development | S5 Self-Regulation + S6 Social Interaction | Already covered; strengthen caring/respect/repair evidence |
| Bad daily habits | S2/S5/S6/S9 or Daily Student Life | Do not recreate long symptom-like checklist |
| Academic learning progress | S3/S8/S10 + Academic evidence systems | Do not duplicate formal academic result capture here |
| Attention span | S9 | Already covered |
| Understand/follow directions | S7 | Already covered |
| Independence | S4 | Already covered; strengthen belongings/organisation/time-use evidence |
| Time management | S4 age-calibrated routine/task progress | Reconcile into observable behaviour |
| Teacher 'potential learning disability' judgement | none | Exclude; not a teacher diagnostic field |
| Teacher liking percentage | none | Exclude as bias-generating/non-evidence |
| Best friend / don't want to be friends with named child | S6 + Daily Student Life if materially relevant | Exclude named preference list |
| Upload supporting document | Evidence attachment architecture (future/when needed) | Do not block current LoveGo teacher flow |
| Handwriting Excellent/Improving/Weak | Academic/report evidence source | Do not ask LoveGo teacher to rate again unless no authoritative academic source exists |
| Academic Performance Excellent/Improving/Weak | EvalGo/Academic report evidence + LoveGo observation context | Do not duplicate as generic LoveGo rating |
| Helpful/Friendly/Respectful | S6 observable behaviour | Ground report language in evidence |
| High/Low Motivation | S3 observable engagement/curiosity | Ground report language in evidence |
| Good/Poor Time Management | S4 observable routine/task progress | Ground report language in evidence |
| Neat/Untidy/Disorganised | S4 observable belongings/organisation | Ground report language in evidence |
| Report-card sentence selection | downstream phrase/comment engine | Teacher must not perform a second selection pass |

## v46 implementation
- Added S11 `日常自理 / Self-Care & Personal Routines` for both preschool age bands.
- 3–4 evidence: independent eating, drinking needs, washroom expression, basic toileting/handwashing/clothing steps, level of adult dependence.
- 5–6 evidence: independent hydration/eating/toileting/hygiene, self-correction/help-seeking, repeated adult dependence where age-inappropriate.
- Added curiosity / external-motivation observables into S3.
- Added belongings / organisation / age-appropriate time-use observables into S4.
- Added helpfulness / care / respect / leadership-without-control / responsibility-and-repair into S6.
- Explicitly excluded subjective student labels, teacher liking score, teacher diagnosis of learning disability, and duplicate report-comment picking.
- Removed local LoveGo Logout control; Academee/SSO owns session exit.

## Report comment architecture
Old PTM Card Comment forms are treated as language/pattern authority, not a second teacher assessment form.

Pipeline:
LoveGo evidence + academic evidence → evidence interpretation → approved age/programme language pattern → generated draft comment → report output

Rules:
1. No report sentence may assert a construct unsupported by evidence.
2. Negative labels must be rewritten as observable, contextual, changeable behaviour.
3. Age/programme wording may differ even when the underlying construct is the same.
4. Sensitive self-care/toileting details must not flow automatically into parent-facing prose.
5. Teacher should not choose the same meaning twice.

## Open source gap (not an Owner decision)
The remaining inaccessible legacy forms have not been reconstructed. When their actual field content becomes retrievable, run a delta audit against this map and only add genuinely new constructs/evidence—not duplicate wording.
