import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";

/* ============================================================
   recompile(math) v2 — full curriculum edition
   One interactive chapter per video of 3Blue1Brown's
   "Essence of Linear Algebra" (16) and "Essence of Calculus" (12),
   plus a bonus gradient-descent chapter that ties it all to ML.
   ============================================================ */

const VIEW = 400;

function clientToSvg(svgEl, clientX, clientY) {
  const r = svgEl.getBoundingClientRect();
  return [((clientX - r.left) / r.width) * VIEW, ((clientY - r.top) / r.height) * VIEW];
}

const S = 30; // px per unit on the standard plane
const toPx = (x, y) => [200 + x * S, 200 - y * S];
const toMath = (px, py) => [(px - 200) / S, (200 - py) / S];

const fmt = (n, d = 2) => {
  if (!Number.isFinite(n)) return "—";
  const v = Number(n.toFixed(d));
  return Object.is(v, -0) ? (0).toFixed(d) : v.toFixed(d);
};
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ---------- design system ---------- */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

.mr-root {
  --bp-bg: #0d1c33; --bp-panel: #13294a; --bp-panel-2: #0f2240;
  --bp-line: rgba(125,178,255,0.16); --bp-line-strong: rgba(125,178,255,0.34);
  --bp-ink: #dbe8fb; --bp-dim: #8aa3c7;
  --bp-cyan: #5fc9f8; --bp-amber: #ffb454; --bp-green: #7be0ad; --bp-red: #ff6b81; --bp-purple: #b59df5;
  --mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --sans: 'Space Grotesk', system-ui, -apple-system, sans-serif;
  min-height: 100vh;
  background:
    linear-gradient(rgba(125,178,255,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(125,178,255,0.05) 1px, transparent 1px),
    var(--bp-bg);
  background-size: 28px 28px, 28px 28px, auto;
  color: var(--bp-ink); font-family: var(--sans); padding: 18px 14px 70px;
}
.mr-shell { max-width: 1080px; margin: 0 auto; }
.mr-header { display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-end; justify-content: space-between; border-bottom: 1px solid var(--bp-line-strong); padding-bottom: 14px; }
.mr-title { font-family: var(--mono); font-size: clamp(22px,4vw,34px); font-weight: 600; letter-spacing: -.5px; margin: 0; }
.mr-title .fn { color: var(--bp-cyan); } .mr-title .arg { color: var(--bp-amber); }
.mr-sub { color: var(--bp-dim); font-size: 13.5px; margin: 6px 0 0; max-width: 600px; line-height: 1.5; }
.mr-xpbox { min-width: 230px; }
.mr-level { font-family: var(--mono); font-size: 12px; color: var(--bp-amber); letter-spacing: 1px; text-transform: uppercase; }
.mr-xpbar { height: 8px; background: var(--bp-panel-2); border: 1px solid var(--bp-line-strong); border-radius: 99px; margin-top: 6px; overflow: hidden; }
.mr-xpfill { height: 100%; background: linear-gradient(90deg, var(--bp-cyan), var(--bp-green)); transition: width .5s ease; }
.mr-xpnum { font-family: var(--mono); font-size: 12px; color: var(--bp-dim); margin-top: 4px; text-align: right; }

.mr-tracks { display: flex; gap: 10px; margin: 16px 0 10px; }
.mr-track { font-family: var(--mono); font-size: 14px; padding: 10px 18px; border-radius: 9px; border: 1px solid var(--bp-line-strong); background: var(--bp-panel-2); color: var(--bp-dim); cursor: pointer; }
.mr-track.active { background: var(--bp-amber); color: #2b1a02; border-color: var(--bp-amber); font-weight: 700; }
.mr-track .count { font-size: 11px; opacity: .75; margin-left: 6px; }

.mr-chips { display: flex; gap: 7px; flex-wrap: wrap; margin: 10px 0 18px; }
.mr-chip { font-family: var(--mono); font-size: 12px; padding: 7px 10px; background: var(--bp-panel-2); color: var(--bp-dim); border: 1px solid var(--bp-line-strong); border-radius: 7px; cursor: pointer; transition: all .12s; }
.mr-chip:hover { color: var(--bp-ink); border-color: var(--bp-cyan); }
.mr-chip.active { background: var(--bp-cyan); color: #06182e; border-color: var(--bp-cyan); font-weight: 600; }
.mr-chip .done { color: var(--bp-green); margin-left: 5px; }
.mr-chip.active .done { color: #06532f; }

.mr-grid { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 18px; align-items: start; }
@media (max-width: 880px) { .mr-grid { grid-template-columns: 1fr; } }

.mr-panel { background: var(--bp-panel); border: 1px solid var(--bp-line-strong); border-radius: 12px; padding: 18px; }
.mr-eyebrow { font-family: var(--mono); font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--bp-purple); margin: 0 0 6px; }
.mr-panel h2 { font-family: var(--mono); font-size: 17px; margin: 0 0 10px; color: var(--bp-cyan); }
.mr-panel h3 { font-family: var(--mono); font-size: 13px; letter-spacing: 1px; text-transform: uppercase; color: var(--bp-amber); margin: 18px 0 8px; }
.mr-panel p { font-size: 14.5px; line-height: 1.65; margin: 0 0 10px; }
.mr-panel p.dim { color: var(--bp-dim); font-size: 13.5px; }
.mr-code { font-family: var(--mono); background: var(--bp-panel-2); border: 1px solid var(--bp-line); border-radius: 6px; padding: 1px 6px; font-size: 13px; color: var(--bp-green); white-space: nowrap; }
.mr-svgwrap { background: var(--bp-panel-2); border: 1px solid var(--bp-line-strong); border-radius: 12px; overflow: hidden; }
.mr-svgwrap svg { display: block; width: 100%; height: auto; touch-action: none; }
.mr-readout { font-family: var(--mono); font-size: 13px; background: var(--bp-panel-2); border: 1px solid var(--bp-line); border-radius: 8px; padding: 10px 12px; margin-top: 12px; line-height: 1.8; overflow-x: auto; }
.mr-btnrow { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.mr-btn { font-family: var(--mono); font-size: 12.5px; padding: 7px 12px; border-radius: 7px; border: 1px solid var(--bp-line-strong); background: var(--bp-panel-2); color: var(--bp-ink); cursor: pointer; transition: all .12s; }
.mr-btn:hover { border-color: var(--bp-cyan); color: var(--bp-cyan); }
.mr-btn.primary { background: var(--bp-cyan); color: #06182e; border-color: var(--bp-cyan); font-weight: 600; }
.mr-btn.primary:hover { filter: brightness(1.1); color: #06182e; }
.mr-btn:disabled { opacity: .45; cursor: default; }
.mr-slider { width: 100%; accent-color: var(--bp-cyan); margin-top: 2px; }
.mr-sliderlabel { font-family: var(--mono); font-size: 12.5px; color: var(--bp-dim); display: flex; justify-content: space-between; margin-top: 12px; }
.mr-challenge { margin-top: 14px; border: 1px dashed var(--bp-amber); border-radius: 10px; padding: 12px 14px; font-size: 13.5px; line-height: 1.55; }
.mr-challenge.done { border-color: var(--bp-green); }
.mr-challenge .tag { font-family: var(--mono); font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--bp-amber); display: block; margin-bottom: 4px; }
.mr-challenge.done .tag { color: var(--bp-green); }
.mr-quiz { margin-top: 18px; }
.mr-q { background: var(--bp-panel-2); border: 1px solid var(--bp-line); border-radius: 10px; padding: 14px; margin-bottom: 12px; }
.mr-q .qt { font-size: 14.5px; font-weight: 500; margin-bottom: 10px; line-height: 1.5; }
.mr-opts { display: grid; gap: 8px; }
.mr-opt { text-align: left; font-family: var(--mono); font-size: 13px; padding: 9px 12px; border-radius: 7px; border: 1px solid var(--bp-line-strong); background: transparent; color: var(--bp-ink); cursor: pointer; line-height: 1.45; }
.mr-opt:hover { border-color: var(--bp-cyan); }
.mr-opt.correct { border-color: var(--bp-green); color: var(--bp-green); background: rgba(123,224,173,.08); }
.mr-opt.wrong { border-color: var(--bp-red); color: var(--bp-red); background: rgba(255,107,129,.07); }
.mr-opt:disabled { cursor: default; }
.mr-expl { font-size: 13px; color: var(--bp-dim); margin-top: 10px; line-height: 1.6; border-left: 2px solid var(--bp-cyan); padding-left: 10px; }
.mr-caption { color: var(--bp-dim); font-size: 13.5px; line-height: 1.6; margin-top: 10px; }
.mr-nav { display: flex; justify-content: space-between; margin-top: 20px; }
.mr-toast { position: fixed; bottom: 22px; left: 50%; transform: translateX(-50%); background: var(--bp-green); color: #06301c; font-family: var(--mono); font-weight: 600; font-size: 14px; padding: 10px 18px; border-radius: 10px; box-shadow: 0 8px 30px rgba(0,0,0,.45); animation: mr-pop .25s ease; z-index: 50; }
@keyframes mr-pop { from { transform: translateX(-50%) translateY(12px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .mr-root * { transition: none !important; animation: none !important; } }
`;

/* ---------- gamification ---------- */
const MAX_XP = 740; // 58 quiz questions x 10 + 8 challenges x 20
const LEVELS = [
  { at: 0, name: "import math  # again" },
  { at: 110, name: "Span Cadet" },
  { at: 240, name: "Matrix Mechanic" },
  { at: 380, name: "Chain Rule Operator" },
  { at: 520, name: "Eigen Hunter" },
  { at: 660, name: "Gradient Whisperer" },
];
const levelFor = (xp) => LEVELS.reduce((cur, l) => (xp >= l.at ? l : cur), LEVELS[0]);

/* ---------- generic pieces ---------- */
function Quiz({ questions, award, qstate, setQstate }) {
  return (
    <div className="mr-quiz">
      <h3>Checkpoint — 10 XP each</h3>
      {questions.map((q, qi) => {
        const picked = qstate[qi];
        const answered = picked !== undefined;
        return (
          <div className="mr-q" key={qi}>
            <div className="qt">{qi + 1}. {q.q}</div>
            <div className="mr-opts">
              {q.opts.map((opt, oi) => {
                let cls = "mr-opt";
                if (answered && oi === q.a) cls += " correct";
                else if (answered && oi === picked && picked !== q.a) cls += " wrong";
                return (
                  <button key={oi} className={cls} disabled={answered}
                    onClick={() => { setQstate({ ...qstate, [qi]: oi }); if (oi === q.a) award(10, "Correct! +10 XP"); }}>
                    {opt}
                  </button>
                );
              })}
            </div>
            {answered && <div className="mr-expl">{q.expl}</div>}
          </div>
        );
      })}
    </div>
  );
}

function Challenge({ done, children }) {
  return (
    <div className={"mr-challenge" + (done ? " done" : "")}>
      <span className="tag">{done ? "✓ challenge complete (+20 XP)" : "challenge"}</span>
      {children}
    </div>
  );
}

function Slider({ label, value, set, min, max, step = 0.01, d = 2 }) {
  return (
    <div>
      <div className="mr-sliderlabel"><span>{label}</span><span>{fmt(value, d)}</span></div>
      <input className="mr-slider" type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => set(parseFloat(e.target.value))} />
    </div>
  );
}

function useSvgDrag(svgRef, onMove) {
  const dragging = useRef(null);
  const start = (id) => (e) => {
    e.preventDefault(); dragging.current = id;
    e.target.setPointerCapture && e.target.setPointerCapture(e.pointerId);
  };
  const move = (e) => {
    if (!dragging.current || !svgRef.current) return;
    const [px, py] = clientToSvg(svgRef.current, e.clientX, e.clientY);
    onMove(dragging.current, px, py);
  };
  const end = () => { dragging.current = null; };
  return { start, move, end };
}

function PlaneAxes() {
  const lines = [];
  for (let i = -6; i <= 6; i++) {
    if (i === 0) continue;
    const [x1] = toPx(i, 0); const [, y1] = toPx(0, i);
    lines.push(<line key={"v" + i} x1={x1} y1={0} x2={x1} y2={VIEW} stroke="var(--bp-line)" strokeWidth="1" />);
    lines.push(<line key={"h" + i} x1={0} y1={y1} x2={VIEW} y2={y1} stroke="var(--bp-line)" strokeWidth="1" />);
  }
  return (
    <g>
      {lines}
      <line x1={200} y1={0} x2={200} y2={VIEW} stroke="var(--bp-line-strong)" strokeWidth="1.5" />
      <line x1={0} y1={200} x2={VIEW} y2={200} stroke="var(--bp-line-strong)" strokeWidth="1.5" />
    </g>
  );
}

function TGrid({ m, color = "var(--bp-cyan)" }) {
  const [a, b, c, d] = m;
  const T = (x, y) => toPx(a * x + c * y, b * x + d * y);
  const lines = [];
  for (let i = -4; i <= 4; i++) {
    const [x1, y1] = T(i, -6), [x2, y2] = T(i, 6);
    const [x3, y3] = T(-6, i), [x4, y4] = T(6, i);
    lines.push(<line key={"tv" + i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeOpacity={i === 0 ? 0.5 : 0.18} strokeWidth="1" />);
    lines.push(<line key={"th" + i} x1={x3} y1={y3} x2={x4} y2={y4} stroke={color} strokeOpacity={i === 0 ? 0.5 : 0.18} strokeWidth="1" />);
  }
  return <g>{lines}</g>;
}

function Arrow({ from = [200, 200], to, color, width = 3, dash, label }) {
  const [x1, y1] = from, [x2, y2] = to;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const hx = x2 - ux * 10, hy = y2 - uy * 10;
  const px = -uy, py = ux;
  return (
    <g>
      <line x1={x1} y1={y1} x2={hx} y2={hy} stroke={color} strokeWidth={width} strokeDasharray={dash} strokeLinecap="round" />
      <polygon points={`${x2},${y2} ${hx + px * 5},${hy + py * 5} ${hx - px * 5},${hy - py * 5}`} fill={color} />
      {label && <text x={x2 + ux * 16} y={y2 + uy * 16} fill={color} fontSize="15" fontFamily="var(--mono)" fontWeight="600" textAnchor="middle" dominantBaseline="middle">{label}</text>}
    </g>
  );
}

function Handle({ at, color, onPointerDown, r = 11 }) {
  return <circle cx={at[0]} cy={at[1]} r={r} fill={color} fillOpacity="0.25" stroke={color} strokeWidth="2" style={{ cursor: "grab" }} onPointerDown={onPointerDown} />;
}

/* function-plot mapping: x,y in [-4.4, 4.4] */
const FX = 45, FY = 42;
const fToPx = (x, y) => [200 + x * FX, 200 - y * FY];
function curvePath(f, x0 = -4.4, x1 = 4.4, color) {
  const pts = [];
  for (let i = 0; i <= 220; i++) {
    const x = x0 + ((x1 - x0) * i) / 220;
    const y = f(x);
    if (Number.isFinite(y) && Math.abs(y) < 60) {
      const [px, py] = fToPx(x, clamp(y, -4.7, 4.7));
      pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
    }
  }
  return pts.join(" ");
}

/* two-column lesson wrapper */
function Lesson({ eyebrow, title, viz, caption, children }) {
  return (
    <div className="mr-grid">
      <div className="mr-panel">
        <p className="mr-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {children}
      </div>
      <div className="mr-panel">
        <div className="mr-svgwrap">{viz}</div>
        {caption && <p className="mr-caption">{caption}</p>}
      </div>
    </div>
  );
}

/* ============================================================
   LINEAR ALGEBRA — chapters 1..16
   ============================================================ */

/* LA1 — Vectors, what even are they? */
function LA1({ award, qstate, setQstate }) {
  const svgRef = useRef(null);
  const [v, setV] = useState([3, 2]);
  const drag = useSvgDrag(svgRef, (_id, px, py) => {
    const [x, y] = toMath(px, py);
    setV([clamp(x, -6, 6), clamp(y, -6, 6)]);
  });
  const pv = toPx(v[0], v[1]);
  return (
    <Lesson eyebrow="essence of linear algebra · ch 1" title="Vectors, what even are they?"
      caption="Drag the handle. One object, three lenses: arrow (physics), point (math), array (you)."
      viz={
        <svg ref={svgRef} viewBox={`0 0 ${VIEW} ${VIEW}`} onPointerMove={drag.move} onPointerUp={drag.end} onPointerLeave={drag.end}>
          <PlaneAxes />
          <line x1={pv[0]} y1={pv[1]} x2={pv[0]} y2={200} stroke="var(--bp-amber)" strokeDasharray="4 4" strokeWidth="1.5" />
          <line x1={pv[0]} y1={pv[1]} x2={200} y2={pv[1]} stroke="var(--bp-amber)" strokeDasharray="4 4" strokeWidth="1.5" />
          <Arrow to={pv} color="var(--bp-cyan)" label="v" />
          <circle cx={pv[0]} cy={pv[1]} r="4" fill="var(--bp-green)" />
          <Handle at={pv} color="var(--bp-cyan)" onPointerDown={drag.start("v")} />
        </svg>
      }>
      <p>Three communities, one object. The physicist says <b>arrow</b>: length + direction, root it anywhere. The CS person says <b>list of numbers</b>: <span className="mr-code">[{fmt(v[0],1)}, {fmt(v[1],1)}]</span>. The mathematician says: anything you can add and scale.</p>
      <p>Linear algebra lives in the translation: every arrow rooted at the origin <b>is</b> its coordinate list, and every coordinate list <b>is</b> an arrow. The dashed lines show the decomposition into x and y components.</p>
      <p className="dim">ML connection: an embedding is this exact picture in 1,536 dimensions. You can't draw it, but every intuition built here transfers.</p>
      <div className="mr-readout">
        v = [{fmt(v[0])}, {fmt(v[1])}]<br />
        |v| = √(x² + y²) = {fmt(Math.hypot(v[0], v[1]))}
      </div>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "In linear algebra, vectors are almost always rooted at…", opts: ["their midpoint", "the origin", "the x-axis", "anywhere convenient"], a: 1, expl: "Rooting at the origin makes the arrow ↔ coordinates correspondence exact: one arrow per list of numbers." },
        { q: "The two operations that define everything in linear algebra are…", opts: ["addition and scalar multiplication", "dot and cross product", "rotation and reflection", "transpose and inverse"], a: 0, expl: "Vector addition and scaling. Every concept in this series — span, transformations, eigenvectors — is built from these two." },
      ]} />
    </Lesson>
  );
}

/* LA2 — Linear combinations, span, basis */
function LA2({ award, qstate, setQstate, challenges, completeChallenge }) {
  const svgRef = useRef(null);
  const [v, setV] = useState([2, 1]);
  const [w, setW] = useState([-1, 2]);
  const [a, setA] = useState(1.2);
  const [b, setB] = useState(0.8);
  const drag = useSvgDrag(svgRef, (id, px, py) => {
    const [x, y] = toMath(px, py);
    const p = [clamp(x, -5, 5), clamp(y, -5, 5)];
    if (id === "v") setV(p); else setW(p);
  });
  const cross = v[0] * w[1] - v[1] * w[0];
  const collinear = Math.abs(cross) < 0.18 && Math.hypot(...v) > 0.5 && Math.hypot(...w) > 0.5;
  const done = challenges.has("la2");
  useEffect(() => { if (!done && collinear) completeChallenge("la2"); }, [collinear, done, completeChallenge]);

  const p = [a * v[0] + b * w[0], a * v[1] + b * w[1]];
  const lattice = [];
  for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
    const [lx, ly] = toPx(i * v[0] + j * w[0], i * v[1] + j * w[1]);
    if (lx > -20 && lx < 420 && ly > -20 && ly < 420)
      lattice.push(<circle key={`${i},${j}`} cx={lx} cy={ly} r="2" fill="var(--bp-purple)" fillOpacity="0.45" />);
  }
  const pv = toPx(...v), pw = toPx(...w), pp = toPx(...p);
  return (
    <Lesson eyebrow="essence of linear algebra · ch 2" title="Linear combinations, span & basis"
      caption="Purple dots: integer combinations of v and w. Green: your combination a·v + b·w. Make v and w collinear and watch 2D reach collapse to a line."
      viz={
        <svg ref={svgRef} viewBox={`0 0 ${VIEW} ${VIEW}`} onPointerMove={drag.move} onPointerUp={drag.end} onPointerLeave={drag.end}>
          <PlaneAxes />
          {lattice}
          {collinear && <line x1={200 - v[0] * 70} y1={200 + v[1] * 70} x2={200 + v[0] * 70} y2={200 - v[1] * 70} stroke="var(--bp-red)" strokeWidth="2" strokeOpacity="0.6" />}
          <Arrow to={pv} color="var(--bp-cyan)" label="v" />
          <Arrow to={pw} color="var(--bp-amber)" label="w" />
          <Arrow to={pp} color="var(--bp-green)" width={2.5} dash="6 5" label="av+bw" />
          <Handle at={pv} color="var(--bp-cyan)" onPointerDown={drag.start("v")} />
          <Handle at={pw} color="var(--bp-amber)" onPointerDown={drag.start("w")} />
        </svg>
      }>
      <p>A <b>linear combination</b> is the only move you're allowed: scale vectors, then add. <span className="mr-code">a·v + b·w</span>. The <b>span</b> of v and w is every point you can reach this way.</p>
      <p>Two independent vectors span the whole plane — they form a <b>basis</b>. If one is a scaled copy of the other (linearly <b>dependent</b>), your reach collapses to a line.</p>
      <Slider label="a (scales v)" value={a} set={setA} min={-2.5} max={2.5} />
      <Slider label="b (scales w)" value={b} set={setB} min={-2.5} max={2.5} />
      <div className="mr-readout">
        av + bw = [{fmt(p[0])}, {fmt(p[1])}]<br />
        independence (cross) = <b style={{ color: collinear ? "var(--bp-red)" : "var(--bp-green)" }}>{fmt(cross)}</b>{collinear ? "  ← span is a LINE" : "  ← spans the plane"}
      </div>
      <Challenge done={done}>Drag w until it's (nearly) a scaled copy of v. The lattice flattens onto one red line — you've made the vectors linearly dependent.</Challenge>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "The span of two linearly dependent 2D vectors is…", opts: ["the whole plane", "a line (or just the origin)", "two lines", "empty"], a: 1, expl: "If w = k·v, every combination av + bw = (a + bk)v stays on v's line." },
        { q: "A basis of a space is a set of vectors that is…", opts: ["any two vectors", "linearly independent AND spans the space", "orthogonal, always", "made of unit vectors"], a: 1, expl: "Independence: no redundancy. Spanning: full reach. Orthogonal/unit is nice-to-have, not required." },
      ]} />
    </Lesson>
  );
}

/* LA3 — Linear transformations and matrices */
function LA3({ award, qstate, setQstate }) {
  const svgRef = useRef(null);
  const [m, setM] = useState([1.4, 0.5, -0.3, 1.1]);
  const [a, b, c, d] = m;
  const drag = useSvgDrag(svgRef, (id, px, py) => {
    const [x, y] = toMath(px, py);
    const cl = (v) => clamp(v, -5, 5);
    setM((p) => id === "i" ? [cl(x), cl(y), p[2], p[3]] : [p[0], p[1], cl(x), cl(y)]);
  });
  const pi = toPx(a, b), pj = toPx(c, d);
  const tv = [a * 2 + c * 1, b * 2 + d * 1]; // where (2,1) lands
  const ptv = toPx(...tv);
  return (
    <Lesson eyebrow="essence of linear algebra · ch 3" title="Linear transformations & matrices"
      caption="Drag î and ĵ. The green dot is where the point (2,1) lands: 2·(new î) + 1·(new ĵ). Lines stay lines, origin stays put — that's what 'linear' means."
      viz={
        <svg ref={svgRef} viewBox={`0 0 ${VIEW} ${VIEW}`} onPointerMove={drag.move} onPointerUp={drag.end} onPointerLeave={drag.end}>
          <PlaneAxes />
          <TGrid m={m} />
          <Arrow to={pi} color="var(--bp-cyan)" label="î" />
          <Arrow to={pj} color="var(--bp-amber)" label="ĵ" />
          <Arrow to={ptv} color="var(--bp-green)" width={2.5} dash="6 4" label="(2,1)→" />
          <Handle at={pi} color="var(--bp-cyan)" onPointerDown={drag.start("i")} />
          <Handle at={pj} color="var(--bp-amber)" onPointerDown={drag.start("j")} />
        </svg>
      }>
      <p>A matrix is not a table — it's a <b>function on space</b>. And it's fully determined by two facts: where <span className="mr-code">î=[1,0]</span> lands and where <span className="mr-code">ĵ=[0,1]</span> lands. Those landing spots are the matrix's <b>columns</b>.</p>
      <p>Any point [x, y] = x·î + y·ĵ, and linearity preserves that recipe: it lands at x·(new î) + y·(new ĵ). Matrix-vector multiplication is just this sentence written in symbols.</p>
      <div className="mr-readout">
        M = [ {fmt(a)}  {fmt(c)} ]    columns = images of î, ĵ<br />
        {"     "}[ {fmt(b)}  {fmt(d)} ]<br />
        M·[2,1] = 2·î' + 1·ĵ' = [{fmt(tv[0])}, {fmt(tv[1])}]
      </div>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "The columns of a matrix tell you…", opts: ["its eigenvalues", "where the basis vectors land", "its row space", "nothing geometric"], a: 1, expl: "Column 1 = image of î, column 2 = image of ĵ. That's the whole decoder ring for reading matrices." },
        { q: "A transformation is linear iff…", opts: ["it keeps grid lines parallel & evenly spaced, origin fixed", "it preserves all lengths", "it has positive determinant", "it's invertible"], a: 0, expl: "Lines stay lines, spacing stays even, origin stays put. Rotations, shears, scalings: yes. Translations: no (origin moves)." },
      ]} />
    </Lesson>
  );
}

/* LA4 — Matrix multiplication as composition */
function LA4({ award, qstate, setQstate }) {
  const [theta, setTheta] = useState(40);
  const [k, setK] = useState(0.8);
  const [order, setOrder] = useState("RS"); // RS = shear first then rotate (R·S); SR = rotate first then shear
  const t = (theta * Math.PI) / 180;
  const R = [Math.cos(t), Math.sin(t), -Math.sin(t), Math.cos(t)];
  const Sh = [1, 0, k, 1];
  const mul = (A, B) => [ // A·B, both [a,b,c,d] column-major 2x2
    A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1],
    A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3],
  ];
  const M = order === "RS" ? mul(R, Sh) : mul(Sh, R);
  const pi = toPx(M[0], M[1]), pj = toPx(M[2], M[3]);
  return (
    <Lesson eyebrow="essence of linear algebra · ch 4" title="Matrix multiplication = composition"
      caption="The grid shows the combined transformation. Flip the order button — same two ingredients, different result. Multiplication order matters because function order matters."
      viz={
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`}>
          <PlaneAxes />
          <TGrid m={M} />
          <Arrow to={pi} color="var(--bp-cyan)" label="î" />
          <Arrow to={pj} color="var(--bp-amber)" label="ĵ" />
        </svg>
      }>
      <p>Multiplying matrices means <b>applying one transformation after another</b>. Read it right-to-left, like function composition: <span className="mr-code">M₂·M₁</span> means "do M₁ first, then M₂" — exactly like <span className="mr-code">f(g(x))</span>.</p>
      <p>That's also why <b>AB ≠ BA</b> in general: shearing then rotating is visibly different from rotating then shearing. Try it.</p>
      <Slider label="rotation θ (deg)" value={theta} set={setTheta} min={0} max={180} step={1} d={0} />
      <Slider label="shear k" value={k} set={setK} min={-1.5} max={1.5} />
      <div className="mr-btnrow">
        <button className={"mr-btn" + (order === "RS" ? " primary" : "")} onClick={() => setOrder("RS")}>shear, then rotate (R·S)</button>
        <button className={"mr-btn" + (order === "SR" ? " primary" : "")} onClick={() => setOrder("SR")}>rotate, then shear (S·R)</button>
      </div>
      <div className="mr-readout">
        {order === "RS" ? "R·S" : "S·R"} = [ {fmt(M[0])}  {fmt(M[2])} ]<br />
        {"          "}[ {fmt(M[1])}  {fmt(M[3])} ]
      </div>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "Applying A first and then B corresponds to the product…", opts: ["A·B", "B·A", "A + B", "either, they're equal"], a: 1, expl: "(BA)x = B(Ax): the rightmost matrix touches the vector first. Same convention as f∘g." },
        { q: "Matrix multiplication is, in general…", opts: ["commutative and associative", "associative but NOT commutative", "commutative but not associative", "neither"], a: 1, expl: "(AB)C = A(BC) always — composing the same three functions in the same order. But AB ≠ BA, as the toggle shows." },
      ]} />
    </Lesson>
  );
}

/* LA5 — 3D linear transformations */
function LA5({ award, qstate, setQstate }) {
  const [ax, setAx] = useState(25);
  const [ay, setAy] = useState(-30);
  const [sc, setSc] = useState(1);
  const ra = (ax * Math.PI) / 180, rb = (ay * Math.PI) / 180;
  // M = scale · Ry · Rx (3x3, row-major rows)
  const Rx = [[1, 0, 0], [0, Math.cos(ra), -Math.sin(ra)], [0, Math.sin(ra), Math.cos(ra)]];
  const Ry = [[Math.cos(rb), 0, Math.sin(rb)], [0, 1, 0], [-Math.sin(rb), 0, Math.cos(rb)]];
  const mul3 = (A, B) => A.map((r, i) => B[0].map((_, j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
  const M0 = mul3(Ry, Rx);
  const M = M0.map((r) => r.map((v) => v * sc));
  const ap = (p) => [
    M[0][0] * p[0] + M[0][1] * p[1] + M[0][2] * p[2],
    M[1][0] * p[0] + M[1][1] * p[1] + M[1][2] * p[2],
    M[2][0] * p[0] + M[2][1] * p[1] + M[2][2] * p[2],
  ];
  const proj = ([x, y, z]) => [200 + (x + z * 0.0) * 52, 200 - y * 52]; // orthographic
  const C = 1.4;
  const corners = [];
  for (const sx of [-C, C]) for (const sy of [-C, C]) for (const sz of [-C, C]) corners.push([sx, sy, sz]);
  const edges = [];
  for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) {
    const diff = corners[i].filter((v, kk) => v !== corners[j][kk]).length;
    if (diff === 1) edges.push([i, j]);
  }
  const P = corners.map((p) => proj(ap(p)));
  const axes3 = [[2.4, 0, 0], [0, 2.4, 0], [0, 0, 2.4]].map(ap).map(proj);
  return (
    <Lesson eyebrow="essence of linear algebra · ch 5" title="Three-dimensional transformations"
      caption="A wireframe cube under a 3×3 transformation (two rotations + uniform scale), projected onto your screen. Cyan/amber/green arrows: the images of î, ĵ, k̂."
      viz={
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`}>
          <PlaneAxes />
          {edges.map(([i, j], n) => (
            <line key={n} x1={P[i][0]} y1={P[i][1]} x2={P[j][0]} y2={P[j][1]} stroke="var(--bp-ink)" strokeOpacity="0.55" strokeWidth="1.5" />
          ))}
          <Arrow to={axes3[0]} color="var(--bp-cyan)" width={2.5} label="î" />
          <Arrow to={axes3[1]} color="var(--bp-amber)" width={2.5} label="ĵ" />
          <Arrow to={axes3[2]} color="var(--bp-green)" width={2.5} label="k̂" />
        </svg>
      }>
      <p>Nothing new — just one more basis vector. A 3×3 matrix is pinned down by where <b>three</b> basis vectors î, ĵ, k̂ land, and its three columns record exactly that.</p>
      <p>Composition, determinants (now volume scaling), inverses: every 2D idea carries over unchanged. This is why the 2D intuition is worth building — it scales to n dimensions where you can't see anymore.</p>
      <Slider label="rotate about x (deg)" value={ax} set={setAx} min={-90} max={90} step={1} d={0} />
      <Slider label="rotate about y (deg)" value={ay} set={setAy} min={-90} max={90} step={1} d={0} />
      <Slider label="uniform scale" value={sc} set={setSc} min={0.4} max={1.6} />
      <div className="mr-readout">
        M = [ {fmt(M[0][0])}  {fmt(M[0][1])}  {fmt(M[0][2])} ]<br />
        {"     "}[ {fmt(M[1][0])}  {fmt(M[1][1])}  {fmt(M[1][2])} ]<br />
        {"     "}[ {fmt(M[2][0])}  {fmt(M[2][1])}  {fmt(M[2][2])} ]   det ≈ {fmt(sc ** 3, 2)}
      </div>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "A 3×3 matrix is fully determined by…", opts: ["its diagonal", "where î, ĵ and k̂ land (its 3 columns)", "its determinant", "its trace and det"], a: 1, expl: "Same decoder ring as 2D: columns = images of basis vectors. Every other point follows by linearity." },
        { q: "In 3D, the determinant measures the scaling factor of…", opts: ["length", "area", "volume", "angles"], a: 2, expl: "2D det scales areas; 3D det scales volumes. In n dimensions: n-dimensional volume." },
      ]} />
    </Lesson>
  );
}

/* LA6 — The determinant */
function LA6({ award, qstate, setQstate, challenges, completeChallenge }) {
  const svgRef = useRef(null);
  const [m, setM] = useState([1.6, 0.4, 0.3, 1.2]);
  const [a, b, c, d] = m;
  const det = a * d - b * c;
  const drag = useSvgDrag(svgRef, (id, px, py) => {
    const [x, y] = toMath(px, py);
    const cl = (v) => clamp(v, -5, 5);
    setM((p) => id === "i" ? [cl(x), cl(y), p[2], p[3]] : [p[0], p[1], cl(x), cl(y)]);
  });
  const done = challenges.has("la6");
  useEffect(() => { if (!done && det < -0.15) completeChallenge("la6"); }, [det, done, completeChallenge]);
  const pi = toPx(a, b), pj = toPx(c, d), pij = toPx(a + c, b + d);
  return (
    <Lesson eyebrow="essence of linear algebra · ch 6" title="The determinant"
      caption="The shaded parallelogram is the image of the unit square; its area is |det|. It turns red when orientation flips (det < 0)."
      viz={
        <svg ref={svgRef} viewBox={`0 0 ${VIEW} ${VIEW}`} onPointerMove={drag.move} onPointerUp={drag.end} onPointerLeave={drag.end}>
          <PlaneAxes />
          <TGrid m={m} />
          <polygon points={`200,200 ${pi[0]},${pi[1]} ${pij[0]},${pij[1]} ${pj[0]},${pj[1]}`} fill={det < 0 ? "var(--bp-red)" : "var(--bp-green)"} fillOpacity="0.15" />
          <Arrow to={pi} color="var(--bp-cyan)" label="î" />
          <Arrow to={pj} color="var(--bp-amber)" label="ĵ" />
          <Handle at={pi} color="var(--bp-cyan)" onPointerDown={drag.start("i")} />
          <Handle at={pj} color="var(--bp-amber)" onPointerDown={drag.start("j")} />
        </svg>
      }>
      <p>The determinant answers one geometric question: <b>by how much does this transformation scale areas?</b> det = 3 → every region triples in area. det = ½ → halves. det = 0 → crushed flat.</p>
      <p>A <b>negative</b> determinant means areas scale by |det| but space gets <b>flipped</b> — orientation inverts, like turning the plane over. The formula <span className="mr-code">ad − bc</span> is just this area, computed.</p>
      <div className="mr-readout">
        M = [ {fmt(a)}  {fmt(c)} ]<br />
        {"     "}[ {fmt(b)}  {fmt(d)} ]<br />
        det = ad − bc = <b style={{ color: det < -0.001 ? "var(--bp-red)" : Math.abs(det) < 0.06 ? "var(--bp-amber)" : "var(--bp-green)" }}>{fmt(det)}</b>
      </div>
      <Challenge done={done}>Drag the basis vectors until det {"<"} 0 — watch the shading flip to red as î crosses over ĵ.</Challenge>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "det(M₁·M₂) equals…", opts: ["det(M₁) + det(M₂)", "det(M₁) · det(M₂)", "det(M₁) − det(M₂)", "always 1"], a: 1, expl: "Scale areas by f₂, then by f₁ → total scaling f₁·f₂. The geometric view makes this 'theorem' obvious." },
        { q: "If det(M) = 0, then M…", opts: ["is the identity", "squashes space into a lower dimension", "rotates space", "flips orientation"], a: 1, expl: "Zero area factor: the plane collapses to a line or point. (And as ch 7 shows, that's exactly when no inverse exists.)" },
      ]} />
    </Lesson>
  );
}

/* LA7 — Inverse matrices, column space, null space */
function LA7({ award, qstate, setQstate, challenges, completeChallenge }) {
  const svgRef = useRef(null);
  const [m, setM] = useState([1.3, 0.4, -0.5, 1.1]);
  const [a, b, c, d] = m;
  const det = a * d - b * c;
  const drag = useSvgDrag(svgRef, (id, px, py) => {
    const [x, y] = toMath(px, py);
    const cl = (v) => clamp(v, -5, 5);
    setM((p) => id === "i" ? [cl(x), cl(y), p[2], p[3]] : [p[0], p[1], cl(x), cl(y)]);
  });
  const mag = Math.hypot(a, b) + Math.hypot(c, d);
  const rank = Math.abs(det) > 0.06 ? 2 : mag > 0.3 ? 1 : 0;
  const done = challenges.has("la7");
  useEffect(() => { if (!done && rank === 1 && mag > 1.2) completeChallenge("la7"); }, [rank, mag, done, completeChallenge]);
  const pi = toPx(a, b), pj = toPx(c, d);
  // null space direction when rank 1: vector (x,y) with ax+cy=0, bx+dy=0 → direction (c,-a) (or (d,-b))
  const nv = Math.hypot(c, a) > 0.1 ? [c, -a] : [d, -b];
  const nlen = Math.hypot(...nv) || 1;
  const nu = [nv[0] / nlen, nv[1] / nlen];
  return (
    <Lesson eyebrow="essence of linear algebra · ch 7" title="Inverse, column space, null space"
      caption="Rank 2: grid covers the plane, inverse exists. Collapse to rank 1: the column space is the cyan line, and the red dashed line (null space) is everything that gets crushed to zero."
      viz={
        <svg ref={svgRef} viewBox={`0 0 ${VIEW} ${VIEW}`} onPointerMove={drag.move} onPointerUp={drag.end} onPointerLeave={drag.end}>
          <PlaneAxes />
          <TGrid m={m} />
          {rank === 1 && <line x1={200 - nu[0] * 200} y1={200 + nu[1] * 200} x2={200 + nu[0] * 200} y2={200 - nu[1] * 200} stroke="var(--bp-red)" strokeWidth="2" strokeDasharray="7 5" />}
          <Arrow to={pi} color="var(--bp-cyan)" label="î" />
          <Arrow to={pj} color="var(--bp-amber)" label="ĵ" />
          <Handle at={pi} color="var(--bp-cyan)" onPointerDown={drag.start("i")} />
          <Handle at={pj} color="var(--bp-amber)" onPointerDown={drag.start("j")} />
        </svg>
      }>
      <p>Solving <span className="mr-code">Ax = b</span> geometrically: find the vector x that <b>lands on</b> b. If A doesn't crush space (det ≠ 0), you can run the film backwards — that rewind is <b>A⁻¹</b>.</p>
      <p><b>Column space</b>: all possible outputs (the span of the columns). <b>Rank</b>: its dimension. <b>Null space</b>: every input that gets squashed onto the zero vector. Crush the plane to a line and a whole line of inputs dies at the origin.</p>
      <div className="mr-readout">
        det = {fmt(det)}   rank = <b style={{ color: rank === 2 ? "var(--bp-green)" : "var(--bp-red)" }}>{rank}</b><br />
        {Math.abs(det) > 0.06 ? (
          <>A⁻¹ = (1/det)·[ {fmt(d)}  {fmt(-c)} ]  [ {fmt(-b)}  {fmt(a)} ]</>
        ) : (
          <>A⁻¹ = none — information was destroyed</>
        )}
      </div>
      <Challenge done={done}>Make the matrix rank 1 (det ≈ 0) without shrinking both vectors to zero. The red dashed line is the null space appearing.</Challenge>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "A matrix has an inverse exactly when…", opts: ["det ≠ 0", "det > 0", "it's symmetric", "rank = 1"], a: 0, expl: "No crushing → every output has exactly one input → the transformation can be undone." },
        { q: "The null space of A is…", opts: ["all outputs of A", "all vectors A sends to the zero vector", "the columns of A", "vectors A leaves unchanged"], a: 1, expl: "The set of solutions to Ax = 0. For full-rank A it's just {0}; once A crushes a dimension, a whole line (or more) maps to zero." },
      ]} />
    </Lesson>
  );
}

/* LA8 — Nonsquare matrices */
function LA8({ award, qstate, setQstate }) {
  const svgRef = useRef(null);
  const [L, setL] = useState([1.2, 0.8]); // 1x2 matrix [a b]: 2D → 1D
  const [p, setP] = useState([2, 1.5]);
  const drag = useSvgDrag(svgRef, (id, px, py) => {
    const [x, y] = toMath(px, py);
    if (id === "p") setP([clamp(x, -5, 5), clamp(y, -3.2, 5)]);
  });
  const [a, b] = L;
  const out = a * p[0] + b * p[1];
  const pp = toPx(...p);
  // null line: ax + by = 0 → direction (b, -a)
  const nlen = Math.hypot(b, a) || 1;
  const nu = [b / nlen, -a / nlen];
  const NL_Y = 360, NL_S = 26;
  const outX = clamp(200 + out * NL_S, 8, 392);
  return (
    <Lesson eyebrow="essence of linear algebra · ch 8" title="Nonsquare matrices: between dimensions"
      caption="Top: the input plane with a draggable point and the null-space line (dashed). Bottom: the 1D output line — where your 2D point lands after the 1×2 matrix flattens it."
      viz={
        <svg ref={svgRef} viewBox={`0 0 ${VIEW} ${VIEW}`} onPointerMove={drag.move} onPointerUp={drag.end} onPointerLeave={drag.end}>
          <PlaneAxes />
          <line x1={200 - nu[0] * 220} y1={200 + nu[1] * 220} x2={200 + nu[0] * 220} y2={200 - nu[1] * 220} stroke="var(--bp-red)" strokeWidth="1.5" strokeDasharray="6 5" />
          <Arrow to={pp} color="var(--bp-cyan)" label="p" />
          <Handle at={pp} color="var(--bp-cyan)" onPointerDown={drag.start("p")} />
          <rect x="0" y={NL_Y - 24} width="400" height="60" fill="var(--bp-bg)" opacity="0.65" />
          <line x1="10" y1={NL_Y} x2="390" y2={NL_Y} stroke="var(--bp-line-strong)" strokeWidth="2" />
          {[-6, -4, -2, 0, 2, 4, 6].map((t) => (
            <g key={t}>
              <line x1={200 + t * NL_S} y1={NL_Y - 5} x2={200 + t * NL_S} y2={NL_Y + 5} stroke="var(--bp-dim)" />
              <text x={200 + t * NL_S} y={NL_Y + 18} fill="var(--bp-dim)" fontSize="10" fontFamily="var(--mono)" textAnchor="middle">{t}</text>
            </g>
          ))}
          <line x1={pp[0]} y1={pp[1]} x2={outX} y2={NL_Y} stroke="var(--bp-green)" strokeWidth="1.5" strokeDasharray="3 4" strokeOpacity="0.7" />
          <circle cx={outX} cy={NL_Y} r="6" fill="var(--bp-green)" />
        </svg>
      }>
      <p>The shape of a matrix is a type signature. An <b>m×n</b> matrix maps n-dimensional inputs to m-dimensional outputs — <span className="mr-code">f: Rⁿ → Rᵐ</span>. Square is the special case where input and output dimensions match.</p>
      <p>Here a <b>1×2</b> matrix <span className="mr-code">[{fmt(a, 1)} {fmt(b, 1)}]</span> flattens the plane onto a number line. The dashed red line is everything that lands on 0 — an entire dimension of information, gone. (Foreshadowing ch 9: this flattening IS the dot product.)</p>
      <Slider label="L[0]" value={a} set={(v) => setL([v, b])} min={-2} max={2} />
      <Slider label="L[1]" value={b} set={(v) => setL([a, v])} min={-2} max={2} />
      <div className="mr-readout">
        L·p = {fmt(a)}·{fmt(p[0])} + {fmt(b)}·{fmt(p[1])} = <b>{fmt(out)}</b>
      </div>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "A 2×3 matrix maps…", opts: ["2D inputs to 3D outputs", "3D inputs to 2D outputs", "2D to 2D", "3D to 3D"], a: 1, expl: "Rows = output dimension, columns = input dimension. Three columns: three basis vectors come in; each lands as a 2D point." },
        { q: "In a neural net, a layer with weight matrix of shape 512×1536 takes…", opts: ["512-dim vectors to 1536-dim", "1536-dim vectors to 512-dim", "only square inputs", "scalars to vectors"], a: 1, expl: "Same rule at scale: W·x with W ∈ R^(512×1536) eats a 1536-vector and emits a 512-vector. Layers are dimension-hopping linear maps." },
      ]} />
    </Lesson>
  );
}

/* LA9 — Dot products and duality */
function LA9({ award, qstate, setQstate, challenges, completeChallenge }) {
  const svgRef = useRef(null);
  const [a, setA] = useState([2.5, 1]);
  const [b, setB] = useState([1, 2.5]);
  const drag = useSvgDrag(svgRef, (id, px, py) => {
    const [x, y] = toMath(px, py);
    const p = [clamp(x, -6, 6), clamp(y, -6, 6)];
    if (id === "a") setA(p); else setB(p);
  });
  const dot = a[0] * b[0] + a[1] * b[1];
  const magA = Math.hypot(...a), magB = Math.hypot(...b);
  const cos = magA && magB ? dot / (magA * magB) : 0;
  const done = challenges.has("la9");
  useEffect(() => { if (!done && magA > 0.5 && magB > 0.5 && Math.abs(dot) < 0.12) completeChallenge("la9"); }, [dot, magA, magB, done, completeChallenge]);
  // projection of b onto a
  const proj = magA > 0.01 ? [(dot / (magA * magA)) * a[0], (dot / (magA * magA)) * a[1]] : [0, 0];
  const pa = toPx(...a), pb = toPx(...b), ppr = toPx(...proj);
  return (
    <Lesson eyebrow="essence of linear algebra · ch 9" title="Dot products & duality"
      caption="The green segment is b projected onto a. Dot product = (length of projection) × (length of a) — positive when aligned, zero at 90°, negative beyond."
      viz={
        <svg ref={svgRef} viewBox={`0 0 ${VIEW} ${VIEW}`} onPointerMove={drag.move} onPointerUp={drag.end} onPointerLeave={drag.end}>
          <PlaneAxes />
          <line x1={200 - a[0] * 50} y1={200 + a[1] * 50} x2={200 + a[0] * 50} y2={200 - a[1] * 50} stroke="var(--bp-cyan)" strokeOpacity="0.25" strokeWidth="1.5" />
          <line x1={pb[0]} y1={pb[1]} x2={ppr[0]} y2={ppr[1]} stroke="var(--bp-dim)" strokeDasharray="4 4" strokeWidth="1.5" />
          <line x1={200} y1={200} x2={ppr[0]} y2={ppr[1]} stroke="var(--bp-green)" strokeWidth="4" strokeOpacity="0.85" />
          <Arrow to={pa} color="var(--bp-cyan)" label="a" />
          <Arrow to={pb} color="var(--bp-amber)" label="b" />
          <Handle at={pa} color="var(--bp-cyan)" onPointerDown={drag.start("a")} />
          <Handle at={pb} color="var(--bp-amber)" onPointerDown={drag.start("b")} />
        </svg>
      }>
      <p><span className="mr-code">a·b = a[0]b[0] + a[1]b[1]</span>: multiply elementwise, sum. Geometrically: project b onto a, multiply the lengths. Why do those two stories match?</p>
      <p><b>Duality</b>: taking "dot with a" is itself a linear map from 2D to 1D — literally the 1×2 matrix <span className="mr-code">[a₀ a₁]</span> from the last chapter, which is the vector a lying on its side. Every plane→line linear map is secretly a vector, and vice versa.</p>
      <div className="mr-readout">
        a·b = <b style={{ color: Math.abs(dot) < 0.12 ? "var(--bp-green)" : "var(--bp-ink)" }}>{fmt(dot)}</b>   cos θ = {fmt(cos)}<br />
        cosine similarity = a·b / (|a||b|) — the vector-search formula
      </div>
      <Challenge done={done}>Make <span className="mr-code">a·b ≈ 0</span>. Watch the green projection shrink to a point exactly at 90°.</Challenge>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "A negative dot product means the vectors…", opts: ["are perpendicular", "point in generally opposite directions", "have negative lengths", "are dependent"], a: 1, expl: "The projection of one onto the other points backwards — the angle between them is greater than 90°." },
        { q: "Duality says the dot-with-a operation is the same thing as…", opts: ["multiplying by the 1×2 matrix [a₀ a₁]", "rotating by a", "the cross product", "the inverse of a"], a: 0, expl: "A vector standing up is data; the same vector lying down is a function (a linear map to R). That's the dual pairing." },
      ]} />
    </Lesson>
  );
}

/* LA10 — Cross products */
function LA10({ award, qstate, setQstate }) {
  const svgRef = useRef(null);
  const [v, setV] = useState([2.5, 0.5]);
  const [w, setW] = useState([1, 2]);
  const drag = useSvgDrag(svgRef, (id, px, py) => {
    const [x, y] = toMath(px, py);
    const p = [clamp(x, -5, 5), clamp(y, -5, 5)];
    if (id === "v") setV(p); else setW(p);
  });
  const cz = v[0] * w[1] - v[1] * w[0];
  const pv = toPx(...v), pw = toPx(...w), ps = toPx(v[0] + w[0], v[1] + w[1]);
  return (
    <Lesson eyebrow="essence of linear algebra · ch 10" title="Cross products"
      caption="|v×w| is the parallelogram's area. Green ⊙ means the result points out of the screen (v to w is counter-clockwise); red ⊗ means into the screen."
      viz={
        <svg ref={svgRef} viewBox={`0 0 ${VIEW} ${VIEW}`} onPointerMove={drag.move} onPointerUp={drag.end} onPointerLeave={drag.end}>
          <PlaneAxes />
          <polygon points={`200,200 ${pv[0]},${pv[1]} ${ps[0]},${ps[1]} ${pw[0]},${pw[1]}`} fill={cz >= 0 ? "var(--bp-green)" : "var(--bp-red)"} fillOpacity="0.16" />
          <Arrow to={pv} color="var(--bp-cyan)" label="v" />
          <Arrow to={pw} color="var(--bp-amber)" label="w" />
          <circle cx="350" cy="50" r="16" fill="none" stroke={cz >= 0 ? "var(--bp-green)" : "var(--bp-red)"} strokeWidth="2" />
          {cz >= 0
            ? <circle cx="350" cy="50" r="4" fill="var(--bp-green)" />
            : <g stroke="var(--bp-red)" strokeWidth="2"><line x1="341" y1="41" x2="359" y2="59" /><line x1="359" y1="41" x2="341" y2="59" /></g>}
          <Handle at={pv} color="var(--bp-cyan)" onPointerDown={drag.start("v")} />
          <Handle at={pw} color="var(--bp-amber)" onPointerDown={drag.start("w")} />
        </svg>
      }>
      <p>The cross product v×w produces a <b>vector</b> perpendicular to both v and w, whose <b>length is the area</b> of their parallelogram, with direction given by the right-hand rule.</p>
      <p>For 2D vectors that perpendicular direction is the z-axis, so the whole result lives in one signed number: <span className="mr-code">vₓw_y − v_yw_x</span> — which you should recognize as a determinant. Notice it flips sign when w crosses over v, and hits zero when they're parallel (no area).</p>
      <div className="mr-readout">
        v×w (z-component) = {fmt(v[0])}·{fmt(w[1])} − {fmt(v[1])}·{fmt(w[0])} = <b style={{ color: cz >= 0 ? "var(--bp-green)" : "var(--bp-red)" }}>{fmt(cz)}</b><br />
        area of parallelogram = |v×w| = {fmt(Math.abs(cz))}
      </div>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "v×w = 0 means the vectors are…", opts: ["perpendicular", "parallel (zero area)", "unit length", "equal"], a: 1, expl: "Opposite of the dot product: cross vanishes for parallel vectors (flat parallelogram), dot vanishes for perpendicular ones." },
        { q: "Swapping the order, w×v, gives…", opts: ["the same result", "−(v×w)", "the dot product", "zero"], a: 1, expl: "Anticommutative: orientation flips, so the sign flips — the same orientation-flipping you saw with negative determinants." },
      ]} />
    </Lesson>
  );
}

/* LA11 — Cross products via transformations */
function LA11({ award, qstate, setQstate }) {
  const [w, setW] = useState([1, 2, 0]);
  const v = [2, 0.5, 1];
  const cx = v[1] * w[2] - v[2] * w[1];
  const cy = v[2] * w[0] - v[0] * w[2];
  const cz = v[0] * w[1] - v[1] * w[0];
  return (
    <Lesson eyebrow="essence of linear algebra · ch 11" title="Cross products, the deeper view"
      caption="No picture can do 4 dimensions of idea justice — so this one is a computation panel. Tune w and watch p = v×w stay the unique vector encoding 'volume with (v, w)'."
      viz={
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`}>
          <PlaneAxes />
          <text x="200" y="120" fill="var(--bp-ink)" fontSize="16" fontFamily="var(--mono)" textAnchor="middle">f(x) = det([ x  v  w ])</text>
          <text x="200" y="160" fill="var(--bp-dim)" fontSize="13" fontFamily="var(--mono)" textAnchor="middle">f is linear in x</text>
          <text x="200" y="200" fill="var(--bp-dim)" fontSize="13" fontFamily="var(--mono)" textAnchor="middle">⇒ (duality, ch 9) f(x) = p·x for some p</text>
          <text x="200" y="240" fill="var(--bp-green)" fontSize="15" fontFamily="var(--mono)" textAnchor="middle">that p is defined to be v×w</text>
          <text x="200" y="290" fill="var(--bp-amber)" fontSize="13" fontFamily="var(--mono)" textAnchor="middle">v×w = [{fmt(cx, 1)}, {fmt(cy, 1)}, {fmt(cz, 1)}]</text>
        </svg>
      }>
      <p>Why does the cross-product formula work? Define <span className="mr-code">f(x) = det([x v w])</span> — the volume of the box with edges x, v, w. That's a linear function of x.</p>
      <p>By <b>duality</b> (ch 9), every linear map R³→R is "dot with some vector p". The vector p hiding inside this volume function is exactly <b>v×w</b>: dotting with it must measure volume, which forces it to be perpendicular to v and w with length = base area.</p>
      <Slider label="w[0]" value={w[0]} set={(x) => setW([x, w[1], w[2]])} min={-3} max={3} />
      <Slider label="w[1]" value={w[1]} set={(x) => setW([w[0], x, w[2]])} min={-3} max={3} />
      <Slider label="w[2]" value={w[2]} set={(x) => setW([w[0], w[1], x])} min={-3} max={3} />
      <div className="mr-readout">
        v = [2.00, 0.50, 1.00]   w = [{fmt(w[0])}, {fmt(w[1])}, {fmt(w[2])}]<br />
        v×w = [{fmt(cx)}, {fmt(cy)}, {fmt(cz)}]<br />
        check ⊥: (v×w)·v = {fmt(cx * v[0] + cy * v[1] + cz * v[2])},  (v×w)·w = {fmt(cx * w[0] + cy * w[1] + cz * w[2])}
      </div>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "The deep reason v×w is perpendicular to both v and w is that…", opts: ["it's defined that way arbitrarily", "dotting with it computes a volume, forcing perpendicularity", "all products are perpendicular", "of the right-hand rule"], a: 1, expl: "p·x = det([x v w]). Geometrically: volume = (component of x perpendicular to the v-w plane) × base area. Only a perpendicular p computes that." },
        { q: "The length |v×w| equals…", opts: ["|v| + |w|", "the area of the v, w parallelogram", "the volume of a cube", "|v|·|w| always"], a: 1, expl: "It's |v||w|sin θ — the base area in the volume story. (|v||w| only when they're perpendicular, sin θ = 1.)" },
      ]} />
    </Lesson>
  );
}

/* LA12 — Cramer's rule */
function LA12({ award, qstate, setQstate }) {
  const svgRef = useRef(null);
  const [m, setM] = useState([2, 0.5, 0.5, 1.5]);
  const [bv, setBv] = useState([2.5, 2]);
  const [a, b, c, d] = m;
  const det = a * d - b * c;
  const drag = useSvgDrag(svgRef, (id, px, py) => {
    const [x, y] = toMath(px, py);
    const cl = (v) => clamp(v, -5, 5);
    if (id === "i") setM((p) => [cl(x), cl(y), p[2], p[3]]);
    else if (id === "j") setM((p) => [p[0], p[1], cl(x), cl(y)]);
    else setBv([cl(x), cl(y)]);
  });
  const d1 = bv[0] * d - c * bv[1]; // det with col1 replaced by b
  const d2 = a * bv[1] - b * bv[0]; // det with col2 replaced by b
  const x1 = Math.abs(det) > 0.05 ? d1 / det : NaN;
  const x2 = Math.abs(det) > 0.05 ? d2 / det : NaN;
  const pi = toPx(a, b), pj = toPx(c, d), pb = toPx(...bv);
  return (
    <Lesson eyebrow="essence of linear algebra · ch 12" title="Cramer's rule, geometrically"
      caption="Drag the columns of A and the target b. The solution x is computed purely from ratios of areas (determinants) — no row reduction."
      viz={
        <svg ref={svgRef} viewBox={`0 0 ${VIEW} ${VIEW}`} onPointerMove={drag.move} onPointerUp={drag.end} onPointerLeave={drag.end}>
          <PlaneAxes />
          <TGrid m={m} />
          <Arrow to={pi} color="var(--bp-cyan)" label="a₁" />
          <Arrow to={pj} color="var(--bp-amber)" label="a₂" />
          <Arrow to={pb} color="var(--bp-green)" label="b" />
          <Handle at={pi} color="var(--bp-cyan)" onPointerDown={drag.start("i")} />
          <Handle at={pj} color="var(--bp-amber)" onPointerDown={drag.start("j")} />
          <Handle at={pb} color="var(--bp-green)" onPointerDown={drag.start("b")} />
        </svg>
      }>
      <p>To solve <span className="mr-code">Ax = b</span>, Cramer's trick: areas transform uniformly (everything scales by det A). The signed area built from the input x and ĵ becomes, after transformation, the area built from b and a₂.</p>
      <p>So <span className="mr-code">x₁ = det(A with col 1 → b) / det(A)</span>, and likewise for x₂. Slow in practice, but a beautiful demonstration of determinant thinking — and verify below that A·x really reproduces b.</p>
      <div className="mr-readout">
        det(A) = {fmt(det)}<br />
        x₁ = {fmt(d1)} / {fmt(det)} = <b>{fmt(x1)}</b><br />
        x₂ = {fmt(d2)} / {fmt(det)} = <b>{fmt(x2)}</b><br />
        check A·x = [{fmt(a * x1 + c * x2)}, {fmt(b * x1 + d * x2)}] ≟ b = [{fmt(bv[0])}, {fmt(bv[1])}]
      </div>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "Cramer's rule computes each unknown as a ratio of…", opts: ["traces", "two determinants", "dot products", "eigenvalues"], a: 1, expl: "xᵢ = det(A with column i swapped for b) / det(A). Areas in, areas out." },
        { q: "Cramer's rule fails when…", opts: ["b = 0", "det(A) = 0", "A is symmetric", "x is negative"], a: 1, expl: "Division by det(A): when the transformation crushes space, areas can't be un-scaled and the system has no unique solution." },
      ]} />
    </Lesson>
  );
}

/* LA13 — Change of basis */
function LA13({ award, qstate, setQstate }) {
  const svgRef = useRef(null);
  const [b1, setB1] = useState([2, 1]);
  const [b2, setB2] = useState([-1, 1]);
  const drag = useSvgDrag(svgRef, (id, px, py) => {
    const [x, y] = toMath(px, py);
    const p = [clamp(x, -5, 5), clamp(y, -5, 5)];
    if (id === "1") setB1(p); else setB2(p);
  });
  const P = [3, 1]; // fixed point, standard coords
  const det = b1[0] * b2[1] - b1[1] * b2[0];
  const c1 = Math.abs(det) > 0.05 ? (P[0] * b2[1] - b2[0] * P[1]) / det : NaN;
  const c2 = Math.abs(det) > 0.05 ? (b1[0] * P[1] - b1[1] * P[0]) / det : NaN;
  const m = [b1[0], b1[1], b2[0], b2[1]];
  const p1 = toPx(...b1), p2 = toPx(...b2), pP = toPx(...P);
  return (
    <Lesson eyebrow="essence of linear algebra · ch 13" title="Change of basis"
      caption="The green point is FIXED in space. Drag the basis vectors: the point doesn't move, but its coordinates in their language do."
      viz={
        <svg ref={svgRef} viewBox={`0 0 ${VIEW} ${VIEW}`} onPointerMove={drag.move} onPointerUp={drag.end} onPointerLeave={drag.end}>
          <PlaneAxes />
          <TGrid m={m} color="var(--bp-purple)" />
          <Arrow to={p1} color="var(--bp-cyan)" label="b₁" />
          <Arrow to={p2} color="var(--bp-amber)" label="b₂" />
          <circle cx={pP[0]} cy={pP[1]} r="7" fill="var(--bp-green)" />
          <text x={pP[0] + 14} y={pP[1] - 8} fill="var(--bp-green)" fontSize="14" fontFamily="var(--mono)">p</text>
          <Handle at={p1} color="var(--bp-cyan)" onPointerDown={drag.start("1")} />
          <Handle at={p2} color="var(--bp-amber)" onPointerDown={drag.start("2")} />
        </svg>
      }>
      <p>Coordinates are a <b>language</b>, not a property of space. The same point p reads [3, 1] in the standard grid and something completely different in the purple grid defined by b₁, b₂.</p>
      <p>If B's columns are the new basis vectors (written in our language), then <span className="mr-code">B</span> translates <b>their language → ours</b>, and <span className="mr-code">B⁻¹</span> translates ours → theirs. The famous sandwich <span className="mr-code">B⁻¹·M·B</span> means: translate in, apply M, translate back — "M, as another basis sees it".</p>
      <div className="mr-readout">
        p (standard) = [3.00, 1.00]<br />
        p (in b₁,b₂ basis) = B⁻¹p = [<b>{fmt(c1)}</b>, <b>{fmt(c2)}</b>]<br />
        check: {fmt(c1)}·b₁ + {fmt(c2)}·b₂ = [{fmt(c1 * b1[0] + c2 * b2[0])}, {fmt(c1 * b1[1] + c2 * b2[1])}]
      </div>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "The expression B⁻¹MB represents…", opts: ["M inverted twice", "the transformation M as seen in B's basis", "a rotation of M", "M with no change"], a: 1, expl: "Translate a foreign vector into our language (B), apply M, translate the result back (B⁻¹). Same transformation, different coordinate language." },
        { q: "Changing basis changes…", opts: ["the underlying vectors themselves", "only the numbers used to describe them", "the dimension of the space", "the origin"], a: 1, expl: "Space and its points are unchanged; only the description changes. Like the same UTC instant rendered in different time zones." },
      ]} />
    </Lesson>
  );
}

/* LA14 — Eigenvectors and eigenvalues */
const EIG_PRESETS = [
  { name: "[[3,1],[0,2]]", m: [3, 0, 1, 2] },
  { name: "shear", m: [1, 0, 1, 1] },
  { name: "rotation 45°", m: [0.707, 0.707, -0.707, 0.707] },
  { name: "stretch x", m: [2, 0, 0, 1] },
];
function LA14({ award, qstate, setQstate, challenges, completeChallenge }) {
  const svgRef = useRef(null);
  const [m, setM] = useState(EIG_PRESETS[0].m);
  const [v, setV] = useState([2.2, 1.6]);
  const [a, b, c, d] = m;
  const drag = useSvgDrag(svgRef, (_id, px, py) => {
    const [x, y] = toMath(px, py);
    setV([clamp(x, -5, 5), clamp(y, -5, 5)]);
  });
  const Mv = [a * v[0] + c * v[1], b * v[0] + d * v[1]];
  const cross = v[0] * Mv[1] - v[1] * Mv[0];
  const magV = Math.hypot(...v), magMv = Math.hypot(...Mv);
  const aligned = magV > 0.6 && magMv > 0.1 && Math.abs(cross) / (magV * magMv) < 0.018;
  const lambda = aligned ? (Math.sign(v[0] * Mv[0] + v[1] * Mv[1]) * magMv) / magV : NaN;
  const done = challenges.has("la14");
  useEffect(() => { if (!done && aligned) completeChallenge("la14"); }, [aligned, done, completeChallenge]);
  const pv = toPx(...v), pMv = toPx(clamp(Mv[0], -6.5, 6.5), clamp(Mv[1], -6.5, 6.5));
  return (
    <Lesson eyebrow="essence of linear algebra · ch 14" title="Eigenvectors & eigenvalues"
      caption="Drag the cyan probe v; amber is Mv. Most vectors get knocked off their own line. When the two arrows line up — both glow green — you've found an eigenvector, and λ is the stretch."
      viz={
        <svg ref={svgRef} viewBox={`0 0 ${VIEW} ${VIEW}`} onPointerMove={drag.move} onPointerUp={drag.end} onPointerLeave={drag.end}>
          <PlaneAxes />
          <line x1={200 - v[0] * 60} y1={200 + v[1] * 60} x2={200 + v[0] * 60} y2={200 - v[1] * 60} stroke={aligned ? "var(--bp-green)" : "var(--bp-line-strong)"} strokeWidth="1.5" strokeDasharray="5 5" />
          <Arrow to={pMv} color={aligned ? "var(--bp-green)" : "var(--bp-amber)"} label="Mv" />
          <Arrow to={pv} color={aligned ? "var(--bp-green)" : "var(--bp-cyan)"} label="v" />
          <Handle at={pv} color="var(--bp-cyan)" onPointerDown={drag.start("v")} />
        </svg>
      }>
      <p>Most vectors, when transformed, get rotated off their own span. An <b>eigenvector</b> is a vector that stays on its line — the transformation only <b>stretches</b> it: <span className="mr-code">Mv = λv</span>. The stretch factor λ is its eigenvalue.</p>
      <p>Eigenvectors are the transformation's skeleton: its natural axes. Try the rotation preset — no arrow ever aligns, because a rotation leaves no direction unmoved (its eigenvalues are complex).</p>
      <div className="mr-btnrow">
        {EIG_PRESETS.map((p) => <button key={p.name} className="mr-btn" onClick={() => setM(p.m)}>{p.name}</button>)}
      </div>
      <div className="mr-readout">
        M = [ {fmt(a)}  {fmt(c)} ]  [ {fmt(b)}  {fmt(d)} ]<br />
        v = [{fmt(v[0])}, {fmt(v[1])}]   Mv = [{fmt(Mv[0])}, {fmt(Mv[1])}]<br />
        status: <b style={{ color: aligned ? "var(--bp-green)" : "var(--bp-dim)" }}>{aligned ? `EIGENVECTOR!  λ ≈ ${fmt(lambda)}` : "off-axis — keep hunting"}</b>
      </div>
      <Challenge done={done}>With the first preset, find an eigenvector by hand. Hint: there are two directions — one is hiding along an axis.</Challenge>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "An eigenvector of M is a vector that…", opts: ["M sends to zero", "M keeps on its own span, only scaled", "has length 1", "is a column of M"], a: 1, expl: "Mv = λv: direction preserved (or exactly reversed if λ < 0), only the length changes." },
        { q: "A 2D rotation by 45° has…", opts: ["two real eigenvectors", "one real eigenvector", "no real eigenvectors", "infinitely many"], a: 2, expl: "Every direction gets rotated off itself. The eigenvalues exist but are complex — the i in e^(iθ) is this fact in disguise." },
      ]} />
    </Lesson>
  );
}

/* LA15 — Quick eigenvalue trick */
function LA15({ award, qstate, setQstate }) {
  const [a, setA] = useState(3);
  const [b, setB] = useState(0);
  const [c, setC] = useState(1);
  const [d, setD] = useState(2);
  const mean = (a + d) / 2;
  const prod = a * d - b * c;
  const disc = mean * mean - prod;
  const real = disc >= 0;
  const l1 = real ? mean + Math.sqrt(disc) : NaN;
  const l2 = real ? mean - Math.sqrt(disc) : NaN;
  const W = 200, H = 200;
  return (
    <Lesson eyebrow="essence of linear algebra · ch 15" title="A quick eigenvalue trick"
      caption="The two eigenvalues sit symmetrically around the mean m (half the trace), at distance √(m² − p). Tune the matrix and watch them slide — or collide and go complex."
      viz={
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`}>
          <PlaneAxes />
          <line x1="20" y1="200" x2="380" y2="200" stroke="var(--bp-line-strong)" strokeWidth="2" />
          <line x1={200 + mean * 40} y1="140" x2={200 + mean * 40} y2="260" stroke="var(--bp-amber)" strokeWidth="1.5" strokeDasharray="5 4" />
          <text x={200 + mean * 40} y="130" fill="var(--bp-amber)" fontSize="13" fontFamily="var(--mono)" textAnchor="middle">m = {fmt(mean, 1)}</text>
          {real ? (
            <g>
              <circle cx={clamp(200 + l1 * 40, 12, 388)} cy="200" r="8" fill="var(--bp-green)" />
              <circle cx={clamp(200 + l2 * 40, 12, 388)} cy="200" r="8" fill="var(--bp-green)" />
              <text x={clamp(200 + l1 * 40, 12, 388)} y="232" fill="var(--bp-green)" fontSize="12" fontFamily="var(--mono)" textAnchor="middle">λ₁</text>
              <text x={clamp(200 + l2 * 40, 12, 388)} y="232" fill="var(--bp-green)" fontSize="12" fontFamily="var(--mono)" textAnchor="middle">λ₂</text>
            </g>
          ) : (
            <text x="200" y="300" fill="var(--bp-red)" fontSize="14" fontFamily="var(--mono)" textAnchor="middle">m² − p {"<"} 0 → complex pair (rotation-like)</text>
          )}
        </svg>
      }>
      <p>For a 2×2 matrix you can skip the characteristic polynomial. Two facts you can read straight off the matrix: the eigenvalues' <b>mean</b> is half the trace, <span className="mr-code">m = (a+d)/2</span>, and their <b>product</b> is the determinant, <span className="mr-code">p = det</span>.</p>
      <p>Two numbers with mean m and product p must be <span className="mr-code">λ = m ± √(m² − p)</span>. Done. If m² {"<"} p the square root goes imaginary — the rotation case from last chapter.</p>
      <Slider label="a (top-left)" value={a} set={setA} min={-3} max={4} step={0.5} d={1} />
      <Slider label="b (bottom-left)" value={b} set={setB} min={-3} max={3} step={0.5} d={1} />
      <Slider label="c (top-right)" value={c} set={setC} min={-3} max={3} step={0.5} d={1} />
      <Slider label="d (bottom-right)" value={d} set={setD} min={-3} max={4} step={0.5} d={1} />
      <div className="mr-readout">
        m = trace/2 = {fmt(mean)}   p = det = {fmt(prod)}<br />
        λ = m ± √(m² − p) = {real ? <b>{fmt(l1)} and {fmt(l2)}</b> : <b style={{ color: "var(--bp-red)" }}>{fmt(mean)} ± {fmt(Math.sqrt(-disc))}i</b>}
      </div>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "For any square matrix, the SUM of the eigenvalues equals…", opts: ["the determinant", "the trace (sum of diagonal)", "zero", "the rank"], a: 1, expl: "And their product equals the determinant. Two free invariants you can read without solving anything." },
        { q: "Eigenvalues of [[5,1],[1,5]]: m = 5, p = 24, so λ =", opts: ["6 and 4", "5 and 5", "24 and 1", "complex"], a: 0, expl: "λ = 5 ± √(25−24) = 5 ± 1. Mean-product trick: three seconds, no polynomial." },
      ]} />
    </Lesson>
  );
}

/* LA16 — Abstract vector spaces */
function LA16({ award, qstate, setQstate }) {
  const [c0, setC0] = useState(0);
  const [c1, setC1] = useState(-1);
  const [c2, setC2] = useState(0);
  const [c3, setC3] = useState(0.3);
  const f = (x) => c0 + c1 * x + c2 * x * x + c3 * x * x * x;
  const df = (x) => c1 + 2 * c2 * x + 3 * c3 * x * x;
  return (
    <Lesson eyebrow="essence of linear algebra · ch 16" title="Abstract vector spaces"
      caption="A cubic polynomial (cyan) and its derivative (amber). The 'vector' here is the coefficient list — and d/dx is just a matrix acting on it."
      viz={
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`}>
          <PlaneAxes />
          <polyline points={curvePath(f)} fill="none" stroke="var(--bp-cyan)" strokeWidth="2.5" />
          <polyline points={curvePath(df)} fill="none" stroke="var(--bp-amber)" strokeWidth="2" strokeDasharray="6 4" />
        </svg>
      }>
      <p>The punchline of the series: <b>anything</b> you can add and scale is a vector. Functions qualify: (f+g)(x), (2f)(x) — perfectly legal. So functions form a vector space, and "linear transformation" extends to them.</p>
      <p>The derivative is linear — <span className="mr-code">d/dx(f+g) = f' + g'</span> — so on polynomials it's literally a <b>matrix</b> multiplying the coefficient vector. Span, basis, null space (constants!), eigen-everything: all of it applies. This abstraction is why the same theory runs graphics, quantum mechanics, and your gradient computations.</p>
      <Slider label="c₀ (constant)" value={c0} set={setC0} min={-2} max={2} d={1} />
      <Slider label="c₁ (x)" value={c1} set={setC1} min={-2} max={2} d={1} />
      <Slider label="c₂ (x²)" value={c2} set={setC2} min={-1} max={1} d={1} />
      <Slider label="c₃ (x³)" value={c3} set={setC3} min={-1} max={1} d={1} />
      <div className="mr-readout">
        f as a vector: [{fmt(c0, 1)}, {fmt(c1, 1)}, {fmt(c2, 1)}, {fmt(c3, 1)}]<br />
        D·f = [{fmt(c1, 1)}, {fmt(2 * c2, 1)}, {fmt(3 * c3, 1)}, 0]   (D = the derivative matrix)
      </div>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "Functions count as vectors because…", opts: ["they have arrows", "they can be added and scaled, satisfying the vector axioms", "they're lists of two numbers", "they don't"], a: 1, expl: "The axioms only require sensible + and ·. Arrows, arrays, polynomials, audio signals — all the same algebra." },
        { q: "The null space of the derivative operator (on polynomials) is…", opts: ["empty", "the constant functions", "the linear functions", "all polynomials"], a: 1, expl: "d/dx(c) = 0: constants are exactly what the derivative crushes to zero — a null space you've known since high school." },
      ]} />
    </Lesson>
  );
}

/* ============================================================
   CALCULUS — chapters 1..12 (+ bonus)
   ============================================================ */

/* C1 — The essence of calculus (circle area by rings) */
function C1({ award, qstate, setQstate }) {
  const [N, setN] = useState(8);
  const R = 3;
  const dr = R / N;
  let approx = 0;
  const bars = [];
  const baseY = 330, scaleX = 17, scaleY = 13;
  for (let i = 0; i < N; i++) {
    const r = (i + 1) * dr;
    approx += 2 * Math.PI * r * dr;
    const h = 2 * Math.PI * r * scaleY * 0.32;
    const w = Math.max(1, dr * scaleX * 6.6);
    bars.push(<rect key={i} x={30 + i * w} y={baseY - h} width={Math.max(1, w - 1)} height={h} fill="var(--bp-amber)" fillOpacity="0.7" />);
  }
  const rings = [];
  for (let i = 1; i <= N; i++) rings.push(<circle key={i} cx="200" cy="95" r={(i * dr * 70) / R} fill="none" stroke="var(--bp-cyan)" strokeOpacity="0.7" strokeWidth="1.5" />);
  return (
    <Lesson eyebrow="essence of calculus · ch 1" title="The essence of calculus"
      caption="Top: circle sliced into rings. Bottom: each ring unrolled into a strip of width dr and height 2πr — together they fill a triangle of base R and height 2πR. Triangle area = ½·R·2πR = πR²."
      viz={
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`}>
          {rings}
          {bars}
          <line x1="30" y1={baseY} x2="370" y2={baseY} stroke="var(--bp-line-strong)" strokeWidth="1.5" />
          <line x1="30" y1={baseY} x2="368" y2={baseY - 2 * Math.PI * R * scaleY * 0.32} stroke="var(--bp-green)" strokeWidth="2" strokeDasharray="6 4" />
          <text x="200" y="385" fill="var(--bp-dim)" fontSize="12" fontFamily="var(--mono)" textAnchor="middle">r: 0 → R</text>
        </svg>
      }>
      <p>The whole subject in one move: a hard problem (area of a circle) becomes easy after slicing it into pieces small enough to approximate. Unroll each thin ring → almost a rectangle of size <span className="mr-code">2πr × dr</span>.</p>
      <p>Stack the rectangles and they fill a triangle. As <span className="mr-code">dr → 0</span> the approximation becomes exact: <b>πR²</b>. That's an integral, discovered rather than memorized — and the derivative will turn out to be its mirror image.</p>
      <Slider label="number of rings N" value={N} set={(v) => setN(Math.round(v))} min={3} max={60} step={1} d={0} />
      <div className="mr-readout">
        Σ 2πr·dr = {fmt(approx, 3)}<br />
        πR² (exact) = {fmt(Math.PI * R * R, 3)}<br />
        error = {fmt(Math.abs(approx - Math.PI * R * R), 3)} — shrinking as N grows
      </div>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "The core strategy of calculus is…", opts: ["memorizing formulas", "approximating with tiny pieces, then taking a limit", "graphing everything", "avoiding infinity"], a: 1, expl: "Slice into dr-sized pieces where everything is simple, sum, then let dr → 0. Integrals and derivatives are both this move." },
        { q: "Each thin ring of the circle unrolls into approximately a…", opts: ["triangle", "rectangle of size 2πr × dr", "circle of radius dr", "square"], a: 1, expl: "Circumference 2πr long, dr thick. The error in 'approximately' vanishes in the limit — that's the licensed cheating of calculus." },
      ]} />
    </Lesson>
  );
}

/* C2 — The paradox of the derivative */
const C2_FUNCS = [
  { name: "0.5·x²", f: (x) => 0.5 * x * x, df: (x) => x },
  { name: "sin(x)", f: Math.sin, df: Math.cos },
  { name: "x³/4 − x", f: (x) => (x ** 3) / 4 - x, df: (x) => (3 * x * x) / 4 - 1 },
];
function C2({ award, qstate, setQstate, challenges, completeChallenge }) {
  const svgRef = useRef(null);
  const [fi, setFi] = useState(0);
  const [x0, setX0] = useState(1.4);
  const [h, setH] = useState(1.5);
  const { f, df } = C2_FUNCS[fi];
  const drag = useSvgDrag(svgRef, (_id, px) => setX0(clamp((px - 200) / FX, -4, 4)));
  const slope = df(x0);
  const sec = (f(x0 + h) - f(x0)) / h;
  const done = challenges.has("c2");
  useEffect(() => { if (!done && Math.abs(slope) < 0.045) completeChallenge("c2"); }, [slope, done, completeChallenge]);
  const p0 = fToPx(x0, f(x0)), ph = fToPx(x0 + h, f(x0 + h));
  const t1 = fToPx(x0 - 1.6, f(x0) - 1.6 * slope), t2 = fToPx(x0 + 1.6, f(x0) + 1.6 * slope);
  return (
    <Lesson eyebrow="essence of calculus · ch 2" title="The paradox of the derivative"
      caption="Drag the cyan point; shrink h and watch the amber secant collapse onto the green tangent. 'Instantaneous rate of change' is the limit of that collapse."
      viz={
        <svg ref={svgRef} viewBox={`0 0 ${VIEW} ${VIEW}`} onPointerMove={drag.move} onPointerUp={drag.end} onPointerLeave={drag.end}>
          <PlaneAxes />
          <polyline points={curvePath(f)} fill="none" stroke="var(--bp-ink)" strokeWidth="2.5" strokeOpacity="0.9" />
          <line x1={p0[0]} y1={p0[1]} x2={ph[0]} y2={ph[1]} stroke="var(--bp-amber)" strokeWidth="2" strokeDasharray="5 4" />
          <circle cx={ph[0]} cy={ph[1]} r="4.5" fill="var(--bp-amber)" />
          <line x1={t1[0]} y1={t1[1]} x2={t2[0]} y2={t2[1]} stroke="var(--bp-green)" strokeWidth="2.5" />
          <Handle at={p0} color="var(--bp-cyan)" onPointerDown={drag.start("p")} />
        </svg>
      }>
      <p>"Instantaneous rate of change" is an oxymoron — change needs two moments. The honest definition: the slope <span className="mr-code">(f(x+h) − f(x)) / h</span> for a <b>tiny</b> nudge h, and the derivative is what that slope approaches as h → 0.</p>
      <p>You already trust this idea: it's the finite-difference check <span className="mr-code">(f(x + 1e-5) − f(x)) / 1e-5</span> you'd write to verify a gradient implementation.</p>
      <div className="mr-btnrow">
        {C2_FUNCS.map((fn, i) => <button key={fn.name} className={"mr-btn" + (i === fi ? " primary" : "")} onClick={() => setFi(i)}>f = {fn.name}</button>)}
      </div>
      <Slider label="nudge size h" value={h} set={setH} min={0.001} max={2.5} step={0.001} d={3} />
      <div className="mr-readout">
        secant slope = {fmt(sec, 3)}<br />
        f'(x) = <b style={{ color: Math.abs(slope) < 0.045 ? "var(--bp-green)" : "var(--bp-ink)" }}>{fmt(slope, 3)}</b>   error = {fmt(Math.abs(sec - slope), 3)}
      </div>
      <Challenge done={done}>Park the point where f'(x) ≈ 0 — a flat spot. These are where optimizers stop.</Challenge>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "The derivative is best described as…", opts: ["the slope at a literal instant", "the limit of secant slopes as the nudge shrinks", "f(x+1) − f(x)", "the area under f"], a: 1, expl: "No paradox once it's a limit: never divide by zero, just watch where the ratio is heading." },
        { q: "dy/dx should be read as…", opts: ["a fraction of two ordinary numbers", "the limiting ratio of a tiny output change to a tiny input change", "y divided by x", "a percentage"], a: 1, expl: "It behaves like a fraction in many manipulations, but it's defined as a limit of ratios — that's what dissolves the paradox." },
      ]} />
    </Lesson>
  );
}

/* C3 — Derivative formulas through geometry */
function C3({ award, qstate, setQstate }) {
  const [x, setX] = useState(1.6);
  const [dx, setDx] = useState(0.5);
  const sc = 70;
  const ox = 60, oy = 340;
  return (
    <Lesson eyebrow="essence of calculus · ch 3" title="Derivative formulas via geometry"
      caption="f(x) = x² is literally a square. Nudge the side by dx: the area grows by two strips (2x·dx, amber) plus a corner (dx², red). The corner is negligible as dx→0 — hence d(x²) = 2x dx."
      viz={
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`}>
          <rect x={ox} y={oy - x * sc} width={x * sc} height={x * sc} fill="var(--bp-cyan)" fillOpacity="0.25" stroke="var(--bp-cyan)" />
          <rect x={ox + x * sc} y={oy - x * sc} width={dx * sc} height={x * sc} fill="var(--bp-amber)" fillOpacity="0.5" />
          <rect x={ox} y={oy - x * sc - dx * sc} width={x * sc} height={dx * sc} fill="var(--bp-amber)" fillOpacity="0.5" />
          <rect x={ox + x * sc} y={oy - x * sc - dx * sc} width={dx * sc} height={dx * sc} fill="var(--bp-red)" fillOpacity="0.6" />
          <text x={ox + (x * sc) / 2} y={oy - (x * sc) / 2} fill="var(--bp-cyan)" fontSize="16" fontFamily="var(--mono)" textAnchor="middle">x²</text>
          <text x={ox + x * sc + (dx * sc) / 2} y={oy - (x * sc) / 2} fill="#2b1a02" fontSize="11" fontFamily="var(--mono)" textAnchor="middle">x·dx</text>
          <text x={ox + (x * sc) / 2} y={oy - x * sc - (dx * sc) / 2 + 4} fill="#2b1a02" fontSize="11" fontFamily="var(--mono)" textAnchor="middle">x·dx</text>
        </svg>
      }>
      <p>Power-rule formulas aren't incantations — they're pictures. Grow a square's side from x to x+dx: new area = old + <b>two strips</b> of x·dx + one <b>corner</b> of dx·dx.</p>
      <p>The corner is "a tiny thing squared" — it vanishes faster than everything else, so <span className="mr-code">d(x²) = 2x·dx</span>. The same game with a cube gives 3x²·dx (three faces), and the pattern generalizes to <span className="mr-code">d(xⁿ) = n·xⁿ⁻¹·dx</span>.</p>
      <Slider label="x (side length)" value={x} set={setX} min={0.6} max={3} />
      <Slider label="dx (nudge)" value={dx} set={setDx} min={0.05} max={1} />
      <div className="mr-readout">
        Δ(x²) exactly = 2x·dx + dx² = {fmt(2 * x * dx)} + {fmt(dx * dx)} = {fmt(2 * x * dx + dx * dx)}<br />
        corner share = {fmt((100 * dx * dx) / (2 * x * dx + dx * dx), 1)}% — shrink dx and watch it die
      </div>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "In the square picture, the dx² corner can be ignored because…", opts: ["it equals zero", "it shrinks proportionally faster than the strips as dx→0", "it's outside the square", "geometry is approximate"], a: 1, expl: "Strips shrink like dx; corner shrinks like dx². Divide by dx and the corner term still has a dx in it → gone in the limit." },
        { q: "By the same geometric reasoning, d(x³)/dx = 3x² because a growing cube adds…", opts: ["three thin square faces of area x²", "one face", "six edges", "a bigger cube"], a: 0, expl: "Three faces of x²·dx dominate; the edge (x·dx²) and corner (dx³) terms vanish faster." },
      ]} />
    </Lesson>
  );
}

/* C4 — Chain rule and product rule */
function C4({ award, qstate, setQstate }) {
  const [f, setF] = useState(2);
  const [g, setG] = useState(1.4);
  const [d, setD] = useState(0.4); // df and dg magnitudes
  const sc = 62, ox = 60, oy = 340;
  const df = d, dg = d * 0.8;
  return (
    <Lesson eyebrow="essence of calculus · ch 4" title="Product rule & chain rule"
      caption="The area f·g grows by an amber strip g·df, an amber strip f·dg, and a negligible red corner df·dg. d(fg) = f·dg + g·df."
      viz={
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`}>
          <rect x={ox} y={oy - g * sc} width={f * sc} height={g * sc} fill="var(--bp-cyan)" fillOpacity="0.25" stroke="var(--bp-cyan)" />
          <rect x={ox + f * sc} y={oy - g * sc} width={df * sc} height={g * sc} fill="var(--bp-amber)" fillOpacity="0.5" />
          <rect x={ox} y={oy - g * sc - dg * sc} width={f * sc} height={dg * sc} fill="var(--bp-amber)" fillOpacity="0.5" />
          <rect x={ox + f * sc} y={oy - g * sc - dg * sc} width={df * sc} height={dg * sc} fill="var(--bp-red)" fillOpacity="0.6" />
          <text x={ox + (f * sc) / 2} y={oy - (g * sc) / 2} fill="var(--bp-cyan)" fontSize="16" fontFamily="var(--mono)" textAnchor="middle">f · g</text>
          <text x={ox + f * sc + 26} y={oy - (g * sc) / 2} fill="var(--bp-amber)" fontSize="11" fontFamily="var(--mono)">g·df</text>
          <text x={ox + (f * sc) / 2} y={oy - g * sc - dg * sc - 6} fill="var(--bp-amber)" fontSize="11" fontFamily="var(--mono)" textAnchor="middle">f·dg</text>
        </svg>
      }>
      <p><b>Sum rule</b>: nudges add — <span className="mr-code">d(f+g) = df + dg</span>. <b>Product rule</b>: think of f·g as a rectangle's area; nudging x grows both sides, adding the two strips: <span className="mr-code">d(fg) = f·dg + g·df</span>. "Left d-right plus right d-left", now with a picture.</p>
      <p><b>Chain rule</b>: for <span className="mr-code">f(g(x))</span>, a nudge dx becomes a nudge <span className="mr-code">dg = g'(x)·dx</span>, which becomes <span className="mr-code">df = f'(g)·dg</span>. Multiply the sensitivities: <span className="mr-code">df/dx = f'(g(x))·g'(x)</span>. Chain enough of these and you've implemented backpropagation.</p>
      <Slider label="f" value={f} set={setF} min={0.8} max={3.2} />
      <Slider label="g" value={g} set={setG} min={0.8} max={2.6} />
      <Slider label="nudge size" value={d} set={setD} min={0.05} max={0.8} />
      <div className="mr-readout">
        Δ(fg) = g·df + f·dg + df·dg<br />
        {"      "}= {fmt(g * df)} + {fmt(f * dg)} + <span style={{ color: "var(--bp-red)" }}>{fmt(df * dg)}</span> ← the term that dies
      </div>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "d/dx of sin(x²) is…", opts: ["cos(x²)", "2x·cos(x²)", "cos(2x)", "2x·sin(x)"], a: 1, expl: "Chain rule: outer derivative at the inner value, cos(x²), times inner derivative, 2x." },
        { q: "Backprop through a deep network is the chain rule applied…", opts: ["once at the output", "layer by layer, multiplying local derivatives backwards", "only to the loss", "to integrals"], a: 1, expl: "Loss(wₙ(...w₁(x))) is one giant composition; the chain rule streams the sensitivity backwards through every layer." },
      ]} />
    </Lesson>
  );
}

/* C5 — What's so special about e? */
function C5({ award, qstate, setQstate, challenges, completeChallenge }) {
  const [bse, setBse] = useState(2);
  const f = (x) => Math.pow(bse, x);
  const ratio = Math.log(bse); // f'/f
  const done = challenges.has("c5");
  useEffect(() => { if (!done && Math.abs(ratio - 1) < 0.02) completeChallenge("c5"); }, [ratio, done, completeChallenge]);
  const fp = (x) => ratio * Math.pow(bse, x);
  return (
    <Lesson eyebrow="essence of calculus · ch 5" title="What's so special about e?"
      caption="Cyan: bˣ. Amber dashed: its derivative. They're always proportional — same shape, scaled by ln(b). Slide b until they coincide."
      viz={
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`}>
          <PlaneAxes />
          <polyline points={curvePath(f, -4.4, 2.1)} fill="none" stroke="var(--bp-cyan)" strokeWidth="2.5" />
          <polyline points={curvePath(fp, -4.4, 2.1)} fill="none" stroke="var(--bp-amber)" strokeWidth="2" strokeDasharray="6 4" />
        </svg>
      }>
      <p>Exponentials have a defining property: the derivative of <span className="mr-code">bˣ</span> is <b>proportional to itself</b> — your growth rate is proportional to how much you have. The constant of proportionality turns out to be ln(b).</p>
      <p><b>e ≈ 2.71828</b> is simply the base where that constant is exactly 1: <span className="mr-code">d/dx eˣ = eˣ</span>. e isn't mystical — it's a normalization choice, which is why everything gets rewritten as <span className="mr-code">e^(kt)</span>.</p>
      <Slider label="base b" value={bse} set={setBse} min={1.3} max={4} step={0.005} d={3} />
      <div className="mr-readout">
        f'(x) / f(x) = ln({fmt(bse, 3)}) = <b style={{ color: Math.abs(ratio - 1) < 0.02 ? "var(--bp-green)" : "var(--bp-ink)" }}>{fmt(ratio, 4)}</b><br />
        target: 1.0000 (that's when b = e ≈ 2.71828)
      </div>
      <Challenge done={done}>Find the base where the two curves merge — derivative equals function. You're rediscovering e.</Challenge>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "e is special because it's the base where…", opts: ["bˣ grows fastest", "d/dx bˣ = bˣ exactly", "bˣ is always positive", "logs are defined"], a: 1, expl: "All exponentials are self-proportional; e is the one with proportionality constant 1. A unit choice, like radians." },
        { q: "d/dx of 2ˣ is…", opts: ["2ˣ", "x·2ˣ⁻¹", "ln(2)·2ˣ", "2ˣ/ln(2)"], a: 2, expl: "Write 2ˣ = e^(x·ln2) and chain-rule it: ln(2) pops out front. That's the constant the graph showed you." },
      ]} />
    </Lesson>
  );
}

/* C6 — Implicit differentiation */
function C6({ award, qstate, setQstate }) {
  const svgRef = useRef(null);
  const [ang, setAng] = useState(0.9);
  const R = 3;
  const x = R * Math.cos(ang), y = R * Math.sin(ang);
  const drag = useSvgDrag(svgRef, (_id, px, py) => {
    const [mx, my] = toMath(px, py);
    setAng(Math.atan2(my, mx));
  });
  const slope = Math.abs(y) > 0.05 ? -x / y : Infinity;
  const pp = toPx(x, y);
  const t1 = toPx(x - 1.6, Number.isFinite(slope) ? y - 1.6 * slope : y - 50);
  const t2 = toPx(x + 1.6, Number.isFinite(slope) ? y + 1.6 * slope : y + 50);
  return (
    <Lesson eyebrow="essence of calculus · ch 6" title="Implicit differentiation"
      caption="The circle x² + y² = 9 is not a function — yet every point has a tangent. Drag the point; the green tangent has slope −x/y."
      viz={
        <svg ref={svgRef} viewBox={`0 0 ${VIEW} ${VIEW}`} onPointerMove={drag.move} onPointerUp={drag.end} onPointerLeave={drag.end}>
          <PlaneAxes />
          <circle cx="200" cy="200" r={R * S} fill="none" stroke="var(--bp-cyan)" strokeWidth="2.5" />
          <line x1={clamp(t1[0], -50, 450)} y1={clamp(t1[1], -50, 450)} x2={clamp(t2[0], -50, 450)} y2={clamp(t2[1], -50, 450)} stroke="var(--bp-green)" strokeWidth="2.5" />
          <Arrow to={pp} color="var(--bp-amber)" width={2} dash="4 4" />
          <Handle at={pp} color="var(--bp-cyan)" onPointerDown={drag.start("p")} />
        </svg>
      }>
      <p>The circle's equation relates x and y without y being a function of x. Trick: treat <b>both</b> as nudging together while the equation stays true. Differentiate everything: <span className="mr-code">2x·dx + 2y·dy = 0</span>.</p>
      <p>Solve: <span className="mr-code">dy/dx = −x/y</span> — a tangent slope at every point, no y = f(x) needed. The real lesson: dx and dy are tiny linked nudges, and equations constrain how they move together. (This mindset is multivariable calculus knocking.)</p>
      <div className="mr-readout">
        point = ({fmt(x)}, {fmt(y)})   x² + y² = {fmt(x * x + y * y)}<br />
        dy/dx = −x/y = <b>{Number.isFinite(slope) ? fmt(slope, 3) : "vertical"}</b>
      </div>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "Implicit differentiation works by…", opts: ["solving for y first", "differentiating both sides, treating dy and dx as linked nudges", "guessing the slope", "using only x"], a: 1, expl: "The constraint must keep holding as the point slides, which ties dy to dx — then you solve for their ratio." },
        { q: "On x² + y² = 9, the tangent is horizontal (slope 0) where…", opts: ["x = 0 (top and bottom)", "y = 0 (left and right)", "x = y", "nowhere"], a: 0, expl: "slope = −x/y = 0 needs x = 0: the top (0,3) and bottom (0,−3). At y = 0 it's vertical instead — drag there and see." },
      ]} />
    </Lesson>
  );
}

/* C7 — Limits, L'Hôpital, epsilon-delta */
function C7({ award, qstate, setQstate }) {
  const [x, setX] = useState(1.2);
  const xs = Math.abs(x) < 0.001 ? 0.001 : x;
  const f = (t) => (Math.abs(t) < 1e-9 ? NaN : Math.sin(t) / t) * 3; // scaled for display
  const val = Math.sin(xs) / xs;
  const pp = fToPx(xs, 3 * val);
  return (
    <Lesson eyebrow="essence of calculus · ch 7" title="Limits, L'Hôpital & ε-δ"
      caption="sin(x)/x (scaled ×3 for display) has a hole at x = 0 — yet the curve clearly 'wants' to be 1 there. Slide toward 0 from either side."
      viz={
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`}>
          <PlaneAxes />
          <polyline points={curvePath(f, -4.4, -0.02)} fill="none" stroke="var(--bp-cyan)" strokeWidth="2.5" />
          <polyline points={curvePath(f, 0.02, 4.4)} fill="none" stroke="var(--bp-cyan)" strokeWidth="2.5" />
          <circle cx={fToPx(0, 3)[0]} cy={fToPx(0, 3)[1]} r="5" fill="var(--bp-bg)" stroke="var(--bp-cyan)" strokeWidth="2" />
          <circle cx={pp[0]} cy={pp[1]} r="7" fill="var(--bp-amber)" />
        </svg>
      }>
      <p>sin(0)/0 is <span className="mr-code">0/0</span> — undefined. But the function approaches a definite value as x → 0, and the <b>limit</b> is that destination: 1. ε-δ just makes "approaches" rigorous: any output tolerance ε can be met by some input tolerance δ.</p>
      <p><b>L'Hôpital</b>: at a 0/0 point, both top and bottom are well-approximated by their tangent lines, so the ratio approaches the ratio of slopes: <span className="mr-code">cos(x)/1 → 1</span>. It's tangent-line approximation wearing a fancy name.</p>
      <Slider label="x (approach 0)" value={x} set={setX} min={-2} max={2} step={0.001} d={3} />
      <div className="mr-readout">
        sin(x)/x at x = {fmt(xs, 3)} → <b>{fmt(val, 5)}</b><br />
        L'Hôpital: cos(x)/1 = {fmt(Math.cos(xs), 5)} → both heading to 1
      </div>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "A limit describes…", opts: ["the function's value at the point", "the value the function approaches near the point", "the maximum", "the derivative"], a: 1, expl: "The function may be undefined at the point itself (hole and all) — the limit only cares about the approach." },
        { q: "L'Hôpital's rule applies to 0/0 forms and says the limit equals…", opts: ["the ratio of the derivatives", "zero", "the product of derivatives", "infinity"], a: 0, expl: "Near the point, f(x) ≈ f'(a)(x−a) and g(x) ≈ g'(a)(x−a); the (x−a) cancels, leaving f'/g'." },
      ]} />
    </Lesson>
  );
}

/* C8 — Integration and the fundamental theorem */
function C8({ award, qstate, setQstate }) {
  const [N, setN] = useState(10);
  const [X, setX] = useState(3);
  const f = (t) => 0.3 * t * t + 0.5;
  const F = (t) => 0.1 * t ** 3 + 0.5 * t;
  const ox = 35, oy = 350, sx = 82, sy = 70;
  let riemann = 0;
  const rects = [];
  const w = X / N;
  for (let i = 0; i < N; i++) {
    const t = i * w;
    riemann += f(t) * w;
    rects.push(<rect key={i} x={ox + t * sx} y={oy - f(t) * sy} width={Math.max(0.5, w * sx - 1)} height={f(t) * sy} fill="var(--bp-amber)" fillOpacity="0.5" />);
  }
  const pts = [];
  for (let i = 0; i <= 120; i++) {
    const t = (4.2 * i) / 120;
    pts.push(`${(ox + t * sx).toFixed(1)},${(oy - f(t) * sy).toFixed(1)}`);
  }
  return (
    <Lesson eyebrow="essence of calculus · ch 8" title="Integrals & the fundamental theorem"
      caption="Area under f from 0 to X, approximated by rectangles. The fundamental theorem: the accumulated area A(X) changes at rate f(X) — so A is an antiderivative."
      viz={
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`}>
          {rects}
          <polyline points={pts.join(" ")} fill="none" stroke="var(--bp-cyan)" strokeWidth="2.5" />
          <line x1={ox} y1={oy} x2="390" y2={oy} stroke="var(--bp-line-strong)" strokeWidth="1.5" />
          <line x1={ox + X * sx} y1={oy} x2={ox + X * sx} y2={oy - f(X) * sy} stroke="var(--bp-green)" strokeWidth="2" strokeDasharray="5 4" />
          <text x={ox + X * sx} y={oy + 16} fill="var(--bp-green)" fontSize="12" fontFamily="var(--mono)" textAnchor="middle">X</text>
        </svg>
      }>
      <p>An integral accumulates: chop [0, X] into slices of width dx, each contributing ≈ f(x)·dx of area, and sum. As dx → 0, the sum becomes ∫f dx.</p>
      <p>The <b>fundamental theorem</b>: nudge the right edge X by dX and the area grows by a sliver of size <span className="mr-code">f(X)·dX</span>. So <span className="mr-code">dA/dX = f(X)</span> — the derivative of the accumulated area is the function itself. Integration and differentiation are inverse operations; that's why antiderivatives compute areas.</p>
      <Slider label="rectangles N" value={N} set={(v) => setN(Math.round(v))} min={2} max={80} step={1} d={0} />
      <Slider label="upper bound X" value={X} set={setX} min={0.5} max={4} />
      <div className="mr-readout">
        Riemann sum = {fmt(riemann, 4)}<br />
        exact ∫₀ˣ f = F(X) − F(0) = {fmt(F(X), 4)}<br />
        and dA/dX = f(X) = {fmt(f(X), 3)}
      </div>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "The fundamental theorem of calculus connects…", opts: ["limits and continuity", "accumulation (integrals) and rates (derivatives) as inverses", "areas and volumes", "sums and products"], a: 1, expl: "dA/dx = f(x): differentiating the running total recovers the integrand. Hence area = antiderivative difference." },
        { q: "∫₀² 2x dx = …", opts: ["2", "4", "8", "x²"], a: 1, expl: "Antiderivative of 2x is x²; evaluate: 2² − 0² = 4. (A definite integral is a number, not a function.)" },
      ]} />
    </Lesson>
  );
}

/* C9 — What does area have to do with slope? (average value) */
function C9({ award, qstate, setQstate }) {
  const [bb, setBb] = useState(3.14);
  const f = Math.sin;
  const avg = bb > 0.01 ? (1 - Math.cos(bb)) / bb : 0;
  const ox = 35, oy = 240, sx = 56, sy = 90;
  const pts = [];
  for (let i = 0; i <= 140; i++) {
    const t = (6.3 * i) / 140;
    pts.push(`${(ox + t * sx).toFixed(1)},${(oy - f(t) * sy).toFixed(1)}`);
  }
  const area = [];
  for (let i = 0; i <= 80; i++) {
    const t = (bb * i) / 80;
    area.push(`${(ox + t * sx).toFixed(1)},${(oy - f(t) * sy).toFixed(1)}`);
  }
  return (
    <Lesson eyebrow="essence of calculus · ch 9" title="Average value: area meets slope"
      caption="Average of sin(x) on [0, b] = shaded area ÷ width — drawn as the green line. A rectangle of that height over [0, b] has exactly the shaded area."
      viz={
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`}>
          <polygon points={`${ox},${oy} ${area.join(" ")} ${(ox + bb * sx).toFixed(1)},${oy}`} fill="var(--bp-amber)" fillOpacity="0.25" />
          <polyline points={pts.join(" ")} fill="none" stroke="var(--bp-cyan)" strokeWidth="2.5" />
          <line x1={ox} y1={oy} x2="392" y2={oy} stroke="var(--bp-line-strong)" strokeWidth="1.5" />
          <line x1={ox} y1={oy - avg * sy} x2={ox + bb * sx} y2={oy - avg * sy} stroke="var(--bp-green)" strokeWidth="2.5" strokeDasharray="7 4" />
          <text x={ox + bb * sx + 8} y={oy - avg * sy + 4} fill="var(--bp-green)" fontSize="12" fontFamily="var(--mono)">avg</text>
        </svg>
      }>
      <p>"Average of a continuum of values" sounds ill-defined — you can't sum infinitely many numbers and divide. The fix: average ≈ (sum of samples · dx) / (width) → <span className="mr-code">(1/(b−a)) ∫ f dx</span>. Averaging is integration in disguise.</p>
      <p>And since the integral is computed by an antiderivative F, the average becomes <span className="mr-code">(F(b) − F(a)) / (b − a)</span> — literally the <b>slope of the secant line</b> of F. Whenever you wonder "why would area help here?", reframe the question as an average.</p>
      <Slider label="interval end b" value={bb} set={setBb} min={0.3} max={6.28} />
      <div className="mr-readout">
        avg of sin on [0, {fmt(bb)}] = (1 − cos b)/b = <b>{fmt(avg, 4)}</b><br />
        = slope of −cos(x) between 0 and b
      </div>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "The average value of f on [a,b] is…", opts: ["(f(a)+f(b))/2", "∫f dx / (b−a)", "f((a+b)/2)", "max minus min"], a: 1, expl: "Total accumulated value divided by width — the height of the rectangle with the same area." },
        { q: "That average equals the slope of a secant line of…", opts: ["f itself", "an antiderivative of f", "f'", "any line"], a: 1, expl: "(F(b)−F(a))/(b−a): integrals of f are differences of F, and differences-over-width are slopes. Area ↔ slope, via the FTC." },
      ]} />
    </Lesson>
  );
}

/* C10 — Higher order derivatives */
function C10({ award, qstate, setQstate }) {
  const svgRef = useRef(null);
  const [x0, setX0] = useState(0.8);
  const f = (x) => (x ** 3) / 4 - x;
  const df = (x) => (3 * x * x) / 4 - 1;
  const ddf = (x) => (3 * x) / 2;
  const drag = useSvgDrag(svgRef, (_id, px) => setX0(clamp((px - 200) / FX, -4, 4)));
  const p0 = fToPx(x0, f(x0));
  return (
    <Lesson eyebrow="essence of calculus · ch 10" title="Higher order derivatives"
      caption="Cyan: f. Amber: f' (slope). Purple: f'' (curvature). Drag the point — where f'' > 0 the cyan curve smiles (concave up); where f'' < 0 it frowns."
      viz={
        <svg ref={svgRef} viewBox={`0 0 ${VIEW} ${VIEW}`} onPointerMove={drag.move} onPointerUp={drag.end} onPointerLeave={drag.end}>
          <PlaneAxes />
          <polyline points={curvePath(f)} fill="none" stroke="var(--bp-cyan)" strokeWidth="2.5" />
          <polyline points={curvePath(df)} fill="none" stroke="var(--bp-amber)" strokeWidth="1.8" strokeDasharray="6 4" />
          <polyline points={curvePath(ddf)} fill="none" stroke="var(--bp-purple)" strokeWidth="1.8" strokeDasharray="2 4" />
          <Handle at={p0} color="var(--bp-cyan)" onPointerDown={drag.start("p")} />
        </svg>
      }>
      <p>The derivative of the derivative. If f is position, f' is velocity and f'' is <b>acceleration</b> — the thing you physically feel in a car. Geometrically, f'' is curvature: is the slope itself increasing or decreasing?</p>
      <p>f'' {">"} 0: curve bends upward (valley-shaped). f'' {"<"} 0: bends downward. In optimization this is everything: second-order information (Hessians, in many dimensions) tells you whether a flat point is a minimum, maximum, or saddle.</p>
      <div className="mr-readout">
        x = {fmt(x0)}<br />
        f(x) = {fmt(f(x0))}   f'(x) = {fmt(df(x0))}   f''(x) = {fmt(ddf(x0))}<br />
        shape here: <b>{ddf(x0) > 0.05 ? "concave up ⌣" : ddf(x0) < -0.05 ? "concave down ⌢" : "inflection"}</b>
      </div>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "If f is position over time, f'' is…", opts: ["speed", "acceleration", "distance", "jerk"], a: 1, expl: "Rate of change of velocity. (The third derivative is genuinely called jerk.)" },
        { q: "At a critical point (f' = 0), f'' > 0 indicates…", opts: ["a local maximum", "a local minimum", "an asymptote", "nothing"], a: 1, expl: "Flat AND curving upward = bottom of a valley. This is the second-derivative test — and the 1D shadow of Hessian analysis in ML." },
      ]} />
    </Lesson>
  );
}

/* C11 — Taylor series */
function C11({ award, qstate, setQstate }) {
  const [terms, setTerms] = useState(2);
  const taylorSin = (x) => {
    let s = 0;
    for (let i = 0; i < terms; i++) {
      let fact = 1;
      for (let k = 2; k <= 2 * i + 1; k++) fact *= k;
      s += ((-1) ** i * x ** (2 * i + 1)) / fact;
    }
    return s;
  };
  const err = Math.abs(taylorSin(2) - Math.sin(2));
  return (
    <Lesson eyebrow="essence of calculus · ch 11" title="Taylor series"
      caption="Cyan: sin(x). Amber: its Taylor polynomial at 0. Each added term matches one more derivative — watch the polynomial hug the curve further and further out."
      viz={
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`}>
          <PlaneAxes />
          <polyline points={curvePath(Math.sin)} fill="none" stroke="var(--bp-cyan)" strokeWidth="2.5" />
          <polyline points={curvePath(taylorSin)} fill="none" stroke="var(--bp-amber)" strokeWidth="2" strokeDasharray="6 4" />
        </svg>
      }>
      <p>Polynomials are the functions computers actually like — easy to evaluate, differentiate, integrate. Taylor's idea: approximate <b>any</b> smooth function with a polynomial that copies its value, slope, curvature, … at one point.</p>
      <p>Each derivative you match adds a term <span className="mr-code">f⁽ⁿ⁾(0)·xⁿ/n!</span> (the n! cancels the exponent avalanche from differentiating xⁿ). For sin at 0: <span className="mr-code">x − x³/3! + x⁵/5! − …</span> This is also where <span className="mr-code">e^iθ = cosθ + i·sinθ</span> comes from, and how your math library computes sin in the first place.</p>
      <Slider label="number of terms" value={terms} set={(v) => setTerms(Math.round(v))} min={1} max={7} step={1} d={0} />
      <div className="mr-readout">
        P(x) = x{terms > 1 ? " − x³/6" : ""}{terms > 2 ? " + x⁵/120" : ""}{terms > 3 ? " − x⁷/5040" : ""}{terms > 4 ? " + …" : ""}<br />
        error at x = 2:  |P(2) − sin(2)| = {fmt(err, 5)}
      </div>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "The n-th Taylor coefficient (at 0) is fⁿ(0)/n! — the factorial is there because…", opts: ["of convention", "differentiating xⁿ n times produces n!", "it makes terms smaller", "Taylor liked factorials"], a: 1, expl: "d/dx applied n times to xⁿ gives n·(n−1)···1 = n!. Dividing by it ensures the polynomial's n-th derivative matches f's." },
        { q: "The first-order Taylor approximation f(a) + f'(a)(x−a) is just…", opts: ["the tangent line", "the secant line", "a parabola", "the average value"], a: 0, expl: "Taylor series are tangent lines upgraded: each term bends the approximation to match one more derivative." },
      ]} />
    </Lesson>
  );
}

/* C12 — Derivatives as transformations */
function C12({ award, qstate, setQstate }) {
  const [x0, setX0] = useState(1.5);
  const f = (x) => (x * x) / 4 - 2;
  const df = (x) => x / 2;
  const TOP = 120, BOT = 290, SC = 42;
  const offs = [-0.8, -0.4, 0, 0.4, 0.8];
  return (
    <Lesson eyebrow="essence of calculus · ch 12" title="What they won't teach you: f as a mapping"
      caption="Top line: inputs. Bottom line: where f(x) = x²/4 − 2 sends them. Around your point, the bundle of neighbors gets stretched by a factor of |f'(x)| — slide and watch the fan widen and narrow."
      viz={
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`}>
          <line x1="10" y1={TOP} x2="390" y2={TOP} stroke="var(--bp-line-strong)" strokeWidth="2" />
          <line x1="10" y1={BOT} x2="390" y2={BOT} stroke="var(--bp-line-strong)" strokeWidth="2" />
          {[-4, -2, 0, 2, 4].map((t) => (
            <g key={t}>
              <line x1={200 + t * SC} y1={TOP - 5} x2={200 + t * SC} y2={TOP + 5} stroke="var(--bp-dim)" />
              <line x1={200 + t * SC} y1={BOT - 5} x2={200 + t * SC} y2={BOT + 5} stroke="var(--bp-dim)" />
              <text x={200 + t * SC} y={TOP - 12} fill="var(--bp-dim)" fontSize="10" fontFamily="var(--mono)" textAnchor="middle">{t}</text>
            </g>
          ))}
          {offs.map((o, i) => {
            const xi = x0 + o;
            const xin = clamp(200 + xi * SC, 5, 395);
            const xout = clamp(200 + f(xi) * SC, 5, 395);
            return (
              <g key={i}>
                <circle cx={xin} cy={TOP} r={o === 0 ? 5 : 3} fill={o === 0 ? "var(--bp-cyan)" : "var(--bp-amber)"} />
                <line x1={xin} y1={TOP} x2={xout} y2={BOT} stroke={o === 0 ? "var(--bp-cyan)" : "var(--bp-amber)"} strokeOpacity="0.6" strokeWidth="1.5" />
                <circle cx={xout} cy={BOT} r={o === 0 ? 5 : 3} fill={o === 0 ? "var(--bp-cyan)" : "var(--bp-amber)"} />
              </g>
            );
          })}
          <text x="200" y="350" fill="var(--bp-green)" fontSize="13" fontFamily="var(--mono)" textAnchor="middle">local stretch ≈ |f'({fmt(x0, 1)})| = {fmt(Math.abs(df(x0)), 2)}</text>
        </svg>
      }>
      <p>Drop the graph entirely. Think of f as a machine that <b>moves points on a number line</b> to new positions. Zoom into a tiny neighborhood around x: the map looks like a pure stretch (or squish) — and the stretch factor is <b>|f'(x)|</b>.</p>
      <p>Where |f'| {">"} 1, neighbors spread apart; where |f'| {"<"} 1, they bunch up; f' {"<"} 0 means the neighborhood also flips. This transformational view is the one that generalizes — the Jacobian in higher dimensions is exactly "local linear map", and it's how derivatives are defined in serious math and in autograd systems.</p>
      <Slider label="x (center of the bundle)" value={x0} set={setX0} min={-3} max={3} />
      <div className="mr-readout">
        f(x) = x²/4 − 2   f'(x) = x/2 = {fmt(df(x0))}<br />
        {Math.abs(df(x0)) > 1 ? "stretching neighbors apart" : "squeezing neighbors together"}
      </div>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "In the transformational view, |f'(x)| measures…", opts: ["the height of the graph", "how much a tiny neighborhood of x gets stretched", "the area under f", "the curvature"], a: 1, expl: "Locally every smooth map is approximately linear; the derivative IS that local linear map. In nD it becomes the Jacobian matrix." },
        { q: "Points near a fixed point x* are pulled toward it under repeated application of f when…", opts: ["|f'(x*)| < 1", "|f'(x*)| > 1", "f(x*) = 0", "f is positive"], a: 0, expl: "Local squishing → distances to x* shrink each iteration (a stable fixed point). |f'| > 1 repels. This is the video's punchline." },
      ]} />
    </Lesson>
  );
}

/* BONUS — Gradient descent (everything compiled) */
const gdLoss = (w) => 0.05 * w ** 4 - 0.5 * w ** 2 + 0.3 * w + 2.2;
const gdGrad = (w) => 0.2 * w ** 3 - w + 0.3;
const GXX = 43, GYY = 58;
const gToPx = (w, L) => [200 + w * GXX, 380 - L * GYY];
const GD_PATH = (() => {
  const pts = [];
  for (let i = 0; i <= 220; i++) {
    const w = -4.5 + (9 * i) / 220;
    const [px, py] = gToPx(w, Math.min(6.4, gdLoss(w)));
    pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  return pts.join(" ");
})();

function BonusGD({ award, qstate, setQstate, challenges, completeChallenge }) {
  const svgRef = useRef(null);
  const [w, setW] = useState(3.6);
  const [lr, setLr] = useState(0.08);
  const [trail, setTrail] = useState([3.6]);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("ready");
  const done = challenges.has("gd");
  const step = useCallback(() => {
    setW((prev) => {
      const g = gdGrad(prev);
      const next = prev - lr * g;
      if (!Number.isFinite(next) || Math.abs(next) > 30) { setStatus("exploded"); setRunning(false); return prev; }
      setTrail((t) => [...t.slice(-60), next]);
      if (Math.abs(gdGrad(next)) < 0.01) { setStatus("converged"); setRunning(false); if (!done) completeChallenge("gd"); }
      else setStatus(Math.abs(next) > 4.4 ? "overshooting" : "descending");
      return next;
    });
  }, [lr, done, completeChallenge]);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(step, 120);
    return () => clearInterval(id);
  }, [running, step]);
  const reset = (s = 3.6) => { setW(s); setTrail([s]); setStatus("ready"); setRunning(false); };
  const pick = (e) => {
    if (!svgRef.current) return;
    const [px] = clientToSvg(svgRef.current, e.clientX, e.clientY);
    reset(clamp((px - 200) / GXX, -4.3, 4.3));
  };
  const pw = gToPx(w, Math.min(6.3, gdLoss(w)));
  const stText = { ready: "ready — tap the curve to drop the ball", descending: "descending…", overshooting: "overshooting — lr too hot", exploded: "EXPLODED — NaN loss, step 3, sound familiar?", converged: "converged — |∇L| < 0.01" }[status];
  const stColor = status === "exploded" ? "var(--bp-red)" : status === "converged" ? "var(--bp-green)" : status === "overshooting" ? "var(--bp-amber)" : "var(--bp-dim)";
  return (
    <Lesson eyebrow="bonus · where both series compile to" title="Gradient descent"
      caption="Tap to drop the ball, then run. Two valleys: depending on the start and learning rate you'll hit the global minimum, the local one, oscillate, or explode. All four happen in real training."
      viz={
        <svg ref={svgRef} viewBox={`0 0 ${VIEW} ${VIEW}`} onPointerDown={pick}>
          <PlaneAxes />
          <polyline points={GD_PATH} fill="none" stroke="var(--bp-ink)" strokeWidth="2.5" strokeOpacity="0.9" />
          {trail.map((tw, i) => {
            const [px, py] = gToPx(tw, Math.min(6.3, gdLoss(tw)));
            return <circle key={i} cx={px} cy={py} r="3.5" fill="var(--bp-amber)" fillOpacity={(0.15 + (0.6 * i) / trail.length).toFixed(2)} />;
          })}
          <circle cx={pw[0]} cy={pw[1]} r="9" fill="var(--bp-cyan)" stroke="#fff" strokeWidth="1.5" />
        </svg>
      }>
      <p>The payoff. The derivative (calculus) tells you which way is downhill; vectors and matrices (linear algebra) let you do it for millions of weights at once; the chain rule computes all those derivatives efficiently. The loop:</p>
      <p><span className="mr-code">w = w - lr * grad(w)</span></p>
      <p className="dim">That single line, in very high dimensions, is how every model you've used was trained. You now have the full intuition stack underneath it.</p>
      <Slider label="learning rate" value={lr} set={setLr} min={0.005} max={1.4} step={0.005} d={3} />
      <div className="mr-btnrow">
        <button className="mr-btn primary" onClick={() => setRunning((r) => !r)}>{running ? "pause" : "run"}</button>
        <button className="mr-btn" onClick={step} disabled={running}>step once</button>
        <button className="mr-btn" onClick={() => reset()}>reset</button>
      </div>
      <div className="mr-readout">
        w = {fmt(w, 3)}   L(w) = {fmt(gdLoss(w), 3)}   ∇L = {fmt(gdGrad(w), 3)}<br />
        steps: {trail.length - 1}   status: <b style={{ color: stColor }}>{stText}</b>
      </div>
      <Challenge done={done}>Converge: |∇L| {"<"} 0.01. Then retry the same start with lr = 1.2 and enjoy the fireworks.</Challenge>
      <Quiz award={award} qstate={qstate} setQstate={setQstate} questions={[
        { q: "Gradient descent updates weights with…", opts: ["w = w + lr·∇L", "w = w − lr·∇L", "w = ∇L/lr", "w = −w"], a: 1, expl: "The gradient points uphill on the loss surface; subtract it to descend." },
        { q: "A too-large learning rate typically causes…", opts: ["guaranteed faster convergence", "oscillation or divergence", "better minima", "nothing"], a: 1, expl: "Each step overshoots the valley floor and can amplify — the explosion you can reproduce on demand above." },
      ]} />
    </Lesson>
  );
}

/* ============================================================
   APP SHELL
   ============================================================ */
const LA_CHAPTERS = [
  { id: "la1", label: "01 vectors", Comp: LA1 },
  { id: "la2", label: "02 span", Comp: LA2, ch: ["la2"] },
  { id: "la3", label: "03 transforms", Comp: LA3 },
  { id: "la4", label: "04 composition", Comp: LA4 },
  { id: "la5", label: "05 3D", Comp: LA5 },
  { id: "la6", label: "06 determinant", Comp: LA6, ch: ["la6"] },
  { id: "la7", label: "07 inverse·rank", Comp: LA7, ch: ["la7"] },
  { id: "la8", label: "08 nonsquare", Comp: LA8 },
  { id: "la9", label: "09 dot product", Comp: LA9, ch: ["la9"] },
  { id: "la10", label: "10 cross", Comp: LA10 },
  { id: "la11", label: "11 cross deep", Comp: LA11 },
  { id: "la12", label: "12 cramer", Comp: LA12 },
  { id: "la13", label: "13 basis change", Comp: LA13 },
  { id: "la14", label: "14 eigen", Comp: LA14, ch: ["la14"] },
  { id: "la15", label: "15 eigen trick", Comp: LA15 },
  { id: "la16", label: "16 abstract", Comp: LA16 },
];
const CALC_CHAPTERS = [
  { id: "c1", label: "01 essence", Comp: C1 },
  { id: "c2", label: "02 derivative", Comp: C2, ch: ["c2"] },
  { id: "c3", label: "03 geometry", Comp: C3 },
  { id: "c4", label: "04 chain·product", Comp: C4 },
  { id: "c5", label: "05 e", Comp: C5, ch: ["c5"] },
  { id: "c6", label: "06 implicit", Comp: C6 },
  { id: "c7", label: "07 limits", Comp: C7 },
  { id: "c8", label: "08 integrals·FTC", Comp: C8 },
  { id: "c9", label: "09 avg value", Comp: C9 },
  { id: "c10", label: "10 higher d", Comp: C10 },
  { id: "c11", label: "11 taylor", Comp: C11 },
  { id: "c12", label: "12 f as map", Comp: C12 },
  { id: "gd", label: "★ gradient descent", Comp: BonusGD, ch: ["gd"] },
];
const TRACKS = {
  la: { name: "linear_algebra", chapters: LA_CHAPTERS },
  calc: { name: "calculus", chapters: CALC_CHAPTERS },
};

export default function MathRecompile() {
  const [xp, setXp] = useState(0);
  const [toast, setToast] = useState(null);
  const [track, setTrack] = useState("la");
  const [chIdx, setChIdx] = useState({ la: 0, calc: 0 });
  const [quizStates, setQuizStates] = useState({});
  const [challenges, setChallenges] = useState(() => new Set());
  const toastTimer = useRef(null);

  const award = useCallback((amount, msg) => {
    setXp((x) => Math.min(MAX_XP, x + amount));
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1900);
  }, []);
  const completeChallenge = useCallback((id) => {
    setChallenges((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev); next.add(id);
      return next;
    });
    award(20, "Challenge complete! +20 XP");
  }, [award]);

  const chapters = TRACKS[track].chapters;
  const idx = chIdx[track];
  const chapter = chapters[idx];
  const Comp = chapter.Comp;
  const qstate = quizStates[chapter.id] || {};
  const setQstate = (s) => setQuizStates((p) => ({ ...p, [chapter.id]: s }));

  const isDone = (c) => {
    const qs = quizStates[c.id] || {};
    const qDone = Object.keys(qs).length >= 2;
    const cDone = !c.ch || c.ch.every((id) => challenges.has(id));
    return qDone && cDone;
  };

  const level = levelFor(xp);
  const nextLevel = LEVELS.find((l) => l.at > xp);

  return (
    <div className="mr-root">
      <style>{css}</style>
      <div className="mr-shell">
        <header className="mr-header">
          <div>
            <h1 className="mr-title"><span className="fn">recompile</span>(<span className="arg">math</span>)</h1>
            <p className="mr-sub">The full 3Blue1Brown "Essence of" curriculum, rebuilt as interactive playgrounds — every chapter of both series, for engineers who think in code.</p>
          </div>
          <div className="mr-xpbox">
            <div className="mr-level">lvl · {level.name}</div>
            <div className="mr-xpbar"><div className="mr-xpfill" style={{ width: `${(100 * xp) / MAX_XP}%` }} /></div>
            <div className="mr-xpnum">{xp} / {MAX_XP} XP{nextLevel ? ` · next @ ${nextLevel.at}` : " · max"}</div>
          </div>
        </header>

        <div className="mr-tracks">
          {Object.entries(TRACKS).map(([key, t]) => (
            <button key={key} className={"mr-track" + (track === key ? " active" : "")} onClick={() => setTrack(key)}>
              {t.name}<span className="count">{t.chapters.filter(isDone).length}/{t.chapters.length}</span>
            </button>
          ))}
        </div>

        <div className="mr-chips">
          {chapters.map((c, i) => (
            <button key={c.id} className={"mr-chip" + (i === idx ? " active" : "")}
              onClick={() => setChIdx((p) => ({ ...p, [track]: i }))}>
              {c.label}{isDone(c) && <span className="done">✓</span>}
            </button>
          ))}
        </div>

        <Comp key={chapter.id} award={award} qstate={qstate} setQstate={setQstate}
          challenges={challenges} completeChallenge={completeChallenge} />

        <div className="mr-nav">
          <button className="mr-btn" disabled={idx === 0}
            onClick={() => setChIdx((p) => ({ ...p, [track]: Math.max(0, idx - 1) }))}>← prev</button>
          <button className="mr-btn primary" disabled={idx === chapters.length - 1}
            onClick={() => setChIdx((p) => ({ ...p, [track]: Math.min(chapters.length - 1, idx + 1) }))}>next chapter →</button>
        </div>
      </div>
      {toast && <div className="mr-toast">{toast}</div>}
    </div>
  );
}
