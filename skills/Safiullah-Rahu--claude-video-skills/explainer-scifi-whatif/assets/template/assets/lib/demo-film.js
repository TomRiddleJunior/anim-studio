/* demo-film.js — a 3-scene demo of the sci-fi what-if grammar: cold open with the robot and the HUD, a NOW HIRING card
   (cut), a comments card (cut). window.ONEYEAR(canvas, V) -> { draw(t), scenes } (same factory shape as the sample). */
window.ONEYEAR = function (canvas, V) {
  const ctx = canvas.getContext("2d");
  const off = document.createElement("canvas"); off.width = 1920; off.height = 1080;
  const G1 = window.SCIFI.kit(ctx), G2 = window.SCIFI.kit(off.getContext("2d"));
  const { clamp, sm, eo, P } = G1;
  const S = (id) => V.L(id).start, E = (id) => V.L(id).end, w = (id, word) => V.w(id, word);
  const sc = [];
  const scene = (t0, o) => { o.t0 = t0; sc.push(o); return o; };
  scene(0, { draw(G, t) {
    G.ground("#141c2c", "#070b14");
    const c = G.ctx, wx = 1250, wy = 470, wr = 330;
    c.save(); c.beginPath(); c.arc(wx, wy, wr, 0, Math.PI * 2); c.clip(); c.fillStyle = "#02040a"; c.fillRect(wx - wr, wy - wr, 2 * wr, 2 * wr);
    G.stars(t, { seed: 11, n: 160, x: wx - wr, y: wy - wr, w: wr * 2, h: wr * 2, drift: 6 }); G.planet(wx + 80, wy + 310, 250, { seed: 5, rot: t * 0.01 }); c.restore();
    c.lineWidth = 26; c.strokeStyle = "#c9d1dc"; c.beginPath(); c.arc(wx, wy, wr + 12, 0, Math.PI * 2); c.stroke();
    G.otto({ x: wx, y: 520, s: 1.05, t, face: t > w("d1", "only") ? "happy" : "idle" });
    G.text("POV: a robot is your only company", 150, 150, { size: 34, weight: 600, color: "#d8dde6" });
    G.text("SHIP TIME", 160, 330, { size: 22, weight: 600, ls: 6, color: P.grey });
    G.text("1 YEAR", 150, 460, { size: 130, weight: 500, fam: G.F.mono, color: P.white, glow: 16 });
  } });
  scene(S("d2") - 0.15, { draw(G, t) {
    G.ground("#0e1a2e", "#05080f", [600, 700, 700, "rgba(60,110,180,0.25)"]);
    G.ship(560, 600, 1.15, {});
    G.card(940, 170, 760, 560);
    G.text("NOW HIRING · 2031", 1320, 250, { size: 30, weight: 700, ls: 9, color: P.yellow, align: "center" });
    G.text("DEEP SPACE COURIER", 1320, 320, { size: 44, weight: 700, color: P.white, align: "center" });
    const m = Math.round(5000000 * eo((t - S("d2") - 0.2) / 2.0));
    G.text("$" + m.toLocaleString("en-US"), 1320, 450, { size: 110, weight: 800, color: P.yellow, align: "center", glow: 18 });
    const c = G.ctx; c.fillStyle = P.cyan; G.rr(1110, 500, 420, 96, 18); c.fill();
    G.text("FLY 1 YEAR", 1320, 564, { size: 40, weight: 800, color: "#06121a", align: "center" });
  } });
  scene(E("d2") + 0.3, { draw(G, t) {
    G.ground("#0c1222", "#03050a"); G.stars(t, { seed: 61, n: 220, a: 0.7 });
    G.text("TELL ME IN THE COMMENTS", 960, 560, { size: 44, weight: 800, ls: 4, color: P.yellow, align: "center", glow: 14, a: G.pop(t, E("d2") + 0.3, 0.35).a });
  } });
  function draw(t) {
    let i = 0; while (i < sc.length - 1 && t >= sc[i + 1].t0) i++;
    const s = sc[i];
    ctx.save(); ctx.clearRect(0, 0, 1920, 1080);
    if (s.xf && t - s.t0 < s.xf && i > 0) { sc[i - 1].draw(G1, t); const oc = off.getContext("2d"); oc.clearRect(0, 0, 1920, 1080); s.draw(G2, t); ctx.globalAlpha = sm((t - s.t0) / s.xf); ctx.drawImage(off, 0, 0); ctx.globalAlpha = 1; }
    else s.draw(G1, t);
    ctx.restore();
    if (t < E("d2") + 0.3) G1.hud("SHIP TIME", t < S("d2") - 0.15 ? "EARTH · 2101" : "FLASHBACK · 2031", "0y " + String(Math.floor(t * 3)).padStart(3, "0") + "d 00:00:" + (t % 60).toFixed(6).padStart(9, "0"));
    G1.vignette(0.55); G1.grain(t, 0.05);
  }
  return { draw, scenes: sc };
};
