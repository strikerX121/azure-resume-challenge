// Topic motifs. Each returns SVG markup for a 1200 x 630 canvas centred on
// (600, 315). The important shapes stay inside x 330-870 / y 150-480 so the
// art survives every crop the site applies: 16:9 cards, the 1200 x 420 post
// hero, the narrow mobile hero and the 1200 x 630 social card.

import {
  C, HUE, rng, line, path, rect, circle, g, glow, dot, cloud, cylinder, doc, envelope,
  shield, person, check, sparkle, hex, lock, key, curve,
} from './art.mjs';

const CX = 600, CY = 315;

/* ------------------------------------------------------------ blog posts */

// AI search visibility: a radar sweep over many businesses, one of which is
// lit up because it is the one that gets named.
export function radar(hue) {
  const r = rng(11);
  let s = '';
  for (const rad of [55, 105, 155, 205]) s += circle(CX, CY, rad, { c: hue, w: 1.5, o: 0.32 });
  s += line(CX - 220, CY, CX + 220, CY, { c: hue, o: 0.15, w: 1 }) + line(CX, CY - 220, CX, CY + 220, { c: hue, o: 0.15, w: 1 });
  s += `<path d="M ${CX} ${CY} L ${CX + 205} ${CY - 5} A 205 205 0 0 0 ${CX + 138} ${CY - 152} Z" fill="${hue}" fill-opacity="0.14"/>`;
  s += line(CX, CY, CX + 205, CY - 5, { c: hue, w: 2.5, o: 0.75 });
  for (let i = 0; i < 24; i++) {
    const a = r() * Math.PI * 2, d = 40 + r() * 160;
    s += circle(CX + Math.cos(a) * d, CY + Math.sin(a) * d, 3.5 + r() * 2, { fill: C.muted, fo: 0.5 });
  }
  s += circle(CX + 122, CY - 76, 20, { c: C.accent, w: 2, o: 0.65 }) + circle(CX + 122, CY - 76, 34, { c: C.accent, w: 1.5, o: 0.3 });
  s += dot(CX + 122, CY - 76, 9);
  s += dot(CX, CY, 5, hue, 2);
  return s;
}

// Copilot in PowerPoint: a stack of slides with a bar chart, one bar that
// does not match, and a magnifier doing the 30-second check.
export function slidesCheck(hue) {
  let s = '';
  const ox = CX - 70, oy = CY + 10;
  s += rect(ox - 230, oy - 140, 360, 210, { fill: C.surface2, fo: 0.9, c: C.muted, so: 0.25 });
  s += rect(ox - 210, oy - 118, 360, 210, { fill: C.surface2, fo: 0.95, c: C.muted, so: 0.35 });
  s += rect(ox - 190, oy - 96, 360, 210, { fill: C.surface, fo: 1, c: C.muted, so: 0.6, sw: 2 });
  s += line(ox - 160, oy - 66, ox - 40, oy - 66, { c: C.text, w: 6, o: 0.6 });
  s += line(ox - 160, oy - 46, ox + 20, oy - 46, { c: C.muted, w: 4, o: 0.35 });
  const base = oy + 90, bars = [60, 95, 130, 78];
  bars.forEach((h, i) => {
    const x = ox - 150 + i * 62;
    const odd = i === 2;
    s += rect(x, base - h, 38, h, { r: 4, fill: odd ? C.accent : hue, fo: odd ? 0.9 : 0.6, c: 'none', sw: 0 });
  });
  s += line(ox - 165, base, ox + 125, base, { c: C.muted, w: 2, o: 0.5 });
  // magnifier beside the deck, aimed at the odd bar
  const mx = ox + 250, my = oy - 10;
  s += line(ox - 15, base - 140, mx - 60, my - 8, { c: C.accent, w: 2, o: 0.5, dash: '3 7' });
  s += glow(mx, my, 70, C.accent, 0.16);
  s += circle(mx, my, 62, { fill: C.surface, fo: 0.9, c: C.text, w: 5, o: 0.85 });
  s += line(mx + 44, my + 44, mx + 92, my + 92, { c: C.text, w: 11, o: 0.85 });
  s += check(mx, my, 1.5, { c: C.accent, w: 6 });
  return s;
}

// Automate data, not spreadsheets: a loose grid of cells becomes a database,
// and only then feeds an automation.
export function sheetToDb(hue) {
  let s = '';
  const gx = CX - 270, gy = CY - 110;
  for (let rI = 0; rI < 6; rI++) for (let cI = 0; cI < 4; cI++) {
    const lit = (rI * 3 + cI * 5) % 7 === 0;
    s += rect(gx + cI * 46, gy + rI * 38, 40, 30, { r: 4, fill: lit ? hue : C.surface, fo: lit ? 0.35 : 0.8, c: C.border, so: 0.9, sw: 1.2 });
  }
  s += path(`M ${CX - 76} ${CY} C ${CX - 40} ${CY} ${CX - 40} ${CY} ${CX - 8} ${CY}`, { c: C.accent, w: 3, o: 0.9, dash: '2 9' });
  s += cylinder(CX + 50, CY, 110, 150, { accentBand: C.accent });
  for (const [dy, i] of [[-80, 0], [0, 1], [80, 2]]) {
    s += curve(CX + 108, CY, CX + 214, CY + dy, { c: hue, w: 2.5, o: 0.6 });
    s += rect(CX + 214, CY + dy - 20, 56, 40, { r: 10, fill: i === 1 ? C.accent : C.surface, fo: i === 1 ? 0.95 : 0.95, c: i === 1 ? C.accent : hue, so: 0.8, sw: 2 });
  }
  s += sparkle(CX + 242, CY, 0.55, '#fff', 0.95);
  return s;
}

// Azure cost dashboards: a cloud with spend trending down underneath it.
export function cloudCost(hue) {
  let s = '';
  s += cloud(CX, CY - 92, 1.15, { c: hue, o: 0.85 });
  for (let i = 0; i < 3; i++) s += `<ellipse cx="${CX}" cy="${CY - 66 - i * 13}" rx="34" ry="10" fill="${C.surface}" stroke="${C.accent}" stroke-width="2.5"/>`;
  const x0 = CX - 230, x1 = CX + 230, y0 = CY + 160;
  for (let i = 0; i < 9; i++) s += rect(x0 + 10 + i * 52, y0 - 26 - (i % 3) * 10, 22, 26 + (i % 3) * 10, { r: 3, fill: C.muted, fo: 0.28, c: 'none', sw: 0 });
  const pts = [[0, 60], [1, 92], [2, 84], [3, 120], [4, 104], [5, 84], [6, 90], [7, 70], [8, 58]];
  const xy = pts.map(([i, v]) => [x0 + i * ((x1 - x0) / 8), y0 - v]);
  s += path(`M ${xy.map((p) => p.join(' ')).join(' L ')}`, { c: hue, w: 3.5, o: 0.9 });
  for (const [x, y] of xy.slice(0, 8)) s += circle(x, y, 4, { fill: C.bg0, c: hue, w: 2 });
  s += dot(xy[8][0], xy[8][1], 7);
  s += line(x0, y0, x1, y0, { c: C.muted, w: 2, o: 0.45 });
  s += line(CX, CY - 22, CX, CY + 30, { c: hue, w: 2, o: 0.4, dash: '3 7' });
  return s;
}

// Azure Front Door: a swarm of requests hits the edge, the shield filters
// them, and only a calm trickle reaches the origin servers.
export function edgeShield(hue) {
  let s = '';
  // five lanes of incoming requests, most of them stopping at the edge
  for (let l = 0; l < 5; l++) {
    const y = CY - 120 + l * 60;
    s += line(CX - 330, y, CX - 110, CY - 6 + (y - CY) * 0.25, { c: C.muted, w: 1.5, o: 0.22 });
    for (let i = 0; i < 6; i++) {
      const t = i / 6, x = CX - 320 + t * 200, yy = y + (CY - 6 + (y - CY) * 0.25 - y) * t;
      const bad = (i + l) % 3 !== 0;
      s += circle(x, yy, 4, { fill: bad ? C.muted : hue, fo: bad ? 0.5 : 0.9 });
    }
  }
  s += glow(CX - 40, CY, 90, hue, 0.2);
  s += shield(CX - 40, CY - 6, 1.65, { c: C.accent, w: 3.5 });
  s += path(`M ${CX - 62} ${CY - 6} L ${CX - 46} ${CY + 12} L ${CX - 16} ${CY - 22}`, { c: C.accent, w: 6, o: 1 });
  s += line(CX + 50, CY - 6, CX + 140, CY - 6, { c: hue, w: 2.5, o: 0.6 });
  s += circle(CX + 95, CY - 6, 4, { fill: hue });
  // origin load gauge: needle well below the old high-water mark
  const gx = CX + 240, gy = CY + 40, gr = 92;
  s += path(`M ${gx - gr} ${gy} A ${gr} ${gr} 0 0 1 ${gx + gr} ${gy}`, { c: C.border, w: 14, o: 1 });
  s += path(`M ${gx - gr} ${gy} A ${gr} ${gr} 0 0 1 ${gx - gr * Math.cos(Math.PI * 0.35)} ${gy - gr * Math.sin(Math.PI * 0.35)}`, { c: HUE.engineering, w: 14, o: 0.9 });
  const hi = Math.PI * 0.95, lo = Math.PI * 0.35;
  s += line(gx, gy, gx - gr * 0.8 * Math.cos(hi), gy - Math.sin(hi) * gr * 0.8, { c: C.muted, w: 3, o: 0.35, dash: '4 6' });
  s += line(gx, gy, gx - gr * 0.8 * Math.cos(lo), gy - gr * 0.8 * Math.sin(lo), { c: C.accent, w: 5, o: 1 });
  s += circle(gx, gy, 9, { fill: C.accent });
  s += rect(gx - 70, gy + 22, 140, 40, { r: 8, fill: C.surface, c: C.border, sw: 2 });
  s += circle(gx - 50, gy + 42, 5, { fill: HUE.engineering }) + line(gx - 34, gy + 42, gx + 50, gy + 42, { c: C.muted, w: 4, o: 0.4 });
  return s;
}

// Before you build a Copilot agent: the agent sits on a blueprint, wired to
// governance, licensing and its instructions before it is shared.
export function agentBlueprint(hue) {
  let s = '';
  for (let i = -5; i <= 5; i++) s += line(CX + i * 52, CY - 190, CX + i * 52, CY + 190, { c: hue, w: 1, o: 0.12 });
  for (let i = -3; i <= 3; i++) s += line(CX - 290, CY + i * 52, CX + 290, CY + i * 52, { c: hue, w: 1, o: 0.12 });
  const sat = [[CX - 200, CY - 90], [CX + 200, CY - 90], [CX - 200, CY + 110], [CX + 200, CY + 110]];
  for (const [x, y] of sat) s += line(CX, CY, x, y, { c: C.muted, w: 2, o: 0.4, dash: '6 8' });
  s += glow(CX, CY, 80, hue, 0.25);
  s += hex(CX, CY, 82, { c: hue, w: 3, o: 0.9 });
  s += hex(CX, CY, 58, { c: C.accent, w: 2, o: 0.6, fill: 'none' });
  s += sparkle(CX, CY, 1.6, C.accent);
  // satellites: lock, licence card, instructions doc, checklist
  s += circle(sat[0][0], sat[0][1], 40, { fill: C.surface, c: C.border, w: 2 }) + lock(sat[0][0], sat[0][1] - 4, 1.2);
  s += circle(sat[1][0], sat[1][1], 40, { fill: C.surface, c: C.border, w: 2 }) + rect(sat[1][0] - 22, sat[1][1] - 14, 44, 28, { r: 4, fill: 'none', c: hue, sw: 2.5 }) + line(sat[1][0] - 14, sat[1][1] + 4, sat[1][0] + 4, sat[1][1] + 4, { c: hue, w: 3, o: 0.9 });
  s += circle(sat[2][0], sat[2][1], 40, { fill: C.surface, c: C.border, w: 2 }) + doc(sat[2][0] - 16, sat[2][1] - 21, 32, 42, { lines: 3, o: 0.9, lo: 0.6, hl: 0 });
  s += circle(sat[3][0], sat[3][1], 40, { fill: C.surface, c: C.border, w: 2 });
  for (let i = 0; i < 3; i++) s += check(sat[3][0] - 10, sat[3][1] - 14 + i * 14, 0.5, { w: 2.5 }) + line(sat[3][0] + 2, sat[3][1] - 14 + i * 14, sat[3][0] + 18, sat[3][1] - 14 + i * 14, { w: 2.5, o: 0.6 });
  return s;
}

// Build to be recommended: an AI answer bubble that names you.
export function answerBubble(hue) {
  let s = '';
  s += glow(CX + 20, CY + 10, 120, hue, 0.15);
  s += path(`M ${CX - 200} ${CY - 120} H ${CX + 220} Q ${CX + 250} ${CY - 120} ${CX + 250} ${CY - 90} V ${CY + 80} Q ${CX + 250} ${CY + 110} ${CX + 220} ${CY + 110} H ${CX - 120} L ${CX - 170} ${CY + 160} V ${CY + 110} H ${CX - 200} Q ${CX - 230} ${CY + 110} ${CX - 230} ${CY + 80} V ${CY - 90} Q ${CX - 230} ${CY - 120} ${CX - 200} ${CY - 120} Z`, { c: hue, w: 2.5, o: 0.8, fill: C.surface, fo: 0.95 });
  s += sparkle(CX - 190, CY - 80, 0.75, hue);
  s += line(CX - 150, CY - 78, CX + 150, CY - 78, { c: C.muted, w: 6, o: 0.4 });
  s += line(CX - 190, CY - 40, CX + 190, CY - 40, { c: C.muted, w: 6, o: 0.4 });
  s += rect(CX - 190, CY - 12, 200, 36, { r: 18, fill: C.accent, fo: 0.18, c: C.accent, sw: 2 });
  s += line(CX - 166, CY + 6, CX - 30, CY + 6, { c: C.accent, w: 7, o: 0.95 });
  s += sparkle(CX - 10, CY + 6, 0.5, C.accent);
  s += line(CX + 30, CY + 6, CX + 190, CY + 6, { c: C.muted, w: 6, o: 0.4 });
  s += line(CX - 190, CY + 52, CX + 80, CY + 52, { c: C.muted, w: 6, o: 0.4 });
  return s;
}

// Client-side pagination: an endless list that sags under its own weight
// versus the same data served a page at a time.
export function pagination(hue) {
  let s = '';
  for (let i = 0; i < 16; i++) {
    const y = CY - 170 + i * 22, o = Math.max(0.1, 0.6 - i * 0.03);
    s += rect(CX - 290, y, 210, 14, { r: 7, fill: C.muted, fo: o, c: 'none', sw: 0 });
  }
  // stalled loader over the everything-at-once list
  s += circle(CX - 185, CY, 48, { fill: C.surface, fo: 0.97, c: C.border, w: 2 });
  s += circle(CX - 185, CY, 30, { c: C.muted, w: 6, o: 0.45 });
  s += `<circle cx="${CX - 185}" cy="${CY}" r="30" fill="none" stroke="${C.accent}" stroke-width="6" stroke-linecap="round" stroke-dasharray="52 137" transform="rotate(-60 ${CX - 185} ${CY})"/>`;
  s += path(`M ${CX - 55} ${CY} H ${CX + 10}`, { c: C.accent, w: 3.5, o: 0.9 });
  s += path(`M ${CX} ${CY - 10} L ${CX + 12} ${CY} L ${CX} ${CY + 10}`, { c: C.accent, w: 3.5, o: 0.9 });
  for (let p = 2; p >= 0; p--) {
    const x = CX + 50 + p * 18, y = CY - 130 + p * 14;
    s += rect(x, y, 200, 230, { r: 12, fill: C.surface, fo: 1, c: p === 0 ? hue : C.border, so: p === 0 ? 0.8 : 1, sw: 2 });
  }
  for (let i = 0; i < 6; i++) s += rect(CX + 72, CY - 104 + i * 30, 156, 16, { r: 8, fill: i === 0 ? hue : C.muted, fo: i === 0 ? 0.55 : 0.32, c: 'none', sw: 0 });
  for (let i = 0; i < 4; i++) s += circle(CX + 120 + i * 20, CY + 128, 5, { fill: i === 0 ? C.accent : C.muted, fo: i === 0 ? 1 : 0.5 });
  return s;
}

// Copilot notebooks: one bounded notebook holding the right sources while
// everything else stays outside.
export function notebook(hue) {
  let s = '';
  const spots = [[CX - 300, CY - 170], [CX - 330, CY - 20], [CX - 280, CY + 150], [CX - 120, CY + 200], [CX + 110, CY + 205], [CX + 290, CY + 160], [CX + 330, CY + 10], [CX + 300, CY - 130], [CX - 60, CY - 205], [CX + 60, CY - 200]];
  for (let i = 0; i < spots.length; i++) {
    const [x, y] = spots[i];
    s += i % 2 ? doc(x - 18, y - 22, 36, 44, { o: 0.45, lo: 0.25, lines: 3 }) : envelope(x - 22, y - 15, 44, 30, { o: 0.45 });
  }
  s += glow(CX, CY, 140, hue, 0.15);
  s += rect(CX - 170, CY - 140, 340, 280, { r: 18, fill: C.surface, fo: 0.98, c: C.accent, so: 0.9, sw: 3 });
  for (let i = 0; i < 6; i++) s += circle(CX - 170, CY - 105 + i * 42, 7, { fill: C.bg0, c: C.muted, w: 2.5, o: 0.8 });
  s += doc(CX - 110, CY - 95, 70, 90, { o: 0.9, lo: 0.5, hl: 1 });
  s += doc(CX - 20, CY - 95, 70, 90, { o: 0.9, lo: 0.5 });
  s += doc(CX + 70, CY - 95, 70, 90, { o: 0.9, lo: 0.5, hl: 2 });
  s += line(CX - 110, CY + 40, CX + 140, CY + 40, { c: hue, w: 6, o: 0.5 });
  s += line(CX - 110, CY + 68, CX + 80, CY + 68, { c: hue, w: 6, o: 0.35 });
  s += sparkle(CX + 196, CY - 164, 1.1, C.accent);
  return s;
}

// Readiness vs adoption: a finished checklist on one side, the people curve
// that has to happen afterwards on the other.
export function readinessAdoption(hue) {
  let s = '';
  s += rect(CX - 300, CY - 120, 180, 220, { r: 14, fill: C.surface, c: C.border, sw: 2 });
  for (let i = 0; i < 4; i++) {
    const y = CY - 80 + i * 46;
    s += rect(CX - 276, y - 12, 24, 24, { r: 6, fill: 'none', c: C.muted, sw: 2, so: 0.7 });
    s += check(CX - 264, y, 0.7, { w: 3.5 });
    s += line(CX - 240, y, CX - 150, y, { c: C.muted, w: 5, o: 0.4 });
  }
  s += line(CX - 80, CY + 140, CX + 290, CY + 140, { c: C.muted, w: 2, o: 0.35 });
  s += line(CX - 80, CY + 140, CX - 80, CY - 150, { c: C.muted, w: 2, o: 0.35 });
  const d = `M ${CX - 70} ${CY + 125} C ${CX + 60} ${CY + 120} ${CX + 80} ${CY - 120} ${CX + 280} ${CY - 130}`;
  s += path(d, { c: hue, w: 4, o: 0.85 });
  const people = [[CX - 30, CY + 112], [CX + 40, CY + 70], [CX + 85, CY], [CX + 135, CY - 70], [CX + 210, CY - 112]];
  people.forEach(([x, y], i) => {
    s += circle(x, y - 26, 20, { fill: C.surface, c: i >= 3 ? C.accent : C.border, w: 2 });
    s += person(x, y - 24, 0.6, { c: i >= 3 ? C.accent : C.muted, o: 0.95 });
  });
  return s;
}

// One dashboard instead of six tools.
export function sixToOne(hue) {
  let s = '';
  const tiles = [[CX - 290, CY - 150], [CX - 300, CY - 10], [CX - 270, CY + 130], [CX + 290, CY - 150], [CX + 300, CY - 10], [CX + 270, CY + 130]];
  for (const [x, y] of tiles) {
    s += line(x, y, CX + (x < CX ? -110 : 110), CY + (y - CY) * 0.3, { c: C.muted, w: 2, o: 0.3, dash: '5 8' });
    s += rect(x - 30, y - 22, 60, 44, { r: 8, fill: C.surface2, c: C.border, sw: 1.5 });
    s += line(x - 16, y - 4, x + 16, y - 4, { c: C.muted, w: 4, o: 0.3 }) + line(x - 16, y + 8, x + 6, y + 8, { c: C.muted, w: 4, o: 0.2 });
  }
  s += glow(CX, CY, 140, hue, 0.18);
  s += rect(CX - 160, CY - 120, 320, 240, { r: 16, fill: C.surface, c: hue, so: 0.8, sw: 2.5 });
  // four abstract widgets: ring, bars, line, list
  s += circle(CX - 85, CY - 50, 34, { c: C.border, w: 10 }) + `<circle cx="${CX - 85}" cy="${CY - 50}" r="34" fill="none" stroke="${C.accent}" stroke-width="10" stroke-dasharray="150 214" transform="rotate(-90 ${CX - 85} ${CY - 50})"/>`;
  [30, 50, 38, 62].forEach((h, i) => (s += rect(CX + 20 + i * 26, CY - 20 - h, 16, h, { r: 3, fill: hue, fo: 0.6, c: 'none', sw: 0 })));
  s += path(`M ${CX - 130} ${CY + 80} L ${CX - 95} ${CY + 55} L ${CX - 60} ${CY + 70} L ${CX - 25} ${CY + 35}`, { c: hue, w: 3, o: 0.9 });
  for (let i = 0; i < 3; i++) s += line(CX + 20, CY + 35 + i * 22, CX + 130, CY + 35 + i * 22, { c: i === 0 ? C.accent : C.muted, w: 6, o: i === 0 ? 0.85 : 0.35 });
  return s;
}

// Good Chefs Saute Evenly: four ingredients spread evenly in one pan.
export function chefPan(hue) {
  let s = '';
  // steam
  for (const dx of [-60, 0, 60]) s += path(`M ${CX + dx} ${CY - 108} C ${CX + dx - 16} ${CY - 124} ${CX + dx + 16} ${CY - 140} ${CX + dx} ${CY - 158}`, { c: C.muted, w: 3, o: 0.4 });
  s += glow(CX - 20, CY + 20, 150, C.accent, 0.14);
  s += `<ellipse cx="${CX - 20}" cy="${CY + 20}" rx="190" ry="120" fill="${C.surface}" stroke="${C.muted}" stroke-width="5" stroke-opacity="0.8"/>`;
  s += `<ellipse cx="${CX - 20}" cy="${CY + 20}" rx="160" ry="96" fill="${C.surface2}" stroke="${C.border}" stroke-width="2"/>`;
  s += rect(CX + 166, CY + 6, 150, 26, { r: 13, fill: C.surface, c: C.muted, so: 0.8, sw: 3 });
  // four ingredients: goal, context, source, expectation
  const cols = [C.accent, hue, HUE.strategy, HUE.commerce];
  const pos = [[-90, -20], [40, -30], [-60, 60], [70, 55]];
  pos.forEach(([dx, dy], i) => {
    const x = CX - 20 + dx, y = CY + 20 + dy;
    s += glow(x, y, 26, cols[i], 0.35) + circle(x, y, 22, { fill: cols[i], fo: 0.9 });
    s += circle(x - 7, y - 7, 5, { fill: '#fff', fo: 0.35 });
  });
  return s;
}

// SASSI logistics build story: parcels move along a route from chat threads
// to a cloud platform.
export function logisticsRoute(hue) {
  let s = '';
  const Y = 30; // sits slightly low so it centres in the 12:5 banner crop
  // where it started: a pile of chat threads
  const bubble = (x, y, w, o) => path(`M ${x} ${y} H ${x + w} Q ${x + w + 14} ${y} ${x + w + 14} ${y + 14} V ${y + 22} Q ${x + w + 14} ${y + 36} ${x + w} ${y + 36} H ${x + 22} L ${x + 6} ${y + 48} V ${y + 36} Q ${x - 14} ${y + 36} ${x - 14} ${y + 22} V ${y + 14} Q ${x - 14} ${y} ${x} ${y} Z`, { c: C.muted, w: 2, o, fill: C.surface, fo: 0.9 });
  s += bubble(CX - 300, CY - 150, 80, 0.45) + bubble(CX - 260, CY - 96, 96, 0.6) + bubble(CX - 310, CY - 42, 60, 0.4);
  const d = `M ${CX - 200} ${CY + 40} C ${CX - 120} ${CY + 150} ${CX + 20} ${CY - 60} ${CX + 120} ${CY + 30} S ${CX + 230} ${CY + 10} ${CX + 250} ${CY - 50}`;
  s += path(d, { c: hue, w: 3, o: 0.6, dash: '10 10' });
  const box = (x, y, sz, lit) => g(
    path(`M ${-sz} ${-sz * 0.5} L 0 ${-sz} L ${sz} ${-sz * 0.5} L ${sz} ${sz * 0.6} L 0 ${sz * 1.1} L ${-sz} ${sz * 0.6} Z`, { c: lit ? C.accent : C.muted, w: 2.5, o: 0.9, fill: C.surface, fo: 1 }) +
      path(`M ${-sz} ${-sz * 0.5} L 0 0 L ${sz} ${-sz * 0.5} M 0 0 V ${sz * 1.1}`, { c: lit ? C.accent : C.muted, w: 2.5, o: 0.7 }),
    { t: `translate(${x} ${y})` },
  );
  s += box(CX - 190, CY + 66, 26, false) + box(CX - 40, CY + 44, 30, false) + box(CX + 112, CY + 26, 34, true);
  s += cloud(CX + 250, CY - 110, 0.95, { c: hue, o: 0.9 });
  s += dot(CX + 250, CY - 104, 8);
  return g(s, { t: `translate(0 ${Y})` });
}

// RBAC: roles are looked up in the database at request time, not frozen in
// a token.
export function rbac(hue) {
  let s = '';
  // stale token, crossed out
  s += rect(CX - 300, CY - 150, 150, 70, { r: 10, fill: C.surface2, c: C.border, sw: 1.5 });
  for (let i = 0; i < 3; i++) s += line(CX - 285, CY - 130 + i * 15, CX - 175 - i * 15, CY - 130 + i * 15, { c: C.muted, w: 4, o: 0.25 });
  s += line(CX - 300, CY - 80, CX - 150, CY - 150, { c: C.accent, w: 3, o: 0.6 });
  s += cylinder(CX, CY + 10, 150, 190, { accentBand: C.accent, c: hue });
  s += lock(CX, CY + 40, 1.4);
  const roles = [[CX - 250, CY + 70], [CX + 250, CY - 80], [CX + 250, CY + 100]];
  roles.forEach(([x, y], i) => {
    s += curve(x + (x < CX ? 70 : -70), y, CX + (x < CX ? -76 : 76), CY + 10, { c: hue, w: 2.5, o: 0.55 });
    s += rect(x - 70, y - 26, 140, 52, { r: 26, fill: C.surface, c: i === 1 ? C.accent : C.border, sw: 2 });
    s += person(x - 38, y + 4, 0.75, { c: i === 1 ? C.accent : C.muted });
    s += line(x - 10, y - 4, x + 44, y - 4, { c: C.muted, w: 5, o: 0.45 }) + line(x - 10, y + 10, x + 24, y + 10, { c: C.muted, w: 5, o: 0.25 });
  });
  s += key(CX + 60, CY - 120, 1.3, { c: C.accent });
  return s;
}

// Microsoft 365 gaps: identity, devices and licensing under one shield, with
// three quiet warnings.
export function m365Gaps(hue) {
  let s = '';
  // tenant settings panel: three sliders, one of them left at the default
  s += glow(CX - 170, CY, 110, hue, 0.22);
  s += rect(CX - 260, CY - 110, 180, 220, { r: 22, fill: C.surface, c: hue, so: 0.85, sw: 3 });
  [[-0.5, false], [0.3, true], [-0.1, false]].forEach(([v, off], j) => {
    const x = CX - 215 + j * 45;
    s += line(x, CY - 75, x, CY + 75, { c: C.muted, w: 5, o: 0.4 });
    s += circle(x, CY + v * 75, 13, { fill: off ? C.accent : C.bg0, c: off ? C.accent : hue, w: 3 });
  });
  // three quiet configuration gaps: identity, devices, licensing
  for (let i = 0; i < 3; i++) {
    const y = CY - 110 + i * 100;
    s += line(CX - 60, CY - 8 + (y - CY) * 0.4, CX + 10, y, { c: C.muted, w: 2, o: 0.4, dash: '5 8' });
    s += rect(CX + 10, y - 34, 270, 68, { r: 14, fill: C.surface, c: C.border, sw: 2 });
    const ix = CX + 52;
    if (i === 0) s += person(ix, y + 4, 1, { c: C.text, o: 0.85 });
    if (i === 1) s += rect(ix - 22, y - 15, 44, 28, { r: 4, fill: 'none', c: C.text, so: 0.85, sw: 2.5 }) + line(ix - 28, y + 18, ix + 28, y + 18, { c: C.text, w: 3, o: 0.85 });
    if (i === 2) s += rect(ix - 22, y - 15, 44, 30, { r: 5, fill: 'none', c: C.text, so: 0.85, sw: 2.5 }) + line(ix - 12, y + 4, ix + 6, y + 4, { c: C.text, w: 3, o: 0.85 });
    s += line(CX + 96, y - 8, CX + 210, y - 8, { c: C.muted, w: 6, o: 0.45 }) + line(CX + 96, y + 12, CX + 170, y + 12, { c: C.muted, w: 6, o: 0.3 });
    s += dot(CX + 250, y, 8);
  }
  return s;
}

// Emails that sound like you: a sent-folder stack trains one voice line.
export function voiceEmail(hue) {
  let s = '';
  for (let i = 3; i >= 1; i--) s += envelope(CX - 250 + i * 18, CY - 120 + i * 22, 170, 110, { o: 0.25 + 0.1 * (3 - i) });
  s += envelope(CX - 250, CY - 120, 170, 110, { o: 0.9, c: hue });
  // voice waveform leading out of the stack
  let d = `M ${CX} ${CY + 30}`;
  for (let i = 0; i < 19; i++) {
    const x = CX + i * 14, a = 14 + 26 * Math.sin(i * 0.55) * Math.sin(i * 0.17 + 0.6);
    d += ` L ${x} ${CY + 30 - a} L ${x + 7} ${CY + 30 + a}`;
  }
  s += path(d, { c: C.accent, w: 3.5, o: 0.9 });
  s += glow(CX + 270, CY + 30, 30, C.accent, 0.35);
  s += envelope(CX + 220, CY + 120, 120, 80, { o: 0.95, c: C.accent });
  s += path(`M ${CX + 280} ${CY + 70} V ${CY + 110}`, { c: C.accent, w: 3, o: 0.7, dash: '3 6' });
  return s;
}

// Vague prompts fail quietly: a prompt goes in, the signal fades to flat,
// and nothing warns you.
export function quietFail(hue) {
  let s = '';
  // a short, vague prompt
  s += rect(CX - 150, CY - 190, 300, 50, { r: 25, fill: C.surface, c: hue, so: 0.7, sw: 2 });
  s += sparkle(CX - 120, CY - 165, 0.65, hue);
  s += line(CX - 92, CY - 165, CX - 20, CY - 165, { c: C.muted, w: 6, o: 0.45 });
  s += line(CX - 6, CY - 178, CX - 6, CY - 152, { c: C.accent, w: 3, o: 1 });
  // three possible sources; it quietly picks the wrong one
  const src = [[CX - 230, CY - 40], [CX - 40, CY - 40], [CX + 150, CY - 40]];
  src.forEach(([x, y], i) => {
    const wrong = i === 0, right = i === 2;
    s += line(CX, CY - 140, x + 40, y, { c: wrong ? C.accent : C.muted, w: wrong ? 3 : 2, o: wrong ? 0.8 : 0.3, dash: wrong ? '' : '4 8' });
    s += doc(x, y, 80, 100, { o: right ? 0.9 : 0.6, lo: right ? 0.5 : 0.3, c: right ? hue : C.muted, hl: right ? 1 : -1 });
  });
  // a confident answer built on it
  s += line(CX - 190, CY + 64, CX - 120, CY + 110, { c: C.accent, w: 3, o: 0.8 });
  s += rect(CX - 160, CY + 110, 320, 76, { r: 14, fill: C.surface, c: C.border, sw: 2 });
  s += line(CX - 132, CY + 136, CX + 110, CY + 136, { c: C.text, w: 6, o: 0.55 }) + line(CX - 132, CY + 160, CX + 50, CY + 160, { c: C.muted, w: 6, o: 0.4 });
  s += circle(CX + 132, CY + 110, 15, { fill: C.bg0, c: C.muted, w: 2, o: 0.6 }) + check(CX + 132, CY + 110, 0.55, { c: C.muted, w: 3 });
  return s;
}

// What drives adoption: a crowd where use spreads person to person.
export function adoptionCrowd(hue) {
  let s = '';
  const cols = 15, rows = 7, sx = 38, sy = 44;
  const ox = CX - ((cols - 1) * sx) / 2, oy = CY - ((rows - 1) * sy) / 2;
  const fx = CX - 80, fy = CY - 10;
  for (const rr of [70, 140, 210]) s += circle(fx, fy, rr, { c: C.accent, w: 1.5, o: 0.25 - rr / 1400 });
  for (let r = 0; r < rows; r++) for (let c2 = 0; c2 < cols; c2++) {
    const x = ox + c2 * sx, y = oy + r * sy, d = Math.hypot(x - fx, y - fy);
    const lit = d < 75, warm = d < 150;
    s += person(x, y, 0.62, { c: lit ? C.accent : warm ? hue : C.muted, o: lit ? 1 : warm ? 0.85 : 0.42 });
  }
  s += glow(fx, fy, 40, C.accent, 0.3);
  return s;
}

/* ----------------------------------------------------------- case studies */

// Enterprise Apps Masterview: one hub with the operational feeds orbiting it.
export function opsHub(hue, cx = CX, cy = CY, k = 1) {
  let s = '';
  s += circle(cx, cy, 150 * k, { c: hue, w: 1.5, o: 0.3, dash: '4 8' }) + circle(cx, cy, 230 * k, { c: C.muted, w: 1, o: 0.18 });
  const feeds = [[-150, 0], [106, -106], [106, 106], [-80, -212], [210, 40], [-120, 196]];
  feeds.forEach(([dx, dy], i) => {
    const x = cx + dx * k, y = cy + dy * k;
    s += line(cx, cy, x, y, { c: hue, w: 1.5, o: 0.3 });
    s += circle(x, y, 26 * k, { fill: C.surface, c: i === 1 ? C.accent : C.border, w: 2 });
    s += circle(x, y, 6 * k, { fill: i === 1 ? C.accent : hue, fo: 0.9 });
  });
  s += glow(cx, cy, 90 * k, hue, 0.25);
  s += rect(cx - 70 * k, cy - 56 * k, 140 * k, 112 * k, { r: 14, fill: C.surface, c: hue, so: 0.9, sw: 2.5 });
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) s += rect(cx - 54 * k + j * 58 * k, cy - 40 * k + i * 44 * k, 50 * k, 36 * k, { r: 6, fill: i + j === 0 ? C.accent : hue, fo: i + j === 0 ? 0.75 : 0.25, c: 'none', sw: 0 });
  return s;
}

// 3ST EMR: a clinical pulse line through a medical cross, secured.
export function clinicalPulse(hue, cx = CX, cy = CY, k = 1, span = 300) {
  let s = '';
  let d = `M ${cx - span * k} ${cy}`;
  const beat = (x0) => ` L ${x0} ${cy} L ${x0 + 14 * k} ${cy - 18 * k} L ${x0 + 26 * k} ${cy + 10 * k} L ${x0 + 40 * k} ${cy - 90 * k} L ${x0 + 56 * k} ${cy + 60 * k} L ${x0 + 70 * k} ${cy} `;
  d += beat(cx - 240 * k) + beat(cx + 150 * k) + ` L ${cx + span * k} ${cy}`;
  s += path(d, { c: hue, w: 3.5, o: 0.8 });
  s += glow(cx, cy, 90 * k, hue, 0.22);
  s += rect(cx - 74 * k, cy - 74 * k, 148 * k, 148 * k, { r: 28, fill: C.surface, c: hue, so: 0.9, sw: 3 });
  s += path(`M ${cx - 16 * k} ${cy - 46 * k} H ${cx + 16 * k} V ${cy - 16 * k} H ${cx + 46 * k} V ${cy + 16 * k} H ${cx + 16 * k} V ${cy + 46 * k} H ${cx - 16 * k} V ${cy + 16 * k} H ${cx - 46 * k} V ${cy - 16 * k} H ${cx - 16 * k} Z`, { c: C.accent, w: 3, o: 1, fill: C.accent, fo: 0.18 });
  s += shield(cx + 92 * k, cy - 78 * k, 0.45 * k, { c: C.accent, w: 3 });
  return s;
}

// Qualitech: seven separate spreadsheets routed through workflows into one
// central database.
export function sevenToOne(hue, cx = CX, cy = CY, k = 1) {
  let s = '';
  for (let i = 0; i < 7; i++) {
    const x = cx - 250 * k, y = cy + (i - 3) * 44 * k;
    s += rect(x - 30 * k, y - 15 * k, 60 * k, 30 * k, { r: 6, fill: C.surface, c: C.muted, so: 0.5, sw: 1.5 });
    s += line(x - 18 * k, y, x + 16 * k, y, { c: C.muted, w: 4, o: 0.45 });
    s += curve(x + 32 * k, y, cx - 60 * k, cy, { c: hue, w: 2, o: 0.4 });
  }
  s += rect(cx - 60 * k, cy - 34 * k, 68 * k, 68 * k, { r: 14, fill: C.accent, fo: 0.9, c: 'none', sw: 0 });
  s += sparkle(cx - 26 * k, cy, 0.9 * k, '#fff');
  s += curve(cx + 10 * k, cy, cx + 70 * k, cy - 50 * k, { c: hue, w: 2.5, o: 0.7 }) + curve(cx + 10 * k, cy, cx + 70 * k, cy + 50 * k, { c: hue, w: 2.5, o: 0.7 });
  s += rect(cx + 70 * k, cy - 70 * k, 52 * k, 40 * k, { r: 10, fill: C.surface, c: hue, sw: 2 }) + rect(cx + 70 * k, cy + 30 * k, 52 * k, 40 * k, { r: 10, fill: C.surface, c: hue, sw: 2 });
  s += curve(cx + 122 * k, cy - 50 * k, cx + 190 * k, cy, { c: hue, w: 2.5, o: 0.7 }) + curve(cx + 122 * k, cy + 50 * k, cx + 190 * k, cy, { c: hue, w: 2.5, o: 0.7 });
  s += cylinder(cx + 250 * k, cy, 120 * k, 150 * k, { accentBand: C.accent, c: hue });
  return s;
}

// Wiman: one identity, many managed devices, all under policy.
export function identityDevices(hue, cx = CX, cy = CY, k = 1) {
  let s = '';
  s += glow(cx, cy, 90 * k, hue, 0.22);
  s += circle(cx, cy, 70 * k, { fill: C.surface, c: hue, w: 3 });
  s += person(cx, cy + 6 * k, 2 * k, { c: C.text, o: 0.9 });
  s += lock(cx + 50 * k, cy + 50 * k, 0.9 * k);
  const dev = [[-230, -90, 'laptop'], [230, -90, 'desktop'], [-210, 120, 'phone'], [210, 120, 'laptop']];
  for (const [dx, dy, t] of dev) {
    const x = cx + dx * k, y = cy + dy * k;
    s += line(cx + dx * 0.33 * k, cy + dy * 0.33 * k, x - dx * 0.25 * k, y - dy * 0.25 * k, { c: C.muted, w: 2, o: 0.55, dash: '5 8' });
    if (t === 'laptop') s += rect(x - 46 * k, y - 30 * k, 92 * k, 58 * k, { r: 6, fill: C.surface, c: C.muted, so: 0.75, sw: 2.5 }) + line(x - 60 * k, y + 34 * k, x + 60 * k, y + 34 * k, { c: C.muted, w: 4, o: 0.7 });
    if (t === 'desktop') s += rect(x - 50 * k, y - 36 * k, 100 * k, 66 * k, { r: 6, fill: C.surface, c: C.muted, so: 0.75, sw: 2.5 }) + line(x, y + 30 * k, x, y + 46 * k, { c: C.muted, w: 4, o: 0.7 }) + line(x - 24 * k, y + 46 * k, x + 24 * k, y + 46 * k, { c: C.muted, w: 4, o: 0.7 });
    if (t === 'phone') s += rect(x - 22 * k, y - 40 * k, 44 * k, 80 * k, { r: 8, fill: C.surface, c: C.muted, so: 0.75, sw: 2.5 });
    s += circle(x + 30 * k, y - 30 * k, 11 * k, { fill: C.bg0, c: hue, w: 2 }) + check(x + 30 * k, y - 30 * k, 0.45 * k, { c: hue, w: 2.5 });
  }
  return s;
}

// The Jimny Shop: off-road terrain contours and a shopping bag.
export function trailShop(hue, cx = CX, cy = CY, k = 1) {
  let s = '';
  for (let i = 5; i >= 0; i--) {
    const y = cy + 40 * k + i * 26 * k;
    let d = '';
    for (let x = -640; x <= 640; x += 20) {
      const yy = y - Math.max(0, 64 - i * 9) * k * (0.5 + 0.5 * Math.sin((x + i * 50) / 70)) ;
      d += `${d ? ' L' : 'M'} ${cx + x * k} ${yy}`;
    }
    s += path(d, { c: i === 0 ? hue : C.muted, w: i === 0 ? 3 : 1.5, o: i === 0 ? 0.85 : 0.32 - i * 0.04 });
  }
  // tyre, resting on the trail line
  const tx = cx - 170 * k, ty = cy - 46 * k;
  s += circle(tx, ty, 56 * k, { fill: C.surface, c: C.muted, w: 10 * k, o: 0.85 }) + circle(tx, ty, 24 * k, { c: hue, w: 4, o: 0.85 });
  for (let a = 0; a < 12; a++) {
    const t = (a / 12) * Math.PI * 2;
    s += line(tx + Math.cos(t) * 50 * k, ty + Math.sin(t) * 50 * k, tx + Math.cos(t) * 64 * k, ty + Math.sin(t) * 64 * k, { c: C.muted, w: 6, o: 0.7 });
  }
  // shopping bag
  s += glow(cx + 120 * k, cy - 50 * k, 70 * k, C.accent, 0.2);
  s += path(`M ${cx + 60 * k} ${cy - 90 * k} H ${cx + 180 * k} L ${cx + 192 * k} ${cy + 30 * k} H ${cx + 48 * k} Z`, { c: C.accent, w: 3, o: 1, fill: C.surface, fo: 1 });
  s += path(`M ${cx + 92 * k} ${cy - 90 * k} V ${cy - 106 * k} C ${cx + 92 * k} ${cy - 140 * k} ${cx + 148 * k} ${cy - 140 * k} ${cx + 148 * k} ${cy - 106 * k} V ${cy - 90 * k}`, { c: C.accent, w: 3, o: 1 });
  s += check(cx + 120 * k, cy - 34 * k, 1.1 * k, { c: C.accent, w: 4 });
  return s;
}

// This portfolio: a cloud-hosted static site, edge nodes, and arcs (ARC).
export function portfolioCloud(hue, cx = CX, cy = CY, k = 1) {
  let s = '';
  const base = cy + 190 * k;
  for (const r of [200, 260, 320]) s += path(`M ${cx - r * k} ${base} A ${r * k} ${r * k * 0.62} 0 0 1 ${cx + r * k} ${base}`, { c: r === 260 ? C.accent : hue, w: r === 260 ? 3 : 1.5, o: r === 260 ? 0.6 : 0.3 });
  s += glow(cx, cy - 10 * k, 90 * k, hue, 0.2);
  s += cloud(cx, cy - 10 * k, 1.1 * k, { c: hue, o: 0.9, fo: 0.95 });
  s += doc(cx - 34 * k, cy - 50 * k, 68 * k, 84 * k, { lines: 4, o: 0.95, lo: 0.5, hl: 0 });
  for (const [dx, col] of [[-260, C.accent], [260, C.accent], [-200, hue], [200, hue]]) {
    const r = Math.abs(dx) === 260 ? 260 : 200;
    const ang = Math.acos(Math.max(-1, Math.min(1, dx / r * 0.92)));
    s += dot(cx + r * k * Math.cos(ang), base - r * k * 0.62 * Math.sin(ang), 6, col, 2);
  }
  return s;
}

// Automations catalogue: a workflow graph, trigger to outcome.
export function workflowGraph(hue, cx = CX, cy = CY, k = 1) {
  let s = '';
  const N = [
    { x: -260, y: 0, lit: true },
    { x: -110, y: -90 }, { x: -110, y: 70 },
    { x: 40, y: -120 }, { x: 40, y: 0 }, { x: 40, y: 120 },
    { x: 190, y: -50 }, { x: 190, y: 90 },
    { x: 300, y: 20, end: true },
  ];
  const E = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5], [3, 6], [4, 6], [5, 7], [6, 8], [7, 8]];
  for (const [a, b] of E) s += curve(cx + (N[a].x + 34) * k, cy + N[a].y * k, cx + (N[b].x - 34) * k, cy + N[b].y * k, { c: hue, w: 2.5, o: 0.5 });
  N.forEach((n, i) => {
    const x = cx + n.x * k, y = cy + n.y * k;
    if (n.lit) s += glow(x, y, 46 * k, C.accent, 0.4);
    s += rect(x - 34 * k, y - 28 * k, 68 * k, 56 * k, { r: 14, fill: n.lit ? C.accent : C.surface, fo: n.lit ? 0.95 : 1, c: n.lit ? C.accent : n.end ? hue : C.border, sw: 2 });
    if (n.lit) s += path(`M ${x - 4 * k} ${y - 14 * k} L ${x - 12 * k} ${y + 3 * k} H ${x + 2 * k} L ${x - 2 * k} ${y + 16 * k} L ${x + 12 * k} ${y - 4 * k} H ${x - 2 * k} Z`, { c: '#fff', w: 2, o: 1, fill: '#fff', fo: 1 });
    else if (n.end) s += check(x, y, 0.9 * k, { c: hue, w: 4 });
    else s += line(x - 16 * k, y - 6 * k, x + 16 * k, y - 6 * k, { c: C.muted, w: 4, o: 0.5 }) + line(x - 16 * k, y + 8 * k, x + 6 * k, y + 8 * k, { c: C.muted, w: 4, o: 0.3 });
  });
  return s;
}
