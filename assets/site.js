/* Leepu 포트폴리오 공통 스크립트: data.json 읽기, 머리말·하단 그리기, 작은 도우미들 */
(() => {
"use strict";
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const list = (v) => (Array.isArray(v) ? v : String(v || "").split(",")).map((x) => String(x).trim()).filter(Boolean);
const safe = (u) => (/^(https?:\/\/|\.?\/|assets\/|mailto:)/i.test(u || "") ? u : "#");
const ko = (a, b) => a.localeCompare(b, "ko");
const ytId = (u) => ((u || "").match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,})/) || [])[1] || "";
const isShort = (u) => /youtube\.com\/shorts\//.test(u || "");
const IMGERR = `onerror="this.style.visibility='hidden'"`;
const ymd = (d) => String(d || "").replace(/-/g, ".");

// 작업 분야 이름 (data.json에는 영문 대문자로 저장됨)
const CAT = { CINEMACHINE: "Cinemachine", "3D": "3D", DESIGN: "Design", BOOTH: "BOOTH", EDIT: "Edit", ETC: "Etc" };
const catLabel = (c) => CAT[c] || c;
const catClass = (c) => (c === "3D" ? "T3D" : String(c).replace(/[^\w-]/g, ""));

// 경력: 설정의 '자기소개' 칸을 한 줄에 하나씩 읽음.
//  "키동부 2025.02 ~"  → 현재 경력
//  "- 리피스튜디오"     → 맨 앞에 - 를 붙이면 지난 경력 (기간이 없으면 '이전'으로 표시)
function career(intro) {
  return String(intro || "").split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const past = /^[-–·]\s*/.test(l);
    l = l.replace(/^[-–·]\s*/, "");
    const m = l.match(/^(.*?)\s*((?:\d{4}[.\-/]\d{1,2}|\d{4})\s*~?\s*(?:\d{4}[.\-/]?\d{0,2})?)\s*$/);
    return m ? { name: m[1].trim(), period: m[2].replace(/\s+/g, " ").trim(), past } : { name: l, period: past ? "이전" : "", past };
  });
}

// 작업 썸네일: YouTube 영상이 연결된 작업은 YouTube 썸네일을 써요.
// 쇼츠는 세로 원본(oardefault) → 큰 가로(maxresdefault) → 기본(hqdefault) → 저장된 썸네일 순서로 시도해요.
function ytOf(w) {
  const u = [...(w.video_urls || []), w.link_url || ""].find((x) => ytId(x));
  return u ? { id: ytId(u), short: isShort(u) } : null;
}
function thumbList(w) {
  const y = ytOf(w), out = [];
  if (y) {
    const b = `https://i.ytimg.com/vi/${y.id}/`;
    if (y.short) out.push(b + "oardefault.jpg");
    out.push(b + "maxresdefault.jpg", b + "hqdefault.jpg");
  }
  if (w.thumbnail) out.push(w.thumbnail);
  return out;
}
// 다음 후보로 넘기기 (YouTube는 없는 크기를 120px짜리 회색 그림으로 돌려줘서 그것도 실패로 봐요)
window.LP_THUMB_NEXT = (img, failed) => {
  if (!failed && !(img.naturalWidth <= 120 && /ytimg/.test(img.src))) return;
  const rest = (img.dataset.next || "").split("|").filter(Boolean);
  if (!rest.length) { img.style.visibility = "hidden"; img.onerror = img.onload = null; return; }
  img.dataset.next = rest.slice(1).join("|");
  img.src = rest[0];
};
function thumbImg(w, extra = "") {
  const list = thumbList(w);
  if (!list.length) return "";
  return `<img src="${esc(list[0])}" data-next="${esc(list.slice(1).join("|"))}" alt="" loading="lazy" ${extra} onload="LP_THUMB_NEXT(this)" onerror="LP_THUMB_NEXT(this, true)">`;
}

// 제목에서 버튜버 이름(… 님)과 작품 이름을 나눠요. 예) "디아나 님 'You & 合図'" → 디아나 님 / You & 合図
function splitTitle(t) {
  t = String(t || "").trim();
  const m = t.match(/^(.*님)\s+(['"‘“].*)$/) || t.match(/^(.*?님)\s+(.+)$/);
  if (!m) return { who: "", what: t };
  let what = m[2].trim();
  // 따옴표로 감싼 부분의 따옴표만 빼요: 'Peppy Twintail' 썸네일 → Peppy Twintail 썸네일
  const q = what.match(/^(['"‘“])(.*?)(['"’”])(.*)$/);
  if (q) what = (q[2] + q[4]).trim();
  return { who: m[1].trim(), what: what || t };
}

function accent(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex || "")) return;
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  const root = document.documentElement.style;
  root.setProperty("--pink", hex);
  root.setProperty("--pink-ink", (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#141214" : "#ffffff");
}

function header(page) {
  const el = document.getElementById("top");
  if (!el) return;
  const cur = (p) => (p === page ? ' aria-current="page"' : "");
  el.innerHTML = `
    <a class="brand" href="./">${esc(LP.D.site.name || "Leepu")}<span class="dot">.</span></a>
    <span class="dots" aria-hidden="true"><i></i><i></i></span>
    <nav aria-label="메뉴">
      <a href="./#about"${cur("about")}>About</a>
      <a href="works.html"${cur("works")}>Works</a>
      <a href="items.html"${cur("items")}>Items</a>
      <a href="#contact">Contact</a>
    </nav>`;
}

function footer() {
  const el = document.getElementById("contact");
  if (!el) return;
  const s = LP.D.site;
  const title = s.footer_title || "Let's make it\nmove.";
  const msg = s.message ?? "매 작업마다 최선을 다하며,\n예쁘고 좋은 결과물을 내기 위해 늘 노력하고 있습니다.";
  const t = esc(title).replace(/\n/g, "<br>").replace(/([.!?])\s*$/, '<span class="dot">$1</span>');
  const links = [
    ...(s.email ? [{ url: "mailto:" + s.email, label: s.email }] : []),
    ...(s.links || []).filter((l) => l.url).map((l) => ({ url: l.url, label: l.label || (/(^|\/\/|\.)(x|twitter)\.com\/([^/?#]+)/i.test(l.url) ? "X @" + l.url.match(/(?:x|twitter)\.com\/([^/?#]+)/i)[1] : l.url.replace(/^https?:\/\//, "")) })),
  ];
  el.innerHTML = `<div class="foot-in">
      <h2 class="rv">${t}</h2>
      <div class="foot-row">
        <div>
          ${msg ? `<p class="foot-msg">${esc(msg)}</p>` : ""}
          <div class="foot-contact">
            <div class="foot-label">문의</div>
            <div class="foot-links">${links.map((l) => `<a href="${esc(safe(l.url))}"${/^mailto:/.test(l.url) ? "" : ' target="_blank" rel="noopener"'}>${esc(l.label)}</a>`).join("")}</div>
          </div>
        </div>
        <span class="foot-copy">© ${new Date().getFullYear()} ${esc(s.name || "Leepu")}<span class="dot">.</span></span>
      </div>
    </div>`;
}

async function boot(page) {
  let D;
  try {
    D = window.SITE_DATA || await (await fetch("data.json", { cache: "no-cache" })).json();
  } catch (e) {
    document.querySelector("main").innerHTML = `<p class="empty">data.json을 불러오지 못했어요. 파일을 컴퓨터에서 바로 열면 이렇게 돼요. GitHub Pages에 올리거나 로컬 서버로 열어 주세요.</p>`;
    throw e;
  }
  D.site = D.site || {};
  D.works = (D.works || []).filter((w) => w.public !== false && w.title);
  D.works.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  D.items = (D.items || []).filter((i) => !i.pending && i.name);
  LP.D = D;
  accent(D.site.accent_color);
  header(page);
  footer();
  return D;
}

window.LP = { esc, list, safe, ko, ytId, isShort, IMGERR, ymd, catLabel, catClass, career, boot, ytOf, thumbImg, splitTitle, D: null };
})();
