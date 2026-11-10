"""Independent checks of the four A3 exports, with Poppler rendering."""

import csv
import hashlib
import io
import json
import math
import subprocess
import sys
from pathlib import Path
from zipfile import ZipFile

from PIL import Image, ImageDraw
from pypdf import PdfReader


acceptance = "--user-acceptance" in sys.argv
root = Path("artifacts/final-user-acceptance" if acceptance else "artifacts/final-professional-polish")
production = root / "production"
before = Path("artifacts/final-professional-polish/production" if acceptance else "artifacts/final-remediation/production")
rendered = root / "pdf-rendered"
rendered.mkdir(exist_ok=True)
manifest = json.loads((production / "manifest.json").read_text(encoding="utf-8"))
results = []

for record in manifest:
    kind = record["kind"]
    folder = production / kind
    source = before / kind
    read = lambda directory, name: json.loads((directory / name).read_text(encoding="utf-8"))
    design = read(folder, "design.json")
    assert design == read(source, "design.json"), kind
    model = read(folder, "resolved-model.json")
    package = read(folder, "production.json")
    old = read(source, "production.json")
    parts = {part["code"]: part for part in package["parts"]}
    old_parts = {part["code"]: part for part in old["parts"]}
    assert len(parts) == len(package["parts"]) and not record["errors"], kind
    assert parts.keys() == old_parts.keys(), kind

    pdf = Path(record["path"])
    old_pdf = source / f"wardrobe-{'professional' if acceptance else 'final'}-{kind}.pdf"
    reader = PdfReader(pdf)
    texts = [page.extract_text() for page in reader.pages]
    all_text = "\n".join(texts)
    assert len(texts) == record["pages"]
    assert all(code in all_text for code in parts)
    assert all("50 mm baskı kontrolü" in page for page in texts)
    assert all(abs(float(page.mediabox.width) - 420 * 72 / 25.4) < 0.1 and
               abs(float(page.mediabox.height) - 297 * 72 / 25.4) < 0.1 for page in reader.pages)

    diagnostic = acceptance and package["accessStatus"] == "blocked"
    if diagnostic:
        assert "KULLANIM ENGELİ" in texts[0]
        assert "Tanısal pafta" in texts[0]
        assert not (folder / "cut-list.csv").exists()
        assert not (folder / "technical-package.zip").exists()
        assert any(sheet["id"].startswith("13-ERISIM") for sheet in record["sheets"])
        assert ("0 / 310 mm" if kind == "diagonal" else "7 / 310 mm" if kind == "asymmetric" else "49 / 451 mm") in texts[0]
    else:
        files = (folder / "cut-list.csv").read_bytes()
        rows = list(csv.DictReader(io.StringIO(files.decode("utf-8-sig")), delimiter=";"))
        assert len(rows) == len(parts)
        for row in rows:
            part = parts[row["Parça kodu"]]
            assert tuple(int(row[key]) for key in ("Genişlik mm", "Yükseklik mm", "Kalınlık mm")) == (
                part["widthMm"], part["heightMm"], part["thicknessMm"])
        with ZipFile(folder / "technical-package.zip") as archive:
            assert archive.testzip() is None
            assert len([name for name in archive.namelist() if name.endswith(".svg")]) == len(texts)
            assert next(archive.read(name) for name in archive.namelist() if name.endswith(".csv")) == files
            assert any(json.loads(archive.read(name)) == package for name in archive.namelist() if name.endswith(".json"))

    plan_index = next(i for i, sheet in enumerate(record["sheets"]) if sheet["id"] == "04-PLAN")
    plan = texts[plan_index]
    assert ("Kesim V/E" in plan) == bool(record["polygons"])
    assert ("Kör köşe" in plan) == (kind == "blind")

    hinges = {door["id"]: door for door in model["doors"]}
    slides = {door["id"]: door for door in model["slidingDoors"]}
    door_pages = [i for i, sheet in enumerate(record["sheets"]) if sheet["id"].startswith("15-KAPAK")]
    door_text = "\n".join(texts[i] for i in door_pages)
    door_svg = "\n".join((folder / "svg" / f'{record["sheets"][i]["id"]}.svg').read_text(encoding="utf-8") for i in door_pages)
    changed = []
    for detail in package["frontDetails"]:
        unit = detail["unitId"]
        door = hinges.get(unit) or slides[unit]
        part = parts[detail["partCode"]]
        assert detail["cutSizeMm"] == [door["widthMm"], door["heightMm"], door["thicknessMm"]]
        assert part["worldCenterMm"] == detail["closedCenterMm"]
        assert part["code"] in door_text and part["code"] in door_svg
        cut_text = " × ".join(map(str, detail["cutSizeMm"]))
        assert cut_text in door_text and cut_text in door_svg, (kind, cut_text)
        previous = old_parts[part["code"]]
        old_cut = [previous[key] for key in ("widthMm", "heightMm", "thicknessMm")]
        if old_cut != detail["cutSizeMm"]:
            changed.append({"code": part["code"], "oldMm": old_cut, "newMm": detail["cutSizeMm"]})
        if unit in hinges:
            pivot = door["pivotWorldMm"]
            x, y, z = door["leafCenterOffsetMm"]
            angle = door["closedRotationYRad"]
            cx = pivot[0] + x * math.cos(angle) + z * math.sin(angle)
            cz = pivot[2] - x * math.sin(angle) + z * math.cos(angle)
            assert math.dist((cx, pivot[1] + y, cz), detail["closedCenterMm"]) < 1e-7
            assert detail["motion"]["pivotMm"] == pivot
            assert detail["motion"]["opening"] == door["opening"]
            assert 0 <= door["opening"]["safeAngleDeg"] <= door["maxAngleDeg"]
            assert detail["motion"]["hardwareConfirmed"] is False
            assert f"nominal {door['maxAngleDeg']}°" in door_text

    diagonal_mm = None
    if record["polygons"]:
        junction = design["junctions"][0]
        a, b = design["runs"]
        t, tb = a["panelThicknessMm"], a["backPanelThicknessMm"]
        x, z = junction["diagonalArmAMm"] - t, junction["diagonalArmBMm"] - t
        da, db = a["depthMm"] + a.get("rearOffsetMm", 0), b["depthMm"] + b.get("rearOffsetMm", 0)
        vertices = [(0, 0), (x - tb, 0), (x - tb, da - tb), (db - tb, z - tb), (0, z - tb)]
        edges = [math.dist(p, vertices[(i + 1) % 5]) for i, p in enumerate(vertices)]
        area = abs(sum(p[0] * vertices[(i + 1) % 5][1] - p[1] * vertices[(i + 1) % 5][0] for i, p in enumerate(vertices))) / 2
        diagonal_mm = edges[2]
        for part in parts.values():
            if part["shape"] != "polygon":
                continue
            assert [(v["xMm"], v["zMm"]) for v in part["verticesMm"]] == vertices
            assert math.isclose(part["areaMm2"], area)
            assert all(math.isclose(edge["lengthMm"], expected) for edge, expected in zip(part["edges"], edges))
            assert math.isclose(sum(edge["interiorAngleDeg"] for edge in part["edges"]), 540)

    target = rendered / kind
    target.mkdir(exist_ok=True)
    subprocess.run(["pdftoppm", "-scale-to", "1400", "-png", str(pdf), str(target / "page")],
                   check=True, capture_output=True)
    pages = sorted(target.glob("page-*.png"))
    assert len(pages) == len(texts)
    for start in range(0, len(pages), 16):
        sheet = Image.new("RGB", (1560, 4 * 301), "#dbe4ec")
        draw = ImageDraw.Draw(sheet)
        for index, page in enumerate(pages[start:start + 16]):
            im = Image.open(page).convert("RGB")
            im.thumbnail((382, 274))
            x, y = (index % 4) * 390, (index // 4) * 301
            sheet.paste(im, (x + 4, y + 23))
            draw.text((x + 4, y + 4), f'{start + index + 1} {record["sheets"][start + index]["id"]}', fill="black")
        sheet.save(rendered / f"{kind}-overview-{start // 16 + 1}.jpg", quality=90)
    result = {"kind": kind, "oldPages": len(PdfReader(old_pdf).pages), "newPages": len(texts),
              "parts": len(parts), "hinged": len(hinges), "sliding": len(slides),
              "diagonalEdgeMm": diagonal_mm, "changedDoorCuts": changed,
              "pdfSha256": hashlib.sha256(pdf.read_bytes()).hexdigest(), "doorSheetPages": [i + 1 for i in door_pages]}
    if acceptance:
        assert not changed
        result["accessStatus"] = package["accessStatus"]
        result["accessBlocked"] = sum(entry["status"] == "blocked" for entry in package["functionalAccess"])
        result["accessUnverified"] = sum(entry["status"] == "unverified" for entry in package["functionalAccess"])
    results.append(result)
    print(json.dumps(result, ensure_ascii=False), flush=True)

(root / "pdf-qa.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
