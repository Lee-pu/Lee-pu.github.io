"""미리보기용 한 파일 만들기.

사이트 폴더에서 실행하면 Leepu-미리보기.html 하나가 생겨요.
- data.json, 세 페이지(index · works · items), 공통 css · js, 사진(작게 줄여서)을 전부 한 파일에 넣어요.
- 더블클릭하면 인터넷 연결 없이도 화면이 보여요 (글꼴과 YouTube 재생만 인터넷이 필요해요).

사용: python tools/preview_build.py [출력 파일 경로]
"""
import base64
import io
import json
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "Leepu-미리보기.html"

_cache = {}


def shrink(path, size):
    """assets/... 사진을 size 픽셀 안으로 줄여 data: 주소로 바꿔요. 못 읽으면 원래 경로를 그대로 둬요."""
    if not path or not path.startswith("assets/"):
        return path
    key = (path, size)
    if key in _cache:
        return _cache[key]
    f = ROOT / path
    try:
        im = Image.open(f)
        im.thumbnail((size, size))
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGBA")
        buf = io.BytesIO()
        im.save(buf, "WEBP", quality=74, method=4)
        uri = "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()
    except Exception as e:  # noqa: BLE001
        print("  사진을 못 읽음:", path, e)
        uri = path
    _cache[key] = uri
    return uri


def main():
    d = json.loads((ROOT / "data.json").read_text(encoding="utf-8"))
    d["works"] = [w for w in d.get("works", []) if w.get("public") is not False and w.get("title")]
    d["items"] = [i for i in d.get("items", []) if not i.get("pending") and i.get("name")]
    s = d.get("site", {})
    s["profile_image"] = shrink(s.get("profile_image", ""), 640)
    for w in d["works"]:
        w["thumbnail"] = shrink(w.get("thumbnail", ""), 720)
        w["images"] = [shrink(u, 1100) for u in w.get("images", [])]
        # 저장소 안 영상 파일은 미리보기에 넣기엔 커서 뺌 (YouTube는 그대로)
        w["video_urls"] = [u for u in w.get("video_urls", []) if not u.startswith("assets/")]
    for i in d["items"]:
        i["thumbnail"] = shrink(i.get("thumbnail", ""), 420)

    css = (ROOT / "assets/site.css").read_text(encoding="utf-8")
    js = (ROOT / "assets/site.js").read_text(encoding="utf-8")
    # 미리보기 안에서 페이지 이동: 링크를 눌러도 이 파일 안에서 화면만 바꿈
    nav = """<script>
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href]");
  if (!a) return;
  const m = (a.getAttribute("href") || "").match(/^(\\.\\/|index\\.html|works\\.html|items\\.html)(#.*)?$/);
  if (!m) return;
  e.preventDefault();
  parent.LP_GO(m[1] === "works.html" ? "works" : m[1] === "items.html" ? "items" : "index", m[2] || "");
}, true);
</script>"""
    pages = {}
    for name in ("index", "works", "items"):
        h = (ROOT / f"{name}.html").read_text(encoding="utf-8")
        h = h.replace('<link rel="stylesheet" href="assets/site.css?v=dev">', "<style>\n" + css + "\n</style>")
        h = h.replace('<script src="assets/site.js?v=dev"></script>',
                      "<script>window.SITE_DATA = parent.SITE_DATA;</script>\n<script>\n" + js + "\n</script>\n" + nav)
        pages[name] = h

    def js_str(o):
        return json.dumps(o, ensure_ascii=False).replace("</", "<\\/")

    html = f"""<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{s.get("name", "Leepu")} · 미리보기</title>
<style>html,body{{margin:0;height:100%;background:#fff}}iframe{{display:block;width:100%;height:100%;border:0}}</style>
</head>
<body>
<iframe id="v" title="사이트 미리보기"></iframe>
<script>
window.SITE_DATA = {js_str(d)};
const PAGES = {js_str(pages)};
const v = document.getElementById("v");
window.LP_GO = (page, hash) => {{
  v.onload = () => {{
    document.title = v.contentDocument.title + " · 미리보기";
    if (hash) setTimeout(() => {{ v.contentWindow.location.hash = hash; }}, 300);
  }};
  v.srcdoc = PAGES[page] || PAGES.index;
}};
LP_GO("index", "");
</script>
</body>
</html>
"""
    OUT.write_text(html, encoding="utf-8")
    print(f"만들었어요: {OUT} ({OUT.stat().st_size / 1024 / 1024:.1f} MB)")


if __name__ == "__main__":
    main()
