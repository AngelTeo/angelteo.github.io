// LoveGo legacy compatibility shim.
//
// This file previously re-overrode renderAssignments() on window.load and
// restored the obsolete per-student "confirm recommendations" workflow.
// That conflicted with the locked governance model introduced in v40:
// Management manually assigns responsible teachers by CLASS; system
// recommendations are reference-only and never grant access or create an
// assignment by themselves.
//
// Keep this file as an intentional no-op because older LoveGo.html builds may
// still reference it. The active assignment UI/behaviour is owned by
// LoveGo_v40_dashboard.js (plus v41-v44 extensions).
window.__LOVEGO_LEGACY_RECOMMENDATION_LAYER_DISABLED__ = true;
