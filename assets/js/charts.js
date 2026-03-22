"use strict";
const PALETTE = {
  accent:  "#00e5c3",
  accent2: "#00b89a",
  warn:    "#f59e0b",
  danger:  "#ef4444",
  safe:    "#22c55e",
  text2:   "#8ca5ad",
  border:  "#2a3840",
  bg2:     "#111618",
  surface2:"#1f292e",
};

// Global chart instances (destroyed before re-render)
const _charts = {};

function destroyChart(id) {
  if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; }
}

// Shared Chart.js defaults
const BASE_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: PALETTE.text2, font: { family: "'IBM Plex Mono'", size: 11 } } },
    tooltip: {
      backgroundColor: "#1a2226",
      borderColor: PALETTE.border,
      borderWidth: 1,
      titleColor: "#e8f0f0",
      bodyColor: PALETTE.text2,
      titleFont: { family: "'IBM Plex Mono'" },
      bodyFont:  { family: "'IBM Plex Mono'" },
    },
  },
  scales: {
    x: { ticks: { color: PALETTE.text2, font: { family: "'IBM Plex Mono'", size: 10 } }, grid: { color: "rgba(42,56,64,0.5)" } },
    y: { ticks: { color: PALETTE.text2, font: { family: "'IBM Plex Mono'", size: 10 } }, grid: { color: "rgba(42,56,64,0.5)" } },
  },
};


/* ── Load + render entire analytics tab ──────────────────────── */
async function renderAnalytics() {
  const wrap = document.getElementById("analytics-loading");
  if (wrap) wrap.style.display = "flex";

  try {
    const [dashRes, histRes] = await Promise.all([
      fetch("/api/dashboard"),
      fetch("/api/history"),
    ]);
    const dash = await dashRes.json();
    const hist = await histRes.json();

    renderKPIs(dash.kpis);
    renderRiskDist(dash.risk_dist);
    renderHistogram(dash.hist_labels, dash.hist_values);
    renderByPurpose(dash.by_purpose);
    renderByOwnership(dash.by_ownership);
    renderByTerm(dash.by_term);
    renderByYear(dash.by_year);
    renderHistoryTable(hist);

    if (wrap) wrap.style.display = "none";
  } catch (err) {
    console.error("Analytics load failed:", err);
    const el = document.getElementById("analytics-error");
    if (el) { el.style.display = "block"; el.textContent = "Failed to load analytics: " + err.message; }
  }
}


/* ── KPI CARDS ───────────────────────────────────────────────── */
function renderKPIs(kpis) {
  const map = {
    "kpi-total":    { val: kpis.total_applications, suffix: "", label: "Total Applications" },
    "kpi-avg-risk": { val: kpis.avg_risk_score,     suffix: "", label: "Avg Risk Score" },
    "kpi-high-pct": { val: kpis.high_risk_pct,      suffix: "%", label: "High-Risk Rate" },
    "kpi-loan":     { val: (kpis.avg_loan_amnt/1000).toFixed(0) + "K", suffix: "₹", label: "Avg Loan Amt" },
    "kpi-rate":     { val: kpis.avg_int_rate,        suffix: "%", label: "Avg Int Rate" },
    "kpi-income":   { val: (kpis.avg_annual_inc/1000).toFixed(0) + "K", suffix: "₹", label: "Avg Income" },
  };

  for (const [id, cfg] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) el.textContent = cfg.suffix + cfg.val;
  }
}


/* ── DOUGHNUT: Risk Distribution ─────────────────────────────── */
function renderRiskDist(dist) {
  const ctx = document.getElementById("chart-risk-dist");
  if (!ctx) return;
  destroyChart("risk-dist");

  const labels = Object.keys(dist);
  const values = Object.values(dist);
  const colors = labels.map(l =>
    l === "Low Risk" ? PALETTE.safe : l === "Medium Risk" ? PALETTE.warn : PALETTE.danger
  );

  _charts["risk-dist"] = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors.map(c => c + "cc"),
        borderColor:     colors,
        borderWidth: 2,
        hoverOffset: 8,
      }],
    },
    options: {
      ...BASE_OPTS,
      cutout: "65%",
      scales: {},   // no axes for doughnut
      plugins: {
        ...BASE_OPTS.plugins,
        legend: { position: "bottom", labels: { color: PALETTE.text2, font: { family: "'IBM Plex Mono'", size: 11 }, padding: 16 } },
      },
    },
  });
}


/* ── BAR: Risk Score Histogram ───────────────────────────────── */
function renderHistogram(labels, values) {
  const ctx = document.getElementById("chart-histogram");
  if (!ctx) return;
  destroyChart("histogram");

  _charts["histogram"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Applicants",
        data: values,
        backgroundColor: labels.map((_, i) => {
          const mid = i / labels.length;
          if (mid < 0.3) return PALETTE.safe + "cc";
          if (mid < 0.6) return PALETTE.warn + "cc";
          return PALETTE.danger + "cc";
        }),
        borderColor: labels.map((_, i) => {
          const mid = i / labels.length;
          if (mid < 0.3) return PALETTE.safe;
          if (mid < 0.6) return PALETTE.warn;
          return PALETTE.danger;
        }),
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      ...BASE_OPTS,
      plugins: { ...BASE_OPTS.plugins, legend: { display: false } },
      scales: {
        ...BASE_OPTS.scales,
        y: { ...BASE_OPTS.scales.y, title: { display: true, text: "Count", color: PALETTE.text2, font: { family: "'IBM Plex Mono'", size: 10 } } },
        x: { ...BASE_OPTS.scales.x, ticks: { ...BASE_OPTS.scales.x.ticks, maxRotation: 45 } },
      },
    },
  });
}


/* ── HORIZONTAL BAR: By Purpose ─────────────────────────────── */
function renderByPurpose(byPurpose) {
  const ctx = document.getElementById("chart-by-purpose");
  if (!ctx) return;
  destroyChart("by-purpose");

  const labels = Object.keys(byPurpose).map(k => k.replace(/_/g, " "));
  const values = Object.values(byPurpose);
  const colors = values.map(v => v < 30 ? PALETTE.safe : v < 55 ? PALETTE.warn : PALETTE.danger);

  _charts["by-purpose"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Avg Risk Score",
        data: values,
        backgroundColor: colors.map(c => c + "aa"),
        borderColor: colors,
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      ...BASE_OPTS,
      indexAxis: "y",
      plugins: { ...BASE_OPTS.plugins, legend: { display: false } },
      scales: {
        x: { ...BASE_OPTS.scales.x, min: 0, max: 100,
             title: { display: true, text: "Avg Risk Score", color: PALETTE.text2, font: { family: "'IBM Plex Mono'", size: 10 } } },
        y: { ...BASE_OPTS.scales.y },
      },
    },
  });
}


/* ── BAR: By Home Ownership ──────────────────────────────────── */
function renderByOwnership(byOwner) {
  const ctx = document.getElementById("chart-by-ownership");
  if (!ctx) return;
  destroyChart("by-ownership");

  _charts["by-ownership"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(byOwner),
      datasets: [{
        label: "Avg Risk Score",
        data: Object.values(byOwner),
        backgroundColor: [PALETTE.accent + "aa", PALETTE.accent2 + "aa", PALETTE.text2 + "aa", PALETTE.border + "aa"],
        borderColor:     [PALETTE.accent, PALETTE.accent2, PALETTE.text2, PALETTE.border],
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      ...BASE_OPTS,
      plugins: { ...BASE_OPTS.plugins, legend: { display: false } },
      scales: { ...BASE_OPTS.scales, y: { ...BASE_OPTS.scales.y, min: 0, max: 60 } },
    },
  });
}


/* ── DOUGHNUT: By Loan Term ──────────────────────────────────── */
function renderByTerm(byTerm) {
  const ctx = document.getElementById("chart-by-term");
  if (!ctx) return;
  destroyChart("by-term");

  _charts["by-term"] = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(byTerm).map(k => k + " months"),
      datasets: [{
        data: Object.values(byTerm),
        backgroundColor: [PALETTE.accent + "cc", PALETTE.warn + "cc"],
        borderColor:     [PALETTE.accent, PALETTE.warn],
        borderWidth: 2,
        hoverOffset: 8,
      }],
    },
    options: {
      ...BASE_OPTS,
      cutout: "60%",
      scales: {},
      plugins: {
        ...BASE_OPTS.plugins,
        legend: { position: "bottom", labels: { color: PALETTE.text2, font: { family: "'IBM Plex Mono'", size: 11 }, padding: 14 } },
        tooltip: {
          ...BASE_OPTS.plugins.tooltip,
          callbacks: { label: (ctx) => ` Avg Risk: ${ctx.parsed.toFixed(1)}` },
        },
      },
    },
  });
}


/* ── LINE: Risk by Year ──────────────────────────────────────── */
function renderByYear(byYear) {
  const ctx = document.getElementById("chart-by-year");
  if (!ctx) return;
  destroyChart("by-year");

  const labels = Object.keys(byYear).sort();
  const values = labels.map(k => byYear[k]);

  _charts["by-year"] = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Avg Risk Score",
        data: values,
        borderColor: PALETTE.accent,
        backgroundColor: PALETTE.accent + "22",
        pointBackgroundColor: PALETTE.accent,
        pointRadius: 5,
        tension: 0.35,
        fill: true,
      }],
    },
    options: {
      ...BASE_OPTS,
      plugins: { ...BASE_OPTS.plugins, legend: { display: false } },
      scales: { ...BASE_OPTS.scales, y: { ...BASE_OPTS.scales.y, min: 0 } },
    },
  });
}


/* ── HISTORY TABLE ───────────────────────────────────────────── */
function renderHistoryTable(rows) {
  const tbody = document.getElementById("history-tbody");
  const empty = document.getElementById("history-empty");
  if (!tbody) return;

  if (!rows || rows.length === 0) {
    tbody.innerHTML = "";
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";

  const cls = { low: "var(--safe)", medium: "var(--warn)", high: "var(--danger)" };

  tbody.innerHTML = rows.map((r, i) => `
    <tr>
      <td style="color:var(--text3);font-family:var(--mono);font-size:0.75rem;">#${i+1}</td>
      <td style="font-family:var(--mono);font-size:0.8rem;">₹${Number(r.loan_amnt).toLocaleString()}</td>
      <td style="font-family:var(--mono);font-size:0.8rem;">${r.int_rate}%</td>
      <td style="font-family:var(--mono);font-size:0.8rem;">₹${Number(r.annual_inc).toLocaleString()}</td>
      <td style="font-family:var(--mono);font-size:0.8rem;text-transform:capitalize;">${(r.purpose || "—").replace(/_/g, " ")}</td>
      <td style="font-family:var(--mono);font-size:0.8rem;font-weight:600;color:var(--text);">${r.risk_score}</td>
      <td><span style="background:${cls[r.verdict_class] + "22"};color:${cls[r.verdict_class]};border:1px solid ${cls[r.verdict_class] + "66"};border-radius:6px;padding:2px 10px;font-family:var(--mono);font-size:0.72rem;">${r.verdict}</span></td>
    </tr>
  `).join("");
}