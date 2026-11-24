/* race.js — the two curves of this film. Change this file (and the beats in tools/build.py) to make another race.
   Every value shown on screen must be exact: verify crossings with tools/verify_math.py before you render. */
window.RACE = {
  brand: "PLOT TWISTS",
  title: [["2"], ["x", 1], ["  vs  x"], ["2", 1]],          // [text, superscript?]
  f1: (x) => Math.pow(2, x), f2: (x) => x * x,
  lab1: [["y", "i"], [" = ", "u"], ["2", "u"], ["x", "si"]], // i italic, u upright, si/su superscript italic/upright
  lab2: [["y", "i"], [" = ", "u"], ["x", "i"], ["2", "su"]],
  col1: "#ff7a59", col2: "#59c8ff",                          // 2^x coral, x^2 sky
  firstLead: 2,                                              // x^2 is ahead at the start
  xStart: -2.6, xReveal: 5.45, xEnd: 5.72,
  crossings: [{ x: -0.7666646959621231, lab: "x ≈ −0.767" }, { x: 2, lab: "x = 2" }, { x: 4, lab: "x = 4" }],
};
