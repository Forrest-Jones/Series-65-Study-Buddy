/* Series 65 flashcards — vanilla JS, progress stored in localStorage. */
(function () {
  'use strict';

  // NASAA Series 65 content outline. Weight = number of scored questions out of 130.
  // "scored" defaults are pre-filled from the 09/14/2026 score report.
  var SECTIONS = [
    { id: 'econ', name: 'Economic Factors and Business Information',      weight: 20, scored: 10 },
    { id: 'veh',  name: 'Investment Vehicle Characteristics',             weight: 32, scored: 24 },
    { id: 'rec',  name: 'Client Investment Recommendations and Strategies', weight: 39, scored: 27 },
    { id: 'law',  name: 'Laws, Regulations and Guidelines',               weight: 39, scored: 25 }
  ];
  var PASS = 94, TOTAL = 130;

  var CARDS = window.CARDS || [];
  CARDS.forEach(function (c, i) { c.id = c.section + '-' + i; });

  // ---- persistence ----
  var KEY = 's65.v1';
  var state = load();
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || { cards: {}, scored: {} }; }
    catch (e) { return { cards: {}, scored: {} }; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  function rec(id) {
    return state.cards[id] || (state.cards[id] = { box: 0, due: 0, seen: 0, missed: 0 });
  }
  function scoredPct(sec) {
    var s = state.scored[sec.id];
    if (s === undefined || s === null || s === '') s = sec.scored;
    if (s === undefined || s === null || s === '') return null;
    return Math.max(0, Math.min(1, s / sec.weight));
  }

  // ---- card selection ----
  // Weight each section by exam weight * (1 + how far below passing you scored there),
  // then weight each card by how often it's been missed and whether it's due.
  var DAY = 86400000;
  var INTERVALS = [0, 1, 3, 7, 14, 30]; // days per Leitner box

  function sectionMultiplier(sec) {
    var p = scoredPct(sec);
    if (p === null) return 1;
    var target = PASS / TOTAL;             // 72.3%
    var gap = Math.max(0, target - p);     // 0 if already above passing
    return 1 + gap * 6;                    // 50% -> 1+0.22*6 = 2.3x ; 75% -> 1x
  }

  function cardWeight(card, now) {
    var sec = SECTIONS.find(function (s) { return s.id === card.section; });
    var r = rec(card.id);
    var w = sec.weight * sectionMultiplier(sec);
    w *= 1 + r.missed;                     // keep hammering misses
    w *= r.due <= now ? 1 : 0.15;          // mostly show what's due
    w *= r.seen === 0 ? 1.5 : 1;           // slight bias to unseen
    return w;
  }

  var current = null, lastId = null;
  function pick() {
    var now = Date.now();
    var deck = document.getElementById('deck-select').value;
    var pool = CARDS;
    if (deck === 'due') pool = CARDS.filter(function (c) { return rec(c.id).due <= now; });
    else if (deck !== 'all') pool = CARDS.filter(function (c) { return c.section === deck; });
    if (pool.length > 1) pool = pool.filter(function (c) { return c.id !== lastId; });
    if (!pool.length) return null;
    var total = 0, ws = pool.map(function (c) { var w = cardWeight(c, now); total += w; return w; });
    var r = Math.random() * total;
    for (var i = 0; i < pool.length; i++) { r -= ws[i]; if (r <= 0) return pool[i]; }
    return pool[pool.length - 1];
  }

  function grade(g) {
    if (!current) return;
    var r = rec(current.id);
    r.seen++;
    if (g === 0) { r.box = 0; r.missed++; }
    else if (g === 1) { r.box = Math.max(0, r.box - 1); }
    else { r.box = Math.min(INTERVALS.length - 1, r.box + 1); }
    r.due = Date.now() + INTERVALS[r.box] * DAY;
    save();
    show();
  }

  // ---- study view ----
  var flipped = false;
  function show() {
    current = pick();
    flipped = false;
    var cardEl = document.getElementById('card'), gradeEl = document.getElementById('grade'), emptyEl = document.getElementById('empty');
    if (!current) { cardEl.classList.add('hidden'); gradeEl.classList.add('hidden'); emptyEl.classList.remove('hidden'); return; }
    lastId = current.id;
    cardEl.classList.remove('hidden'); emptyEl.classList.add('hidden'); gradeEl.classList.add('hidden');
    var sec = SECTIONS.find(function (s) { return s.id === current.section; });
    document.getElementById('card-section').textContent = sec.name + (current.topic ? ' · ' + current.topic : '');
    document.getElementById('card-front').textContent = current.q;
    document.getElementById('card-back').textContent = current.a;
    document.getElementById('card-back').classList.add('hidden');
    updateCounter();
  }
  function flip() {
    if (!current || flipped) return;
    flipped = true;
    document.getElementById('card-back').classList.remove('hidden');
    document.getElementById('grade').classList.remove('hidden');
  }
  function updateCounter() {
    var now = Date.now(), due = 0, seen = 0;
    CARDS.forEach(function (c) { var r = state.cards[c.id]; if (r && r.seen) seen++; if (!r || r.due <= now) due++; });
    document.getElementById('counter').textContent = due + ' due · ' + seen + '/' + CARDS.length + ' seen';
  }

  // ---- setup view ----
  function renderWeights() {
    var t = document.getElementById('weights');
    var html = '<tr><th>Section</th><th>Exam Qs</th><th>You got</th><th>%</th><th>Cards</th></tr>';
    SECTIONS.forEach(function (s) {
      var v = state.scored[s.id]; if (v === undefined) v = s.scored;
      var n = CARDS.filter(function (c) { return c.section === s.id; }).length;
      var p = scoredPct(s);
      html += '<tr><td>' + s.name + '</td><td>' + s.weight + '</td>' +
        '<td><input type="number" min="0" max="' + s.weight + '" data-sec="' + s.id + '" value="' + (v == null ? '' : v) + '"></td>' +
        '<td>' + (p === null ? '—' : Math.round(p * 100) + '%') + '</td><td>' + n + '</td></tr>';
    });
    var got = SECTIONS.reduce(function (a, s) { var v = state.scored[s.id]; if (v === undefined) v = s.scored; return a + (+v || 0); }, 0);
    html += '<tr><th>Total</th><th>' + TOTAL + '</th><th>' + got + '</th><th>' + Math.round(got / TOTAL * 100) + '%</th><th>need ' + PASS + ' (' + Math.max(0, PASS - got) + ' more)</th></tr>';
    t.innerHTML = html;
  }
  function saveWeights() {
    document.querySelectorAll('#weights input').forEach(function (inp) {
      state.scored[inp.dataset.sec] = inp.value === '' ? '' : +inp.value;
    });
    save(); renderWeights(); alert('Saved. Weak sections will now show up more often.');
  }

  // ---- stats view ----
  function renderStats() {
    var now = Date.now();
    var html = '<tr><th>Section</th><th>Seen</th><th>Mastered</th><th></th></tr>';
    SECTIONS.forEach(function (s) {
      var cs = CARDS.filter(function (c) { return c.section === s.id; });
      var seen = 0, mastered = 0;
      cs.forEach(function (c) { var r = state.cards[c.id]; if (r && r.seen) seen++; if (r && r.box >= 3) mastered++; });
      var pct = cs.length ? Math.round(mastered / cs.length * 100) : 0;
      html += '<tr><td>' + s.name + '</td><td>' + seen + '/' + cs.length + '</td><td>' + mastered + '/' + cs.length + '</td>' +
        '<td style="width:30%"><div class="bar"><span style="width:' + pct + '%"></span></div></td></tr>';
    });
    document.getElementById('stats-table').innerHTML = html;
    var misses = CARDS.map(function (c) { return { c: c, r: state.cards[c.id] }; })
      .filter(function (x) { return x.r && x.r.missed > 0; })
      .sort(function (a, b) { return b.r.missed - a.r.missed; }).slice(0, 15);
    document.getElementById('miss-list').innerHTML = misses.length
      ? misses.map(function (x) { return '<li><b>' + esc(x.c.q) + '</b><br><span class="note">' + esc(x.c.a) + ' (missed ' + x.r.missed + 'x)</span></li>'; }).join('')
      : '<li class="note">No misses yet.</li>';
  }
  function esc(s) { return String(s).replace(/[&<>]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]; }); }

  // ---- wiring ----
  function setView(v) {
    document.querySelectorAll('.view').forEach(function (el) { el.classList.toggle('active', el.id === 'view-' + v); });
    document.querySelectorAll('nav button').forEach(function (b) { b.classList.toggle('active', b.dataset.view === v); });
    if (v === 'setup') renderWeights();
    if (v === 'stats') renderStats();
    if (v === 'study') show();
  }
  document.querySelectorAll('nav button').forEach(function (b) { b.addEventListener('click', function () { setView(b.dataset.view); }); });
  document.getElementById('card').addEventListener('click', flip);
  document.querySelectorAll('#grade button').forEach(function (b) { b.addEventListener('click', function () { grade(+b.dataset.grade); }); });
  document.getElementById('deck-select').addEventListener('change', show);
  document.getElementById('save-weights').addEventListener('click', saveWeights);
  document.getElementById('reset-progress').addEventListener('click', function () {
    if (confirm('Erase all card progress and score card entries?')) { state = { cards: {}, scored: {} }; save(); renderWeights(); }
  });
  document.addEventListener('keydown', function (e) {
    if (!document.getElementById('view-study').classList.contains('active')) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); flip(); }
    else if (flipped && (e.key === '1' || e.key === '2' || e.key === '3')) grade(+e.key - 1);
  });

  // add per-section deck options
  var sel = document.getElementById('deck-select');
  SECTIONS.forEach(function (s) { var o = document.createElement('option'); o.value = s.id; o.textContent = s.name + ' only'; sel.appendChild(o); });

  show();
})();
