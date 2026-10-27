(() => {
  "use strict";
  const esc = s => String(s ?? "").replace(/[&<>"']/g, (c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c])));
  const list = v => (Array.isArray(v) ? v : String(v || "").split(",")).map((x => String(x).trim())).filter(Boolean);
  const safe = u => /^(https?:\/\/|\.?\/|assets\/|mailto:)/i.test(u || "") ? u : "#";
  const ko = (a, b) => a.localeCompare(b, "ko");
  const ytId = u => ((u || "").match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,})/) || [])[1] || "";
  const isShort = u => /youtube\.com\/shorts\//.test(u || "");
  const IMGERR = `onerror="this.style.visibility='hidden'"`;
  const ymd = d => String(d || "").replace(/-/g, ".");
  const catLabel = c => String(c || "").toUpperCase();
  const catClass = c => c === "3D" ? "T3D" : String(c).replace(/[^\w-]/g, "");
  function career(intro) {
    return String(intro || "").split("\n").map((l => l.trim())).filter(Boolean).map((l => {
      const past = /^[-–·]\s*/.test(l);
      l = l.replace(/^[-–·]\s*/, "");
      const m = l.match(/^(.*?)\s*((?:\d{4}[.\-/]\d{1,2}|\d{4})\s*~?\s*(?:\d{4}[.\-/]?\d{0,2})?)\s*$/);
      return m ? {
        name: m[1].trim(),
        period: m[2].replace(/\s+/g, " ").trim(),
        past: past
      } : {
        name: l,
        period: past ? "이전" : "",
        past: past
      };
    }));
  }
  function ytOf(w) {
    const u = [ ...w.video_urls || [], w.link_url || "" ].find((x => ytId(x)));
    return u ? {
      id: ytId(u),
      short: isShort(u)
    } : null;
  }
  function thumbList(w) {
    const y = ytOf(w), out = [];
    const own = w.thumbnail && !/i\.ytimg\.com\//.test(w.thumbnail) ? w.thumbnail : "";
    if (own) out.push(own);
    if (y) {
      const b = `https://i.ytimg.com/vi/${y.id}/`;
      if (y.short) out.push(b + "oardefault.jpg");
      out.push(b + "maxresdefault.jpg", b + "hqdefault.jpg");
    }
    if (w.thumbnail && !own) out.push(w.thumbnail);
    return out;
  }
  window.LP_THUMB_NEXT = (img, failed) => {
    if (!failed && !(img.naturalWidth <= 120 && /ytimg/.test(img.src))) return;
    const rest = (img.dataset.next || "").split("|").filter(Boolean);
    if (!rest.length) {
      img.style.visibility = "hidden";
      img.onerror = img.onload = null;
      return;
    }
    img.dataset.next = rest.slice(1).join("|");
    img.src = rest[0];
  };
  function thumbImg(w, extra = "") {
    const list = thumbList(w);
    if (!list.length) return "";
    return `<img src="${esc(list[0])}" data-next="${esc(list.slice(1).join("|"))}" alt="" loading="lazy" ${extra} onload="LP_THUMB_NEXT(this)" onerror="LP_THUMB_NEXT(this, true)">`;
  }
  function splitTitle(t) {
    t = String(t || "").trim();
    const m = t.match(/^(.*님)\s+(.+)$/);
    if (!m) return {
      who: "",
      what: t
    };
    return {
      who: m[1].trim(),
      what: m[2].trim() || t
    };
  }
  function accent(hex) {
    if (!/^#[0-9a-f]{6}$/i.test(hex || "")) return;
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    const root = document.documentElement.style;
    root.setProperty("--pink", hex);
    root.setProperty("--pink-ink", (r * 299 + g * 587 + b * 114) / 1e3 > 150 ? "#141214" : "#ffffff");
  }
  function header(page) {
    const el = document.getElementById("top");
    if (!el) return;
    const cur = p => p === page ? ' aria-current="page"' : "";
    el.innerHTML = `\n    <a class="brand" href="./">${esc(LP.D.site.name || "Leepu")}<span class="dot">.</span></a>\n    <span class="dots" aria-hidden="true"><i></i><i></i></span>\n    <nav aria-label="메뉴">\n      <a href="./#about"${cur("about")}>About</a>\n      <a href="works.html"${cur("works")}>Works</a>\n      <a href="items.html"${cur("items")}>Items</a>\n      <a href="#contact">Contact</a>\n    </nav>`;
  }
  const ICON = {
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>',
    discord: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>'
  };
  function footer() {
    const el = document.getElementById("contact");
    if (!el) return;
    const s = LP.D.site;
    const title = s.footer_title || "Let's make it\ncount.";
    const msg = s.message ?? "모든 작업에 최선을 다하며,\n아름답고 완성도 높은 결과물을 위해 늘 노력합니다.";
    const t = esc(title).replace(/\n/g, "<br>").replace(/([.!?])\s*$/, '<span class="dot">$1</span>');
    const links = [ ...s.email ? [ {
      url: "mailto:" + s.email,
      label: s.email,
      icon: ICON.mail,
      aria: "메일 " + s.email
    } ] : [], ...(s.links || []).filter((l => l.url)).map((l => {
      const x = l.url.match(/(?:^|\/\/|\.)(?:x|twitter)\.com\/([^/?#]+)/i);
      return {
        url: l.url,
        label: l.label || (x ? "@" + x[1] : l.url.replace(/^https?:\/\//, "")),
        icon: x ? ICON.x : "",
        aria: x ? "X @" + x[1] : ""
      };
    })) ];
    el.innerHTML = `<div class="foot-in">\n      <h2 class="rv">${t}</h2>\n      <div class="foot-row">\n        <div>\n          ${msg ? `<p class="foot-msg">${esc(msg)}</p>` : ""}\n          <div class="foot-contact">\n            <div class="foot-label">CONTACT</div>\n            <div class="foot-links">${links.map((l => `<a href="${esc(safe(l.url))}"${/^mailto:/.test(l.url) ? "" : ' target="_blank" rel="noopener"'}${l.aria ? ` aria-label="${esc(l.aria)}"` : ""}>${l.icon || ""}<span class="tx">${esc(l.label)}</span></a>`)).join("")}${s.discord ? `<button type="button" class="foot-dc" data-copy="${esc(s.discord)}" title="누르면 디스코드 아이디가 복사돼요" aria-label="Discord ${esc(s.discord)} 아이디 복사">${ICON.discord}<span class="tx">${esc(s.discord)}</span></button>` : ""}</div>\n          </div>\n        </div>\n        <span class="foot-copy">© ${(new Date).getFullYear()} ${esc(s.name || "Leepu")}<span class="dot">.</span></span>\n      </div>\n    </div>`;
    const dc = el.querySelector(".foot-dc");
    if (dc) dc.onclick = async () => {
      const id = dc.dataset.copy, txt = dc.querySelector("span"), label = txt.textContent;
      try {
        await navigator.clipboard.writeText(id);
      } catch (e) {
        const t = document.createElement("textarea");
        t.value = id;
        document.body.appendChild(t);
        t.select();
        try {
          document.execCommand("copy");
        } catch (_) {}
        t.remove();
      }
      txt.textContent = "복사됐어요";
      dc.classList.add("done");
      clearTimeout(dc._t);
      dc._t = setTimeout((() => {
        txt.textContent = label;
        dc.classList.remove("done");
      }), 1600);
    };
  }
  function marquee() {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rows = [ ...document.querySelectorAll(".mq-track") ].map((t => {
      t.style.animation = "none";
      t.querySelectorAll("img").forEach((i => {
        i.loading = "eager";
        i.decoding = "async";
      }));
      const rev = t.classList.contains("rev");
      const r = {
        t: t,
        rev: rev,
        secs: (rev ? 54 : 48) * (reduce ? 2 : 1),
        half: 0,
        x: 0,
        on: true,
        hover: false
      };
      const measure = () => {
        const h = t.scrollWidth / 2;
        if (h && Math.abs(h - r.half) > 1) {
          r.x = r.half ? r.x / r.half * h : rev ? -h : 0;
          r.half = h;
        }
      };
      measure();
      if (window.ResizeObserver) new ResizeObserver(measure).observe(t);
      if (window.IntersectionObserver) new IntersectionObserver((([e]) => {
        r.on = e.isIntersecting;
      }), {
        rootMargin: "200px"
      }).observe(t.parentElement);
      if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
        t.parentElement.addEventListener("mouseenter", (() => {
          r.hover = true;
        }));
        t.parentElement.addEventListener("mouseleave", (() => {
          r.hover = false;
        }));
      }
      return r;
    }));
    if (!rows.length) return;
    let last = performance.now();
    const step = now => {
      const dt = Math.min(64, now - last) / 1e3;
      last = now;
      for (const r of rows) {
        if (!r.half || !r.on || r.hover || document.hidden) continue;
        const v = r.half / r.secs;
        r.x += r.rev ? v * dt : -v * dt;
        if (r.x <= -r.half) r.x += r.half;
        if (r.x > 0) r.x -= r.half;
        r.t.style.transform = `translate3d(${r.x.toFixed(2)}px, 0, 0)`;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  async function boot(page) {
    let D;
    try {
      D = window.SITE_DATA || await (await fetch("data.json", {
        cache: "no-cache"
      })).json();
    } catch (e) {
      document.querySelector("main").innerHTML = `<p class="empty">data.json을 불러오지 못했어요. 파일을 컴퓨터에서 바로 열면 이렇게 돼요. GitHub Pages에 올리거나 로컬 서버로 열어 주세요.</p>`;
      throw e;
    }
    D.site = D.site || {};
    D.works = (D.works || []).filter((w => w.public !== false && w.title));
    D.works.sort(((a, b) => String(b.date || "").localeCompare(String(a.date || ""))));
    D.items = (D.items || []).filter((i => !i.pending && i.name));
    LP.D = D;
    accent(D.site.accent_color);
    header(page);
    footer();
    return D;
  }
  window.LP = {
    esc: esc,
    list: list,
    safe: safe,
    ko: ko,
    ytId: ytId,
    isShort: isShort,
    IMGERR: IMGERR,
    ymd: ymd,
    catLabel: catLabel,
    catClass: catClass,
    career: career,
    boot: boot,
    ytOf: ytOf,
    thumbImg: thumbImg,
    splitTitle: splitTitle,
    marquee: marquee,
    D: null
  };
})();
