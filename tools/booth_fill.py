"""
GitHub Actions에서 자동으로 실행됩니다 (직접 실행할 필요 없음).

관리 화면에서 BOOTH 링크로 등록해 "pending" 표시가 붙은 아이템을 찾아
BOOTH 상품 정보로 이름 · 썸네일을 채우고, 비어 있으면 카테고리 · 아바타도 추측해서 채웁니다.
직접 입력한 값은 덮어쓰지 않습니다.

BOOTH 공식 API가 아니라 상품 페이지 정보를 읽는 방식이라,
BOOTH가 페이지를 바꾸면 실패할 수 있습니다. 실패하면 fill_error에 이유를 남기고
관리 화면에 "자동 채우기 실패 · 직접 입력"으로 표시됩니다.
"""
import html
import io
import json
import os
import re
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data.json")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

try:
    from PIL import Image
except ImportError:
    Image = None

# 아바타 이름 ↔ 일본어 표기 (상품 설명에서 찾기용). 사이트에 이미 쓰는 아바타 이름만 채웁니다.
AVATAR_ALIASES = {
    "manuka": ["マヌカ"], "shinano": ["しなの", "シナノ"], "airi": ["愛莉", "あいり"], "milfy": ["ミルフィ"],
    "milltina": ["ミルティナ"], "mayo": ["マヨ"], "kipfel": ["キプフェル"], "fyuett": ["フィユエ"],
    "eku": ["エク"], "rusk": ["ラスク"], "lasyusha": ["ラシューシャ"],
    "karin": ["カリン"], "chiffon": ["シフォン"], "kikyo": ["桔梗"], "mamehinata": ["まめひなた"], "rindo": ["竜胆"],
}
# BOOTH 카테고리 → 사이트 카테고리
BOOTH_CATS = {"3D衣装": "Clothes", "3Dキャラクター": "Avatar", "3D装飾品": "Accessories", "3Dモーション・アニメーション": "Motion", "3D環境・ワールド": "World", "3Dテクスチャ": None}
TITLE_CATS = [
    (r"hair|ヘア|髪", "Hair"),
    (r"eye|アイ(?!テム)|瞳", "Eye"),
    (r"make ?up|メイク|化粧", "Make Up"),
    (r"オリジナル3Dモデル|original 3d model", "Avatar"),
]


def get(url, referer="https://booth.pm/"):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": referer, "Accept-Language": "ja,en;q=0.8"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def booth_info(item_id):
    """이름, 이미지 주소, 설명, BOOTH 카테고리"""
    try:
        j = json.loads(get(f"https://booth.pm/ja/items/{item_id}.json"))
        imgs = j.get("images") or []
        img = (imgs[0].get("original") or imgs[0].get("resized")) if imgs else ""
        cat = j.get("category") or {}
        return {"name": j.get("name") or "", "image": img or "", "desc": j.get("description") or "", "cat": cat.get("name") if isinstance(cat, dict) else ""}
    except Exception as e:
        first = e
    # 대체: 상품 페이지의 og 태그
    try:
        page = get(f"https://booth.pm/ja/items/{item_id}").decode("utf-8", "replace")
    except Exception as e:
        raise RuntimeError(f"BOOTH 페이지를 열지 못했어요 ({first}; {e})")
    meta = lambda prop: html.unescape((re.search(rf'<meta[^>]+(?:property|name)="{prop}"[^>]+content="([^"]*)"', page) or [None, ""])[1])
    name = re.sub(r"\s*-\s*[^-]*\s*-\s*BOOTH\s*$", "", meta("og:title")).strip()
    if not name:
        raise RuntimeError("상품 이름을 찾지 못했어요")
    return {"name": name, "image": meta("og:image"), "desc": meta("og:description"), "cat": ""}


def shrink(raw):
    if Image is None:
        return raw, ".jpg"
    try:
        im = Image.open(io.BytesIO(raw))
        im.thumbnail((1600, 1600))
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGB")
        buf = io.BytesIO()
        im.save(buf, "WEBP", quality=86, method=5)
        return buf.getvalue(), ".webp"
    except Exception:
        return raw, ".jpg"


def guess_category(name, booth_cat, known):
    found = [c for pat, c in TITLE_CATS if re.search(pat, name, re.I) and c in known]
    if not found and BOOTH_CATS.get(booth_cat) in known:
        found = [BOOTH_CATS[booth_cat]]
    return ", ".join(found)


def guess_avatars(text, known):
    low, out = text.lower(), []
    for av in known:
        latin = re.search(rf"(?<![a-z]){re.escape(av.lower())}(?![a-z])", low)
        if latin or any(k in text for k in AVATAR_ALIASES.get(av.lower(), [])):
            out.append(av)
    return ", ".join(out)


def main():
    with open(DATA, encoding="utf-8") as f:
        d = json.load(f)
    items = d.get("items", [])
    split = lambda s: [x.strip() for x in str(s or "").split(",") if x.strip()]
    known_cats = {c for i in items for c in split(i.get("category"))} | {"Avatar", "Hair", "Clothes", "Eye", "Make Up", "Accessories", "Motion", "World"}
    avatar_names = {}
    for i in items:
        for a in split(i.get("avatar")):
            avatar_names.setdefault(a.lower(), a)
    known_avs = sorted(avatar_names.values(), key=str.lower)

    changed = 0
    for it in items:
        if not it.get("pending"):
            continue
        m = re.search(r"booth\.pm/(?:[a-z-]+/)?items/(\d+)", it.get("product_link") or "")
        it.pop("pending", None)
        changed += 1
        if not m:
            it["fill_error"] = "BOOTH 상품 링크가 아니에요"
            continue
        item_id = m.group(1)
        try:
            info = booth_info(item_id)
            if not it.get("name"):
                it["name"] = info["name"]
            if not it.get("thumbnail") and info["image"]:
                raw, ext = shrink(get(info["image"]))
                rel = f"assets/img/booth_{item_id}{ext}"
                os.makedirs(os.path.join(ROOT, "assets", "img"), exist_ok=True)
                with open(os.path.join(ROOT, rel), "wb") as f:
                    f.write(raw)
                it["thumbnail"] = rel
            if not it.get("category"):
                it["category"] = guess_category(it["name"], info["cat"], known_cats)
            if not it.get("avatar"):
                it["avatar"] = guess_avatars(it["name"] + "\n" + info["desc"], known_avs)
            it.pop("fill_error", None)
            print(f"채움: {item_id} {it['name']}")
        except Exception as e:
            it["fill_error"] = str(e)[:300]
            print(f"실패: {item_id} {e}")

    if changed:
        with open(DATA, "w", encoding="utf-8") as f:
            json.dump(d, f, ensure_ascii=False, indent=1)
            f.write("\n")
    print(f"처리한 아이템: {changed}개")


if __name__ == "__main__":
    main()
