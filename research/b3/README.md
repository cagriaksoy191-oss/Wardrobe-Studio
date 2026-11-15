# B3 isolated research CAD

Research only, no production integration/import/manufacturing approval. Run from this branch's worktree root after npm ci:

```powershell
node --test research/b3/cad.node-test.mjs
node research/b3/verify-production.mjs
```

`prototype.mjs` composes three copied blind-corner models with external drawers and independent upper doors. It explicitly changes only the experimental resolved assembly (15mm box sides, external blind face,92deg full-height limit). `measure.mjs` uses the D3-1 capacity/access definitions, actual continuous motion constraints and an11-scenario interaction matrix. `overlap-audit.mjs` diagnoses20 canonical25/4 overlaps and performs a copied-position counterfactual; it never edits the solver or canonical cuts. `verify-production.mjs` uses real Vite SSR production exporters to assert12 goldens/338parts and create diagnostic PDF/SVG test evidence. It never produces blocked CSV/ZIP files.

The16 tests cover repeatability/immutability, catalog formulas/stock rejection, closed/static geometry, actual box volume and seams, hanger openings, constrained handles and inverse order, unknown hardware/physical status, negative155deg sequence, explicit500mm sensitivity, synthetic room obstacle, overlap volumes/unchanged cuts and forbidden manufacturing export. Real rail/hinge CAD, loaded stroke, hook release, human movement and room remain unverified.

Read the seven root B3/overlap/portability reports. The existing284 application and24 D3 tests remain separate. No new npm dependencies or app schema fields were added.
