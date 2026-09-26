// Hand painted item icons for goods that have no fitting emoji. An item whose icon starts with
// '@' is drawn here with canvas paths and gradients; the UI shows it as an image and the 3D
// bubbles paint it straight onto their canvas.

type Painter = (c: CanvasRenderingContext2D) => void; // draws into a 128 x 128 box

const lin = (c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) => {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  for (const [o, col] of stops) g.addColorStop(o, col);
  return g;
};
const rad = (c: CanvasRenderingContext2D, x: number, y: number, r: number, stops: [number, string][]) => {
  const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  for (const [o, col] of stops) g.addColorStop(o, col);
  return g;
};
const circle = (c: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string | CanvasGradient) => {
  c.fillStyle = fill; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
};
const outline = (c: CanvasRenderingContext2D, w = 4) => { c.lineWidth = w; c.strokeStyle = 'rgba(60,35,15,0.55)'; c.lineJoin = 'round'; c.stroke(); };
const rrect = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
};
const shine = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.ellipse(x, y, w, h, -0.4, 0, Math.PI * 2); c.fill();
};

// a glass jar with a gingham lid and a fruit label
function jar(fill: [string, string], label: string): Painter {
  return (c) => {
    rrect(c, 30, 36, 68, 80, 16);
    c.fillStyle = lin(c, 30, 0, 98, 0, [[0, fill[1]], [0.5, fill[0]], [1, fill[1]]]); c.fill(); outline(c);
    c.fillStyle = 'rgba(255,255,255,0.35)'; rrect(c, 38, 44, 10, 60, 5); c.fill();
    rrect(c, 26, 22, 76, 20, 7); c.fillStyle = '#e8433a'; c.fill(); outline(c, 3);
    c.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2 === 0) c.fillRect(30 + i * 12, 24 + j * 8, 12, 8);
    rrect(c, 40, 64, 48, 32, 6); c.fillStyle = '#fff6df'; c.fill(); outline(c, 2);
    circle(c, 64, 80, 11, rad(c, 64, 80, 11, [[0, '#ffd3a8'], [1, label]]));
    c.fillStyle = '#4f9e36'; c.beginPath(); c.ellipse(70, 68, 7, 3.5, -0.6, 0, Math.PI * 2); c.fill();
  };
}

// a tall glass with a straw, a lemon or fruit slice on the rim
function drink(liquid: [string, string], slice: string, sliceIn: string): Painter {
  return (c) => {
    c.beginPath(); c.moveTo(34, 30); c.lineTo(94, 30); c.lineTo(86, 116); c.lineTo(42, 116); c.closePath();
    c.fillStyle = 'rgba(220,240,255,0.55)'; c.fill(); outline(c);
    c.beginPath(); c.moveTo(37, 46); c.lineTo(91, 46); c.lineTo(85, 112); c.lineTo(43, 112); c.closePath();
    c.fillStyle = lin(c, 0, 46, 0, 112, [[0, liquid[0]], [1, liquid[1]]]); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.7)'; for (const [x, y] of [[52, 66], [70, 80], [60, 96], [76, 58]]) { c.beginPath(); c.arc(x, y, 3.5, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = '#ff6b8a'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(72, 100); c.lineTo(82, 16); c.stroke();
    c.beginPath(); c.arc(34, 34, 16, 0, Math.PI * 2); c.fillStyle = slice; c.fill(); outline(c, 3);
    c.beginPath(); c.arc(34, 34, 11, 0, Math.PI * 2); c.fillStyle = sliceIn; c.fill();
    c.strokeStyle = slice; c.lineWidth = 2; for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; c.beginPath(); c.moveTo(34, 34); c.lineTo(34 + Math.cos(a) * 11, 34 + Math.sin(a) * 11); c.stroke(); }
    shine(c, 44, 70, 4, 18);
  };
}

// a milk bottle with a colored cap and label
function bottle(milk: string, cap: string, label: string): Painter {
  return (c) => {
    c.beginPath(); c.moveTo(46, 30); c.lineTo(82, 30); c.lineTo(84, 46); c.bezierCurveTo(100, 56, 100, 70, 100, 80); c.lineTo(100, 114); c.lineTo(28, 114); c.lineTo(28, 80); c.bezierCurveTo(28, 70, 28, 56, 44, 46); c.closePath();
    c.fillStyle = lin(c, 28, 0, 100, 0, [[0, '#e3e3e3'], [0.45, milk], [1, '#d6d6d6']]); c.fill(); outline(c);
    rrect(c, 42, 16, 44, 16, 5); c.fillStyle = cap; c.fill(); outline(c, 3);
    rrect(c, 36, 74, 56, 26, 6); c.fillStyle = label; c.fill(); outline(c, 2);
    shine(c, 40, 84, 4, 16);
  };
}

// a single feather: quill, vane and an optional eye spot
function feather(vane: [string, string], eye?: [string, string, string]): Painter {
  return (c) => {
    c.save(); c.translate(64, 64); c.rotate(-0.6);
    c.beginPath(); c.moveTo(0, -56); c.bezierCurveTo(26, -30, 22, 30, 0, 44); c.bezierCurveTo(-22, 30, -26, -30, 0, -56);
    c.fillStyle = lin(c, 0, -56, 0, 44, [[0, vane[0]], [1, vane[1]]]); c.fill(); outline(c, 3);
    c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 1.5;
    for (let i = -44; i < 36; i += 8) { c.beginPath(); c.moveTo(0, i); c.lineTo(16, i - 10); c.moveTo(0, i); c.lineTo(-16, i - 10); c.stroke(); }
    if (eye) { circle(c, 0, -22, 13, eye[0]); circle(c, 0, -22, 8, eye[1]); circle(c, 0, -22, 4, eye[2]); }
    c.strokeStyle = '#f2ead8'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, -50); c.lineTo(0, 62); c.stroke();
    c.restore();
  };
}

// a round fruit with a highlight, optional crown and stem
function fruit(body: [string, string], crown?: string, stemCol = '#5a3a1f'): Painter {
  return (c) => {
    circle(c, 64, 70, 44, rad(c, 64, 70, 44, [[0, body[0]], [1, body[1]]]));
    c.beginPath(); c.arc(64, 70, 44, 0, Math.PI * 2); outline(c);
    shine(c, 46, 50, 10, 6);
    if (crown) { c.fillStyle = crown; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(64 + i * 7, 30); c.lineTo(60 + i * 7, 16); c.lineTo(68 + i * 7, 30); c.fill(); } }
    else { c.strokeStyle = stemCol; c.lineWidth = 5; c.beginPath(); c.moveTo(64, 28); c.quadraticCurveTo(66, 16, 74, 12); c.stroke(); }
  };
}

// a bowl heaped with colored bits (salads, roasts)
function bowl(base: string, bits: string[]): Painter {
  return (c) => {
    c.beginPath(); c.ellipse(64, 70, 50, 18, 0, 0, Math.PI * 2); c.fillStyle = base; c.fill();
    bits.forEach((col, i) => { const a = i * 2.4, r = 10 + (i % 3) * 12; c.beginPath(); c.ellipse(64 + Math.cos(a) * r * 1.4, 64 + Math.sin(a) * r * 0.45, 10, 7, a, 0, Math.PI * 2); c.fillStyle = col; c.fill(); outline(c, 2); });
    c.beginPath(); c.moveTo(14, 70); c.quadraticCurveTo(64, 128, 114, 70); c.closePath();
    c.fillStyle = lin(c, 0, 70, 0, 116, [[0, '#ffffff'], [1, '#c8d8e6']]); c.fill(); outline(c);
  };
}

// a pie or quiche in a fluted dish
function pie(fill: [string, string], dots: string): Painter {
  return (c) => {
    c.beginPath(); c.ellipse(64, 76, 54, 26, 0, 0, Math.PI * 2); c.fillStyle = '#c98a45'; c.fill(); outline(c);
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; circle(c, 64 + Math.cos(a) * 50, 76 + Math.sin(a) * 23, 6, '#e0a860'); }
    c.beginPath(); c.ellipse(64, 72, 42, 18, 0, 0, Math.PI * 2); c.fillStyle = rad(c, 64, 72, 42, [[0, fill[0]], [1, fill[1]]]); c.fill();
    c.fillStyle = dots; for (const [x, y] of [[50, 68], [72, 64], [80, 78], [56, 80], [66, 72]]) { c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.fill(); }
  };
}

// a ball of yarn or a folded woolly blanket
function yarn(col: [string, string]): Painter {
  return (c) => {
    circle(c, 64, 68, 44, rad(c, 64, 68, 44, [[0, col[0]], [1, col[1]]]));
    c.beginPath(); c.arc(64, 68, 44, 0, Math.PI * 2); outline(c);
    c.strokeStyle = 'rgba(0,0,0,0.2)'; c.lineWidth = 3;
    for (let i = 0; i < 7; i++) { c.beginPath(); c.ellipse(64, 68, 44 - i * 2, 12 + i * 5, 0.6 + i * 0.35, 0, Math.PI * 2); c.stroke(); }
    c.strokeStyle = col[1]; c.lineWidth = 4; c.beginPath(); c.moveTo(100, 94); c.quadraticCurveTo(118, 110, 104, 122); c.stroke();
  };
}

// a wedge of cheese with holes
function wedge(col: [string, string]): Painter {
  return (c) => {
    c.beginPath(); c.moveTo(16, 92); c.lineTo(108, 92); c.lineTo(108, 52); c.lineTo(16, 70); c.closePath();
    c.fillStyle = lin(c, 0, 52, 0, 92, [[0, col[0]], [1, col[1]]]); c.fill(); outline(c);
    c.beginPath(); c.moveTo(16, 70); c.lineTo(108, 52); c.lineTo(92, 38); c.closePath(); c.fillStyle = col[0]; c.fill(); outline(c);
    c.fillStyle = 'rgba(160,120,40,0.35)'; for (const [x, y, r] of [[40, 80, 6], [70, 76, 8], [94, 66, 5], [58, 62, 4]]) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
  };
}

// a bundle of grain stalks tied with a ribbon
function sheaf(head: string, awns: boolean): Painter {
  return (c) => {
    for (let i = -3; i <= 3; i++) {
      c.save(); c.translate(64, 110); c.rotate(i * 0.12);
      c.strokeStyle = '#a8a050'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -70); c.stroke();
      for (let k = 0; k < 5; k++) {
        c.fillStyle = head; c.beginPath(); c.ellipse(k % 2 ? 5 : -5, -70 - k * 7, 5, 8, k % 2 ? 0.5 : -0.5, 0, Math.PI * 2); c.fill();
        if (awns) { c.strokeStyle = head; c.lineWidth = 1.2; c.beginPath(); c.moveTo(k % 2 ? 8 : -8, -74 - k * 7); c.lineTo(k % 2 ? 18 : -18, -90 - k * 7); c.stroke(); }
      }
      c.restore();
    }
    rrect(c, 46, 84, 36, 10, 4); c.fillStyle = '#c0392b'; c.fill(); outline(c, 2);
  };
}


// ---- late game helpers

// an egg with optional speckles; gold eggs get a bright glint and sparkles
function egg(base: [string, string], spot?: string, sparkle = false): Painter {
  return (c) => {
    c.beginPath(); c.ellipse(64, 70, 36, 46, 0, 0, Math.PI * 2);
    c.fillStyle = rad(c, 64, 70, 50, [[0, base[0]], [1, base[1]]]); c.fill(); outline(c);
    if (spot) { c.fillStyle = spot; for (let i = 0; i < 16; i++) { c.beginPath(); c.ellipse(64 + Math.sin(i * 2.3) * 24, 70 + Math.cos(i * 1.7) * 32, 3 + (i % 3), 2 + (i % 2), i, 0, Math.PI * 2); c.fill(); } }
    shine(c, 50, 46, 8, 14);
    if (sparkle) {
      c.fillStyle = '#fffbe0';
      for (const [x, y, r] of [[100, 26, 9], [22, 40, 6], [104, 96, 6]]) { c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * 0.3, y - r * 0.3); c.lineTo(x + r, y); c.lineTo(x + r * 0.3, y + r * 0.3); c.lineTo(x, y + r); c.lineTo(x - r * 0.3, y + r * 0.3); c.lineTo(x - r, y); c.lineTo(x - r * 0.3, y - r * 0.3); c.closePath(); c.fill(); }
    }
  };
}

// a side view fish: back and belly colors, a fin color and optional stripes, spots or a bill
function fishy(back: string, belly: string, fin: string, o: { stripes?: string; spots?: string; bill?: boolean; long?: boolean; glow?: boolean } = {}): Painter {
  return (c) => {
    const L = o.long ? 50 : 42, H = o.long ? 14 : 22;
    c.beginPath(); c.moveTo(106 - (o.long ? 0 : 6), 64); c.lineTo(124, 44); c.lineTo(120, 64); c.lineTo(124, 84); c.closePath(); c.fillStyle = fin; c.fill(); outline(c, 3);
    c.beginPath(); c.moveTo(58, 64 - H); c.quadraticCurveTo(70, 64 - H - 16, 84, 64 - H + 2); c.lineTo(76, 64 - H + 6); c.closePath(); c.fillStyle = fin; c.fill(); outline(c, 2);
    c.beginPath(); c.ellipse(62, 64, L, H, 0, 0, Math.PI * 2);
    c.fillStyle = lin(c, 0, 64 - H, 0, 64 + H, [[0, back], [0.55, belly], [1, '#f6f2e8']]); c.fill(); outline(c);
    if (o.stripes) { c.strokeStyle = o.stripes; c.lineWidth = 4; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(44 + i * 14, 64 - H + 4); c.lineTo(40 + i * 14, 64 + H - 6); c.stroke(); } }
    if (o.spots) { c.fillStyle = o.spots; for (let i = 0; i < 12; i++) { c.beginPath(); c.arc(38 + (i * 17) % 56, 56 + (i * 7) % 16, 2.2, 0, Math.PI * 2); c.fill(); } }
    if (o.bill) { c.beginPath(); c.moveTo(22, 60); c.lineTo(0, 62); c.lineTo(22, 66); c.closePath(); c.fillStyle = back; c.fill(); outline(c, 2); }
    circle(c, 34 - (o.long ? 8 : 0), 58, 5.5, '#1a1a1a'); circle(c, 35 - (o.long ? 8 : 0), 57, 1.8, '#ffffff');
    if (o.glow) shine(c, 60, 52, 14, 5);
  };
}

// a skein of soft wool with a curl of fibre
function skein(col: [string, string]): Painter {
  return (c) => {
    for (const [x, y, r] of [[44, 74, 28], [84, 70, 30], [64, 50, 28], [64, 88, 26]]) {
      circle(c, x, y, r, rad(c, x, y, r, [[0, col[0]], [1, col[1]]]));
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); outline(c, 2.5);
    }
    c.strokeStyle = 'rgba(0,0,0,0.18)'; c.lineWidth = 2;
    for (let i = 0; i < 14; i++) { const a = i * 1.9; c.beginPath(); c.arc(64 + Math.cos(a) * 14, 70 + Math.sin(a) * 12, 12, a, a + 1.3); c.stroke(); }
  };
}

// a round portrait badge for an animal: a colored disc and a head drawn by `face`
function portrait(bg: string, face: Painter): Painter {
  return (c) => {
    circle(c, 64, 64, 58, rad(c, 64, 64, 60, [[0, '#ffffff'], [1, bg]]));
    c.beginPath(); c.arc(64, 64, 58, 0, Math.PI * 2); outline(c, 4);
    face(c);
  };
}
const eyePair = (c: CanvasRenderingContext2D, x: number, y: number, gap: number, r: number) => {
  for (const sx of [-1, 1]) { circle(c, x + sx * gap, y, r, '#ffffff'); c.beginPath(); c.arc(x + sx * gap, y, r, 0, Math.PI * 2); outline(c, 2); circle(c, x + sx * gap + 1, y + 1, r * 0.55, '#1a120c'); circle(c, x + sx * gap + 2, y - 1, r * 0.2, '#ffffff'); }
};
// a cartoon bird head in profile: head, beak and extras
function birdFace(head: string, beak: string, extra?: (c: CanvasRenderingContext2D) => void): Painter {
  return (c) => {
    circle(c, 60, 66, 30, rad(c, 60, 66, 32, [[0, '#ffffff'], [0.25, head], [1, head]]));
    c.beginPath(); c.arc(60, 66, 30, 0, Math.PI * 2); outline(c, 3);
    c.beginPath(); c.moveTo(86, 60); c.lineTo(112, 70); c.lineTo(86, 78); c.closePath(); c.fillStyle = beak; c.fill(); outline(c, 3);
    if (extra) extra(c);
    circle(c, 70, 60, 8, '#ffffff'); c.beginPath(); c.arc(70, 60, 8, 0, Math.PI * 2); outline(c, 2); circle(c, 72, 61, 4.5, '#1a120c'); circle(c, 73, 59, 1.5, '#ffffff');
  };
}

const PAINTERS: Record<string, Painter> = {
  // ---- late game goods
  speckled_egg: egg(['#fbf6ec', '#d8cbb0'], '#6a5a4a'),
  pheasant_feather: feather(['#e0a060', '#6a3a1a']),
  fresh_cream: (c) => {
    c.beginPath(); c.moveTo(34, 50); c.lineTo(94, 50); c.lineTo(88, 114); c.lineTo(40, 114); c.closePath();
    c.fillStyle = lin(c, 34, 0, 94, 0, [[0, '#d8d0c0'], [0.5, '#ffffff'], [1, '#d0c8b8']]); c.fill(); outline(c);
    c.beginPath(); c.moveTo(30, 52); c.bezierCurveTo(30, 20, 60, 34, 64, 16); c.bezierCurveTo(70, 34, 100, 22, 98, 52); c.closePath();
    c.fillStyle = rad(c, 64, 40, 40, [[0, '#ffffff'], [1, '#f2ead8']]); c.fill(); outline(c, 3);
    rrect(c, 44, 74, 40, 22, 5); c.fillStyle = '#8ab0d8'; c.fill(); outline(c, 2);
  },
  swan_down: (c) => {
    for (const [x, y, r] of [[48, 74, 24], [80, 70, 26], [64, 52, 24], [64, 88, 20]]) {
      circle(c, x, y, r, rad(c, x, y, r, [[0, '#ffffff'], [0.7, '#f4f4f8'], [1, '#d8dce6']]));
      c.strokeStyle = 'rgba(150,160,180,0.5)'; c.lineWidth = 1.5;
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; c.beginPath(); c.moveTo(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5); c.lineTo(x + Math.cos(a) * (r + 4), y + Math.sin(a) * (r + 4)); c.stroke(); }
    }
  },
  emu_egg: egg(['#4a8a6a', '#1f4a3a']),
  reindeer_milk: bottle('#fffdf6', '#b5452c', '#e8f0f4'),
  bison_wool: skein(['#8a6a4a', '#4a2e1c']),
  pink_feather: feather(['#ffb0cc', '#e0507a']),
  llama_wool: skein(['#f2e6cc', '#c8a878']),
  rainbow_mane: (c) => {
    const cols = ['#ff5a6a', '#ffa23a', '#ffe04a', '#6ad86a', '#4ab0ff', '#b07aff'];
    cols.forEach((col, i) => { c.strokeStyle = col; c.lineWidth = 11; c.lineCap = 'round'; c.beginPath(); c.moveTo(30 + i * 8, 24 + i * 4); c.bezierCurveTo(90, 30 + i * 8, 20, 80 + i * 4, 84 + i * 6, 108); c.stroke(); });
    c.fillStyle = '#fffbe0'; for (const [x, y] of [[104, 30], [24, 96]]) { c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill(); }
  },
  golden_egg: egg(['#fff2a0', '#c8900a'], undefined, true),
  trout: fishy('#6a8a5a', '#e8b0a0', '#6a8a5a', { spots: '#2a3a2a' }),
  tuna: fishy('#1f3a6a', '#a8b8c8', '#e8c43a'),
  swordfish: fishy('#2a4a7a', '#b8c8d8', '#2a4a7a', { bill: true, long: true }),
  eel: (c) => {
    c.strokeStyle = '#3a4a2a'; c.lineWidth = 20; c.lineCap = 'round';
    c.beginPath(); c.moveTo(24, 40); c.bezierCurveTo(60, 10, 70, 70, 100, 50); c.bezierCurveTo(120, 40, 110, 100, 80, 104); c.stroke();
    c.strokeStyle = '#6a7a4a'; c.lineWidth = 8;
    c.beginPath(); c.moveTo(24, 40); c.bezierCurveTo(60, 10, 70, 70, 100, 50); c.bezierCurveTo(120, 40, 110, 100, 80, 104); c.stroke();
    circle(c, 22, 38, 4, '#1a1a1a'); circle(c, 23, 37, 1.3, '#ffffff');
  },
  stingray: (c) => {
    c.beginPath(); c.moveTo(64, 22); c.bezierCurveTo(110, 40, 120, 64, 64, 90); c.bezierCurveTo(8, 64, 18, 40, 64, 22);
    c.fillStyle = rad(c, 64, 56, 50, [[0, '#9aa8b8'], [1, '#4a5a6a']]); c.fill(); outline(c);
    c.strokeStyle = '#4a5a6a'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(64, 88); c.quadraticCurveTo(70, 108, 58, 122); c.stroke();
    eyePair(c, 64, 46, 12, 5);
  },
  marlin: fishy('#1a3a8a', '#b8c8e8', '#2a5ab8', { bill: true, long: true, stripes: 'rgba(120,170,255,0.6)' }),
  pearl: (c) => {
    c.beginPath(); c.moveTo(18, 74); c.bezierCurveTo(22, 112, 106, 112, 110, 74); c.closePath();
    c.fillStyle = lin(c, 0, 74, 0, 110, [[0, '#c8b8a8'], [1, '#8a7a6a']]); c.fill(); outline(c);
    c.beginPath(); c.moveTo(18, 70); c.bezierCurveTo(24, 20, 104, 20, 110, 70); c.closePath();
    c.fillStyle = lin(c, 0, 20, 0, 70, [[0, '#d8ccc0'], [1, '#a89888']]); c.fill(); outline(c);
    c.strokeStyle = 'rgba(90,70,50,0.4)'; c.lineWidth = 2; for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(64, 68); c.lineTo(18 + i * 16, 28 + Math.abs(3 - i) * 8); c.stroke(); }
    circle(c, 64, 80, 16, rad(c, 64, 80, 18, [[0, '#ffffff'], [0.6, '#f2eef8'], [1, '#c8c0d8']]));
    c.beginPath(); c.arc(64, 80, 16, 0, Math.PI * 2); outline(c, 2);
  },
  golden_fish: fishy('#e8a010', '#ffe070', '#ffb020', { glow: true }),
  quince: fruit(['#f8e070', '#c8a018']),
  almond: (c) => {
    for (const [x, y, r] of [[48, 70, -0.4], [80, 66, 0.3]] as const) {
      c.save(); c.translate(x, y); c.rotate(r);
      c.beginPath(); c.moveTo(0, -40); c.bezierCurveTo(26, -20, 22, 30, 0, 40); c.bezierCurveTo(-22, 30, -26, -20, 0, -40);
      c.fillStyle = rad(c, 0, 0, 40, [[0, '#d8a060'], [1, '#8a5a2a']]); c.fill(); outline(c, 3);
      c.strokeStyle = 'rgba(90,50,20,0.4)'; c.lineWidth = 2; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 5, -30); c.quadraticCurveTo(i * 8, 0, i * 5, 30); c.stroke(); }
      c.restore();
    }
  },
  mulberry: (c) => {
    for (let i = 0; i < 22; i++) { const y = 32 + i * 3.6, w = Math.sin((i / 22) * Math.PI) * 26; circle(c, 64 + ((i % 3) - 1) * w * 0.6, y, 10, rad(c, 64, y, 12, [[0, '#8a3a6a'], [1, '#2a0a2a']])); }
    c.strokeStyle = '#6a8a3a'; c.lineWidth = 5; c.beginPath(); c.moveTo(64, 30); c.lineTo(70, 12); c.stroke();
  },
  grapefruit: fruit(['#ffd070', '#f07a4a']),
  persimmon: (c) => {
    c.beginPath(); c.ellipse(64, 74, 46, 38, 0, 0, Math.PI * 2); c.fillStyle = rad(c, 64, 74, 46, [[0, '#ffb04a'], [1, '#d8500a']]); c.fill(); outline(c);
    c.fillStyle = '#4a7a2a'; for (let i = 0; i < 4; i++) { c.save(); c.translate(64, 38); c.rotate((i / 4) * Math.PI * 2 + 0.4); c.beginPath(); c.ellipse(14, 0, 16, 7, 0, 0, Math.PI * 2); c.fill(); outline(c, 2); c.restore(); }
    shine(c, 46, 60, 10, 6);
  },
  date: (c) => {
    for (const [x, y, r] of [[40, 70, 0.5], [64, 60, 0], [88, 72, -0.5], [56, 90, 0.3], [78, 92, -0.2]] as const) {
      c.save(); c.translate(x, y); c.rotate(r); c.beginPath(); c.ellipse(0, 0, 14, 24, 0, 0, Math.PI * 2);
      c.fillStyle = rad(c, 0, 0, 24, [[0, '#b8602a'], [1, '#4a1a0a']]); c.fill(); outline(c, 3); c.restore();
    }
  },
  lychee: (c) => {
    for (const [x, y] of [[48, 74], [82, 66]]) {
      circle(c, x, y, 26, rad(c, x, y, 28, [[0, '#ff7a7a'], [1, '#a8182a']]));
      c.beginPath(); c.arc(x, y, 26, 0, Math.PI * 2); outline(c, 3);
      c.fillStyle = 'rgba(90,10,20,0.35)'; for (let i = 0; i < 14; i++) { c.beginPath(); c.arc(x + Math.cos(i * 2.4) * (i % 3) * 8, y + Math.sin(i * 2.4) * (i % 3) * 8, 2.5, 0, Math.PI * 2); c.fill(); }
    }
    c.strokeStyle = '#6a5a2a'; c.lineWidth = 4; c.beginPath(); c.moveTo(48, 48); c.quadraticCurveTo(64, 20, 82, 40); c.stroke();
  },
  hazelnut: (c) => {
    c.fillStyle = '#7aa84a'; for (let i = 0; i < 6; i++) { c.save(); c.translate(64, 50); c.rotate((i / 6) * Math.PI * 2); c.beginPath(); c.ellipse(0, -20, 12, 22, 0, 0, Math.PI * 2); c.fill(); outline(c, 2); c.restore(); }
    circle(c, 64, 76, 34, rad(c, 64, 76, 36, [[0, '#d0905a'], [1, '#6a3a1a']])); c.beginPath(); c.arc(64, 76, 34, 0, Math.PI * 2); outline(c);
    shine(c, 50, 64, 8, 5);
  },
  starfruit: (c) => {
    c.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 22 : 50; c.lineTo(64 + Math.cos(a) * r, 66 + Math.sin(a) * r); } c.closePath();
    c.fillStyle = rad(c, 64, 66, 50, [[0, '#fff27a'], [1, '#d8a818']]); c.fill(); outline(c);
    circle(c, 64, 66, 8, '#f2e6a0');
  },
  maple_syrup: (c) => {
    c.beginPath(); c.moveTo(50, 26); c.lineTo(78, 26); c.lineTo(80, 44); c.bezierCurveTo(100, 54, 100, 74, 100, 84); c.lineTo(100, 114); c.lineTo(28, 114); c.lineTo(28, 84); c.bezierCurveTo(28, 74, 28, 54, 48, 44); c.closePath();
    c.fillStyle = lin(c, 28, 0, 100, 0, [[0, '#8a3a0a'], [0.5, '#e0902a'], [1, '#7a2a08']]); c.fill(); outline(c);
    rrect(c, 48, 12, 32, 16, 4); c.fillStyle = '#c0392b'; c.fill(); outline(c, 3);
    c.fillStyle = '#d8322a'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 7 : 16; c.lineTo(64 + Math.cos(a) * r, 86 + Math.sin(a) * r); } c.closePath(); c.fill();
    shine(c, 40, 80, 4, 14);
  },
  cocoa_pod: (c) => {
    c.save(); c.translate(64, 66); c.rotate(-0.5);
    c.beginPath(); c.ellipse(0, 0, 30, 52, 0, 0, Math.PI * 2); c.fillStyle = rad(c, 0, 0, 52, [[0, '#f0a040'], [1, '#8a2a0a']]); c.fill(); outline(c);
    c.strokeStyle = 'rgba(90,30,10,0.5)'; c.lineWidth = 2.5; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 10, -48); c.quadraticCurveTo(i * 16, 0, i * 10, 48); c.stroke(); }
    c.restore();
  },
  sakura: (c) => {
    for (const [x, y, s] of [[44, 56, 1], [84, 64, 0.85], [60, 90, 0.9]] as const) {
      for (let i = 0; i < 5; i++) { c.save(); c.translate(x, y); c.rotate((i / 5) * Math.PI * 2); c.beginPath(); c.ellipse(0, -14 * s, 10 * s, 15 * s, 0, 0, Math.PI * 2); c.fillStyle = rad(c, 0, -14 * s, 16 * s, [[0, '#ffe8f0'], [1, '#f08ab0']]); c.fill(); outline(c, 2); c.restore(); }
      circle(c, x, y, 5 * s, '#f2c23a');
    }
  },
  golden_apple: (c) => {
    fruit(['#fff2a0', '#c8900a'])(c);
    c.fillStyle = '#fffbe0'; for (const [x, y, r] of [[102, 30, 7], [24, 44, 5]]) { c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * 0.3, y); c.lineTo(x, y + r); c.lineTo(x - r * 0.3, y); c.closePath(); c.fill(); c.beginPath(); c.moveTo(x - r, y); c.lineTo(x, y + r * 0.3); c.lineTo(x + r, y); c.lineTo(x, y - r * 0.3); c.closePath(); c.fill(); }
  },
  // ---- late game animal portraits
  guinea_fowl: portrait('#b8c8e0', birdFace('#4a4e5a', '#e8c080', (c) => { c.fillStyle = '#d8322a'; c.beginPath(); c.ellipse(80, 90, 6, 10, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#f4f2ee'; for (let i = 0; i < 10; i++) { c.beginPath(); c.arc(44 + (i * 13) % 30, 70 + (i * 7) % 20, 2.5, 0, Math.PI * 2); c.fill(); } })),
  pheasant: portrait('#e8c8a0', birdFace('#1f6a5a', '#e8d0a0', (c) => { c.fillStyle = '#d8322a'; c.beginPath(); c.ellipse(72, 60, 14, 12, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#ffffff'; c.lineWidth = 5; c.beginPath(); c.arc(60, 66, 30, 1.2, 2.2); c.stroke(); })),
  highland_cow: portrait('#f2d0a8', (c) => {
    c.strokeStyle = '#efe4cc'; c.lineWidth = 9; c.lineCap = 'round';
    c.beginPath(); c.moveTo(40, 44); c.quadraticCurveTo(14, 44, 12, 18); c.moveTo(88, 44); c.quadraticCurveTo(114, 44, 116, 18); c.stroke();
    circle(c, 64, 68, 34, rad(c, 64, 68, 36, [[0, '#e8884a'], [1, '#b0501a']])); c.beginPath(); c.arc(64, 68, 34, 0, Math.PI * 2); outline(c, 3);
    c.beginPath(); c.ellipse(64, 90, 22, 14, 0, 0, Math.PI * 2); c.fillStyle = '#3a2418'; c.fill();
    c.fillStyle = '#d8783a'; for (let i = 0; i < 7; i++) { c.beginPath(); c.ellipse(40 + i * 8, 52, 7, 16, (i - 3) * 0.12, 0, Math.PI * 2); c.fill(); }
  }),
  emu: portrait('#d8d0c0', birdFace('#6a7a8a', '#2a2a2a', (c) => { c.fillStyle = '#5a4a3a'; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(36 + i * 5, 40 + i * 3, 5, 12, -0.5, 0, Math.PI * 2); c.fill(); } })),
  llama: portrait('#b8e0f0', (c) => {
    for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(64 + sx * 22, 26, 8, 20, sx * 0.2, 0, Math.PI * 2); c.fillStyle = '#9a5a2a'; c.fill(); outline(c, 2); circle(c, 64 + sx * 26, 14, 6, sx < 0 ? '#e8305a' : '#2ab0c8'); }
    c.beginPath(); c.ellipse(64, 70, 30, 40, 0, 0, Math.PI * 2); c.fillStyle = rad(c, 64, 66, 40, [[0, '#ffffff'], [1, '#e8dcc0']]); c.fill(); outline(c, 3);
    eyePair(c, 64, 60, 13, 7);
    c.beginPath(); c.ellipse(64, 92, 10, 6, 0, 0, Math.PI * 2); c.fillStyle = '#3a2a20'; c.fill();
  }),
  golden_goose: portrait('#fff2c0', birdFace('#f2cc40', '#f39024', (c) => {
    c.fillStyle = '#ffe070'; c.beginPath(); c.moveTo(44, 40); c.lineTo(48, 24); c.lineTo(56, 34); c.lineTo(62, 20); c.lineTo(68, 34); c.lineTo(76, 24); c.lineTo(78, 40); c.closePath(); c.fill(); outline(c, 2);
    circle(c, 62, 32, 3, '#d8322a');
  })),
  oat: sheaf('#e6d9a0', false),
  barley: sheaf('#e0c870', true),
  soybean: (c) => {
    c.save(); c.translate(64, 64); c.rotate(-0.5);
    c.beginPath(); c.moveTo(-48, 0); c.bezierCurveTo(-26, -26, 26, -26, 48, 0); c.bezierCurveTo(26, 16, -26, 16, -48, 0);
    c.fillStyle = lin(c, 0, -20, 0, 14, [[0, '#b8d070'], [1, '#6a8a2a']]); c.fill(); outline(c);
    for (let i = -1; i <= 1; i++) circle(c, i * 22, -3, 10, rad(c, i * 22, -3, 10, [[0, '#fff0b0'], [1, '#c8b060']]));
    c.restore();
  },
  lavender: (c) => {
    for (let i = -2; i <= 2; i++) {
      c.save(); c.translate(64, 116); c.rotate(i * 0.16);
      c.strokeStyle = '#6a8a5a'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -70); c.stroke();
      for (let k = 0; k < 7; k++) circle(c, (k % 2 ? 3 : -3), -64 - k * 6, 5, k % 2 ? '#8a6ad0' : '#a88ae8');
      c.restore();
    }
  },
  salmon: (c) => {
    c.beginPath(); c.ellipse(60, 64, 44, 22, 0, 0, Math.PI * 2); c.fillStyle = lin(c, 0, 42, 0, 86, [[0, '#6a8aa8'], [0.5, '#e8a8a0'], [1, '#f2ece0']]); c.fill(); outline(c);
    c.beginPath(); c.moveTo(100, 64); c.lineTo(122, 44); c.lineTo(122, 84); c.closePath(); c.fillStyle = '#6a8aa8'; c.fill(); outline(c, 3);
    circle(c, 30, 58, 5, '#1a1a1a'); circle(c, 31, 57, 1.5, '#ffffff');
    c.fillStyle = 'rgba(30,40,60,0.5)'; for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(46 + i * 7, 52 + (i % 2) * 4, 1.8, 0, Math.PI * 2); c.fill(); }
  },
  lavender_sachet: (c) => {
    c.beginPath(); c.moveTo(34, 50); c.quadraticCurveTo(28, 110, 64, 116); c.quadraticCurveTo(100, 110, 94, 50); c.closePath();
    c.fillStyle = lin(c, 30, 0, 98, 0, [[0, '#b8a0e8'], [0.5, '#d8c8f8'], [1, '#a890d8']]); c.fill(); outline(c);
    c.fillStyle = '#8a6ad0'; for (const [x, y] of [[50, 80], [66, 92], [80, 76], [58, 100]]) { c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.fill(); }
    rrect(c, 40, 42, 48, 10, 4); c.fillStyle = '#e8c43a'; c.fill(); outline(c, 2);
    c.fillStyle = '#6a8a5a'; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(48 + i * 10, 30, 4, 12, (i - 1.5) * 0.3, 0, Math.PI * 2); c.fill(); }
  },
  flower_crown: (c) => {
    c.beginPath(); c.ellipse(64, 70, 46, 24, 0, 0, Math.PI * 2); c.lineWidth = 8; c.strokeStyle = '#4f8a3a'; c.stroke();
    const cols = ['#e8305a', '#f2d23a', '#8a6ad0', '#ffffff', '#ff8fb0', '#e8305a', '#8a6ad0', '#f2d23a'];
    cols.forEach((col, i) => { const a = (i / cols.length) * Math.PI * 2; const x = 64 + Math.cos(a) * 46, y = 70 + Math.sin(a) * 24; for (let k = 0; k < 5; k++) circle(c, x + Math.cos(k * 1.26) * 6, y + Math.sin(k * 1.26) * 6, 5, col); circle(c, x, y, 3.5, '#f2b33a'); });
  },
  oat_cookie: (c) => {
    for (const [x, y] of [[46, 76], [82, 72], [64, 50]]) {
      circle(c, x, y, 26, rad(c, x, y, 26, [[0, '#e0c080'], [1, '#a87a3a']]));
      c.beginPath(); c.arc(x, y, 26, 0, Math.PI * 2); outline(c, 3);
      c.fillStyle = '#f2e6c0'; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(x + Math.cos(i * 1.1) * 14, y + Math.sin(i * 1.3) * 12, 4, 2, i, 0, Math.PI * 2); c.fill(); }
    }
  },
  barley_bread: (c) => {
    c.beginPath(); c.ellipse(64, 72, 50, 32, 0, 0, Math.PI * 2); c.fillStyle = rad(c, 64, 64, 50, [[0, '#d8a060'], [1, '#8a5a2a']]); c.fill(); outline(c);
    c.strokeStyle = '#f2d8a0'; c.lineWidth = 4; for (const x of [44, 64, 84]) { c.beginPath(); c.moveTo(x - 8, 56); c.lineTo(x + 8, 82); c.stroke(); }
    c.fillStyle = '#e8d8a0'; for (let i = 0; i < 12; i++) { c.beginPath(); c.ellipse(30 + (i * 17) % 70, 50 + (i * 11) % 40, 3, 1.5, i, 0, Math.PI * 2); c.fill(); }
  },
  soy_milk: bottle('#fdf8ea', '#6a8a2a', '#d8e8a8'),
  salmon_roll: (c) => {
    for (const [x, y] of [[40, 70], [88, 70], [64, 52]]) {
      circle(c, x, y, 24, '#1f2a1f'); circle(c, x, y, 19, '#fbfaf5');
      c.fillStyle = '#f08a6a'; c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#8ac850'; c.beginPath(); c.arc(x + 5, y - 3, 4, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(x, y, 24, 0, Math.PI * 2); outline(c, 3);
    }
  },
  crab_cake: (c) => {
    for (const [x, y] of [[44, 76], [84, 76], [64, 56]]) {
      c.beginPath(); c.ellipse(x, y, 26, 16, 0, 0, Math.PI * 2); c.fillStyle = rad(c, x, y, 26, [[0, '#f2c070'], [1, '#b0702a']]); c.fill(); outline(c, 3);
      c.fillStyle = 'rgba(255,230,190,0.7)'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(x - 12 + i * 6, y - 3 + (i % 2) * 5, 2, 0, Math.PI * 2); c.fill(); }
    }
    c.fillStyle = '#ffe066'; c.beginPath(); c.moveTo(96, 40); c.lineTo(118, 30); c.lineTo(110, 52); c.closePath(); c.fill(); outline(c, 2);
  },

  apricot: fruit(['#ffc070', '#e0782a']),
  lime: fruit(['#b8e050', '#3f8a1e'], undefined, '#4f6a2a'),
  fig: (c) => {
    c.beginPath(); c.moveTo(64, 20); c.bezierCurveTo(78, 40, 110, 60, 104, 90); c.bezierCurveTo(98, 116, 30, 116, 24, 90); c.bezierCurveTo(18, 60, 50, 40, 64, 20);
    c.fillStyle = rad(c, 64, 80, 50, [[0, '#9a5a8a'], [1, '#3e1640']]); c.fill(); outline(c);
    shine(c, 46, 70, 6, 12); c.strokeStyle = '#5a3a1f'; c.lineWidth = 5; c.beginPath(); c.moveTo(64, 22); c.lineTo(66, 10); c.stroke();
  },
  walnut: (c) => {
    c.beginPath(); c.ellipse(64, 66, 40, 46, 0, 0, Math.PI * 2); c.fillStyle = rad(c, 64, 66, 46, [[0, '#d8a86a'], [1, '#8a5a2a']]); c.fill(); outline(c);
    c.strokeStyle = 'rgba(80,45,20,0.6)'; c.lineWidth = 3; c.beginPath(); c.moveTo(64, 22); c.lineTo(64, 110); c.stroke();
    for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(64, 30 + i * 13); c.quadraticCurveTo(44 - (i % 2) * 6, 36 + i * 13, 32, 30 + i * 14); c.moveTo(64, 30 + i * 13); c.quadraticCurveTo(84 + (i % 2) * 6, 36 + i * 13, 96, 30 + i * 14); c.stroke(); }
  },
  spinach: (c) => {
    for (const [a, col] of [[-0.6, '#2f7a24'], [0.6, '#3f8a2e'], [0, '#4f9a36']] as const) {
      c.save(); c.translate(64, 112); c.rotate(a);
      c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-30, -40, -24, -88, 0, -96); c.bezierCurveTo(24, -88, 30, -40, 0, 0);
      c.fillStyle = col; c.fill(); outline(c, 3);
      c.strokeStyle = 'rgba(220,255,200,0.6)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -86); c.stroke();
      c.restore();
    }
  },
  beet: (c) => {
    c.fillStyle = '#4f8a3a'; for (const a of [-0.5, 0.1, 0.6]) { c.save(); c.translate(64, 48); c.rotate(a); c.beginPath(); c.ellipse(0, -18, 11, 22, 0, 0, Math.PI * 2); c.fill(); outline(c, 2); c.strokeStyle = '#a8204a'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 4); c.lineTo(0, -34); c.stroke(); c.restore(); }
    circle(c, 64, 80, 34, rad(c, 64, 80, 34, [[0, '#c0305a'], [1, '#5a0a28']]));
    c.beginPath(); c.arc(64, 80, 34, 0, Math.PI * 2); outline(c);
    c.strokeStyle = '#5a0a28'; c.lineWidth = 3; c.beginPath(); c.moveTo(64, 112); c.quadraticCurveTo(62, 122, 70, 126); c.stroke();
  },
  pea: (c) => {
    c.save(); c.translate(64, 64); c.rotate(-0.5);
    c.beginPath(); c.moveTo(-54, 0); c.bezierCurveTo(-30, -30, 30, -30, 54, 0); c.bezierCurveTo(30, 18, -30, 18, -54, 0);
    c.fillStyle = lin(c, 0, -24, 0, 16, [[0, '#9ad860'], [1, '#4f9a2a']]); c.fill(); outline(c);
    for (let i = -2; i <= 2; i++) circle(c, i * 18, -4, 9, rad(c, i * 18, -4, 9, [[0, '#c8f090'], [1, '#5aaa2a']]));
    c.restore();
  },
  zucchini: (c) => {
    c.save(); c.translate(64, 64); c.rotate(-0.6);
    c.beginPath(); c.ellipse(0, 0, 56, 18, 0, 0, Math.PI * 2); c.fillStyle = lin(c, 0, -18, 0, 18, [[0, '#6aa84a'], [1, '#1f4a14']]); c.fill(); outline(c);
    c.strokeStyle = 'rgba(200,230,150,0.5)'; c.lineWidth = 2; for (const y of [-8, 0, 8]) { c.beginPath(); c.moveTo(-50, y); c.lineTo(50, y); c.stroke(); }
    c.fillStyle = '#8a7a3a'; c.fillRect(52, -6, 12, 12);
    c.restore();
  },
  quail_egg: (c) => {
    for (const [x, y, r] of [[44, 74, 0.2], [80, 70, -0.3], [62, 52, 0.1]] as const) {
      c.save(); c.translate(x, y); c.rotate(r);
      c.beginPath(); c.ellipse(0, 0, 20, 26, 0, 0, Math.PI * 2); c.fillStyle = '#efe4cc'; c.fill(); outline(c, 3);
      c.fillStyle = '#5a3a24'; for (let i = 0; i < 10; i++) { c.beginPath(); c.ellipse(Math.sin(i * 2.3) * 13, Math.cos(i * 1.7) * 17, 3 + (i % 3), 2 + (i % 2), i, 0, Math.PI * 2); c.fill(); }
      c.restore();
    }
  },
  yak_wool: yarn(['#8a6a4a', '#3a2818']),
  yak_blanket: (c) => {
    rrect(c, 18, 36, 92, 64, 10); c.fillStyle = '#8a3a2a'; c.fill(); outline(c);
    for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? '#e8c43a' : '#3a5a8a'; c.fillRect(18, 44 + i * 13, 92, 6); }
    c.fillStyle = '#6a2a1a'; for (let x = 20; x < 108; x += 7) c.fillRect(x, 100, 3, 10);
  },
  camel_milk: bottle('#fffaf0', '#c0602a', '#e8d2a8'),
  camel_cheese: wedge(['#fff6d8', '#e8d49a']),
  olive_oil: (c) => {
    c.beginPath(); c.moveTo(52, 24); c.lineTo(76, 24); c.lineTo(78, 46); c.bezierCurveTo(98, 58, 98, 76, 98, 88); c.lineTo(98, 114); c.lineTo(30, 114); c.lineTo(30, 88); c.bezierCurveTo(30, 76, 30, 58, 50, 46); c.closePath();
    c.fillStyle = lin(c, 30, 0, 98, 0, [[0, '#8a9a1a'], [0.5, '#d8d040'], [1, '#7a8a14']]); c.fill(); outline(c);
    rrect(c, 50, 12, 28, 14, 4); c.fillStyle = '#3a4a1a'; c.fill(); outline(c, 3);
    c.beginPath(); c.ellipse(64, 88, 20, 14, 0, 0, Math.PI * 2); c.fillStyle = '#fff6df'; c.fill(); outline(c, 2);
    circle(c, 60, 88, 6, '#4a6a2a'); circle(c, 70, 86, 6, '#2a3a1a');
    shine(c, 40, 78, 4, 16);
  },
  pesto: jar(['#5aa83a', '#2f6a1f'], '#3f8a2e'),
  apricot_jam: jar(['#ffb050', '#e07a1a'], '#ffc070'),
  fig_jam: jar(['#8a3a6a', '#4a1440'], '#9a5a8a'),
  limeade: drink(['#e6f7b0', '#a8d850'], '#6ab82a', '#d8f09a'),
  walnut_cookie: (c) => {
    for (const [x, y] of [[44, 78], [84, 74], [64, 50]]) {
      circle(c, x, y, 26, rad(c, x, y, 26, [[0, '#e8b870'], [1, '#a8702a']]));
      c.beginPath(); c.arc(x, y, 26, 0, Math.PI * 2); outline(c, 3);
      c.fillStyle = '#7a4a1f'; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(x + Math.cos(i * 1.8) * 12, y + Math.sin(i * 1.8) * 10, 5, 3.5, i, 0, Math.PI * 2); c.fill(); }
    }
  },
  greek_salad: bowl('#dff0c8', ['#e0301e', '#f7f3e6', '#2a2a2a', '#6ab83a', '#e0301e', '#f7f3e6', '#6a2a6a']),
  roast_veggies: bowl('#e8c890', ['#c0603a', '#7a1238', '#3f7a24', '#e0a040', '#7a1238', '#c0603a']),
  quail_quiche: pie(['#fff0a8', '#e8c860'], '#3f8a2e'),

  plum: fruit(['#9a5ac8', '#3e1650'], undefined, '#6b5a2a'),
  pomegranate: fruit(['#f05a5a', '#8a1020'], '#8a1020'),
  radish: (c) => {
    c.fillStyle = '#4f9e36'; for (const a of [-0.5, 0, 0.5]) { c.save(); c.translate(64, 50); c.rotate(a); c.beginPath(); c.ellipse(0, -22, 10, 24, 0, 0, Math.PI * 2); c.fill(); outline(c, 2); c.restore(); }
    c.beginPath(); c.moveTo(34, 64); c.bezierCurveTo(34, 40, 94, 40, 94, 64); c.bezierCurveTo(94, 88, 70, 100, 64, 120); c.bezierCurveTo(58, 100, 34, 88, 34, 64);
    c.fillStyle = lin(c, 0, 44, 0, 120, [[0, '#e8385a'], [0.7, '#c01840'], [0.85, '#ffffff'], [1, '#ffffff']]); c.fill(); outline(c);
    shine(c, 48, 60, 6, 10);
  },
  cabbage: (c) => {
    circle(c, 64, 70, 48, rad(c, 64, 70, 48, [[0, '#dff5c0'], [1, '#6cae44']]));
    c.beginPath(); c.arc(64, 70, 48, 0, Math.PI * 2); outline(c);
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 3;
    for (const a of [-2.4, -1.6, -0.8, 0, 0.8]) { c.beginPath(); c.moveTo(64, 70); c.quadraticCurveTo(64 + Math.cos(a) * 30, 70 + Math.sin(a) * 20, 64 + Math.cos(a) * 44, 70 + Math.sin(a) * 44); c.stroke(); }
    c.beginPath(); c.arc(64, 58, 22, Math.PI, 0); c.fillStyle = '#c8eba0'; c.fill(); outline(c, 2);
  },
  raspberry: (c) => {
    for (let r = 0; r < 4; r++) for (let i = 0; i < 5 - Math.abs(r - 1.5); i++) {
      const x = 64 + (i - (4 - Math.abs(r - 1.5)) / 2) * 16, y = 50 + r * 16;
      circle(c, x, y, 10, rad(c, x, y, 10, [[0, '#ff6a8a'], [1, '#a0103a']]));
    }
    c.fillStyle = '#4f9e36'; for (const a of [-0.8, 0, 0.8]) { c.save(); c.translate(64, 36); c.rotate(a); c.beginPath(); c.ellipse(0, -8, 5, 12, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
  },
  gobbler_feather: feather(['#e9d7b0', '#6b3f22']),
  peacock_feather: feather(['#3fae6a', '#1f6a5a'], ['#e8c43a', '#2a8a8a', '#1a2f8a']),
  donkey_milk: bottle('#ffffff', '#9aa3ab', '#d8c9b0'),
  buffalo_milk: bottle('#fffdf2', '#3a4a5a', '#8ab0d8'),
  ostrich_egg: (c) => {
    c.beginPath(); c.ellipse(64, 68, 38, 50, 0, 0, Math.PI * 2);
    c.fillStyle = rad(c, 64, 68, 52, [[0, '#fffaf0'], [1, '#d9ccb0']]); c.fill(); outline(c);
    c.fillStyle = 'rgba(160,140,110,0.35)'; for (let i = 0; i < 14; i++) { c.beginPath(); c.arc(40 + (i * 37) % 50, 30 + (i * 23) % 70, 2, 0, Math.PI * 2); c.fill(); }
    shine(c, 50, 44, 8, 14);
  },
  mozzarella: (c) => {
    circle(c, 64, 70, 40, rad(c, 64, 70, 40, [[0, '#ffffff'], [1, '#e8e2d2']]));
    c.beginPath(); c.arc(64, 70, 40, 0, Math.PI * 2); outline(c);
    c.fillStyle = '#4f9e36'; c.beginPath(); c.ellipse(86, 38, 16, 8, -0.6, 0, Math.PI * 2); c.fill(); outline(c, 2);
    c.beginPath(); c.ellipse(70, 30, 14, 7, 0.4, 0, Math.PI * 2); c.fill(); outline(c, 2);
    shine(c, 50, 54, 10, 6);
  },
  feather_fan: (c) => {
    for (let i = 0; i < 7; i++) {
      const a = -1.2 + i * 0.4;
      c.save(); c.translate(64, 108); c.rotate(a);
      c.beginPath(); c.ellipse(0, -52, 14, 46, 0, 0, Math.PI * 2);
      c.fillStyle = lin(c, 0, -98, 0, -6, [[0, '#2fb07a'], [1, '#1f5a6a']]); c.fill(); outline(c, 2);
      circle(c, 0, -80, 8, '#e8c43a'); circle(c, 0, -80, 5, '#1a2f8a');
      c.restore();
    }
    rrect(c, 54, 98, 20, 22, 6); c.fillStyle = '#8a5a2b'; c.fill(); outline(c, 3);
  },
  big_omelette: (c) => {
    c.beginPath(); c.ellipse(64, 76, 52, 26, 0, 0, Math.PI * 2); c.fillStyle = '#3a3a3a'; c.fill(); outline(c);
    c.beginPath(); c.ellipse(64, 72, 46, 21, 0, 0, Math.PI * 2); c.fillStyle = rad(c, 64, 72, 46, [[0, '#ffe98a'], [1, '#f2c23a']]); c.fill();
    for (const [x, y, col] of [[48, 70, '#e0301e'], [70, 64, '#4f9e36'], [80, 78, '#e0301e'], [58, 82, '#c98a4a']] as const) { c.fillStyle = col; c.fillRect(x, y, 9, 6); }
    c.fillStyle = '#5a3a1f'; c.fillRect(108, 70, 18, 8);
  },
  grape_juice: drink(['#9a4ad0', '#4a1a6a'], '#7a3aa0', '#c79ae8'),
  pineapple_juice: drink(['#fff0a0', '#f2c23a'], '#f2c23a', '#fff4b0'),
  plum_jam: jar(['#8a3aa8', '#4a1860'], '#9a5ac8'),
  pickles: jar(['#8ab04a', '#4f7a2a'], '#6a9a3a'),
  banana_bread: (c) => {
    rrect(c, 18, 50, 92, 52, 14); c.fillStyle = lin(c, 0, 50, 0, 102, [[0, '#b0602a'], [1, '#7a3a18']]); c.fill(); outline(c);
    c.beginPath(); c.ellipse(64, 52, 46, 16, 0, Math.PI, 0); c.fillStyle = '#c8783a'; c.fill(); outline(c, 3);
    c.fillStyle = '#f0d890'; c.beginPath(); c.moveTo(40, 40); c.quadraticCurveTo(64, 24, 90, 40); c.quadraticCurveTo(64, 32, 40, 40); c.fill(); outline(c, 2);
    c.fillStyle = 'rgba(255,230,180,0.6)'; for (const [x, y] of [[36, 76], [60, 84], [86, 72], [48, 64], [76, 90]]) { c.beginPath(); c.arc(x, y, 3, 0, Math.PI * 2); c.fill(); }
  },
  guacamole: (c) => {
    c.beginPath(); c.moveTo(16, 64); c.quadraticCurveTo(64, 128, 112, 64); c.closePath();
    c.fillStyle = lin(c, 0, 64, 0, 110, [[0, '#e8b04a'], [1, '#b0702a']]); c.fill(); outline(c);
    c.beginPath(); c.ellipse(64, 62, 46, 16, 0, 0, Math.PI * 2); c.fillStyle = rad(c, 64, 60, 46, [[0, '#b8e070'], [1, '#6a9a2a']]); c.fill(); outline(c, 3);
    for (const [x, y] of [[48, 58, 0], [76, 64, 0], [62, 54, 0]]) { c.fillStyle = '#e0301e'; c.fillRect(x, y, 7, 5); }
    c.fillStyle = '#f2d16b'; c.beginPath(); c.moveTo(90, 50); c.lineTo(118, 34); c.lineTo(104, 62); c.closePath(); c.fill(); outline(c, 2);
  },

  peach_jam: jar(['#ffb06a', '#e8793a'], '#ff9a5c'),
  peach_juice: drink(['#ffc48a', '#ff8f4a'], '#ffa274', '#ffd8b0'),
  lemonade: drink(['#fff6b0', '#ffe066'], '#ffd23a', '#fff4a8'),
  garden_salad: (c) => {
    c.beginPath(); c.ellipse(64, 78, 50, 16, 0, 0, Math.PI * 2); c.fillStyle = '#e9f4ff'; c.fill();
    const leaf = (x: number, y: number, r: number, col: string) => { c.beginPath(); c.ellipse(x, y, r, r * 0.7, (x - 64) / 40, 0, Math.PI * 2); c.fillStyle = col; c.fill(); outline(c, 2); };
    leaf(40, 64, 20, '#6cbf3a'); leaf(86, 62, 20, '#8ad05a'); leaf(62, 52, 22, '#5aae32'); leaf(52, 70, 18, '#9ad86a'); leaf(78, 72, 18, '#6cbf3a');
    circle(c, 58, 58, 9, rad(c, 58, 58, 9, [[0, '#ff8f7a'], [1, '#d6301f']]));
    circle(c, 80, 56, 8, rad(c, 80, 56, 8, [[0, '#ff8f7a'], [1, '#d6301f']]));
    c.fillStyle = '#f0862a'; for (const [x, y] of [[46, 58], [70, 66], [88, 70]]) { c.fillRect(x, y, 10, 4); }
    c.beginPath(); c.moveTo(14, 78); c.quadraticCurveTo(64, 132, 114, 78); c.closePath();
    c.fillStyle = lin(c, 0, 78, 0, 120, [[0, '#ffffff'], [1, '#bcd6ea']]); c.fill(); outline(c);
    c.fillStyle = '#5aa0d8'; c.fillRect(22, 88, 84, 4);
  },
  blueberry_muffin: (c) => {
    c.beginPath(); c.moveTo(30, 70); c.lineTo(98, 70); c.lineTo(88, 116); c.lineTo(40, 116); c.closePath();
    c.fillStyle = lin(c, 30, 0, 98, 0, [[0, '#6fa8e0'], [0.5, '#9cc8f0'], [1, '#6fa8e0']]); c.fill(); outline(c);
    c.strokeStyle = 'rgba(40,80,140,0.35)'; c.lineWidth = 2; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(36 + i * 11, 72); c.lineTo(42 + i * 9, 114); c.stroke(); }
    c.beginPath(); c.ellipse(64, 64, 42, 30, 0, Math.PI, 0); c.lineTo(106, 72); c.bezierCurveTo(90, 80, 38, 80, 22, 72); c.closePath();
    c.fillStyle = rad(c, 64, 56, 44, [[0, '#f4d19a'], [1, '#c98a45']]); c.fill(); outline(c);
    for (const [x, y] of [[48, 50], [70, 44], [84, 58], [58, 62], [38, 64], [76, 68]]) circle(c, x, y, 5.5, rad(c, x, y, 6, [[0, '#8c9cff'], [1, '#2c2f8a']]));
  },
  latte: (c) => {
    c.beginPath(); c.ellipse(64, 108, 50, 12, 0, 0, Math.PI * 2); c.fillStyle = '#f2f2f2'; c.fill(); outline(c, 3);
    c.beginPath(); c.moveTo(24, 44); c.lineTo(104, 44); c.bezierCurveTo(104, 96, 90, 106, 64, 106); c.bezierCurveTo(38, 106, 24, 96, 24, 44); c.closePath();
    c.fillStyle = lin(c, 24, 0, 104, 0, [[0, '#e6e6e6'], [0.5, '#ffffff'], [1, '#d8d8d8']]); c.fill(); outline(c);
    c.beginPath(); c.arc(106, 66, 14, -1.2, 1.2); c.lineWidth = 8; c.strokeStyle = '#f2f2f2'; c.stroke();
    c.beginPath(); c.ellipse(64, 46, 38, 9, 0, 0, Math.PI * 2); c.fillStyle = '#b07a4a'; c.fill();
    c.beginPath(); c.moveTo(64, 52); c.bezierCurveTo(50, 42, 56, 36, 64, 43); c.bezierCurveTo(72, 36, 78, 42, 64, 52); c.fillStyle = '#fff3e0'; c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 4; c.lineCap = 'round';
    for (const x of [48, 64, 80]) { c.beginPath(); c.moveTo(x, 30); c.bezierCurveTo(x - 8, 20, x + 8, 14, x, 4); c.stroke(); }
  },
  poncho: (c) => {
    c.beginPath(); c.moveTo(64, 24); c.lineTo(114, 96); c.lineTo(14, 96); c.closePath();
    c.fillStyle = '#d9a35a'; c.fill(); outline(c);
    const bands = ['#c0392b', '#f2d16b', '#2e86c1', '#f2d16b', '#c0392b'];
    bands.forEach((col, i) => {
      const y = 50 + i * 9, w = 12 + (y - 24) * 0.7;
      c.fillStyle = col; c.beginPath(); c.moveTo(64 - w, y); c.lineTo(64 + w, y); c.lineTo(64 + w + 3, y + 5); c.lineTo(64 - w - 3, y + 5); c.closePath(); c.fill();
    });
    c.fillStyle = '#8a5a2b'; for (let x = 18; x <= 108; x += 8) c.fillRect(x, 96, 4, 14);
    circle(c, 64, 30, 12, '#7a4a28');
  },
  spicy_pizza: (c) => {
    circle(c, 64, 66, 50, rad(c, 64, 66, 50, [[0, '#f4c56a'], [1, '#c98a45']]));
    c.beginPath(); c.arc(64, 66, 50, 0, Math.PI * 2); outline(c);
    circle(c, 64, 66, 42, '#e3432e');
    c.fillStyle = '#ffe9a8';
    for (const [x, y, r] of [[48, 52, 12], [78, 50, 11], [60, 76, 13], [86, 78, 10], [40, 80, 9]]) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
    for (const [x, y, a] of [[56, 60, 0.6], [80, 66, -0.4], [46, 70, 1.2], [70, 88, 0.2]]) {
      c.save(); c.translate(x, y); c.rotate(a);
      c.fillStyle = '#c0102a'; c.beginPath(); c.ellipse(0, 0, 11, 4, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#3f8f37'; c.fillRect(-14, -1.5, 5, 3); c.restore();
    }
  },
  angora: (c) => {
    for (const [x, y, r] of [[48, 70, 26], [80, 66, 28], [64, 50, 26], [60, 84, 24], [88, 88, 18], [38, 88, 18]]) {
      circle(c, x, y, r, rad(c, x, y, r, [[0, '#ffffff'], [0.6, '#efe7dc'], [1, '#c9bba8']]));
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); outline(c, 2.5);
    }
    c.strokeStyle = 'rgba(160,140,120,0.35)'; c.lineWidth = 2;
    for (let i = 0; i < 18; i++) { const a = i * 1.7, r = 30 + (i % 3) * 6; c.beginPath(); c.arc(64 + Math.cos(a) * 12, 70 + Math.sin(a) * 10, r * 0.4, a, a + 1.2); c.stroke(); }
    c.fillStyle = '#f5b5c0'; c.beginPath(); c.ellipse(100, 36, 6, 14, 0.4, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f5b5c0'; c.beginPath(); c.ellipse(86, 30, 6, 14, -0.2, 0, Math.PI * 2); c.fill();
  },
};

export const isDrawn = (icon: string) => icon.startsWith('@') && !!PAINTERS[icon.slice(1)];

// paint a drawn icon centered at (x, y) with the given size into any canvas
export function paintIcon(c: CanvasRenderingContext2D, icon: string, x: number, y: number, size: number) {
  const p = PAINTERS[icon.slice(1)];
  if (!p) return;
  c.save();
  c.translate(x - size / 2, y - size / 2);
  c.scale(size / 128, size / 128);
  p(c);
  c.restore();
}

const urls = new Map<string, string>();
export function iconUrl(icon: string) {
  let u = urls.get(icon);
  if (u) return u;
  if (typeof document === 'undefined') return '';
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  paintIcon(cv.getContext('2d') as CanvasRenderingContext2D, icon, 64, 64, 128);
  u = cv.toDataURL();
  urls.set(icon, u);
  return u;
}

// draw a line of text that may contain drawn icons (tokens like "@peach_jam")
export function fillRich(c: CanvasRenderingContext2D, text: string, cx: number, cy: number, size: number, stroke: boolean) {
  const parts = text.split(/(@[a-z_]+)/g).filter(Boolean);
  const w = parts.reduce((a, p) => a + (isDrawn(p) ? size : c.measureText(p).width), 0);
  let x = cx - w / 2;
  const align = c.textAlign;
  c.textAlign = 'left';
  for (const p of parts) {
    if (isDrawn(p)) { paintIcon(c, p, x + size / 2, cy, size); x += size; continue; }
    if (stroke) c.strokeText(p, x, cy);
    c.fillText(p, x, cy);
    x += c.measureText(p).width;
  }
  c.textAlign = align;
}
