/* ============================================================================
 * DFWR — pdfmake document definition builder  (Proof of Concept)
 * ----------------------------------------------------------------------------
 * PURPOSE
 * This is the single place that turns a saved DFWR record (the same object
 * shape the existing tool exports) plus the company setup into a pdfmake
 * "document definition". pdfmake then lays it out and paginates it itself.
 *
 * WHY THIS REPLACES THE BROWSER-PRINT PIPELINE
 * - No browser print engine, so Safari cannot inject its URL/date/page footer.
 * - pdfmake auto-paginates: a long Work Report simply flows onto as many
 *   pages as needed. No character budgets, no manual continuation sheets.
 * - The company footer is a repeating band drawn on EVERY page by pdfmake,
 *   so it can never "orphan" onto a blank page.
 * => Compact Print Mode, shrink-block2, print-hide, splitTextByBudget and the
 *    whole v2.3.1–v2.3.6 workaround stack become unnecessary.
 *
 * DESIGN NOTE (ruled-look question, for review)
 * The paper form uses ruled writing lines. Here the fields are rendered as a
 * clean bordered table instead — far simpler to maintain and it reads as a
 * professional form. Literal ruled lines are possible via pdfmake canvas if
 * you decide you want them; this POC shows the table version for you to judge.
 *
 * This file is plain JS with no imports so the exact same function can be
 * pasted into the browser page. (module.exports at the bottom is ignored in
 * the browser and only used by the Node test harness.)
 * ========================================================================== */

function buildDocDefinition(record, setup) {
  var r = record || {};
  var s = setup || {};

  // ---- Colors (fall back to Michael Baker Navy) --------------------------
  var PRIMARY = s.primary || '#1B2A47';
  var LABEL   = '#5A6470';
  var RULE    = '#C0CEDC';
  var TEXT    = '#1F2933';

  // ---- Small helpers -----------------------------------------------------
  function val(x) { return (x === undefined || x === null) ? '' : String(x); }

  // A labelled field cell: small uppercase label over the value.
  function field(label, value) {
    return {
      stack: [
        { text: label, style: 'fieldLabel' },
        { text: val(value) || ' ', style: 'fieldValue' }
      ]
    };
  }

  // A row of labelled fields as one bordered table row (the "ruled" look).
  function fieldRow(cells) {
    return {
      table: { widths: cells.map(function () { return '*'; }), body: [cells.map(function (c) { return c; })] },
      layout: rowLayout,
      margin: [0, 0, 0, 0]
    };
  }

  // Table layout: only a bottom rule per row (mimics the form's ruled rows).
  var rowLayout = {
    hLineWidth: function (i, node) { return (i === node.table.body.length) ? 0.75 : 0; },
    vLineWidth: function () { return 0; },
    hLineColor: function () { return RULE; },
    paddingLeft: function () { return 0; },
    paddingRight: function () { return 8; },
    paddingTop: function () { return 3; },
    paddingBottom: function () { return 4; }
  };

  // A checkbox glyph drawn with canvas (font-independent), with an X if checked.
  function checkbox(checked) {
    var els = [{ type: 'rect', x: 0, y: 0, w: 9, h: 9, lineWidth: 0.8, lineColor: '#333' }];
    if (checked) {
      els.push({ type: 'line', x1: 1.5, y1: 1.5, x2: 7.5, y2: 7.5, lineWidth: 0.9, lineColor: PRIMARY });
      els.push({ type: 'line', x1: 7.5, y1: 1.5, x2: 1.5, y2: 7.5, lineWidth: 0.9, lineColor: PRIMARY });
    }
    return { canvas: els, width: 12 };
  }

  // A checkbox + label pair for an inline options row.
  function checkItem(checked, label) {
    return {
      columns: [checkbox(checked), { text: ' ' + label, fontSize: 9, margin: [2, -1, 0, 0] }],
      width: 'auto',
      columnGap: 2,
      margin: [0, 0, 12, 0]
    };
  }

  // ---- Header block (page 1 body, not a running header) ------------------
  var titleColumns = [];
  if (s.logo) {
    titleColumns.push({ image: s.logo, fit: [120, 40], width: 130 });
  } else {
    titleColumns.push({ text: '', width: 130 });
  }
  titleColumns.push({ text: 'Daily Field Work Record', style: 'docTitle', alignment: 'center' });
  titleColumns.push({ text: '', width: 130 });

  // ---- Work type + attachments option rows -------------------------------
  var workTypeRow = {
    columns: [
      { text: 'WORK TYPE:', style: 'inlineLabel', width: 'auto', margin: [0, 1, 8, 0] },
      checkItem(!!r.wtSurvey, 'Survey'),
      checkItem(!!r.wtArch, 'Archaeological Excavation'),
      checkItem(!!r.wtMonitor, 'Monitoring'),
      checkItem(!!r.wtOther, 'Other' + (r.wtOtherText ? ': ' + r.wtOtherText : ''))
    ],
    columnGap: 0, margin: [0, 6, 0, 6]
  };

  var attachRow = {
    columns: [
      { text: 'ATTACHMENTS:', style: 'inlineLabel', width: 'auto', margin: [0, 1, 8, 0] },
      checkItem(!!r.attPhoto, 'Photo Log'),
      checkItem(!!r.attMap, 'Map'),
      checkItem(!!r.attSupp, 'Supplementary Sheets'),
      checkItem(!!r.attGps, 'GPS Log'),
      checkItem(!!r.attOther, 'Other' + (r.attOtherText ? ': ' + r.attOtherText : ''))
    ],
    columnGap: 0, margin: [0, 8, 0, 0]
  };

  // ---- Time rows (single block, or two blocks + grand total) -------------
  var content = [
    { columns: titleColumns, margin: [0, 0, 0, 6] },
    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 531, y2: 0, lineWidth: 1.2, lineColor: PRIMARY }], margin: [0, 0, 0, 6] },

    fieldRow([field('JOB NUMBER', r.jobNumber), field('JOB NAME', r.jobName), field('DATE', r.date)]),
    fieldRow([field('WORK LOCATION', r.workLocation)]),
    workTypeRow,
    fieldRow([field('YOUR NAME', r.yourName)]),
    fieldRow([field('CREW (NAME AND AFFILIATION)', r.crew)]),

    fieldRow([field('TIME IN', fmtTime(r.timeIn)), field('TIME OUT', fmtTime(r.timeOut)),
              field('LUNCH', r.lunchMins ? r.lunchMins + ' min' : ''),
              field('TOTAL HOURS', r.totalHours ? r.totalHours + ' hrs' : '')])
  ];

  var usesBlock2 = !!(r.timeIn2 || r.timeOut2 || r.lunchMins2 || r.totalHours2);
  if (usesBlock2) {
    content.push(fieldRow([field('TIME IN (2)', fmtTime(r.timeIn2)), field('TIME OUT (2)', fmtTime(r.timeOut2)),
                           field('LUNCH (2)', r.lunchMins2 ? r.lunchMins2 + ' min' : ''),
                           field('BLOCK 2 HOURS', r.totalHours2 ? r.totalHours2 + ' hrs' : '')]));
    content.push(fieldRow([field('', ''), field('', ''), field('', ''),
                           field('GRAND TOTAL HOURS', r.totalHoursGrand ? r.totalHoursGrand + ' hrs' : '')]));
  }

  content.push(fieldRow([field('VISITORS (NAME AND AFFILIATION)', r.visitors)]));
  content.push(fieldRow([field('NATIVE AMERICAN MONITOR (NAME AND AFFILIATION)', r.nativeMonitor)]));
  content.push(fieldRow([field('CONSTRUCTION CREW (NAME AND AFFILIATION)', r.constructionCrew)]));
  content.push(fieldRow([field('VEHICLE', r.vehicle), field('START LOCATION', r.startLocation), field('TOTAL MILES', r.totalMiles)]));

  // ---- Work Report (this is the part that auto-paginates) ----------------
  content.push({
    text: [
      { text: 'WORK REPORT  ', style: 'sectionLabel' },
      { text: '(Methods, Work Completed, Stops/Starts, Discoveries, Observations, Soils, Landforms/Topography, Vegetation, Disturbances, etc.)', style: 'sectionHint' }
    ],
    margin: [0, 10, 0, 4]
  });
  content.push({
    text: val(r.workReport) || ' ',
    style: 'reportBody'
  });

  // ---- User-authored continuation pages ----------------------------------
  // The record model can carry continuationPages (an array of strings the user
  // typed in the tool). We render them, IN SAVED ORDER, after the main Work
  // Report, under a single "Work Notes Continuation" heading. pdfmake flows
  // this across as many generated pages as needed — but nothing is dropped:
  // every non-empty page string is emitted, in order. (Empty strings hold no
  // text, so skipping them loses nothing.)
  var contPages = Array.isArray(r.continuationPages)
    ? r.continuationPages.filter(function (pg) { return pg && String(pg).trim().length; })
    : [];
  if (contPages.length) {
    content.push({ text: 'Work Notes Continuation', style: 'contHeading', margin: [0, 12, 0, 4] });
    contPages.forEach(function (pg, idx) {
      content.push({ text: String(pg), style: 'reportBody', margin: [0, idx === 0 ? 0 : 8, 0, 0] });
    });
  }

  // v2.4.0.1 (visual polish): a thin divider immediately above ATTACHMENTS,
  // to separate the Work Report / continuation content from the checklist.
  content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 531, y2: 0, lineWidth: 0.5, lineColor: RULE }], margin: [0, 10, 0, 0] });
  content.push(attachRow);

  // ---- Repeating company footer band (drawn on EVERY page) ---------------
  var footerText = [s.address, s.cityState].filter(Boolean).join(', ');
  var footerContacts = [footerText, s.phone, s.email].filter(Boolean).join('     ');

  function footer(currentPage, pageCount) {
    return {
      margin: [40, 6, 40, 0],
      stack: [
        { text: 'Page ' + currentPage + ' of ' + pageCount, alignment: 'right', fontSize: 7, color: LABEL, margin: [0, 0, 0, 3] },
        {
          table: { widths: ['*'], body: [[
            { text: footerContacts || ' ', alignment: 'center', color: '#FFFFFF', fillColor: PRIMARY, fontSize: 8, margin: [6, 5, 6, 5] }
          ]] },
          layout: 'noBorders'
        }
      ]
    };
  }

  // ---- Compact running header on pages 2+ (page 1 has the full header) ----
  // v2.4.0.1 (visual polish): a thin divider is drawn immediately below the
  // running header to separate the repeated header from the continued body.
  // This lives entirely inside the top page margin (drawn by pdfmake's header
  // mechanism), so it does NOT affect body pagination or flow.
  function header(currentPage) {
    if (currentPage === 1) return null;
    return {
      margin: [40, 20, 40, 0],
      stack: [
        {
          columns: [
            { text: 'Daily Field Work Record', style: 'docTitleSmall' },
            { text: (r.jobName ? r.jobName : '') + (r.jobNumber ? '  |  #' + r.jobNumber : ''), alignment: 'right', fontSize: 8, color: LABEL, margin: [0, 3, 0, 0] }
          ]
        },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 531, y2: 0, lineWidth: 0.5, lineColor: RULE }], margin: [0, 3, 0, 0] }
      ]
    };
  }

  // ---- Assemble ----------------------------------------------------------
  return {
    pageSize: 'LETTER',
    pageMargins: [40, 44, 40, 64],   // top margin leaves room for pages-2+ header; bottom for footer
    info: {
      title: buildFilename(r)        // suggested Save-as name (no title-swap hack)
    },
    defaultStyle: { font: 'Roboto', fontSize: 10, color: TEXT, lineHeight: 1.15 },
    styles: {
      docTitle:      { fontSize: 16, bold: true, color: PRIMARY, margin: [0, 4, 0, 0] },
      docTitleSmall: { fontSize: 10, bold: true, color: PRIMARY },
      fieldLabel:    { fontSize: 7.5, bold: true, color: LABEL, characterSpacing: 0.3 },
      fieldValue:    { fontSize: 11, color: TEXT },
      inlineLabel:   { fontSize: 8, bold: true, color: LABEL },
      sectionLabel:  { fontSize: 8, bold: true, color: LABEL },
      sectionHint:   { fontSize: 7, italics: true, color: LABEL },
      contHeading:   { fontSize: 10, bold: true, color: PRIMARY },
      reportBody:    { fontSize: 9.5, color: TEXT, lineHeight: 1.25 }
    },
    header: header,
    footer: footer,
    content: content
  };

  // ---- local helpers that need closure over nothing ----------------------
  function fmtTime(hhmm) {
    if (!hhmm || String(hhmm).indexOf(':') === -1) return val(hhmm);
    var parts = String(hhmm).split(':');
    var h = parseInt(parts[0], 10); var m = parts[1];
    var ampm = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12; if (h12 === 0) h12 = 12;
    return h12 + ':' + m + ' ' + ampm;
  }
}

// Suggested filename: JobName_YourName_YYYY-MM-DD-HHMM (sanitized).
function buildFilename(r) {
  var now = new Date();
  var date = now.toISOString().slice(0, 10);
  var time = now.toTimeString().slice(0, 5).replace(':', '');
  var stem = [r && r.jobName, r && r.yourName]
    .map(function (p) { return String(p || '').trim().replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, ''); })
    .filter(Boolean).join('_') || 'DFWR';
  return (stem + '_' + date + '-' + time).slice(0, 120);
}

// Node-only export (ignored in the browser).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { buildDocDefinition: buildDocDefinition, buildFilename: buildFilename };
}
