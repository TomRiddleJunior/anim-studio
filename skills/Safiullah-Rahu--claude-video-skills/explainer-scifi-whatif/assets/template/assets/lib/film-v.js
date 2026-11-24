/* film-v.js — word/line lookups over window.FILM_VO (written by tools/build.py). window.MAKE_V() -> V */
window.MAKE_V = function () {
  const D = window.FILM_VO;
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9']/g, "").replace(/’/g, "'");
  return {
    dur: D.dur, endCard: D.endCard, caps: D.caps,
    L(id) { const l = D.lines[id]; if (!l) throw new Error("no line " + id); return l; },
    w(id, word, k) {
      const hits = D.lines[id].words.filter((x) => norm(x[0]).startsWith(norm(word)));
      if (!hits.length) throw new Error("no word " + id + ":" + word);
      return hits[Math.min(k || 0, hits.length - 1)][1];
    },
  };
};
