# Portable research CAD gallery and PDF pipeline

No CDN/API/server is required to VIEW the delivered ZIP. Extract all files, double-click index.html, choose variant/view. All view images/CSS/JS are inline; raw JSON/SVG, PDF, README and manifests are siblings. User confirmed direct double-click operation; the agent separately tested147views via loopbackHTTP because its browser blocks file://. These are static depth-buffer images of actual experimental solids, not an orbitable manufacturer CAD viewer or manufacturing package.

Run from the research worktree after npm ci. Python needs reportlab,pypdf,pdfplumber,Pillow; bundled runtime was used, no new packages added:

```powershell
node research/portable-cad/generate.mjs --prepare-renders
node research/portable-cad/build_three_preview.mjs
# Serve artifacts/portable-cad/three-preview bound to127.0.0.1.
# In browser select all40 scenes; wait for READY, capture canvas clip x0,y70,w2400,h1520.
# Save PNG bytes to artifacts/portable-cad/renders/<scene-id>.png.
node research/portable-cad/generate.mjs
python research/portable-cad/create_atlas.py
python research/portable-cad/previews.py
node research/portable-cad/finalize.mjs
node research/portable-cad/sync-delivery-report.mjs
node --test research/portable-cad/portability.node-test.mjs
# Render both atlases with pdftoppm -r90 -png to artifacts/portable-cad/{d3,b3}-render/page.
python research/portable-cad/pdf_qa.py
```

Missing browser captures fail generation explicitly. The screenshot step uses existing Three/esbuild to rasterize actual core volumes with correct depth; no synthetic artist drawing replaces the model. Data and SVG primitives are deterministic; exact screenshots can vary byGPU. Reusing the verified captures yields identical PDF and ZIP byte hashes with invariantPDF timestamps and fixedZIP timestamps. Keep captures separately if exact artifact regeneration matters. `generate.mjs` accepts an explicit output folder inside the authorized project root. Original machine's verified D3 evidence is reused without editing; a fresh clone lacking it invokes tracked D3 generator locally.

Default delivery root is commonGit workspace/output/pdf/cad-delivery-2026-11-15. `finalize.mjs` verifies manifest files, safe archive paths, independent extraction, inline no-network HTML and writes DELIVERY_SHA256.json. Atlas dimensions1200×840pt; Noto is embedded. D3 has34pages/16cases, B3 has11pages/5cases. Every page/view is experimental and not physically approved. JSON is complete research evidence, not approved Design import. Manifest intentionally excludes hashing itself; outer delivery manifest hashes ZIP/PDF/previews.

Research folders carry `.gitignore *` so Tailwind scanning remains unchanged. Commit only explicitly reviewed research source with git add -f; never add generated renders/ZIP/PDF/canonical fixtures or user data. Do not merge to main or deploy this research. Preview builds must be freshly confirmed disabled before optional private research push.
