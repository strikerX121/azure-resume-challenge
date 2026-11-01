// Cover-art building blocks for scripts/generate-covers.mjs.
//
// Every cover on the site is drawn here as plain SVG and rasterised by sharp,
// so there is no stock-photo licence to track and every image shares one
// visual language: the site's navy surfaces, the brand orange as the single
// highlight, and one secondary hue per topic area. The art is deliberately
// abstract. Nothing here imitates a product UI or a client's data; a cover is
// a motif for the subject, never a screenshot of it.
//
// No text is rendered. Titles already sit next to every cover on the page,
// and font fallback inside the rasteriser would make lettering inconsistent.

export const C = {
  bg0: '#0F1624',
  bg1: '#141E33',
  surface: '#1C2840',
  surface2: '#161F35',
  border: '#3D4F78',
  text: '#E2E8F8',
  muted: '#8FA4C8',
  accent: '#FF6B2B',
};

// One secondary hue per topic, used for glows and secondary strokes only.
export const HUE = {
  cloud: '#4EA8FF',
  ai: '#A78BFA',
  strategy: '#2DD4BF',
  engineering: '#34D399',
  m365: '#38BDF8',
  health: '#34D399',
  commerce: '#FBBF24',
};

/* ------------------------------------------------------------ utilities */

// Deterministic PRNG so a re-run produces byte-identical art.
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

const f = (n) => Math.round(n * 10) / 10;

export function line(x1, y1, x2, y2, { c = C.muted, w = 2, o = 0.5, dash = '' } = {}) {
  return `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c}" stroke-width="${w}" stroke-opacity="${o}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
}

export function path(d, { c = C.muted, w = 2, o = 0.6, fill = 'none', fo = 1, dash = '', join = 'round' } = {}) {
  return `<path d="${d}" stroke="${c}" stroke-width="${w}" stroke-opacity="${o}" fill="${fill}" fill-opacity="${fo}" stroke-linecap="round" stroke-linejoin="${join}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
}

export function rect(x, y, w, h, { r = 10, fill = C.surface, fo = 0.9, c = C.border, sw = 1.5, so = 1, dash = '' } = {}) {
  return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${r}" fill="${fill}" fill-opacity="${fo}" stroke="${c}" stroke-width="${sw}" stroke-opacity="${so}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
}

export function circle(cx, cy, r, { fill = 'none', fo = 1, c = 'none', w = 2, o = 1, dash = '' } = {}) {
  return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}" fill-opacity="${fo}" stroke="${c}" stroke-width="${w}" stroke-opacity="${o}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
}

export function g(content, { t = '', o = 1 } = {}) {
  return `<g${t ? ` transform="${t}"` : ''}${o !== 1 ? ` opacity="${o}"` : ''}>${content}</g>`;
}

// Soft halo behind a highlighted element.
export function glow(cx, cy, r, color = C.accent, o = 0.55) {
  return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${color}" fill-opacity="${o}" filter="url(#blur)"/>`;
}

export function dot(cx, cy, r, color = C.accent, haloScale = 2.4) {
  return glow(cx, cy, r * haloScale, color, 0.45) + circle(cx, cy, r, { fill: color });
}

/* ---------------------------------------------------------------- glyphs */

// Cloud outline, roughly 220 x 120 at s = 1, centred on (cx, cy).
export function cloud(cx, cy, s = 1, { c = C.muted, w = 3, o = 0.8, fill = C.surface, fo = 0.6 } = {}) {
  const d = 'M -88 46 H 86 C 120 46 128 -4 96 -16 C 98 -54 56 -72 30 -54 C 14 -86 -46 -84 -54 -38 C -92 -40 -112 6 -88 46 Z';
  return g(path(d, { c, w: w / s, o, fill, fo }), { t: `translate(${f(cx)} ${f(cy)}) scale(${s})` });
}

// Database cylinder, w x h, centred on (cx, cy).
export function cylinder(cx, cy, w, h, { c = C.muted, o = 0.85, fill = C.surface, accentBand = null } = {}) {
  const rx = w / 2, ry = w * 0.16, top = cy - h / 2, bot = cy + h / 2, l = cx - rx, r = cx + rx;
  let s = path(`M ${l} ${top} V ${bot} A ${rx} ${ry} 0 0 0 ${r} ${bot} V ${top}`, { c, w: 2.5, o, fill, fo: 0.95 });
  for (const k of [1 / 3, 2 / 3]) {
    const y = top + h * k;
    s += path(`M ${l} ${y} A ${rx} ${ry} 0 0 0 ${r} ${y}`, { c: accentBand && k === 1 / 3 ? accentBand : c, w: 2.5, o: accentBand && k === 1 / 3 ? 1 : o * 0.7 });
  }
  s += `<ellipse cx="${f(cx)}" cy="${f(top)}" rx="${f(rx)}" ry="${f(ry)}" fill="${C.surface}" stroke="${c}" stroke-width="2.5" stroke-opacity="${o}"/>`;
  return s;
}

// Generic document with a folded corner and placeholder lines (no text).
export function doc(x, y, w, h, { c = C.muted, o = 0.7, fill = C.surface, lines = 4, lineC = C.muted, lo = 0.35, hl = -1 } = {}) {
  const fold = Math.min(w, h) * 0.22;
  let s = path(`M ${x} ${y} H ${x + w - fold} L ${x + w} ${y + fold} V ${y + h} H ${x} Z`, { c, w: 2, o, fill, fo: 0.95 });
  s += path(`M ${x + w - fold} ${y} V ${y + fold} H ${x + w}`, { c, w: 2, o: o * 0.8 });
  const pad = w * 0.16;
  for (let i = 0; i < lines; i++) {
    const ly = y + fold + 10 + i * ((h - fold - 20) / Math.max(lines, 1));
    const lw = (w - pad * 2) * (i % 3 === 2 ? 0.6 : 1);
    s += line(x + pad, ly, x + pad + lw, ly, { c: i === hl ? C.accent : lineC, w: 4, o: i === hl ? 0.95 : lo });
  }
  return s;
}

export function envelope(x, y, w, h, { c = C.muted, o = 0.75, fill = C.surface } = {}) {
  return rect(x, y, w, h, { r: 8, fill, c, so: o, sw: 2.5 }) + path(`M ${x + 6} ${y + 8} L ${x + w / 2} ${y + h * 0.55} L ${x + w - 6} ${y + 8}`, { c, w: 2.5, o });
}

export function shield(cx, cy, s = 1, { c = C.accent, w = 3, o = 1, fill = C.surface, fo = 0.9 } = {}) {
  const d = 'M 0 -62 L 52 -42 V 4 C 52 40 28 62 0 74 C -28 62 -52 40 -52 4 V -42 Z';
  return g(path(d, { c, w: w / s, o, fill, fo }), { t: `translate(${f(cx)} ${f(cy)}) scale(${s})` });
}

export function person(cx, cy, s = 1, { c = C.muted, o = 0.8, fill = 'none' } = {}) {
  return g(
    circle(0, -14, 9, { c, w: 2.5 / s, o, fill, fo: 1 }) +
      path('M -16 16 C -16 2 -8 -2 0 -2 C 8 -2 16 2 16 16', { c, w: 2.5 / s, o }),
    { t: `translate(${f(cx)} ${f(cy)}) scale(${s})` },
  );
}

export function check(cx, cy, s = 1, { c = C.accent, w = 4, o = 1 } = {}) {
  return path(`M ${cx - 12 * s} ${cy} L ${cx - 3 * s} ${cy + 9 * s} L ${cx + 13 * s} ${cy - 9 * s}`, { c, w, o });
}

export function sparkle(cx, cy, s = 1, color = C.accent, o = 1) {
  const d = `M ${cx} ${cy - 18 * s} C ${cx + 2 * s} ${cy - 4 * s} ${cx + 4 * s} ${cy - 2 * s} ${cx + 18 * s} ${cy} C ${cx + 4 * s} ${cy + 2 * s} ${cx + 2 * s} ${cy + 4 * s} ${cx} ${cy + 18 * s} C ${cx - 2 * s} ${cy + 4 * s} ${cx - 4 * s} ${cy + 2 * s} ${cx - 18 * s} ${cy} C ${cx - 4 * s} ${cy - 2 * s} ${cx - 2 * s} ${cy - 4 * s} ${cx} ${cy - 18 * s} Z`;
  return `<path d="${d}" fill="${color}" fill-opacity="${o}"/>`;
}

export function hex(cx, cy, r, { c = C.muted, w = 2.5, o = 0.8, fill = C.surface, fo = 0.9 } = {}) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    pts.push(`${f(cx + r * Math.cos(a))} ${f(cy + r * Math.sin(a))}`);
  }
  return path(`M ${pts.join(' L ')} Z`, { c, w, o, fill, fo });
}

export function lock(cx, cy, s = 1, { c = C.accent, o = 1 } = {}) {
  return g(
    rect(-14, -2, 28, 22, { r: 4, fill: C.surface, c, sw: 2.5 / s, so: o }) +
      path('M -8 -2 V -10 C -8 -20 8 -20 8 -10 V -2', { c, w: 2.5 / s, o }) +
      circle(0, 9, 2.6, { fill: c }),
    { t: `translate(${f(cx)} ${f(cy)}) scale(${s})` },
  );
}

export function key(cx, cy, s = 1, { c = C.accent, o = 1 } = {}) {
  return g(
    circle(-16, 0, 10, { c, w: 3 / s, o }) +
      path('M -6 0 H 22 M 14 0 V 8 M 20 0 V 6', { c, w: 3 / s, o }),
    { t: `translate(${f(cx)} ${f(cy)}) scale(${s})` },
  );
}

// Smooth connector between two points (workflow-graph style).
export function curve(x1, y1, x2, y2, opts = {}) {
  const mx = (x1 + x2) / 2;
  return path(`M ${f(x1)} ${f(y1)} C ${f(mx)} ${f(y1)} ${f(mx)} ${f(y2)} ${f(x2)} ${f(y2)}`, opts);
}

/* ----------------------------------------------------------------- frame */

// Wraps a motif in the shared background: navy gradient, a faint dot grid
// that fades out toward the edges, two soft glows (brand orange and the
// topic hue) and a vignette. `glows` positions are in canvas pixels.
export function frame(w, h, hue, motif, { glows = null } = {}) {
  const gl = glows || [
    { x: w * 0.5 + 120, y: h * 0.5 - 40, r: Math.max(w, h) * 0.32, c: hue, o: 0.22 },
    { x: w * 0.5 - 160, y: h * 0.5 + 60, r: Math.max(w, h) * 0.26, c: C.accent, o: 0.12 },
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${C.bg0}"/><stop offset="1" stop-color="${C.bg1}"/>
  </linearGradient>
  <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
    <circle cx="13" cy="13" r="1.2" fill="${C.muted}" fill-opacity="0.22"/>
  </pattern>
  <radialGradient id="fadeR" cx="0.5" cy="0.5" r="0.6">
    <stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </radialGradient>
  <mask id="fade"><rect width="${w}" height="${h}" fill="url(#fadeR)"/></mask>
  ${gl.map((q, i) => `<radialGradient id="gl${i}"><stop offset="0" stop-color="${q.c}" stop-opacity="${q.o}"/><stop offset="1" stop-color="${q.c}" stop-opacity="0"/></radialGradient>`).join('')}
  <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">
    <stop offset="0.55" stop-color="#090E18" stop-opacity="0"/><stop offset="1" stop-color="#090E18" stop-opacity="0.65"/>
  </radialGradient>
  <filter id="blur" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="10"/></filter>
</defs>
<rect width="${w}" height="${h}" fill="url(#bg)"/>
${gl.map((q, i) => `<circle cx="${f(q.x)}" cy="${f(q.y)}" r="${f(q.r)}" fill="url(#gl${i})"/>`).join('')}
<rect width="${w}" height="${h}" fill="url(#dots)" mask="url(#fade)"/>
${motif}
<rect width="${w}" height="${h}" fill="url(#vig)"/>
</svg>`;
}
