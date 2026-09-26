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

const PAINTERS: Record<string, Painter> = {
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
  turkey_feather: feather(['#e9d7b0', '#6b3f22']),
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
