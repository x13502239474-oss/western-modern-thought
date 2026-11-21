/* 西方现代思想讲义 · 交互 */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ── 阅读进度 ── */
  var bar = $("#progress");
  var prose = $("#prose");
  function onScroll() {
    if (bar) {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    }
    spy();
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ── 目录高亮 ── */
  var tocLinks = $$(".toc-list a");
  var heads = tocLinks.map(function (a) { return document.getElementById(a.getAttribute("data-t")); });
  var current = null;
  function spy() {
    if (!tocLinks.length) return;
    var idx = 0;
    for (var i = 0; i < heads.length; i++) {
      if (heads[i] && heads[i].getBoundingClientRect().top < 140) idx = i;
    }
    if (tocLinks[idx] && tocLinks[idx] !== current) {
      if (current) current.classList.remove("on");
      current = tocLinks[idx];
      current.classList.add("on");
    }
  }

  /* ── 抽屉目录 ── */
  var drawer = $("#drawer"), scrim = $("#scrim");
  function openDrawer() { if (drawer) { drawer.hidden = false; scrim.hidden = false; document.body.style.overflow = "hidden"; } }
  function closeDrawer() { if (drawer) { drawer.hidden = true; scrim.hidden = true; document.body.style.overflow = ""; } }
  var mb = $("#menuBtn"), dc = $("#drawerClose");
  if (mb) mb.addEventListener("click", openDrawer);
  if (dc) dc.addEventListener("click", closeDrawer);
  if (scrim) scrim.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeDrawer(); closeSearch(); }
  });

  /* ── 检索 ── */
  var layer = $("#searchLayer"), input = $("#searchInput"), results = $("#searchResults");
  function openSearch() {
    if (!layer) return;
    layer.hidden = false;
    setTimeout(function () { input.focus(); }, 30);
  }
  function closeSearch() { if (layer) layer.hidden = true; }
  var sb = $("#searchBtn"), sc = $("#searchClose");
  if (sb) sb.addEventListener("click", openSearch);
  if (sc) sc.addEventListener("click", closeSearch);
  if (layer) layer.addEventListener("click", function (e) { if (e.target === layer) closeSearch(); });

  function base() {
    // 页面可能在 / 或 /lessons/ /topics/
    var s = document.querySelector('script[src$="assets/js/app.js"]');
    return s ? s.getAttribute("src").replace("assets/js/app.js", "") : "";
  }
  var B = base();

  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }

  function search(q) {
    var data = window.SEARCH_INDEX || [];
    q = q.trim().toLowerCase();
    if (!q) { results.innerHTML = '<p class="hint">输入关键词，例如「祛魅」「伯林」「大屠杀」。</p>'; return; }
    var hits = [];
    for (var i = 0; i < data.length; i++) {
      var it = data[i], t = it.t.toLowerCase(), d = (it.d || "").toLowerCase(), k = it.k.toLowerCase();
      var score = -1;
      if (t === q) score = 100;
      else if (t.indexOf(q) === 0) score = 80;
      else if (t.indexOf(q) > -1) score = 60;
      else if (k.indexOf(q) > -1) score = 40;
      else if (d.indexOf(q) > -1) score = 20;
      if (score > 0) hits.push({ s: score, it: it });
    }
    hits.sort(function (a, b) { return b.s - a.s; });
    hits = hits.slice(0, 24);
    if (!hits.length) { results.innerHTML = '<p class="hint">没有找到「' + esc(q) + '」。试试更短的词，或换个说法。</p>'; return; }
    results.innerHTML = hits.map(function (h) {
      var d = (h.it.d || "").slice(0, 90);
      return '<a class="sr-item" href="' + B + h.it.u + '"><b><span>' + esc(h.it.k) + '</span>' + esc(h.it.t) + '</b><p>' + esc(d) + '…</p></a>';
    }).join("");
  }
  if (input) {
    var timer;
    input.addEventListener("input", function () {
      clearTimeout(timer);
      var v = input.value;
      timer = setTimeout(function () { search(v); }, 120);
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var first = results.querySelector(".sr-item");
        if (first) window.location.href = first.getAttribute("href");
      }
    });
  }

  /* ── 时间轴筛选 ── */
  $$(".fbtn").forEach(function (b) {
    b.addEventListener("click", function () {
      $$(".fbtn").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on");
      var f = b.getAttribute("data-f");
      $$(".tl-item").forEach(function (li) {
        li.classList.toggle("hide", f !== "全部" && li.getAttribute("data-cat") !== f);
      });
    });
  });

  /* ── 首页时间轴横条拖动 ── */
  var strip = $("#tlstrip");
  if (strip) {
    var down = false, startX = 0, startL = 0;
    strip.parentElement.addEventListener("mousedown", function (e) {
      down = true; startX = e.pageX; startL = strip.parentElement.scrollLeft;
    });
    window.addEventListener("mouseup", function () { down = false; });
    strip.parentElement.addEventListener("mousemove", function (e) {
      if (!down) return;
      strip.parentElement.scrollLeft = startL - (e.pageX - startX);
    });
  }

  /* ── 记住展开的篇 ── */
  try {
    var open = JSON.parse(localStorage.getItem("nav-open") || "[]");
    $$("details.nav-part").forEach(function (d, i) {
      if (open.indexOf(i) > -1) d.open = true;
      d.addEventListener("toggle", function () {
        var cur = [];
        $$("details.nav-part").forEach(function (x, j) { if (x.open) cur.push(j); });
        localStorage.setItem("nav-open", JSON.stringify(cur));
      });
    });
  } catch (e) {}

  onScroll();
})();
