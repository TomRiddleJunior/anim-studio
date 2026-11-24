/* demo-hud-config.js — HUD timeline for the template (read by ps1-hud.js). Times come from the voice-over words. */
window.HUD_CONFIG = function (V) {
  const S = (id) => V.L(id).start;
  return {
    title: ["WHAT IF YOU COULD", "REWIND", "10 SECONDS?"], flip: 1.0, titleOff: S("h2") + 0.25,
    rewinds: [S("h3") - 0.05], plays: [S("h4") - 0.05],
    takes: [[S("h3"), S("h4"), 1, 2, "TAKE", V.endCard]],
    ages: [[0, 24]], lived: [[0, 0.01, 24, 24]], age0: 24,
    hudOn: S("h3") - 0.05, end: V.endCard, endText: ["Would you", "press REWIND?"], skipCaps: ["h1"],
  };
};
