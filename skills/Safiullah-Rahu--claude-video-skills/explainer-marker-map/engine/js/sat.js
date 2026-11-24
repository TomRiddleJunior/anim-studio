/* map-films engine · satellite: masked Sentinel-2 land mosaics (3 zoom levels) over a drawn navy sea with a teal
   shallow-water halo. Finer mosaics fade in as the camera zooms and replace the coarser ones inside their extent. */
(function () {
  'use strict';
  const MF = window.MF;

  const loadImg = (src) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('image ' + src)); im.src = src; });

  MF.Satellite = class {
    constructor(mosaics, base, W, H, style = {}) {
      this.base = base; this.W = W; this.H = H;
      this.levels = (mosaics && mosaics.levels ? mosaics.levels : []).slice().sort((a, b) => a.z - b.z);
      this.st = Object.assign({ seaC: '#14304A', seaE: '#0B1E31', fadeIn: [1.1, 0.3] }, style);
      this.can = document.createElement('canvas'); this.can.width = W; this.can.height = H;
      this.landCan = document.createElement('canvas'); this.landCan.width = W; this.landCan.height = H;
      this.cx = this.can.getContext('2d'); this.lx = this.landCan.getContext('2d');
      const g = this.cx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.hypot(W, H) / 2);
      g.addColorStop(0, this.st.seaC); g.addColorStop(0.35, this.st.seaC); g.addColorStop(1, this.st.seaE);
      this.sea = g;
    }
    async load() {
      for (const l of this.levels) {
        [l.landImg, l.haloImg] = await Promise.all([loadImg(this.base + l.land), loadImg(this.base + l.halo)]);
        // coverage mask = the mosaic's feathered extent (what a finer level erases of the coarser ones)
        const cw = Math.max(8, Math.round(l.w / 8)), ch = Math.max(8, Math.round(l.h / 8)), f = 5;
        const c = document.createElement('canvas'); c.width = cw; c.height = ch;
        const x = c.getContext('2d'), id = x.createImageData(cw, ch);
        for (let r = 0; r < ch; r++) for (let q = 0; q < cw; q++) {
          const d = Math.min(r, ch - 1 - r, q, cw - 1 - q) / f, u = MF.clamp(d);
          id.data[(r * cw + q) * 4 + 3] = Math.round(255 * u * u * (3 - 2 * u));
        }
        x.putImageData(id, 0, 0);
        l.cov = c;
      }
      return this;
    }
    fades(Z) {
      return this.levels.map((l, k) => (k === 0 ? 1 : MF.smooth(l.z - this.st.fadeIn[0], l.z - this.st.fadeIn[1], Z)));
    }
    /* renders the satellite stack for camera `cam` and composites it onto ctx at `alpha` */
    draw(ctx, cam, alpha) {
      if (alpha <= 0.002) return;
      const { W, H } = this, cx = this.cx, lx = this.lx;
      cx.setTransform(1, 0, 0, 1, 0, 0);
      cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
      cx.fillStyle = this.sea; cx.fillRect(0, 0, W, H);
      if (this.levels.length) {
        const f = this.fades(cam.Z);
        const vb = cam.worldBounds(0);
        const vis = this.levels.map((l) => !(l.x1 < vb[0] || l.x0 > vb[2] || l.y1 < vb[1] || l.y0 > vb[3]));
        // finest level that fully covers the view at full fade → nothing below it needs drawing
        let floor = 0;
        for (let k = this.levels.length - 1; k > 0; k--) {
          const l = this.levels[k], m = (l.x1 - l.x0) * (48 / l.w);
          if (f[k] > 0.999 && l.x0 + m < vb[0] && l.x1 - m > vb[2] && l.y0 + m < vb[1] && l.y1 - m > vb[3]) { floor = k; break; }
        }
        cx.save(); cam.apply(cx); cx.imageSmoothingQuality = 'high';
        for (let k = floor; k < this.levels.length; k++) {
          if (!vis[k]) continue;
          let a = f[k];
          for (let j = k + 1; j < this.levels.length; j++) a *= 1 - f[j];
          if (a < 0.003) continue;
          const l = this.levels[k];
          cx.globalAlpha = a;
          cx.drawImage(l.haloImg, l.x0, l.y0, l.x1 - l.x0, l.y1 - l.y0);
        }
        cx.restore();
        lx.setTransform(1, 0, 0, 1, 0, 0); lx.globalAlpha = 1; lx.globalCompositeOperation = 'source-over';
        lx.clearRect(0, 0, W, H);
        lx.save(); cam.apply(lx); lx.imageSmoothingQuality = 'high';
        for (let k = floor; k < this.levels.length; k++) {
          if (!vis[k] || f[k] < 0.003) continue;
          const l = this.levels[k], r = [l.x0, l.y0, l.x1 - l.x0, l.y1 - l.y0];
          if (k > floor) { lx.globalCompositeOperation = 'destination-out'; lx.globalAlpha = f[k]; lx.drawImage(l.cov, ...r); }
          lx.globalCompositeOperation = 'source-over'; lx.globalAlpha = k > floor ? f[k] : 1;
          lx.drawImage(l.landImg, ...r);
        }
        lx.restore();
        cx.globalAlpha = 1;
        cx.drawImage(this.landCan, 0, 0);
      }
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = alpha;
      ctx.drawImage(this.can, 0, 0);
      ctx.restore();
    }
  };
})();
