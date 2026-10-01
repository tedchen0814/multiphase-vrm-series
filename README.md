# Multi-phase VRM Series（多相供電互動教學）

多相 VRM（Voltage Regulator Module）互動教學網站：交錯並聯與紋波抵消、Load-line（AVP）負載暫態等。

- 公開網站：https://multiphase-vrm-series.vercel.app/
- 產生器：`_src/`（`shell.html` 版型、`series.css`＋`vrm.css`、`common.js`、各站 `*.part.html`）
- 建置：`python _src/build.py` → 單檔版 `VRM-*_互動教學.html`（不進 git）與 `_site/`（Vercel 根目錄）
- 內容整理：`多相供電Multi-phase VRM_學習順序整理.md`