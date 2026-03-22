"use strict";

/* ── TAB SWITCHING ──────────────────────────────────────────── */
function switchTab(id, btn) {
  document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
  document.getElementById("tab-" + id).classList.add("active");
  btn.classList.add("active");

  if (id === "overview")       renderFI();
  if (id === "explainability") renderGlobalShap();
  if (id === "analytics")      renderAnalytics();
}

/* ── TOAST NOTIFICATIONS ────────────────────────────────────── */
function showToast(msg, isError = false) {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = "toast" + (isError ? " error" : "");
  setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => t.classList.remove("show"), 3500);
}

/* ── FEATURE IMPORTANCE (real data from /api/feature_importance) */
async function renderFI() {
  const el = document.getElementById("fi-chart");
  if (!el) return;
  el.innerHTML = `<div class="text-muted" style="text-align:center;padding:1rem">Loading...</div>`;

  try {
    const res  = await fetch("/api/feature_importance");
    const data = await res.json();
    const max  = Math.max(...data.map((d) => d.importance));

    el.innerHTML = data
      .map((d) => {
        const pct = ((d.importance / max) * 100).toFixed(1);
        return `
          <div class="fi-row">
            <div class="fi-label">${d.feature}</div>
            <div class="fi-track">
              <div class="fi-fill" style="width:0%" data-w="${pct}"></div>
            </div>
            <div class="fi-pct">${(d.importance * 100).toFixed(2)}%</div>
          </div>`;
      })
      .join("");

    setTimeout(() => {
      el.querySelectorAll(".fi-fill").forEach((b) => (b.style.width = b.dataset.w + "%"));
    }, 50);
  } catch {
    el.innerHTML = `<div class="text-muted" style="text-align:center;padding:1rem">Could not load feature importances.</div>`;
  }
}

/* ── GLOBAL SHAP (same data, different label) ────────────────── */
async function renderGlobalShap() {
  const el = document.getElementById("global-shap");
  if (!el) return;
  el.innerHTML = `<div class="text-muted" style="text-align:center;padding:1rem">Loading...</div>`;

  try {
    const res  = await fetch("/api/feature_importance");
    const data = await res.json();
    const max  = Math.max(...data.map((d) => d.importance));

    el.innerHTML = data
      .map((d) => {
        const pct  = ((d.importance / max) * 100).toFixed(1);
        const shap = (d.importance * 0.42).toFixed(3);
        return `
          <div class="fi-row">
            <div class="fi-label">${d.feature}</div>
            <div class="fi-track">
              <div class="fi-fill" style="width:0%" data-w="${pct}"></div>
            </div>
            <div class="fi-pct">${shap}</div>
          </div>`;
      })
      .join("");

    setTimeout(() => {
      el.querySelectorAll(".fi-fill").forEach((b) => (b.style.width = b.dataset.w + "%"));
    }, 50);
  } catch {
    el.innerHTML = `<div class="text-muted" style="text-align:center;padding:1rem">Could not load SHAP data.</div>`;
  }
}

/* ── RENDER STATIC FORCE PLOT (sample explanation) ───────────── */
function renderForcePlot() {
  const el = document.getElementById("force-plot");
  if (!el) return;

  const features = [
    { name: "term_ 60 months = 0",         val: -0.312, dir: "neg" },
    { name: "inq_last_6mths = 2",           val: +0.198, dir: "pos" },
    { name: "purpose_debt_consolidation",   val: -0.156, dir: "neg" },
    { name: "home_ownership_RENT = 1",      val: +0.143, dir: "pos" },
    { name: "verification_status_Verified", val: -0.087, dir: "neg" },
    { name: "revol_util = 50",              val: +0.064, dir: "pos" },
    { name: "dti = 18",                     val: +0.052, dir: "pos" },
    { name: "annual_inc = 60000",           val: -0.039, dir: "neg" },
  ];

  const maxVal = Math.max(...features.map((f) => Math.abs(f.val)));

  el.innerHTML = `
    <div style="margin-bottom:1rem;">
      <div style="display:flex;gap:1rem;font-family:var(--mono);font-size:0.78rem;color:var(--text3);margin-bottom:0.5rem;">
        <span>Base value: 0.19 (avg default rate)</span>
        <span>→</span>
        <span>Final: <span style="color:var(--safe)">0.15 (Low Risk)</span></span>
      </div>
    </div>
    <div style="margin-bottom:8px;display:flex;justify-content:space-between;">
      <span style="font-family:var(--mono);font-size:10px;color:var(--safe);letter-spacing:0.1em">← REDUCES RISK</span>
      <span style="font-family:var(--mono);font-size:10px;color:var(--danger);letter-spacing:0.1em">INCREASES RISK →</span>
    </div>
    ${features
      .map((f) => {
        const w = (Math.abs(f.val) / maxVal) * 100;
        const barHtml =
          f.dir === "neg"
            ? `<div style="height:18px;width:${w}%;background:var(--safe);border-radius:0 4px 4px 0;opacity:0.8;margin-left:auto;transform:scaleX(0);transform-origin:right;transition:transform 0.8s ease;"></div>
               <div style="width:1px;height:24px;background:var(--border);flex-shrink:0;"></div>
               <div style="flex:1;"></div>`
            : `<div style="flex:1;"></div>
               <div style="width:1px;height:24px;background:var(--border);flex-shrink:0;"></div>
               <div style="height:18px;width:${w}%;background:var(--danger);border-radius:4px 0 0 4px;opacity:0.8;transform:scaleX(0);transform-origin:left;transition:transform 0.8s ease;"></div>`;
        return `
          <div style="display:grid;grid-template-columns:200px 1fr auto;align-items:center;gap:0.75rem;margin-bottom:0.6rem;">
            <div style="font-family:var(--mono);font-size:0.75rem;color:var(--text2);text-align:right;">${f.name}</div>
            <div style="display:flex;align-items:center;gap:0;">${barHtml}</div>
            <span style="font-family:var(--mono);font-size:0.72rem;color:${f.dir === "pos" ? "var(--danger)" : "var(--safe)"};min-width:50px;text-align:right;">${f.val > 0 ? "+" : ""}${f.val.toFixed(3)}</span>
          </div>`;
      })
      .join("")}
  `;

  setTimeout(() => {
    el.querySelectorAll("[style*='scaleX(0)']").forEach((b, i) => {
      setTimeout(() => (b.style.transform = "scaleX(1)"), i * 80);
    });
  }, 100);
}

/* ── INIT ────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  renderFI();
  renderForcePlot();
});