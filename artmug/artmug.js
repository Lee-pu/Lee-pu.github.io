(() => {
  "use strict";
  const PAGE = document.body.dataset.page;
  const ROOT = "../../";
  const SITE = "https://lee-pu.github.io/";
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const br = (s) => esc(s).replace(/\n/g, "<br>");
  const list = (v) => (Array.isArray(v) ? v : String(v || "").split(",")).map((x) => String(x).trim()).filter(Boolean);
  const ytId = (u) => ((u || "").match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,})/) || [])[1] || "";
  const isShort = (u) => /youtube\.com\/shorts\//.test(u || "");
  const split = (t) => { t = String(t || "").trim(); const m = t.match(/^(.*님)\s+(.+)$/); return m ? { who: m[1].trim(), what: m[2].trim() } : { who: "", what: t }; };
  const local = (u) => (/^(https?:)?\/\//.test(u || "") ? u : ROOT + u);

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
  window.addEventListener("message", (e) => { if (e.data && e.data.type === "leepu-scroll" && e.data.section) goTo(e.data.section); });

  const section = (id, eyebrow, title, body, cls = "") => `<section class="sec ${cls}" id="${id}"><div class="sec-head"><span class="eyebrow">${eyebrow}</span><h2>${title}</h2></div>${body}</section>`;

  function hero(C, count) {
    return `<header class="hero" id="lpSec-home">
      <div class="topline"><span class="brand">Leepu<i>.</i></span><a class="site" href="${SITE}" target="_blank" rel="noopener">Portfolio ↗</a></div>
      <span class="badge">${esc(C.badge)}</span>
      <h1><span>${esc(C.title[0])}</span><span class="pk">${esc(C.title[1].replace(/\.$/, ""))}<i>.</i></span></h1>
      <p class="greet">${br(C.greeting)}</p>
      <div class="tags">${C.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
      <div class="cta"><button type="button" class="btn dark" data-go="lpSec-portfolio">완성작 ${count}개 보기</button><button type="button" class="btn" data-go="lpSec-form">신청 양식</button></div>
    </header>`;
  }

  function cineWorks(works) {
    const shown = 9;
    const card = (w, i) => {
      const u = (w.video_urls || []).find(ytId) || w.link_url || "";
      const id = ytId(u), s = split(w.title);
      const own = w.thumbnail && !/i\.ytimg\.com\//.test(w.thumbnail) ? local(w.thumbnail) : "";
      const src = own || (id ? `https://i.ytimg.com/vi/${id}/${isShort(u) ? "oardefault" : "hqdefault"}.jpg` : "");
      const fb = id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "";
      return `<button type="button" class="vcard${i >= shown ? " more-hide" : ""}" data-yt="${esc(id)}" aria-label="${esc(s.what)} 재생">
        <span class="vthumb">${src ? `<img src="${esc(src)}" alt="" loading="lazy" onerror="if(this.dataset.f!=='1'&&'${fb}'){this.dataset.f='1';this.src='${fb}'}else{this.style.visibility='hidden'}">` : ""}<span class="play" aria-hidden="true">▶</span></span>
        <span class="vcap"><b>${esc(s.what)}</b>${s.who ? `<small>${esc(s.who)}</small>` : ""}</span>
      </button>`;
    };
    const more = works.length > shown ? `<div class="more"><button type="button" class="btn" id="lpMoreBtn">더보기 (${works.length - shown})</button></div>` : "";
    return `<div class="vgrid" id="lpGrid">${works.map(card).join("")}</div>${more}`;
  }

  const catOf3d = (t) => {
    const s = String(t);
    if (/성형/.test(s) && /페이셜/.test(s)) return "패키지";
    if (/성형/.test(s)) return "성형";
    if (/페이셜/.test(s)) return "페이셜";
    if (/VRC/i.test(s)) return "VRC";
    if (/API/i.test(s)) return "API";
    return "기타";
  };
  function d3Works(works, C) {
    const items = [
      ...works.map((w) => ({ cat: catOf3d(w.title), title: w.title, img: local(w.thumbnail || (w.images || [])[0] || ""), href: `${SITE}works.html#${w.id}` })),
      ...C.extraWorks.map((x) => ({ cat: x.cat, title: x.title, img: x.img, href: "" })),
    ].filter((x) => x.img);
    const cats = C.portfolioCats.filter((c) => items.some((x) => x.cat === c));
    const tabs = `<div class="tabs" id="lpFilterTabs"><button type="button" data-cat="" aria-pressed="true">전체 <small>${items.length}</small></button>${cats.map((c) => `<button type="button" data-cat="${esc(c)}" aria-pressed="false">${esc(c)} <small>${items.filter((x) => x.cat === c).length}</small></button>`).join("")}</div>`;
    const card = (x) => {
      const s = split(x.title), inner = `<span class="pimg"><img src="${esc(x.img)}" alt="" loading="lazy" onerror="this.closest('.pcard').remove()"><em>${esc(x.cat)}</em></span><span class="pcap"><b>${esc(s.what)}</b>${s.who ? `<small>${esc(s.who)}</small>` : ""}</span>`;
      return x.href ? `<a class="pcard" data-c="${esc(x.cat)}" href="${esc(x.href)}" target="_blank" rel="noopener">${inner}</a>` : `<div class="pcard" data-c="${esc(x.cat)}">${inner}</div>`;
    };
    return `${tabs}<div class="pgrid" id="lpGrid">${items.map(card).join("")}</div>`;
  }

  function process(C) {
    const steps = C.steps.map((s, i) => `<li><span class="n">${i + 1}</span><b>${esc(s)}</b></li>`).join("");
    const fees = C.fees.length ? `<div class="fees"><p class="fee-h">🔁 수정 횟수 초과 시 추가금</p>${C.fees.map((f) => `<div class="fee"><strong>${esc(f.price)}</strong><span>${esc(f.label)}</span></div>`).join("")}</div>` : "";
    return `<ol class="steps">${steps}</ol><p class="rev">${esc(C.revisions)}</p>${fees}<div class="caution"><b>⚠️ 주의 사항</b><p>${esc(C.caution)}</p></div>`;
  }

  function notices(C, foot) {
    const acc = C.notices.map((n, i) => `<details class="acc"${i === 0 ? " open" : ""}><summary>${esc(n.title)}<span aria-hidden="true">+</span></summary><ul>${n.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>${n.note ? `<p class="acc-note">${esc(n.note)}</p>` : ""}</details>`).join("");
    return `<div class="must"><b>※ 반드시 읽어주세요.</b><span>미숙지로 인한 모든 불이익은 작가가 책임지지 않습니다.</span></div>${acc}<p class="foot-note">${esc(foot)}</p>`;
  }

  function form(C, agree) {
    const field = (f) => {
      if (f.type === "list") return `<div class="list" data-list="${esc(f.key)}"><input class="in" type="text" placeholder="${esc(f.placeholder || "")}" data-k="${esc(f.key)}"></div><button type="button" class="add" data-add="${esc(f.key)}" data-ph="${esc(f.placeholder || "")}">${esc(f.add || "+ 추가")}</button>`;
      if (f.type === "area") return `<textarea class="in" rows="3" placeholder="${esc(f.placeholder || "")}" data-k="${esc(f.key)}"></textarea>`;
      return `<input class="in" type="text" placeholder="${esc(f.placeholder || "")}" data-k="${esc(f.key)}">`;
    };
    const rows = C.form.map((f, i) => `<div class="frow"><label><span class="n">${i + 1}</span>${esc(f.label)}</label>${field(f)}${(f.subs || []).map((s) => `<label class="sub">+ ${esc(s.label)}</label>${field(s)}`).join("")}${f.note ? `<p class="fnote">${br(f.note)}</p>` : ""}</div>`).join("");
    return `<div class="form">${rows}<label class="agree"><input type="checkbox" id="lpAgree"><span>${esc(agree)}</span></label><div class="fbtns"><button type="button" class="btn dark" id="lpCopyBtn">신청 내용 복사하기</button><button type="button" class="btn" id="lpResetBtn">초기화</button></div><p class="fmsg" id="lpMsg" aria-live="polite"></p></div>`;
  }

  function copyText(C) {
    const val = (k) => [...document.querySelectorAll(`[data-k="${k}"]`)].map((x) => x.value.trim()).filter(Boolean);
    const out = [`[Leepu ${PAGE === "3d" ? "3D" : "시네머신"} 커미션 신청서]`, ""];
    C.form.forEach((f, i) => {
      out.push(`${i + 1}. ${f.label}`);
      const v = val(f.key);
      out.push(f.type === "list" ? (v.length ? v.map((x) => `- ${x}`).join("\n") : "-") : v[0] || "-");
      (f.subs || []).forEach((s) => out.push(`+ ${s.label}: ${val(s.key)[0] || "-"}`));
      out.push("");
    });
    out.push("✔ 필독사항 및 주의사항을 모두 확인하였으며 이에 동의합니다.");
    return out.join("\n");
  }
  async function copy(t) {
    try { await navigator.clipboard.writeText(t); return true; } catch (e) {
      const a = document.createElement("textarea"); a.value = t; a.style.position = "fixed"; a.style.opacity = "0"; document.body.appendChild(a); a.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch (_) {} a.remove(); return ok;
    }
  }

  async function boot() {
    const [content, data] = await Promise.all([
      fetch("../content.json", { cache: "no-cache" }).then((r) => r.json()),
      fetch(ROOT + "data.json", { cache: "no-cache" }).then((r) => r.json()).catch(() => ({ works: [] })),
    ]);
    const C = content[PAGE];
    const works = (data.works || []).filter((w) => w.public !== false && w.title).sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    const mine = works.filter((w) => list(w.category).some((c) => c.toUpperCase() === (PAGE === "3d" ? "3D" : "CINEMACHINE")));
    const count = PAGE === "3d" ? mine.length + C.extraWorks.length : mine.length;
    const parts = [
      hero(C, count),
      section("lpSec-portfolio", "WORKS", `완성작<i>.</i> <small>${count}</small>`, PAGE === "3d" ? d3Works(mine, C) : cineWorks(mine), "works"),
      section("lpSec-process", "PROCESS", "진행 과정<i>.</i>", process(C)),
      section("lpSec-notice", "NOTICE", "필독사항<i>.</i>", notices(C, content.notice_foot)),
    ];
    if (PAGE === "3d") {
      parts.push(section("lpSec-avatar", "AVATARS", "보유 아바타<i>.</i>", `<p class="lead">${esc(C.avatarsNote)}</p><div class="chips">${C.avatars.map((a) => `<span>${esc(a)}</span>`).join("")}</div>`));
      parts.push(section("lpSec-sales", "SHOP", "개인작 판매<i>.</i>", `<div class="soon"><p>${br(C.sales)}</p></div>`));
    }
    parts.push(section("lpSec-form", "ORDER", "신청 양식<i>.</i>", form(C, content.agree), "order"));
    parts.push(`<footer class="foot"><span>© ${new Date().getFullYear()} Leepu<i>.</i></span><a href="${SITE}" target="_blank" rel="noopener">lee-pu.github.io ↗</a></footer>`);
    $("#app").innerHTML = parts.join("");

    document.addEventListener("click", async (e) => {
      const go = e.target.closest("[data-go]");
      if (go) return goTo(go.dataset.go);
      const v = e.target.closest(".vcard");
      if (v && v.dataset.yt && !v.classList.contains("on")) {
        v.classList.add("on");
        v.querySelector(".vthumb").innerHTML = `<iframe src="https://www.youtube.com/embed/${v.dataset.yt}?autoplay=1&playsinline=1&rel=0" title="영상" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
        return;
      }
      if (e.target.id === "lpMoreBtn") { document.querySelectorAll(".more-hide").forEach((x) => x.classList.remove("more-hide")); e.target.parentElement.remove(); return report(); }
      const tab = e.target.closest("#lpFilterTabs button");
      if (tab) {
        document.querySelectorAll("#lpFilterTabs button").forEach((b) => b.setAttribute("aria-pressed", String(b === tab)));
        document.querySelectorAll(".pcard").forEach((c) => { c.hidden = !!tab.dataset.cat && c.dataset.c !== tab.dataset.cat; });
        return report();
      }
      const add = e.target.closest("[data-add]");
      if (add) {
        const box = document.querySelector(`[data-list="${add.dataset.add}"]`);
        const i = document.createElement("input"); i.className = "in"; i.type = "text"; i.placeholder = add.dataset.ph; i.dataset.k = add.dataset.add;
        box.appendChild(i); i.focus(); return report();
      }
      const msg = $("#lpMsg");
      if (e.target.id === "lpCopyBtn") {
        if (!$("#lpAgree").checked) { msg.textContent = "필독사항 동의에 체크해 주세요."; msg.className = "fmsg warn"; $(".agree").classList.add("shake"); setTimeout(() => $(".agree").classList.remove("shake"), 500); return; }
        const ok = await copy(copyText(C));
        msg.textContent = ok ? "복사됐어요! 아트머그 문의창에 붙여넣어 주세요." : "복사하지 못했어요. 다시 눌러 주세요.";
        msg.className = "fmsg " + (ok ? "ok" : "warn");
        return;
      }
      if (e.target.id === "lpResetBtn") {
        document.querySelectorAll(".form .in").forEach((x) => { x.value = ""; });
        document.querySelectorAll(".list").forEach((l) => [...l.children].slice(1).forEach((x) => x.remove()));
        $("#lpAgree").checked = false; msg.textContent = ""; return report();
      }
    });

    report();
    window.addEventListener("load", report);
    if ("ResizeObserver" in window) new ResizeObserver(report).observe(document.body); else setInterval(report, 800);
    document.querySelectorAll("details").forEach((d) => d.addEventListener("toggle", report));
  }
  boot().catch(() => { $("#app").innerHTML = `<p class="err">페이지를 불러오지 못했어요. 새로고침해 주세요.</p>`; report(); });
})();
