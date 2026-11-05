/*
  Class Hub — site script
  ------------------------------------------------------------------
  You normally do NOT need to edit this file. All class content lives
  in the files inside the "content" folder.

  The only thing you might change here is the CLASSES list below,
  if you ever add or remove a class.
*/
(function () {
  'use strict';

  // ---- The classes shown on the home page, in this order ----------
  var CLASSES = [
    { id: 'pa106', label: 'PA 106', file: 'content/pa106.md' },
    { id: 'pa152', label: 'PA 152', file: 'content/pa152.md' }
  ];

  // All "due in X days" math uses Philippine time (UTC+8, no daylight saving).
  var PH_OFFSET_HOURS = 8;
  var MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  /* ================================================================
     Small helpers
     ================================================================ */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function $(sel) { return document.querySelector(sel); }

  function safeUrl(url) {
    url = url.trim();
    if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
    // Relative links to files in this repository (e.g. files/syllabus.pdf)
    if (/^[\w\-./#?=&%]+$/.test(url) && !/^[a-z]+:/i.test(url)) return url;
    return null;
  }

  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
  }

  /* ================================================================
     Mini Markdown: just enough for a non-programmer's text file
     ================================================================ */

  // noLinks: used inside the home-page cards, which are already one big link
  // (a link inside a link breaks the card).
  function inline(raw, noLinks) {
    var tokens = [];
    function stash(html) { tokens.push(html); return '\u0000' + (tokens.length - 1) + '\u0000'; }
    var s = String(raw);

    // {{ placeholders }}
    s = s.replace(/\{\{([\s\S]*?)\}\}/g, function (m, t) {
      return stash('<span class="ph" title="Not filled in yet">' + esc(t.trim() || 'To be added') + '</span>');
    });
    // [text](link)
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, text, url) {
      var u = safeUrl(url);
      var label = esc(text);
      if (!u || noLinks) return stash(label);
      var ext = /^https?:/i.test(u) ? ' target="_blank" rel="noopener noreferrer"' : '';
      return stash('<a href="' + esc(u) + '"' + ext + '>' + label + '</a>');
    });
    // bare web addresses
    s = s.replace(/\bhttps?:\/\/[^\s<>\u0000]*[^\s<>\u0000.,;:!?)\]'"]/gi, function (u) {
      if (noLinks) return stash(esc(u.replace(/^https?:\/\//i, '')));
      return stash('<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(u.replace(/^https?:\/\//i, '')) + '</a>');
    });
    // bare email addresses
    s = s.replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, function (e) {
      if (noLinks) return stash(esc(e));
      return stash('<a href="mailto:' + esc(e) + '">' + esc(e) + '</a>');
    });

    s = esc(s);
    s = s.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, '$1<em>$2</em>');

    var guard = 0;
    while (s.indexOf('\u0000') !== -1 && guard++ < 5) {
      s = s.replace(/\u0000(\d+)\u0000/g, function (m, i) { return tokens[+i]; });
    }
    return s;
  }

  function listItem(text) {
    // "Key: value" lines get a bold key, e.g. "Room: ..."
    var m = /^([A-Za-z\u00C0-\u024F][\w\u00C0-\u024F'’&\/-]*(?: [\w\u00C0-\u024F'’&\/-]+){0,4}):\s+(.+)$/.exec(text);
    if (m && !/^https?$/i.test(m[1])) {
      return '<span class="k">' + inline(m[1]) + '</span> ' + inline(m[2]);
    }
    return inline(text);
  }

  function blocks(lines) {
    if (typeof lines === 'string') lines = lines.split('\n');
    var out = [], para = [], list = null;
    function flushPara() {
      if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; }
    }
    function flushList() {
      if (list) {
        out.push('<' + list.type + '>' + list.items.map(function (i) {
          return '<li>' + listItem(i) + '</li>';
        }).join('') + '</' + list.type + '>');
        list = null;
      }
    }
    lines.forEach(function (line) {
      var t = line.trim(), m;
      if (!t) { flushPara(); flushList(); return; }
      if ((m = /^[-*•]\s+(.*)$/.exec(t))) {
        flushPara();
        if (!list || list.type !== 'ul') { flushList(); list = { type: 'ul', items: [] }; }
        list.items.push(m[1]);
      } else if ((m = /^\d+[.)]\s+(.*)$/.exec(t))) {
        flushPara();
        if (!list || list.type !== 'ol') { flushList(); list = { type: 'ol', items: [] }; }
        list.items.push(m[1]);
      } else if ((m = /^#{3,6}\s+(.*)$/.exec(t))) {
        flushPara(); flushList();
        out.push('<h3 class="sub">' + inline(m[1]) + '</h3>');
      } else if (list && /^\s+/.test(line)) {
        list.items[list.items.length - 1] += ' ' + t; // indented continuation of a bullet
      } else {
        flushList();
        para.push(t);
      }
    });
    flushPara(); flushList();
    return out.join('');
  }

  /* ================================================================
     Reading a class file
     ================================================================ */

  function kindOf(name) {
    var n = name.toLowerCase();
    if (/announce/.test(n)) return 'announcements';
    if (/deadline|due|requirement/.test(n)) return 'deadlines';
    if (/contact|consult/.test(n)) return 'contact';
    if (/schedule/.test(n)) return 'schedule';
    if (/week|topic|reading/.test(n)) return 'weeks';
    if (/descript|about/.test(n)) return 'description';
    if (/class info|course info|details/.test(n)) return 'info';
    return 'extra';
  }

  function parseDoc(text) {
    text = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n').replace(/<!--[\s\S]*?(-->|$)/g, '');
    var doc = { heading: '', info: {}, infoOrder: [], sections: [] };
    var cur = null;
    text.split('\n').forEach(function (line) {
      var h2 = /^##\s+(.+?)\s*#*\s*$/.exec(line);
      var h1 = /^#\s+(.+?)\s*#*\s*$/.exec(line);
      if (h2) {
        cur = { name: h2[1], kind: kindOf(h2[1]), lines: [] };
        doc.sections.push(cur);
      } else if (h1 && !cur) {
        doc.heading = h1[1];
      } else if (cur) {
        cur.lines.push(line);
      }
    });
    doc.sections = doc.sections.filter(function (s) {
      if (s.kind !== 'info') return true;
      s.lines.forEach(function (l) {
        var m = /^\s*[-*]?\s*([^:]{1,40}?)\s*:\s*(.*)$/.exec(l);
        if (m) {
          var key = m[1].toLowerCase();
          if (!(key in doc.info)) doc.infoOrder.push(m[1]);
          doc.info[key] = m[2].trim();
        }
      });
      return false;
    });
    return doc;
  }

  function splitH3(lines) {
    var pre = [], items = [], cur = null;
    lines.forEach(function (l) {
      var m = /^###\s+(.+?)\s*$/.exec(l);
      if (m) { cur = { head: m[1], body: [] }; items.push(cur); }
      else if (cur) cur.body.push(l);
      else pre.push(l);
    });
    return { pre: pre, items: items };
  }

  function parts(s) { return s.split('|').map(function (p) { return p.trim(); }); }

  /* ================================================================
     Dates (Philippine time)
     ================================================================ */

  function parseDate(s) {
    s = (s || '').trim();
    var y, mo, d, rest, m;
    if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})(.*)$/.exec(s))) {
      y = +m[1]; mo = +m[2]; d = +m[3]; rest = m[4];
    } else if ((m = /^([A-Za-z]{3,})\.?\s+(\d{1,2}),?\s+(\d{4})(.*)$/.exec(s))) {
      mo = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()) + 1; d = +m[2]; y = +m[3]; rest = m[4];
    } else if ((m = /^(\d{1,2})\s+([A-Za-z]{3,})\.?,?\s+(\d{4})(.*)$/.exec(s))) {
      d = +m[1]; mo = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()) + 1; y = +m[3]; rest = m[4];
    } else {
      return null;
    }
    var check = new Date(Date.UTC(y, mo - 1, d));
    if (mo < 1 || check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null;

    var out = { y: y, mo: mo, d: d, hasTime: false, h: 23, mi: 59 };
    var t = /^\s*,?\s*(?:at\s+|by\s+)?(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|nn|noon)?\s*$/i.exec(rest || '');
    if (t && (t[2] || t[3])) {
      var h = +t[1], mi = t[2] ? +t[2] : 0, ap = (t[3] || '').toLowerCase().replace(/\./g, '');
      if (ap === 'pm' && h < 12) h += 12;
      if (ap === 'am' && h === 12) h = 0;
            if (h <= 23 && mi <= 59) { out.hasTime = true; out.h = h; out.mi = mi; }
    }
    out.day = Date.UTC(y, mo - 1, d) / 864e5;
    out.sort = out.day * 1440 + out.h * 60 + out.mi;
    return out;
  }

  function phNow() {
    var n = new Date(Date.now() + PH_OFFSET_HOURS * 3600e3);
    var day = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()) / 864e5;
    return { day: day, minutes: n.getUTCHours() * 60 + n.getUTCMinutes() };
  }

  function fmtDate(p) {
    return new Date(p.day * 864e5).toLocaleDateString('en-US', {
      timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  }

  function isoDate(p) {
    return p.y + '-' + (p.mo < 10 ? '0' : '') + p.mo + '-' + (p.d < 10 ? '0' : '') + p.d;
  }

  function fmtTime(p) {
    if (!p.hasTime) return '';
    if (p.h === 12 && p.mi === 0) return '12:00 NN';
    var h = p.h % 12 || 12;
    return h + ':' + (p.mi < 10 ? '0' : '') + p.mi + (p.h < 12 ? ' AM' : ' PM');
  }

  function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }

  function dueStatus(p, now) {
    var diff = p.day - now.day;
    var past = diff < 0 || (diff === 0 && p.hasTime && now.minutes > p.h * 60 + p.mi);
    if (past) {
      return { past: true, cls: 'past', text: diff === 0 ? 'Was due today' : 'Was due ' + plural(-diff, 'day') + ' ago' };
    }
    if (diff === 0) return { cls: 'urgent', text: 'Due today' };
    if (diff === 1) return { cls: 'urgent', text: 'Due tomorrow' };
    if (diff <= 7) return { cls: 'soon', text: 'Due in ' + diff + ' days' };
    return { cls: 'later', text: 'Due in ' + diff + ' days' };
  }

  function agoText(p, now) {
    var diff = now.day - p.day;
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff > 1 && diff < 30) return diff + ' days ago';
    return '';
  }

  /* ================================================================
     Turning sections into data
     ================================================================ */

  function getAnnouncements(sec) {
    var now = phNow();
    var list = splitH3(sec.lines).items.map(function (it, i) {
      var ps = parts(it.head);
      var date = parseDate(ps[0]);
      var title = date ? ps.slice(1).join(' | ') : it.head;
      return { date: date, title: title || 'Announcement', body: it.body, i: i };
    });
    list.sort(function (a, b) {
      if (a.date && b.date) return b.date.sort - a.date.sort || a.i - b.i;
      if (a.date) return -1;
      if (b.date) return 1;
      return a.i - b.i;
    });
    list.forEach(function (a) { a.isNew = !!(a.date && now.day - a.date.day <= 6 && now.day - a.date.day >= 0); });
    return list;
  }

  function getDeadlines(sec) {
    var now = phNow();
    var items = [];
    sec.lines.forEach(function (l, i) {
      var m = /^\s*[-*•]\s+(.+)$/.exec(l);
      if (!m) return;
      var ps = parts(m[1]);
      var date = parseDate(ps[0]);
      var title, details;
      if (ps.length > 1) { title = ps[1]; details = ps.slice(2).join(' | '); }
      else { title = ps[0]; details = ''; }
      items.push({ date: date, rawDate: ps.length > 1 ? ps[0] : '', title: title, details: details, i: i,
        status: date ? dueStatus(date, now) : null });
    });
    var upcoming = items.filter(function (d) { return !d.status || !d.status.past; });
    var past = items.filter(function (d) { return d.status && d.status.past; });
    upcoming.sort(function (a, b) {
      if (a.date && b.date) return a.date.sort - b.date.sort || a.i - b.i;
      if (a.date) return -1;
      if (b.date) return 1;
      return a.i - b.i;
    });
    past.sort(function (a, b) { return b.date.sort - a.date.sort; });
    return { upcoming: upcoming, past: past };
  }

  /* ================================================================
     HTML for each kind of section
     ================================================================ */

  var EMPTY = {
    announcements: 'No announcements yet.',
    deadlines: 'No upcoming deadlines.',
    weeks: 'Weekly topics will be posted soon.',
    other: 'Nothing here yet.'
  };

  function hasContent(lines) {
    return lines.some(function (l) { return l.trim(); });
  }

  function renderAnnouncements(sec) {
    var list = getAnnouncements(sec);
    if (!list.length) return '<p class="empty">' + EMPTY.announcements + '</p>';
    var now = phNow();
    return '<ol class="feed">' + list.map(function (a) {
      var when = a.date
        ? '<time datetime="' + isoDate(a.date) + '">' + esc(fmtDate(a.date)) + '</time>' + (agoText(a.date, now) ? ' · ' + agoText(a.date, now) : '')
        : '<span class="ph">Undated — add a date like 2026-08-20</span>';
      return '<li class="card ann">' +
        '<p class="when">' + when + (a.isNew ? ' <span class="badge new">New</span>' : '') + '</p>' +
        '<h3>' + inline(a.title) + '</h3>' +
        '<div class="prose">' + blocks(a.body) + '</div></li>';
    }).join('') + '</ol>';
  }

  function deadlineItem(d) {
    var dateHtml;
    if (d.date) {
      dateHtml = '<time class="d-date" datetime="' + isoDate(d.date) + '">' + esc(fmtDate(d.date)) +
        (d.date.hasTime ? ', ' + esc(fmtTime(d.date)) : '') + '</time>';
    } else {
      var raw = d.rawDate;
      if (raw && /^\d/.test(raw)) {
        dateHtml = '<span class="ph">Check this date: ' + esc(raw) + '</span>';
      } else {
        dateHtml = '<span class="d-date tba">' + (raw && !/^(tba|tbd)\b/i.test(raw) ? inline(raw) : 'Date to be announced') + '</span>';
      }
    }
    var badge = d.status ? '<span class="badge ' + d.status.cls + '">' + esc(d.status.text) + '</span>' : '';
    return '<li class="deadline ' + (d.status ? d.status.cls : 'tba') + '">' +
      '<div class="d-top">' + dateHtml + ' ' + badge + '</div>' +
      '<p class="d-title">' + inline(d.title) + '</p>' +
      (d.details ? '<p class="d-details">' + inline(d.details) + '</p>' : '') + '</li>';
  }

  function renderDeadlines(sec) {
    var dl = getDeadlines(sec);
    var html = dl.upcoming.length
      ? '<ul class="deadlines">' + dl.upcoming.map(deadlineItem).join('') + '</ul>'
      : '<p class="empty">' + EMPTY.deadlines + '</p>';
    if (dl.past.length) {
      html += '<details class="past-list"><summary>Past deadlines (' + dl.past.length + ')</summary>' +
        '<ul class="deadlines">' + dl.past.map(deadlineItem).join('') + '</ul></details>';
    }
    return html;
  }

  function renderWeeks(sec) {
    var sp = splitH3(sec.lines);
    var html = hasContent(sp.pre) ? '<div class="prose">' + blocks(sp.pre) + '</div>' : '';
    if (!sp.items.length) return html || '<p class="empty">' + EMPTY.weeks + '</p>';
    html += '<div class="weeks">' + sp.items.map(function (w, i) {
      var ps = parts(w.head);
      var label = ps[0], dates = '', topic = '';
      if (ps.length >= 3) { dates = ps[1]; topic = ps.slice(2).join(' | '); }
      else if (ps.length === 2) { topic = ps[1]; }
      var body = hasContent(w.body) ? blocks(w.body) : '<p class="empty">Readings to follow.</p>';
      return '<details class="week"' + (i === 0 && sp.items.length === 1 ? ' open' : '') + '>' +
        '<summary><span class="w-label">' + inline(label) + '</span>' +
        (dates ? ' <span class="w-dates">' + inline(dates) + '</span>' : '') +
        (topic ? ' <span class="w-topic">' + inline(topic) + '</span>' : '') +
        '</summary><div class="prose">' + body + '</div></details>';
    }).join('') + '</div>';
    return html;
  }

  function renderGeneric(sec) {
    return hasContent(sec.lines)
      ? '<div class="prose">' + blocks(sec.lines) + '</div>'
      : '<p class="empty">' + EMPTY.other + '</p>';
  }

  var SHORT = {
    announcements: 'Announcements', deadlines: 'Deadlines', schedule: 'Schedule',
    weeks: 'Weekly topics', description: 'About', contact: 'Contact'
  };

  /* ================================================================
     Pages
     ================================================================ */

  function fetchText(file) {
    // "no-cache" makes sure students see edits as soon as GitHub publishes them.
    return fetch(file, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    });
  }

  function errorBox(file) {
    return '<div class="card error"><h1>Couldn\'t load this class</h1>' +
      '<p>Please check your connection and reload the page.</p>' +
      '<p class="small">Teacher\'s note: the site couldn\'t read <code>' + esc(file) + '</code>. ' +
      'If you opened the page straight from your computer, it needs to run on GitHub Pages ' +
      '(or a local web server) instead.</p></div>';
  }

  function findClass(id) {
    id = (id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    for (var i = 0; i < CLASSES.length; i++) if (CLASSES[i].id === id) return CLASSES[i];
    return null;
  }

  function classTitle(doc, c) {
    return {
      code: doc.info.code || c.label,
      title: doc.info.title || doc.heading || ''
    };
  }

  // ---------- Home ----------
  function initHome() {
    var wrap = $('#cards');
    wrap.innerHTML = CLASSES.map(function (c) {
      return '<a class="card class-card" id="card-' + c.id + '" href="class.html?c=' + c.id + '">' +
        '<p class="code">' + esc(c.label) + '</p><h2 class="loading">Loading…</h2></a>';
    }).join('');

    CLASSES.forEach(function (c) {
      var el = $('#card-' + c.id);
      fetchText(c.file).then(function (text) {
        var doc = parseDoc(text);
        var t = classTitle(doc, c);
        var summary = doc.info.summary || doc.info['card summary'] || '';
        var latest = null, next = null;
        doc.sections.forEach(function (s) {
          if (s.kind === 'announcements' && !latest) latest = getAnnouncements(s)[0] || null;
          if (s.kind === 'deadlines' && !next) next = getDeadlines(s).upcoming[0] || null;
        });
        var rows = '';
        if (latest) {
          rows += '<li><span class="k">Latest</span> <span>' + inline(latest.title, true) +
            (latest.date ? ' <span class="muted">· ' + esc(fmtDate(latest.date)) + '</span>' : '') +
            (latest.isNew ? ' <span class="badge new">New</span>' : '') + '</span></li>';
        }
        if (next) {
          rows += '<li><span class="k">Next due</span> <span>' + inline(next.title, true) +
            (next.status ? ' <span class="badge ' + next.status.cls + '">' + esc(next.status.text) + '</span>' : ' <span class="muted">· date TBA</span>') + '</span></li>';
        }
        el.innerHTML = '<p class="code">' + inline(t.code, true) + '</p>' +
          '<h2>' + (t.title ? inline(t.title, true) : esc(c.label)) + '</h2>' +
          (summary ? '<p class="summary">' + inline(summary, true) + '</p>' : '') +
          (rows ? '<ul class="glance">' + rows + '</ul>' : '') +
          '<span class="go">Open class page <span aria-hidden="true">→</span></span>';
      }).catch(function () {
        el.innerHTML = '<p class="code">' + esc(c.label) + '</p><h2>Open class page</h2>' +
          '<p class="summary muted">Couldn\'t load a preview. Tap to try the class page.</p>';
      });
    });
  }

  // ---------- Class page ----------
  function initClass() {
    var main = $('#class');
    var params = new URLSearchParams(location.search);
    var c = findClass(params.get('c'));
    if (!c) {
      main.innerHTML = '<div class="card error"><h1>Class not found</h1><p>Choose a class:</p><ul>' +
        CLASSES.map(function (k) { return '<li><a href="class.html?c=' + k.id + '">' + esc(k.label) + '</a></li>'; }).join('') +
        '</ul></div>';
      return;
    }
    fetchText(c.file).then(function (text) {
      var doc = parseDoc(text);
      var t = classTitle(doc, c);
      document.title = (doc.info.code || c.label) + ' · Class Hub';

      var skip = { code: 1, title: 1, summary: 1, 'card summary': 1 };
      var meta = doc.infoOrder.filter(function (k) { return !skip[k.toLowerCase()] && doc.info[k.toLowerCase()]; })
        .map(function (k) {
          return '<div><dt>' + esc(k) + '</dt><dd>' + inline(doc.info[k.toLowerCase()]) + '</dd></div>';
        }).join('');

      var used = {};
      var sections = doc.sections.map(function (s) {
        var id = s.kind !== 'extra' && !used[s.kind] ? s.kind : 'sec-' + slug(s.name);
        while (used[id]) id += '-x';
        used[id] = 1;
        var body;
        if (s.kind === 'announcements') body = renderAnnouncements(s);
        else if (s.kind === 'deadlines') body = renderDeadlines(s);
        else if (s.kind === 'weeks') body = renderWeeks(s);
        else body = renderGeneric(s);
        return { id: id, name: s.name, short: SHORT[s.kind] || s.name, html: body };
      });

      var nav = sections.length > 1
        ? '<nav class="jump" aria-label="On this page">' + sections.map(function (s) {
            return '<a href="#' + s.id + '">' + esc(s.short) + '</a>';
          }).join('') + '</nav>'
        : '';

      main.innerHTML =
        '<header class="class-head">' +
          (t.title ? '<p class="code">' + inline(t.code) + '</p><h1>' + inline(t.title) + '</h1>'
                   : '<h1>' + inline(t.code) + '</h1>') +
          (meta ? '<dl class="meta">' + meta + '</dl>' : '') +
        '</header>' + nav +
        (sections.length ? '' : '<p class="empty block">Nothing has been posted for this class yet.</p>') +
        sections.map(function (s) {
          return '<section class="block" id="' + s.id + '" aria-labelledby="h-' + s.id + '">' +
            '<h2 id="h-' + s.id + '">' + inline(s.name) + '</h2>' + s.html + '</section>';
        }).join('');

      if (main.querySelector('.ph')) {
        var note = document.createElement('p');
        note.className = 'ph-note';
        note.innerHTML = 'Items in <span class="ph">dashed boxes</span> haven\'t been filled in yet.';
        main.querySelector('.class-head').appendChild(note);
      }
      if (location.hash) {
        var target = document.getElementById(location.hash.slice(1));
        if (target) target.scrollIntoView();
      }
    }).catch(function () {
      main.innerHTML = errorBox(c.file);
    });
  }

  /* ================================================================
     Light / dark mode switch (remembered on this device only)
     ================================================================ */

  function initTheme() {
    var btn = $('#theme-toggle');
    if (!btn) return;
    var order = ['auto', 'light', 'dark'];
    var labels = { auto: 'Theme: Auto', light: 'Theme: Light', dark: 'Theme: Dark' };
    function get() {
      try { var v = localStorage.getItem('theme'); return order.indexOf(v) > -1 ? v : 'auto'; }
      catch (e) { return 'auto'; }
    }
    function apply(mode) {
      if (mode === 'auto') document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', mode);
      btn.textContent = labels[mode];
      btn.title = 'Switch between automatic, light and dark colors';
    }
    var mode = get();
    apply(mode);
    btn.addEventListener('click', function () {
      mode = order[(order.indexOf(mode) + 1) % order.length];
      try { localStorage.setItem('theme', mode); } catch (e) { /* private mode: ignore */ }
      apply(mode);
    });
  }

  initTheme();
  var page = document.body.getAttribute('data-page');
  if (page === 'home') initHome();
  if (page === 'class') initClass();
})();
