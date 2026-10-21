"""
Base44 등 외부 서버에 있는 사진·영상을 이 사이트 폴더(assets/)로 내려받고,
data.json 안의 주소를 내려받은 파일 경로로 바꿔 줍니다.

사용법 (사이트 폴더에서):
    python tools/files_import.py

- 사진: Pillow가 설치되어 있으면 큰 사진을 웹용 크기(긴 변 2400px)·WebP로 줄입니다.
        (설치: pip install pillow  /  없으면 원본 그대로 저장)
- 영상: 그대로 저장합니다. 95MB가 넘는 영상은 GitHub에 올릴 수 없으니
        목록을 보여 줍니다. 그런 영상은 YouTube에 올리고 주소만 바꿔 주세요.
- 다시 실행해도 됩니다. 이미 받은 파일은 건너뜁니다.
"""
import hashlib
import io
import json
import os
import sys
import urllib.request
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data.json")
HOSTS = ("base44.app", "booth.pximg.net")  # 여기 있는 주소만 내려받음
GITHUB_LIMIT = 95 * 1024 * 1024
MAX_SIDE = 2400

try:
    from PIL import Image
except ImportError:
    Image = None

VIDEO_EXT = {".mp4", ".webm", ".mov", ".m4v"}


def want(url):
    if isinstance(url, str) and url.startswith("data:") and ";base64," in url[:80]:
        return True
    return isinstance(url, str) and url.startswith("http") and any(h in urlparse(url).netloc for h in HOSTS)


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Referer": "https://booth.pm/"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def shrink(raw, ext):
    """큰 사진을 줄여서 WebP로. 이득이 없으면 원본 유지."""
    if Image is None or ext == ".gif":
        return raw, ext
    try:
        im = Image.open(io.BytesIO(raw))
        im.load()
    except Exception:
        return raw, ext
    if max(im.size) <= MAX_SIDE and len(raw) < 600 * 1024:
        return raw, ext
    im.thumbnail((MAX_SIDE, MAX_SIDE))
    if im.mode not in ("RGB", "RGBA"):
        im = im.convert("RGBA" if "A" in im.getbands() else "RGB")
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=86, method=5)
    out = buf.getvalue()
    return (out, ".webp") if len(out) < len(raw) else (raw, ext)


MIME_EXT = {"image/webp": ".webp", "image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif", "video/mp4": ".mp4", "video/webm": ".webm", "video/quicktime": ".mov"}


def save_data_uri(uri, cache, report):
    """관리 화면을 컴퓨터에서 쓸 때 data.json 안에 넣어 둔 사진·영상을 파일로 꺼냄"""
    import base64
    head, _, b64 = uri.partition(",")
    mime = head[5:].split(";")[0]
    ext = MIME_EXT.get(mime, ".bin")
    kind = "video" if mime.startswith("video/") else "img"
    raw = base64.b64decode(b64)
    rel = f"assets/{kind}/{hashlib.sha1(raw).hexdigest()[:12]}{ext}"
    os.makedirs(os.path.join(ROOT, "assets", kind), exist_ok=True)
    with open(os.path.join(ROOT, rel), "wb") as f:
        f.write(raw)
    report[kind] += len(raw)
    cache[uri] = rel
    print(f"  [{len(cache)}] {rel}  {len(raw) / 1048576:.1f}MB (data.json 안의 파일)")
    return rel


def save(url, cache, report):
    if url in cache:
        return cache[url]
    if url.startswith("data:"):
        return save_data_uri(url, cache, report)
    ext = os.path.splitext(urlparse(url).path)[1].lower() or ".bin"
    kind = "video" if ext in VIDEO_EXT else "img"
    name = hashlib.sha1(url.encode()).hexdigest()[:12]
    folder = os.path.join(ROOT, "assets", kind)
    os.makedirs(folder, exist_ok=True)
    done = [f for f in os.listdir(folder) if f.startswith(name + ".")]
    if done:
        rel = f"assets/{kind}/{done[0]}"
    else:
        try:
            raw = fetch(url)
        except Exception as e:
            report["fail"].append((url, str(e)))
            cache[url] = url
            return url
        if kind == "img":
            raw, ext = shrink(raw, ext)
        rel = f"assets/{kind}/{name}{ext}"
        with open(os.path.join(ROOT, rel), "wb") as f:
            f.write(raw)
    size = os.path.getsize(os.path.join(ROOT, rel))
    report[kind] += size
    if kind == "video" and size > GITHUB_LIMIT:
        # GitHub에 못 올리는 크기 → 파일은 지우고 원래 주소 유지
        os.remove(os.path.join(ROOT, rel))
        report["video"] -= size
        report["big"].append((url, size))
        cache[url] = url
        return url
    cache[url] = rel
    n = len(cache)
    print(f"  [{n}] {rel}  {size / 1048576:.1f}MB")
    return rel


def main():
    with open(DATA, encoding="utf-8") as f:
        d = json.load(f)
    cache, report = {}, {"img": 0, "video": 0, "fail": [], "big": []}
    conv = lambda u: save(u, cache, report) if want(u) else u

    if Image is None:
        print("※ Pillow가 없어 사진을 원본 크기로 저장합니다 (pip install pillow 하면 용량이 크게 줄어요)\n")
    print("내려받는 중…")
    d["site"]["profile_image"] = conv(d["site"].get("profile_image"))
    for w in d["works"]:
        w["thumbnail"] = conv(w.get("thumbnail"))
        w["images"] = [conv(u) for u in w.get("images", [])]
        w["video_urls"] = [conv(u) for u in w.get("video_urls", [])]
    for i in d["items"]:
        i["thumbnail"] = conv(i.get("thumbnail"))

    with open(DATA, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=1)

    mb = lambda b: f"{b / 1048576:.0f}MB"
    print("\n─ 결과 ─")
    print(f"사진 {mb(report['img'])} · 영상 {mb(report['video'])} · 합계 {mb(report['img'] + report['video'])} (GitHub Pages 한도 1GB)")
    if report["big"]:
        print("\n95MB가 넘어서 GitHub에 못 올리는 영상:")
        for rel, s in report["big"]:
            print(f"  {rel}  {mb(s)}")
        print("→ YouTube에 올린 뒤 data.json에서 이 경로를 YouTube 주소로 바꾸고, 파일은 지워 주세요.")
    if report["img"] + report["video"] > 900 * 1048576:
        print("\n⚠ 합계가 900MB를 넘었습니다. 영상 일부를 YouTube로 옮기는 걸 권장해요.")
    if report["fail"]:
        print(f"\n내려받기 실패 {len(report['fail'])}개 (주소는 그대로 둠, 다시 실행하면 재시도):")
        for u, e in report["fail"][:20]:
            print(f"  {u}\n    {e}")
    print("\ndata.json을 새 경로로 바꿔 저장했습니다.")


if __name__ == "__main__":
    sys.exit(main())
