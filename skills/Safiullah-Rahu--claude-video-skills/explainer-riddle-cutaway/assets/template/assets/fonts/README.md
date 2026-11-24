# Fonts for this template

- `Inter_opsz-wght_.ttf` ships in this folder (SIL OFL 1.1, see `FONT-LICENSES.txt`).
- The pill and card slab serif is **Roboto Slab** (SIL OFL 1.1). It is not shipped here: download it from
  https://fonts.google.com/specimen/Roboto+Slab and put the variable font in this folder as `RobotoSlab_wght_.ttf`
  (the Google Fonts file `RobotoSlab[wght].ttf`, renamed).

The compositions, `tools/build.py` and `tools/cover.py` load `assets/fonts/RobotoSlab_wght_.ttf` under the CSS family
names "RSlab" (weight 700, pills and cards) and "RSlabR" (weight 400). Without the file the pills fall back to a generic
serif and `tools/cover.py` cannot draw the cover.
