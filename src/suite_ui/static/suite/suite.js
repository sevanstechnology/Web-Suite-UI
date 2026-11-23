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
 * Theme: "auto" (follow the operating system), "light" or "dark".
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
    var main = document.querySelector("main[data-icon]"), h1 = document.querySelector("main .top h1");
    if (main && h1 && main.getAttribute("data-icon") && !h1.querySelector(".page-icon")) {
      var wrap = h1.parentNode, span = document.createElement("span"), row = document.createElement("div");
      span.className = "page-icon"; span.innerHTML = icon(main.getAttribute("data-icon"));
      row.className = "page-title"; wrap.insertBefore(row, h1); row.appendChild(span); row.appendChild(h1);
    }

    // <details data-remember="key"> keeps its open / closed state
    var rem = document.querySelectorAll("details[data-remember]");
    for (var ri = 0; ri < rem.length; ri++) (function (d) {
      var k = "suite-open:" + APP + ":" + d.getAttribute("data-remember");
      if (get(k, "") === "closed") d.removeAttribute("open");
      d.addEventListener("toggle", function () { put(k, d.open ? "open" : "closed"); });
    })(rem[ri]);

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
    if (navigator.share) { var ns = document.querySelectorAll(".share-native"); for (var n = 0; n < ns.length; n++) ns[n].hidden = false; }
    var closed = closedSet(), secs = document.querySelectorAll(".nav-sec[data-sec]");
    for (var si = 0; si < secs.length; si++)
      if (closed.indexOf(secs[si].getAttribute("data-sec")) >= 0 && !secs[si].classList.contains("has-active")) setSec(secs[si], true);

    document.addEventListener("click", function (e) {
      var t = e.target.closest ? e.target : null;
      if (!t) return;
      var b = t.closest(".theme-switch button");
      if (b) { var p = b.getAttribute("data-theme-set"); savePref(p); apply(p); return; }
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
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { var wasOpen = panel && panel.classList.contains("open"); closeMenus(); root.classList.remove("nav-open"); if (wasOpen) wbtn.focus(); }
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || "")) {
        var sb = document.getElementById("tb-search"); if (sb) { e.preventDefault(); sb.focus(); }
      }
    });

    // search: this app's menu pages first, then the other apps in the suite, then "search the help"
    var box = document.getElementById("tb-search"), res = document.getElementById("tb-results");
    if (!box || !res) return;
    var pages = [], helpSearch = attr("data-suite-help-search", "");
    var links = document.querySelectorAll(".nav a[href]");
    for (var i = 0; i < links.length; i++) {
      var l = links[i], lab = l.querySelector(".label");
      pages.push({ href: l.getAttribute("href"), label: lab ? lab.textContent : l.textContent, group: l.getAttribute("data-group") || "", icon: l.getAttribute("data-icon") || "chevron" });
    }
    withRegistry(function (r) {
      (r.groups || []).forEach(function (g) { g.apps.forEach(function (a) {
        if (a.id !== APP) pages.push({ href: a.url, label: a.name, group: g.label, icon: a.icon || "apps", ext: external(a, g), kw: a.description || "" });
      }); });
    });
    var sel = 0;
    function render() {
      var q = box.value.trim().toLowerCase();
      if (!q) { res.classList.remove("open"); return; }
      var hits = pages.filter(function (p) { return (p.label + " " + p.group + " " + (p.kw || "")).toLowerCase().indexOf(q) >= 0; }).slice(0, 9);
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

  window.SuiteUI = { apply: apply, setTheme: function (p) { savePref(p); apply(p); }, registry: withRegistry };
})();
