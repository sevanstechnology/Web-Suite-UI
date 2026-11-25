/* Suite-UI behaviour (extracted from EntraNAC's theme.js). Load in <head> so the colour theme applies before the page paints.
 *
 * Configuration, all optional, on the <html> element:
 *   data-suite-app="entranac"            id of this app in the suite registry (highlighted in the launcher)
 *   data-suite-static="/static/suite"    where suite.css / icons.svg are served from
 *   data-suite-apps="https://…/apps.json" registry URL, used only when the page has no inline
 *                                        <script type="application/json" id="suite-apps"> block
 *   data-suite-cookie-domain=".sevans.io" share the light/dark choice with every app under this domain
 *   data-suite-help-search="/help?q="    adds "Search the help for …" to the top-bar search
 *   data-suite-audience="admin|user"     hide registry apps whose "audience" doesn't include this
 *
 *   data-suite-palettes="all"            colours users may pick for themselves: "all", "none" or e.g. "cobalt,teal,custom"
 *
 * Theme: "auto" (follow the operating system), "light" or "dark".
 * Colours: the page's style="--p-…" is the app default; a user's own pick ("suite-palette") is laid over it.
 * Admin layout: collapsible menu (remembered), drawer on small screens, top-bar menus, page + app search, app launcher.
 */
(function () {
  var root = document.documentElement;
  function attr(n, d) { var v = root.getAttribute(n); return v === null || v === "" ? d : v; }
  var APP = attr("data-suite-app", "app"), STATIC = attr("data-suite-static", "/static/suite").replace(/\/$/, "");
  var COOKIE_DOMAIN = attr("data-suite-cookie-domain", ""), AUDIENCE = attr("data-suite-audience", "");
  var KEY = "suite-theme", NAVKEY = "suite-nav-min", SECKEY = "suite-nav-closed:" + APP;
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function get(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function cookie(n) { var m = document.cookie.match(new RegExp("(?:^|; )" + n + "=([^;]*)")); return m ? decodeURIComponent(m[1]) : ""; }
  function icon(id, cls) {
    if (id && /[\/.]/.test(id)) return '<img src="' + esc(id) + '" alt="">';
    return '<svg class="ic' + (cls ? " " + cls : "") + '"><use href="' + STATIC + "/icons.svg#i-" + esc(id || "apps") + '"/></svg>';
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // ---------------------------------------------------------------- theme, shared between apps through a parent-domain cookie
  function pref() { return cookie(KEY) || get(KEY, "") || get("entranac-theme", "auto"); }
  function savePref(p) {
    put(KEY, p);
    if (COOKIE_DOMAIN) document.cookie = KEY + "=" + p + "; domain=" + COOKIE_DOMAIN + "; path=/; max-age=31536000; SameSite=Lax" + (location.protocol === "https:" ? "; Secure" : "");
  }
  function apply(p) {
    var dark = p === "dark" || (p === "auto" && mq && mq.matches);
    root.setAttribute("data-theme", dark ? "dark" : "light");
    root.setAttribute("data-theme-pref", p);
    var bs = document.querySelectorAll(".theme-switch button");
    for (var i = 0; i < bs.length; i++) bs[i].setAttribute("aria-pressed", bs[i].getAttribute("data-theme-set") === p ? "true" : "false");
  }
  apply(pref());
  if (get(NAVKEY, "0") === "1") root.classList.add("nav-min");
  if (mq && mq.addEventListener) mq.addEventListener("change", function () { if (pref() === "auto") apply("auto"); });

  // ---------------------------------------------------------------- colours: the user's own palette over the app's default
  // Stored like the theme ("suite-palette": "cobalt" or "custom:#00a3d6:#414042"). <html data-suite-palettes="all|none|a,b,custom">
  // says what users may pick here; the server-rendered style="--p-…" is the admin's default and comes back on "Default".
  // PALETTES must match palettes.json (a test checks); the maths matches palettes.py.
  var PKEY = "suite-palette", PALETTES = {
    "valley-baptist": {"label":"Valley Baptist","accent":"#00a3d6","btn":"#007ea6","top":"#00a3d6","btn_dark":"#00a3d6","ink_dark":"#0b1a20","accent2":"#f7cf46","group":"Standard"},
    "valley-baptist-gray": {"label":"Valley Baptist Gray","accent":"#00a3d6","btn":"#007ea6","top":"#414042","btn_dark":"#00a3d6","ink_dark":"#0b1a20","accent2":"#f7cf46","group":"Standard"},
    "cobalt": {"label":"Cobalt","accent":"#0f6cbd","btn":"#0f6cbd","top":"#0f548c","btn_dark":"#479ef5","ink_dark":"#0a1a2e","accent2":"#ffb900","group":"Standard"},
    "teal": {"label":"Teal","accent":"#038387","btn":"#037075","top":"#024f52","btn_dark":"#3ab3b7","ink_dark":"#06201f","accent2":"#ffaa44","group":"Standard"},
    "violet": {"label":"Violet","accent":"#7160e8","btn":"#5b4bd4","top":"#3b2e8c","btn_dark":"#9d8ff5","ink_dark":"#170f40","accent2":"#e3008c","group":"Standard"},
    "forest": {"label":"Forest","accent":"#107c10","btn":"#0e700e","top":"#0b4f0b","btn_dark":"#54b054","ink_dark":"#062006","accent2":"#ffc83d","group":"Standard"},
    "crimson": {"label":"Crimson","accent":"#c50f1f","btn":"#b10e1c","top":"#750b14","btn_dark":"#f1707b","ink_dark":"#2b0307","accent2":"#ffb900","group":"Standard"},
    "graphite": {"label":"Graphite","accent":"#4a5866","btn":"#44505c","top":"#242b33","btn_dark":"#a3b2c2","ink_dark":"#11161b","accent2":"#2899f5","group":"Standard"},
    "summer-popsicle": {"label":"Summer Popsicle","accent":"#598d39","btn":"#507f33","top":"#2d372b","btn_dark":"#619343","ink_dark":"#0f160a","accent2":"#fd9ef8","group":"Fun"},
    "pasture-of-dreams": {"label":"Pasture of Dreams","accent":"#c197d2","btn":"#876a93","top":"#382a40","btn_dark":"#c197d2","ink_dark":"#1d1720","accent2":"#fbc5ff","group":"Fun"},
    "berry-blues": {"label":"Berry Blues","accent":"#ff2768","btn":"#d92158","top":"#4e1a3d","btn_dark":"#ff2768","ink_dark":"#260610","accent2":"#05e0e9","group":"Fun"},
    "icy-gradient": {"label":"Icy Gradient","accent":"#3cacae","btn":"#2d8182","top":"#776391","btn_dark":"#3cacae","ink_dark":"#091a1a","accent2":"#eeb5eb","group":"Fun"},
    "deep-blue": {"label":"The Deep Blue","accent":"#233dff","btn":"#233dff","top":"#050a30","btn_dark":"#6577ff","ink_dark":"#0f1226","accent2":"#a7b1ff","group":"Fun"},
    "christmas": {"label":"Christmas","accent":"#c8102e","btn":"#c8102e","top":"#0b3d2e","btn_dark":"#d8586d","ink_dark":"#200d10","accent2":"#f2c14e","group":"Holidays"},
    "halloween": {"label":"Halloween","accent":"#ff7518","btn":"#bf5812","top":"#1f1a24","btn_dark":"#ff7518","ink_dark":"#261204","accent2":"#9bde3a","group":"Holidays"},
    "thanksgiving": {"label":"Thanksgiving","accent":"#c8601d","btn":"#b4561a","top":"#4a2c1a","btn_dark":"#cb6828","ink_dark":"#1e1006","accent2":"#e8b04b","group":"Holidays"},
    "valentines": {"label":"Valentine's","accent":"#e0245e","btn":"#e0245e","top":"#6d0f2c","btn_dark":"#e54576","ink_dark":"#220a12","accent2":"#ffb3c7","group":"Holidays"},
    "st-patricks": {"label":"St. Patrick's","accent":"#1a9e4b","btn":"#168640","top":"#0b4f2c","btn_dark":"#1a9e4b","ink_dark":"#04180b","accent2":"#f5c542","group":"Holidays"},
    "fourth-of-july": {"label":"Fourth of July","accent":"#b22234","btn":"#b22234","top":"#0a2a66","btn_dark":"#c96471","ink_dark":"#1e0f11","accent2":"#a7c7ff","group":"Holidays"}
  };
  var BASE_STYLE = root.getAttribute("style") || "", BASE_PALETTE = attr("data-palette", "");
  function allowed() {
    var a = attr("data-suite-palettes", "all");
    if (a === "none") return [];
    var all = Object.keys(PALETTES).concat(["custom"]);
    return a === "all" ? all : a.split(",").filter(function (k) { return all.indexOf(k) >= 0; });
  }
  function rnd(x) { var f = Math.floor(x), d = x - f; return d > 0.5 ? f + 1 : d < 0.5 ? f : (f % 2 ? f + 1 : f); }  // like Python's round()
  function rgb(h) { return [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16) / 255; }); }
  function hex(c) { return "#" + c.map(function (v) { var n = Math.max(0, Math.min(255, rnd(v * 255))); return (n < 16 ? "0" : "") + n.toString(16); }).join(""); }
  function lum(h) { var c = rgb(h).map(function (v) { return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function mix(h, o, t) { var a = rgb(h), b = rgb(o); return hex(a.map(function (v, i) { return v + (b[i] - v) * t; })); }
  function until(h, toward, against, need) { for (var i = 0; i <= 20; i++) { var c = mix(h, toward, i * 0.05); if (contrast(c, against) >= need) return c; } return toward; }
  function isHex(v) { return /^#[0-9a-f]{6}$/i.test(v || ""); }
  function customPalette(accent, top) {
    accent = accent.toLowerCase();
    var btnDark = until(accent, "#ffffff", "#1b1a19", 4.5);
    return { label: "Custom", accent: accent, btn: until(accent, "#000000", "#ffffff", 4.5),
             top: until(isHex(top) ? top.toLowerCase() : mix(accent, "#000000", 0.35), "#000000", "#ffffff", 4.5),
             btn_dark: btnDark, ink_dark: contrast(btnDark, "#ffffff") >= contrast(btnDark, "#000000") ? "#ffffff" : mix(btnDark, "#000000", 0.85),
             accent2: mix(accent, "#ffffff", 0.45) };
  }
  function parsePalette(v) {          // "custom:#aabbcc:#112233" -> {key, accent, top, colors}, or null if not allowed / unreadable
    var p = String(v || "").split(":"), ok = allowed();
    if (p[0] === "custom" && isHex(p[1]) && ok.indexOf("custom") >= 0) return { key: "custom", accent: p[1].toLowerCase(), top: isHex(p[2]) ? p[2].toLowerCase() : "", colors: customPalette(p[1], p[2]) };
    if (PALETTES[p[0]] && ok.indexOf(p[0]) >= 0) return { key: p[0], colors: PALETTES[p[0]] };
    return null;
  }
  function palettePref() { return cookie(PKEY) || get(PKEY, ""); }
  function savePalette(v) {
    put(PKEY, v);
    if (COOKIE_DOMAIN) document.cookie = PKEY + "=" + encodeURIComponent(v) + "; domain=" + COOKIE_DOMAIN + "; path=/; max-age=" + (v ? 31536000 : 0) + "; SameSite=Lax" + (location.protocol === "https:" ? "; Secure" : "");
  }
  function applyPalette(v) {
    var p = parsePalette(v);
    root.setAttribute("style", BASE_STYLE);
    root.setAttribute("data-palette", p ? p.key : BASE_PALETTE);
    root.setAttribute("data-palette-pref", p ? v : "");
    if (p) {
      var c = p.colors, vars = { accent: c.accent, btn: c.btn, "btn-hover": mix(c.btn, "#000000", 0.12), top: c.top, "btn-dark": c.btn_dark,
                                 "ink-dark": c.ink_dark, "btn-dark-hover": mix(c.btn_dark, "#ffffff", 0.12), accent2: c.accent2 };
      for (var k in vars) root.style.setProperty("--p-" + k, vars[k]);
    }
    syncPicker();
  }
  function syncPicker() {
    var cur = root.getAttribute("data-palette-pref") || "", key = cur.split(":")[0];
    var bs = document.querySelectorAll("[data-palette-set]");
    for (var i = 0; i < bs.length; i++) bs[i].setAttribute("aria-pressed", bs[i].getAttribute("data-palette-set") === (key || "") ? "true" : "false");
    var p = parsePalette(cur), name = p ? (p.key === "custom" ? "Custom" : p.colors.label) : "Default";
    var ns = document.querySelectorAll(".palette-picker .pp-name");
    for (var n = 0; n < ns.length; n++) ns[n].textContent = name;
    var cs = document.querySelectorAll(".palette-picker .pp-custom");
    for (var j = 0; j < cs.length; j++) cs[j].hidden = key !== "custom";
  }
  function renderPicker(box) {
    var ok = allowed();
    if (!ok.length) { box.hidden = true; return; }
    var cur = parsePalette(palettePref()), html = ['<div class="pp-label">Colours <span class="pp-name muted"></span></div><div class="pp-swatches">'];
    var bt = (BASE_STYLE.match(/--p-top:\s*(#[0-9a-f]{6})/i) || [])[1], ba = (BASE_STYLE.match(/--p-accent:\s*(#[0-9a-f]{6})/i) || [])[1];
    html.push('<button type="button" class="pp-sw pp-default" data-palette-set="" title="Default (this app\'s colours)" aria-label="Default colours"><span' +
              (bt && ba ? ' style="background:linear-gradient(135deg,' + bt + " 0 50%," + ba + ' 50% 100%)">' : ">" + icon("history", "sm")) + "</span></button>");
    var own = null;
    if (ok.indexOf("custom") >= 0) {
      var ca = cur && cur.key === "custom" ? cur.accent : (PALETTES[root.getAttribute("data-palette")] || PALETTES[Object.keys(PALETTES)[0]]).accent;
      own = { a: ca, t: cur && cur.key === "custom" && cur.top ? cur.top : mix(ca, "#000000", 0.35) };
      html.push('<button type="button" class="pp-sw pp-own" data-palette-set="custom" title="Custom colours" aria-label="Custom colours"><span>' + icon("palette", "sm") + "</span></button>");
    }
    var lastGroup = "";
    ok.forEach(function (k) {
      if (k === "custom") return;
      var c = PALETTES[k];
      if (c.group && c.group !== lastGroup && lastGroup) html.push('</div><div class="pp-group">' + esc(c.group) + '</div><div class="pp-swatches">');
      lastGroup = c.group || lastGroup || "-";
      html.push('<button type="button" class="pp-sw" data-palette-set="' + esc(k) + '" title="' + esc(c.label) + '" aria-label="' + esc(c.label) +
                '"><span style="background:linear-gradient(135deg,' + esc(c.top) + " 0 50%," + esc(c.accent) + ' 50% 100%)"></span></button>');
    });
    html.push("</div>");
    if (own) html.push('<div class="pp-custom" hidden><label>Main <input type="color" data-pp="accent" value="' + esc(own.a) + '"></label>' +
                       '<label>Top bar <input type="color" data-pp="top" value="' + esc(own.t) + '"></label></div>');
    box.innerHTML = html.join("");
  }
  function customValue(box) {
    var a = box.querySelector('[data-pp="accent"]'), t = box.querySelector('[data-pp="top"]');
    return "custom:" + a.value + (t && t.value ? ":" + t.value : "");
  }
  applyPalette(palettePref());

  // ---------------------------------------------------------------- suite registry (the apps in the launcher)
  var registry = null, waiting = [];
  function visible(a) {
    if (a.hidden) return false;
    if (AUDIENCE && a.audience && [].concat(a.audience).indexOf(AUDIENCE) < 0) return false;
    return true;
  }
  function useRegistry(r) {
    registry = r || { groups: [] };
    (registry.groups || []).forEach(function (g) { g.apps = (g.apps || []).filter(visible); });
    var w = waiting; waiting = [];
    w.forEach(function (f) { f(registry); });
  }
  function withRegistry(f) { if (registry) f(registry); else waiting.push(f); }
  function loadRegistry() {
    var inline = document.getElementById("suite-apps");
    if (inline) { try { return useRegistry(JSON.parse(inline.textContent)); } catch (e) { return useRegistry(null); } }
    var url = attr("data-suite-apps", "");
    if (!url) return useRegistry(null);
    var ck = "suite-apps:" + url;
    try { var c = JSON.parse(sessionStorage.getItem(ck) || "null"); if (c && Date.now() - c.t < 600000) return useRegistry(c.r); } catch (e) {}
    fetch(url, { credentials: "omit" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (r) {
      try { sessionStorage.setItem(ck, JSON.stringify({ t: Date.now(), r: r })); } catch (e) {}
      useRegistry(r);
    }, function () { useRegistry(null); });
  }

  function appHref(a) { return a.url || "#"; }
  function external(a, g) { return a.external != null ? a.external : !!(g && g.external); }
  function tile(a) { return '<span class="sl-tile" style="--tile:' + esc(a.color || "") + '">' + icon(a.image || a.icon) + "</span>"; }

  function renderLauncher(panel, r) {
    var html = ['<div class="sl-head"><strong>' + esc((r.suite && r.suite.label) || "Apps") + "</strong>"];
    if (r.suite && r.suite.all_apps_url) html.push('<a href="' + esc(r.suite.all_apps_url) + '" target="_blank" rel="noopener">' + esc(r.suite.all_apps_label || "All apps") + " " + icon("external") + "</a>");
    html.push("</div>");
    var any = false;
    (r.groups || []).forEach(function (g) {
      if (!g.apps.length) return;
      any = true;
      html.push('<div class="sl-sec">' + esc(g.label) + "</div>");
      html.push(g.layout === "list" ? '<div class="sl-list">' : '<div class="sl-grid">');
      g.apps.forEach(function (a) {
        var ext = external(a, g), cur = a.id === APP;
        var tgt = ext ? ' target="_blank" rel="noopener"' : "";
        if (g.layout === "list")
          html.push('<a href="' + esc(appHref(a)) + '"' + tgt + (cur ? ' aria-current="page"' : "") + ">" + tile(a) +
                    "<span><strong>" + esc(a.name) + '</strong><span class="d">' + esc(a.description || "") + "</span></span></a>");
        else
          html.push('<a class="sl-app' + (cur ? " current" : "") + '" href="' + esc(appHref(a)) + '"' + tgt + (cur ? ' aria-current="page"' : "") +
                    ' title="' + esc(a.description || a.name) + '">' + tile(a) + '<span class="nm">' + esc(a.name) + "</span>" +
                    (ext ? icon("external", "sl-ext") : "") + "</a>");
      });
      html.push("</div>");
    });
    if (!any) html.push('<div class="sl-empty">No other apps are set up yet.</div>');
    if (r.suite && (r.suite.home_url || r.suite.name))
      html.push('<div class="sl-foot"><span class="muted">' + esc(r.suite.name || "") + "</span>" +
                (r.suite.home_url ? '<a href="' + esc(r.suite.home_url) + '">' + esc(r.suite.home_label || "Home") + "</a>" : "") + "</div>");
    panel.innerHTML = html.join("");
  }

  function closeMenus(except) {
    var ms = document.querySelectorAll(".menu.open, .search-results.open, .suite-launcher.open");
    for (var i = 0; i < ms.length; i++) if (ms[i] !== except) ms[i].classList.remove("open");
    var ws = document.querySelectorAll("[data-launcher][aria-expanded=true]");
    for (var j = 0; j < ws.length; j++) if (!except || !except.classList.contains("suite-launcher")) ws[j].setAttribute("aria-expanded", "false");
  }

  document.addEventListener("DOMContentLoaded", function () {
    apply(pref());
    var pickers = document.querySelectorAll("[data-palette-picker]");
    for (var pi = 0; pi < pickers.length; pi++) renderPicker(pickers[pi]);
    applyPalette(palettePref());
    loadRegistry();

    // app launcher panel
    var wbtn = document.querySelector("[data-launcher]"), panel = null;
    if (wbtn) {
      panel = document.getElementById("suite-launcher");
      if (!panel) { panel = document.createElement("div"); panel.id = "suite-launcher"; document.body.appendChild(panel); }
      panel.className = "suite-launcher"; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "App launcher");
      wbtn.setAttribute("aria-expanded", "false"); wbtn.setAttribute("aria-controls", "suite-launcher");
      panel.innerHTML = '<div class="sl-empty">Loading apps…</div>';
      withRegistry(function (r) { renderLauncher(panel, r); });
    }

    // page icon next to the page title, from the current menu entry
    function decorate() {
      var main = document.querySelector("main[data-icon]"), h1 = document.querySelector("main .top h1");
      if (main && h1 && main.getAttribute("data-icon") && !h1.querySelector(".page-icon") && !(h1.parentNode.querySelector(".page-icon"))) {
        var wrap = h1.parentNode, span = document.createElement("span"), row = document.createElement("div");
        span.className = "page-icon"; span.innerHTML = icon(main.getAttribute("data-icon"));
        row.className = "page-title"; wrap.insertBefore(row, h1); row.appendChild(span); row.appendChild(h1);
      }
    }

    // <details data-remember="key"> keeps its open / closed state
    function initRemember() {
      var rem = document.querySelectorAll("details[data-remember]");
      for (var ri = 0; ri < rem.length; ri++) (function (d) {
        if (d._suiteRem) return; d._suiteRem = true;
        var k = "suite-open:" + APP + ":" + d.getAttribute("data-remember");
        if (get(k, "") === "closed") d.removeAttribute("open");
        d.addEventListener("toggle", function () { put(k, d.open ? "open" : "closed"); });
      })(rem[ri]);
    }

    // collapsible menu sections: closed sections are remembered; the current page's section stays open
    function closedSet() { try { return JSON.parse(get(SECKEY, "[]")) || []; } catch (e) { return []; } }
    function setSec(sec, closed) {
      sec.classList.toggle("closed", closed);
      var b = sec.querySelector(".grp"); if (b) b.setAttribute("aria-expanded", closed ? "false" : "true");
    }
    function saveSecs() {
      var c = [], ss = document.querySelectorAll(".nav-sec.closed");
      for (var i = 0; i < ss.length; i++) c.push(ss[i].getAttribute("data-sec"));
      put(SECKEY, JSON.stringify(c));
    }
    function initSections() {
      var closed = closedSet(), secs = document.querySelectorAll(".nav-sec[data-sec]");
      for (var si = 0; si < secs.length; si++) {
        if (secs[si]._suiteSec) continue; secs[si]._suiteSec = true;
        if (closed.indexOf(secs[si].getAttribute("data-sec")) >= 0 && !secs[si].classList.contains("has-active")) setSec(secs[si], true);
      }
    }
    if (navigator.share) { var ns = document.querySelectorAll(".share-native"); for (var n = 0; n < ns.length; n++) ns[n].hidden = false; }
    function refresh() { decorate(); initRemember(); initSections(); }
    refresh();
    if (window.SuiteUI) window.SuiteUI.refresh = refresh;   // for apps that render their menu / pages in the browser

    document.addEventListener("click", function (e) {
      var t = e.target.closest ? e.target : null;
      if (!t) return;
      var b = t.closest(".theme-switch button");
      if (b) { var p = b.getAttribute("data-theme-set"); savePref(p); apply(p); return; }
      var pb = t.closest("[data-palette-set]");
      if (pb) {
        var pv = pb.getAttribute("data-palette-set"), pbox = pb.closest(".palette-picker");
        if (pv === "custom" && pbox) pv = customValue(pbox);
        savePalette(pv); applyPalette(pv); return;
      }
      if (wbtn && t.closest("[data-launcher]")) {
        var open = !panel.classList.contains("open");
        closeMenus(); panel.classList.toggle("open", open); wbtn.setAttribute("aria-expanded", open ? "true" : "false");
        if (open) { var f = panel.querySelector("a"); if (f) f.focus(); }
        e.stopPropagation(); return;
      }
      var ca = t.closest("[data-check-all]");
      if (ca && ca.tagName === "INPUT") {
        var nm = ca.getAttribute("data-check-all"), boxes = ca.form ? ca.form.querySelectorAll('input[type=checkbox][name="' + nm + '"]') : [];
        for (var bi = 0; bi < boxes.length; bi++) if (!boxes[bi].disabled) boxes[bi].checked = ca.checked;
        return;
      }
      var sh = t.closest("[data-share]");
      if (sh) {
        var box = sh.closest(".share"), url = box.getAttribute("data-share-url"), kind = sh.getAttribute("data-share");
        if (kind === "copy") {
          var done = function () { var l = sh.querySelector("span"), o = l.textContent; l.textContent = "Copied"; sh.classList.add("ok"); setTimeout(function () { l.textContent = o; sh.classList.remove("ok"); }, 1600); };
          if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(done, function () {});
          else { var inp = box.querySelector(".share-url"); inp.select(); try { document.execCommand("copy"); done(); } catch (x) {} }
          e.preventDefault(); return;
        }
        if (kind === "qr") {
          var q = box.querySelector(".share-qr"), img = q.querySelector("img");
          if (!img.getAttribute("src")) { img.src = img.getAttribute("data-src"); q.querySelector("[data-qr-dl]").href = img.getAttribute("data-src"); }
          q.hidden = !q.hidden; e.preventDefault(); return;
        }
        if (kind === "native" && navigator.share) {
          navigator.share({ title: box.getAttribute("data-share-title"), text: box.getAttribute("data-share-text"), url: url }).catch(function () {});
          e.preventDefault(); return;
        }
        return;  // mail / teams: normal links
      }
      var g = t.closest(".nav .grp");
      if (g) { var s = g.closest(".nav-sec"); setSec(s, !s.classList.contains("closed")); saveSecs(); return; }
      var all = t.closest("[data-nav-all]");
      if (all) {
        var shut = all.getAttribute("data-nav-all") === "close", ss = document.querySelectorAll(".nav-sec[data-sec]");
        for (var k = 0; k < ss.length; k++) if (ss[k].querySelector(".grp")) setSec(ss[k], shut && !ss[k].classList.contains("has-active"));
        saveSecs(); return;
      }
      if (t.closest("[data-theme-toggle]")) { var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark"; savePref(next); apply(next); return; }
      if (t.closest("[data-nav-toggle]")) {
        if (window.innerWidth <= 860) root.classList.toggle("nav-open");
        else { root.classList.toggle("nav-min"); put(NAVKEY, root.classList.contains("nav-min") ? "1" : "0"); }
        return;
      }
      var mb = t.closest("[data-menu]");
      if (mb) {
        var m = document.getElementById(mb.getAttribute("data-menu")), op = m && !m.classList.contains("open");
        closeMenus(); if (op) m.classList.add("open");
        e.stopPropagation(); return;
      }
      if (!t.closest(".menu") && !t.closest(".tb-search") && !t.closest(".suite-launcher")) closeMenus();
      if (root.classList.contains("nav-open") && !t.closest(".nav")) root.classList.remove("nav-open");
    });
    function onCustom(e, save) {
      var box = e.target.closest && e.target.closest(".palette-picker");
      if (!box || !e.target.getAttribute("data-pp")) return;
      var v = customValue(box); applyPalette(v); if (save) savePalette(v);
    }
    document.addEventListener("input", function (e) { onCustom(e, false); });   // live preview while dragging
    document.addEventListener("change", function (e) { onCustom(e, true); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { var wasOpen = panel && panel.classList.contains("open"); closeMenus(); root.classList.remove("nav-open"); if (wasOpen) wbtn.focus(); }
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || "")) {
        var sb = document.getElementById("tb-search"); if (sb) { e.preventDefault(); sb.focus(); }
      }
    });

    // search: this app's menu pages first, then the other apps in the suite, then "search the help"
    var box = document.getElementById("tb-search"), res = document.getElementById("tb-results");
    if (!box || !res) return;
    var helpSearch = attr("data-suite-help-search", "");
    // built on every search, so a menu that is drawn after page load (single-page apps) is still found
    function collectPages() {
      var out = [], links = document.querySelectorAll(".nav a[href]");
      for (var i = 0; i < links.length; i++) {
        var l = links[i], lab = l.querySelector(".label");
        out.push({ href: l.getAttribute("href"), label: lab ? lab.textContent : l.textContent, group: l.getAttribute("data-group") || "", icon: l.getAttribute("data-icon") || "chevron" });
      }
      if (registry) (registry.groups || []).forEach(function (g) { g.apps.forEach(function (a) {
        if (a.id !== APP) out.push({ href: a.url, label: a.name, group: g.label, icon: a.icon || "apps", ext: external(a, g), kw: a.description || "" });
      }); });
      return out;
    }
    var sel = 0;
    function render() {
      var q = box.value.trim().toLowerCase();
      if (!q) { res.classList.remove("open"); return; }
      var hits = collectPages().filter(function (p) { return (p.label + " " + p.group + " " + (p.kw || "")).toLowerCase().indexOf(q) >= 0; }).slice(0, 9);
      var html = hits.map(function (p, i) {
        return '<a href="' + esc(p.href) + '" class="' + (i === sel ? "sel" : "") + '"' + (p.ext ? ' target="_blank" rel="noopener"' : "") + ">" +
               icon(p.icon, "sm") + esc(p.label) + '<span class="where">' + esc(p.group) + "</span></a>";
      });
      if (helpSearch) html.push('<a href="' + esc(helpSearch + encodeURIComponent(box.value.trim())) + '" class="' + (hits.length === sel ? "sel" : "") + '">' +
                                icon("help", "sm") + "Search the help for “" + esc(box.value.trim()) + "”</a>");
      if (!html.length) html.push('<div class="sl-empty" style="padding:8px 10px">No matches</div>');
      res.innerHTML = html.join(""); res.classList.add("open");
    }
    box.addEventListener("input", function () { sel = 0; render(); });
    box.addEventListener("focus", render);
    box.addEventListener("keydown", function (e) {
      var items = res.querySelectorAll("a");
      if (e.key === "ArrowDown") { sel = Math.min(sel + 1, items.length - 1); render(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { sel = Math.max(sel - 1, 0); render(); e.preventDefault(); }
      else if (e.key === "Enter" && items[sel]) { e.preventDefault(); items[sel].click(); }
    });
  });

  window.SuiteUI = { apply: apply, refresh: function () {}, setTheme: function (p) { savePref(p); apply(p); }, registry: withRegistry,
                     // the user's colours: setPalette("cobalt"), setPalette("custom:#00a3d6"), setPalette("") = the app's default
                     setPalette: function (v) { savePalette(v || ""); applyPalette(v || ""); }, palette: palettePref,
                     palettes: PALETTES, customPalette: customPalette, contrast: contrast };
})();
