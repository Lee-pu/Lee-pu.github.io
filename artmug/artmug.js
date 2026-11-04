(() => {
  "use strict";
  const PAGE = document.body.dataset.page;
  const ROOT = "../../";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
  const plain = (s) => String(s ?? "").replace(/\*\*/g, "");
  const won = (n) => Number(n || 0).toLocaleString("ko-KR");
  const list = (v) => (Array.isArray(v) ? v : String(v || "").split(",")).map((x) => String(x).trim()).filter(Boolean);
  const ytId = (u) => ((u || "").match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,})/) || [])[1] || (/^[\w-]{11}$/.test(u || "") ? u : "");
  const local = (u) => (!u ? "" : /^(https?:)?\/\//.test(u) ? u : ROOT + u.replace(/^\//, ""));
  const isVideo = (u) => /\.(mp4|webm|mov)(\?|$)/i.test(u || "");

  let lastH = 0;
  const report = () => {
    const h = Math.ceil(document.body.getBoundingClientRect().height) + 30;
    if (Math.abs(h - lastH) < 4) return;
    lastH = h;
    try { window.parent.postMessage({ type: "leepu-height", height: h }, "*"); } catch (e) {}
  };
  const goTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    try { el.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) {}
    const y = el.getBoundingClientRect().top + (window.scrollY || 0);
    try { window.parent.postMessage({ type: "leepu-scroll-pos", section: id, y }, "*"); } catch (e) {}
  };
  const EMBED = window.parent !== window;
  let view = null, lb = null;
  const placeBox = () => {
    if (!lb) return;
    const box = $(".vbox-in", lb), tall = lb.dataset.tall === "1";
    const vh = view ? view.height : EMBED ? Math.min(window.innerHeight, (screen.availHeight || 800) * 0.8) : window.innerHeight;
    const vw = Math.min(document.documentElement.clientWidth, window.innerWidth);
    let w, h;
    if (tall) { h = Math.min(vh * 0.86, 760); w = h * 9 / 16; if (w > vw * 0.92) { w = vw * 0.92; h = w * 16 / 9; } }
    else { w = Math.min(vw * 0.92, 960); h = w * 9 / 16; if (h > vh * 0.8) { h = vh * 0.8; w = h * 16 / 9; } }
    box.style.width = Math.round(w) + "px"; box.style.height = Math.round(h) + "px";
    if (!EMBED) return;
    const top = view ? view.top + view.height / 2 : Number(lb.dataset.y || 0);
    const docH = document.documentElement.scrollHeight;
    box.style.top = Math.round(Math.max(h / 2 + 12, Math.min(top, docH - h / 2 - 12))) + "px";
  };
  const openVideo = (id, tall, y) => {
    closeVideo();
    lb = document.createElement("div");
    lb.className = "vbox" + (EMBED ? " embed" : "");
    lb.dataset.tall = tall ? "1" : "0"; lb.dataset.y = String(y);
    lb.innerHTML = `<div class="vbox-in"><iframe src="https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&playsinline=1&rel=0" title="영상" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div><button type="button" class="vbox-x" aria-label="닫기">×</button>`;
    if (EMBED) lb.style.height = document.documentElement.scrollHeight + "px";
    document.body.appendChild(lb);
    placeBox();
    const x = $(".vbox-x", lb);
    if (EMBED) x.style.top = Math.max(12, parseFloat($(".vbox-in", lb).style.top) - parseFloat($(".vbox-in", lb).style.height) / 2 - 52) + "px";
    try { window.parent.postMessage({ type: "leepu-view-req" }, "*"); } catch (e) {}
    x.focus({ preventScroll: true });
  };
  const closeVideo = () => { if (lb) { lb.remove(); lb = null; } };
  window.addEventListener("message", (e) => {
    const d = e.data;
    if (!d) return;
    if (d.type === "leepu-scroll" && d.section) goTo(d.section);
    if (d.type === "leepu-view") {
      view = { top: Number(d.top) || 0, height: Number(d.height) || window.innerHeight };
      if (lb) { placeBox(); const x = $(".vbox-x", lb), b = $(".vbox-in", lb); x.style.top = Math.max(12, parseFloat(b.style.top) - parseFloat(b.style.height) / 2 - 52) + "px"; }
    }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeVideo(); });

  let C, COMMON, works = [], tab = "", shownAll = false;
  const S = { sel: {}, qty: {}, base: "" };
  let no = 0;
  const panel = (id, title, body, cls = "") => `<section class="panel ${cls}" id="${id}"><h2 class="sec-h"><span class="no">${String(++no).padStart(2, "0")}</span><span class="tt">${esc(title)}</span></h2><div class="sec-body">${body}</div></section>`;

  const hero = () => `<header class="panel hero" id="lpSec-home">
    <span class="badge">${esc(C.badge)}</span>
    <img class="avatar" src="${esc(local(COMMON.profile_image))}" alt="Leepu 프로필">
    <div class="logo">Leepu<i>.</i></div>
    <p class="greet">${md(C.greeting)}</p>
  </header>`;

  const notices = () => `<div class="must"><span class="ic" aria-hidden="true">!</span><div><b>${esc(COMMON.must_title)}</b><span class="t">${esc(COMMON.must_text)}</span></div></div>
    <div class="acc-list">${(C.notices || []).map((n, i) => `<details class="acc"${i === 0 ? " open" : ""}><summary>${esc(n.title)}<span class="plus" aria-hidden="true">+</span></summary><ul>${(n.items || []).map((x) => `<li>${md(x)}</li>`).join("")}</ul></details>`).join("")}</div>
    <p class="end">${md(COMMON.notice_end)}</p>`;

  const media = (w) => {
    const id = ytId(w.youtube);
    const src = local(w.img) || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "");
    if (isVideo(w.img)) return `<video src="${esc(src)}" autoplay muted loop playsinline preload="metadata"></video>`;
    const img = src ? `<img src="${esc(src)}" alt="${esc(w.alt || w.name)}" loading="lazy"${id ? ` onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${id}/hqdefault.jpg'"` : ""}>` : "";
    return img + (id ? `<button type="button" class="play" data-yt="${esc(id)}" aria-label="${esc(w.alt || w.name)} 재생"><span aria-hidden="true">▶</span></button>` : "");
  };

  const card3d = (w) => `<div class="card"><div class="media">${media(w)}</div><div class="cap">${w.platform ? `<span class="pf">${esc(w.platform)}</span><span class="dot">·</span>` : ""}${esc(w.name)}</div></div>`;
  const cardCine = (w, i) => `<div class="card"${i >= C.works_shown && !shownAll ? " hidden" : ""}><div class="media">${media(w)}</div><div class="cap">${esc(w.name)}</div><div class="cap2">${esc(w.song)}</div></div>`;

  const portfolio3d = () => {
    const tabs = (C.tabs || []).filter((t) => works.some((w) => w.tags.includes(t)));
    if (!tab || !tabs.includes(tab)) tab = tabs[0] || "";
    return `<div class="tabs" id="lpTabs" role="tablist"><span class="pill" aria-hidden="true"></span>${tabs.map((t) => `<button type="button" class="tab" data-tab="${esc(t)}" aria-pressed="${t === tab}">${esc(t)}</button>`).join("")}</div><div class="grid" id="lpGrid">${works.filter((w) => w.tags.includes(tab)).map(card3d).join("")}</div>`;
  };
  const portfolioCine = () => {
    const more = works.length > C.works_shown && !shownAll ? `<div class="more"><button type="button" class="btn-line" id="lpMore">더보기</button></div>` : "";
    return `<div class="grid cine">${works.map(cardCine).join("")}</div>${more}`;
  };

  const sales = () => {
    const items = (C.sales && C.sales.items) || [];
    if (!items.length) return `<div class="empty">${md(C.sales && C.sales.empty)}</div>`;
    return `<div class="grid">${items.map(card3d).join("")}</div>`;
  };

  const itemState = (g, it) => {
    const on = !!S.sel[it.id];
    const q = S.qty[it.id] || 1;
    const sum = it.soon || it.ask ? 0 : (it.price || 0) * (it.qty ? q : 1);
    return { on, q, sum };
  };
  const picked = () => {
    const out = [];
    let total = 0, ask = false;
    (C.groups || []).forEach((g) => g.items.forEach((it) => {
      const st = itemState(g, it);
      if (!st.on) return;
      total += st.sum;
      if (it.ask) ask = true;
      out.push({ label: it.label + (it.qty ? " × " + st.q : ""), sum: it.ask ? "문의" : won(st.sum) + "원" });
    }));
    return { rows: out, total, ask };
  };
  const groupsHtml = (sub) => (C.groups || []).map((g) => `<div class="grp">
    <div class="g-h${sub ? " sub" : ""}">${sub ? "+ " : ""}${esc(g.name)}</div>
    <div class="g-items">${g.items.map((it) => {
      if (it.soon) return `<div class="soon"><span>${esc(it.label)}</span><b>곧 오픈</b></div>`;
      const st = itemState(g, it);
      const price = it.ask ? "문의" : won(it.price) + (it.qty ? " / 개" : "");
      return `<label class="opt${st.on ? " on" : ""}"><input type="checkbox" data-item="${esc(it.id)}"${st.on ? " checked" : ""}><span class="lb">${esc(it.label)}</span><span class="pr">${price}</span></label>${it.qty && st.on ? `<div class="qty">개수<button type="button" data-dec="${esc(it.id)}" aria-label="개수 줄이기">−</button><b>${st.q}</b><button type="button" data-inc="${esc(it.id)}" aria-label="개수 늘리기">+</button></div>` : ""}`;
    }).join("")}</div>
    ${g.note ? `<p class="g-note">${md(g.note)}</p>` : ""}
  </div>`).join("");

  const receiptHtml = () => {
    const p = picked();
    const rows = (S.base ? [{ label: "베이스 아바타", sum: S.base }] : []).concat(p.rows);
    return `<div class="rc-t">Leepu<i>.</i> RECEIPT</div><div class="rc-s">예상 견적서</div><div class="rc-hr"></div>
      ${rows.length ? `<div class="rc-list">${rows.map((r) => `<div class="rc-row"><span>${esc(r.label)}</span><span>${esc(r.sum)}</span></div>`).join("")}</div>` : `<p class="rc-empty">아직 고른 항목이 없어요</p>`}
      <div class="rc-hr"></div><div class="rc-total"><span>합계</span><span>${won(p.total)}원</span></div>
      <button type="button" class="btn-dark" data-go="lpSec-form">이 견적으로 신청하기</button>
      <button type="button" class="btn-text" id="lpClear">다시 고르기</button>`;
  };

  const estimate = () => `<div class="est">
    <div class="est-l" id="lpCalc">
      <div id="lpSec-avatar"><div class="g-h">베이스 아바타</div><select class="in sel" id="lpBase"><option value="">아바타를 선택해 주세요</option>${(C.avatars || []).concat(C.avatar_none ? [C.avatar_none] : []).map((a) => `<option value="${esc(a)}">${esc(a)}</option>`).join("")}</select></div>
      <div id="lpGroups" style="display:flex;flex-direction:column;gap:20px">${groupsHtml(false)}</div>
    </div>
    <aside class="receipt" id="lpReceipt">${receiptHtml()}</aside>
  </div>`;

  const pickedHtml = () => {
    const p = picked();
    return `${p.rows.length ? p.rows.map((r) => `<div class="row"><span>${esc(r.label)}</span><span>${esc(r.sum)}</span></div>`).join("") : `<span class="hint">견적 계산기에서 항목을 고르면 여기에 자동으로 채워져요.</span>`}<div class="sum"><span>합계</span><span>${won(p.total)}원</span></div>`;
  };

  const chooseHtml = () => `${groupsHtml(true)}<div class="choose-total"><span>예상 금액</span><span>${won(picked().total)}원</span></div>`;
  const field = (f, sub) => {
    const cls = sub ? "fl sub" : "fl";
    const label = sub ? `+ ${esc(f.label)}` : `${f._n}. ${esc(f.label)}`;
    const ph = f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : "";
    if (f.type === "picked") return `<div class="${cls}"><span>${label}</span><div class="picked" id="lpPicked">${pickedHtml()}</div></div>`;
    if (f.type === "choose") return `<div class="${cls}"><span>${label}</span><div class="choose" id="lpChoose">${chooseHtml()}</div></div>`;
    if (f.type === "base") return `<label class="${cls}">${label}<input class="in" type="text" readonly id="lpBaseOut" placeholder="견적 계산기에서 고르면 자동으로 채워져요"></label>`;
    if (f.type === "area") return `<label class="${cls}">${label}<textarea class="in" rows="2" data-k="${esc(f.key)}"${ph}></textarea></label>`;
    return `<label class="${cls}">${label}<input class="in" type="text" data-k="${esc(f.key)}"${ph}></label>`;
  };
  const form = () => {
    let n = 0;
    const rows = (C.form || []).map((f) => { f._n = ++n; return field(f, false) + (f.subs || []).map((s) => field(s, true)).join("") + (f.note ? `<p class="fnote">${md(f.note)}</p>` : ""); }).join("");
    return `<div class="form" id="lpForm">${rows}
      <label class="agree"><input type="checkbox" id="lpAgree"><span>${esc(COMMON.agree)}</span></label>
      <div class="fbtns"><button type="button" class="go" id="lpCopy">신청 내용 복사하기</button><button type="button" class="rs" id="lpReset">초기화</button></div>
      <p class="fmsg" id="lpMsg" aria-live="polite"></p></div>`;
  };

  const steps = () => `<ol class="steps">${(C.steps || []).map((s, i) => `<li><b>STEP ${i + 1}</b><div>${esc(s)}</div></li>`).join("")}</ol>`;

  const refresh = () => {
    if ($("#lpGroups")) $("#lpGroups").innerHTML = groupsHtml(false);
    if ($("#lpReceipt")) $("#lpReceipt").innerHTML = receiptHtml();
    if ($("#lpPicked")) $("#lpPicked").innerHTML = pickedHtml();
    if ($("#lpBaseOut")) $("#lpBaseOut").value = S.base;
    if ($("#lpBase")) $("#lpBase").value = S.base;
    if ($("#lpChoose")) $("#lpChoose").innerHTML = chooseHtml();
    report();
  };

  const pill = (instant) => {
    const box = $("#lpTabs"), on = box && $(".tab[aria-pressed=\"true\"]", box), p = box && $(".pill", box);
    if (!on || !p) return;
    if (instant) p.style.transition = "none";
    p.style.width = on.offsetWidth + "px";
    p.style.transform = `translateX(${on.offsetLeft}px)`;
    if (instant) requestAnimationFrame(() => { p.style.transition = ""; });
  };

  const copyText = () => {
    const out = [`[Leepu ${PAGE === "3d" ? "3D" : "시네머신"} 커미션 신청서]`, ""];
    const val = (k) => { const el = $(`[data-k="${k}"]`); return el ? el.value.trim() : ""; };
    const one = (f, sub) => {
      if (f.type === "picked" || f.type === "choose") {
        const p = picked();
        out.push(`${f._n}. ${f.label}`);
        if (p.rows.length) p.rows.forEach((r) => out.push(`- ${r.label} : ${r.sum}`)); else out.push("-");
        out.push(`합계 : ${won(p.total)}원${p.ask ? " (문의 항목 별도)" : ""}`);
        return;
      }
      const v = f.type === "base" ? S.base : val(f.key);
      if (sub) out.push(`+ ${f.label} : ${v || "-"}`);
      else { out.push(`${f._n}. ${f.label}`); out.push(v || "-"); }
    };
    (C.form || []).forEach((f) => { one(f, false); (f.subs || []).forEach((s) => one(s, true)); out.push(""); });
    out.push("✔ " + COMMON.agree);
    return out.join("\n");
  };
  const copy = async (t) => {
    try { await navigator.clipboard.writeText(t); return true; } catch (e) {
      const a = document.createElement("textarea"); a.value = t; a.style.position = "fixed"; a.style.opacity = "0"; document.body.appendChild(a); a.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch (_) {} a.remove(); return ok;
    }
  };

  const toggle = (id) => {
    const g = (C.groups || []).find((x) => x.items.some((i) => i.id === id));
    if (!g) return;
    const was = !!S.sel[id];
    if (g.radio) g.items.forEach((i) => { delete S.sel[i.id]; });
    if (was) delete S.sel[id]; else S.sel[id] = true;
    refresh();
  };

  async function boot() {
    const [content, data] = await Promise.all([
      fetch(ROOT + "artmug.json", { cache: "no-cache" }).then((r) => r.json()),
      PAGE === "cinemachine" ? fetch(ROOT + "data.json", { cache: "no-cache" }).then((r) => r.json()).catch(() => ({ works: [] })) : null,
    ]);
    COMMON = content.common || {};
    C = content[PAGE];
    if (PAGE === "3d") {
      works = (C.works || []).map((w) => ({ ...w, tags: list(w.tags) }));
    } else {
      const cat = String(C.works_from_portfolio || "CINEMACHINE").toUpperCase();
      works = ((data && data.works) || [])
        .filter((w) => w.public !== false && w.artmug !== false && list(w.category).some((c) => c.toUpperCase() === cat))
        .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
        .map((w) => {
          const t = String(w.title || "").trim(), m = t.match(/^(.*님)\s+(.+)$/);
          const u = (w.video_urls || []).find(ytId) || w.link_url || "";
          const own = w.thumbnail && !/i\.ytimg\.com\//.test(w.thumbnail) ? w.thumbnail : "";
          return { name: m ? m[1] : t, song: m ? m[2] : "", alt: t, youtube: ytId(u), img: own };
        });
      C.works_shown = C.works_shown || 8;
    }
    const parts = [hero(), panel("lpSec-notice", "필독사항", notices()), panel("lpSec-portfolio", "포트폴리오", PAGE === "3d" ? portfolio3d() : portfolioCine())];
    if (PAGE === "3d") {
      parts.push(panel("lpSec-sales", "개인작", sales()));
      parts.push(panel("lpSec-estimate", "견적 계산기", estimate()));
    }
    parts.push(panel("lpSec-form", "신청 양식", form()));
    parts.push(panel("lpSec-process", "진행 과정", steps()));
    parts.push(`<footer class="foot">© ${new Date().getFullYear()} Leepu<i>.</i></footer>`);
    $("#app").innerHTML = `<div class="wrap">${parts.join("")}</div>`;
    pill(true);

    document.addEventListener("change", (e) => {
      const it = e.target.closest("[data-item]");
      if (it) return toggle(it.dataset.item);
      if (e.target.id === "lpBase") { S.base = e.target.value; refresh(); }
    });
    document.addEventListener("click", async (e) => {
      const go = e.target.closest("[data-go]");
      if (go) return goTo(go.dataset.go);
      if (lb && (e.target === lb || e.target.closest(".vbox-x"))) return closeVideo();
      const pl = e.target.closest(".play");
      if (pl) {
        const r = pl.getBoundingClientRect();
        return openVideo(pl.dataset.yt, !!pl.closest(".cine"), r.top + (window.scrollY || 0) + r.height / 2);
      }
      const t = e.target.closest("#lpTabs .tab");
      if (t) {
        tab = t.dataset.tab;
        $$("#lpTabs .tab").forEach((b) => b.setAttribute("aria-pressed", String(b === t)));
        $("#lpGrid").innerHTML = works.filter((w) => w.tags.includes(tab)).map(card3d).join("");
        try { t.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" }); } catch (_) {}
        pill(false);
        return report();
      }
      if (e.target.id === "lpMore") { shownAll = true; $$(".grid.cine .card[hidden]").forEach((c) => { c.hidden = false; }); e.target.parentElement.remove(); return report(); }
      const inc = e.target.closest("[data-inc]"), dec = e.target.closest("[data-dec]");
      if (inc) { S.qty[inc.dataset.inc] = (S.qty[inc.dataset.inc] || 1) + 1; return refresh(); }
      if (dec) { S.qty[dec.dataset.dec] = Math.max(1, (S.qty[dec.dataset.dec] || 1) - 1); return refresh(); }
      if (e.target.id === "lpClear") { S.sel = {}; S.qty = {}; S.base = ""; return refresh(); }
      const msg = $("#lpMsg");
      if (e.target.id === "lpCopy") {
        if (!$("#lpAgree").checked) {
          msg.textContent = "필독사항 동의에 체크해 주세요."; msg.className = "fmsg warn";
          const a = $(".agree"); a.classList.add("shake"); setTimeout(() => a.classList.remove("shake"), 450);
          return;
        }
        const ok = await copy(copyText());
        msg.textContent = ok ? "복사됐어요! 아트머그 문의창에 붙여넣어 주세요." : "복사하지 못했어요. 다시 눌러 주세요.";
        msg.className = "fmsg " + (ok ? "ok" : "warn");
        return;
      }
      if (e.target.id === "lpReset") {
        $$("#lpForm [data-k]").forEach((x) => { x.value = ""; });
        $("#lpAgree").checked = false; msg.textContent = ""; msg.className = "fmsg";
        if (PAGE !== "3d") { S.sel = {}; S.qty = {}; }
        return refresh();
      }
    });
    window.addEventListener("resize", () => pill(true));
    $$("details").forEach((d) => d.addEventListener("toggle", report));
    report();
    window.addEventListener("load", () => { pill(true); report(); });
    if ("ResizeObserver" in window) new ResizeObserver(report).observe(document.body); else setInterval(report, 800);
  }
  boot().catch(() => { $("#app").innerHTML = `<p class="err">페이지를 불러오지 못했어요. 새로고침해 주세요.</p>`; report(); });
})();
