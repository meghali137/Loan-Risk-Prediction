"use strict";

/* ── Human-readable labels for model feature names ──────────── */
const FEATURE_LABELS = {
  // Numeric
  loan_amnt:               "Loan Amount",
  int_rate:                "Interest Rate (%)",
  emp_length:              "Employment (years)",
  annual_inc:              "Annual Income",
  dti:                     "Debt-to-Income Ratio",
  revol_bal:               "Revolving Balance",
  revol_util:              "Credit Utilization (%)",
  delinq_2yrs:             "Delinquencies (2yr)",
  inq_last_6mths:          "Inquiries (6 months)",
  open_acc:                "Open Accounts",
  pub_rec:                 "Public Records",
  total_acc:               "Total Accounts",
  credit_history_years:    "Credit History (years)",
  mths_since_last_delinq:  "Months Since Delinquency",
  issue_year:              "Issue Year",
  revol_bal:               "Revolving Balance",
  collections_12_mths_ex_med: "Collections (12 months)",
  acc_now_delinq:          "Accounts Currently Delinquent",
  delinq_amnt:             "Delinquency Amount",
  pub_rec_bankruptcies:    "Public Bankruptcies",
  tax_liens:               "Tax Liens",

  // Term
  "term_ 60 months":       "Loan Term: 60 months",

  // Sub grades
  sub_grade_A1:"Sub-Grade A1", sub_grade_A2:"Sub-Grade A2", sub_grade_A3:"Sub-Grade A3",
  sub_grade_A4:"Sub-Grade A4", sub_grade_A5:"Sub-Grade A5",
  sub_grade_B1:"Sub-Grade B1", sub_grade_B2:"Sub-Grade B2", sub_grade_B3:"Sub-Grade B3",
  sub_grade_B4:"Sub-Grade B4", sub_grade_B5:"Sub-Grade B5",
  sub_grade_C1:"Sub-Grade C1", sub_grade_C2:"Sub-Grade C2", sub_grade_C3:"Sub-Grade C3",
  sub_grade_C4:"Sub-Grade C4", sub_grade_C5:"Sub-Grade C5",
  sub_grade_D1:"Sub-Grade D1", sub_grade_D2:"Sub-Grade D2", sub_grade_D3:"Sub-Grade D3",
  sub_grade_D4:"Sub-Grade D4", sub_grade_D5:"Sub-Grade D5",
  sub_grade_E1:"Sub-Grade E1", sub_grade_E2:"Sub-Grade E2", sub_grade_E3:"Sub-Grade E3",
  sub_grade_E4:"Sub-Grade E4", sub_grade_E5:"Sub-Grade E5",
  sub_grade_F1:"Sub-Grade F1", sub_grade_F2:"Sub-Grade F2", sub_grade_F3:"Sub-Grade F3",
  sub_grade_F4:"Sub-Grade F4", sub_grade_F5:"Sub-Grade F5",
  sub_grade_G1:"Sub-Grade G1", sub_grade_G2:"Sub-Grade G2", sub_grade_G3:"Sub-Grade G3",
  sub_grade_G4:"Sub-Grade G4", sub_grade_G5:"Sub-Grade G5",

  // Home ownership
  home_ownership_OWN:      "Ownership: Own",
  home_ownership_RENT:     "Ownership: Rent",
  home_ownership_MORTGAGE: "Ownership: Mortgage",
  home_ownership_NONE:     "Ownership: None",
  home_ownership_OTHER:    "Ownership: Other",

  // Verification
  "verification_status_Verified":        "Verified Income",
  "verification_status_Source Verified": "Source Verified Income",

  // Purposes
  purpose_debt_consolidation: "Purpose: Debt Consolidation",
  purpose_credit_card:        "Purpose: Credit Card",
  purpose_home_improvement:   "Purpose: Home Improvement",
  purpose_small_business:     "Purpose: Small Business",
  purpose_medical:            "Purpose: Medical",
  purpose_educational:        "Purpose: Education",
  purpose_major_purchase:     "Purpose: Major Purchase",
  purpose_moving:             "Purpose: Moving",
  purpose_vacation:           "Purpose: Vacation",
  purpose_wedding:            "Purpose: Wedding",
  purpose_house:              "Purpose: House",
  purpose_renewable_energy:   "Purpose: Renewable Energy",
  purpose_other:              "Purpose: Other",

  // Indian states (addr_state mapped to US codes)
  addr_state_PA: "State: Maharashtra",
  addr_state_IL: "State: Karnataka",
  addr_state_OH: "State: Tamil Nadu",
  addr_state_DC: "State: Delhi",
  addr_state_WY: "State: Telangana",
  addr_state_MN: "State: Gujarat",
  addr_state_MS: "State: West Bengal",
  addr_state_MT: "State: Andhra Pradesh",
  addr_state_NH: "State: Kerala",
  addr_state_OK: "State: Rajasthan",
  addr_state_GA: "State: Uttar Pradesh",
  addr_state_NE: "State: Madhya Pradesh",
  addr_state_NM: "State: Bihar",
  addr_state_NV: "State: Odisha",
  addr_state_CO: "State: Punjab",
  addr_state_VA: "State: Haryana",
  addr_state_WV: "State: Jharkhand",
  addr_state_SD: "State: Assam",
  addr_state_VT: "State: Uttarakhand",
  addr_state_ME: "State: Himachal Pradesh",
  addr_state_CT: "State: Goa",
  addr_state_AR: "State: Chhattisgarh",
  addr_state_RI: "State: Tripura",
  addr_state_ID: "State: Manipur",
  addr_state_IA: "State: Meghalaya",
};

function featureLabel(raw) {
  return FEATURE_LABELS[raw] || raw.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}


/* ── Example inputs (model-verified scores) ──────────────────── */
const EXAMPLES = {
  low: {
    // Score ≈ 1.4 → Low Risk
    loan_amnt:50000, int_rate:7.5, emp_length:8, annual_inc:900000,
    dti:8.0, revol_bal:15000, revol_util:12.0, delinq_2yrs:0,
    inq_last_6mths:0, open_acc:10, pub_rec:0, total_acc:25,
    credit_history_years:15, mths_since_last_delinq:0, issue_year:2015,
    term:'36', sub_grade:'A2', home_ownership:'OWN',
    verification_status:'Verified', purpose:'home_improvement', addr_state:'PA'
  },
  medium: {
    // Score ≈ 42 → Medium Risk
    loan_amnt:200000, int_rate:20.0, emp_length:2, annual_inc:180000,
    dti:26.0, revol_bal:60000, revol_util:78.0, delinq_2yrs:2,
    inq_last_6mths:4, open_acc:4, pub_rec:0, total_acc:9,
    credit_history_years:3, mths_since_last_delinq:8, issue_year:2016,
    term:'60', sub_grade:'E3', home_ownership:'RENT',
    verification_status:'Not Verified', purpose:'small_business', addr_state:'NE'
  },
  high: {
    // Score ≈ 63 → High Risk
    loan_amnt:35000, int_rate:24.0, emp_length:0, annual_inc:24000,
    dti:35.0, revol_bal:80000, revol_util:95.0, delinq_2yrs:5,
    inq_last_6mths:6, open_acc:2, pub_rec:1, total_acc:3,
    credit_history_years:1, mths_since_last_delinq:2, issue_year:2016,
    term:'60', sub_grade:'G5', home_ownership:'RENT',
    verification_status:'Not Verified', purpose:'small_business', addr_state:'NM'
  }
};

function fillExample(level) {
  const e   = EXAMPLES[level];
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  Object.entries(e).forEach(([k, v]) => set(k, v));

  // Visual feedback on the buttons
  document.querySelectorAll(".example-btn").forEach(b => b.style.opacity = "0.5");
  const active = document.getElementById("example-btn-" + level);
  if (active) active.style.opacity = "1";
}


/* ── Main prediction call ────────────────────────────────────── */
async function runPrediction() {
  const btn = document.getElementById("btn-inner");
  btn.innerHTML = '<span class="loading-spinner"></span> Analyzing...';

  const payload = {
    loan_amnt:              parseFloat(document.getElementById("loan_amnt").value)              || 0,
    int_rate:               parseFloat(document.getElementById("int_rate").value)               || 0,
    emp_length:             parseFloat(document.getElementById("emp_length").value)             || 0,
    annual_inc:             parseFloat(document.getElementById("annual_inc").value)             || 0,
    dti:                    parseFloat(document.getElementById("dti").value)                    || 0,
    revol_bal:              parseFloat(document.getElementById("revol_bal").value)              || 0,
    revol_util:             parseFloat(document.getElementById("revol_util").value)             || 0,
    delinq_2yrs:            parseFloat(document.getElementById("delinq_2yrs").value)            || 0,
    inq_last_6mths:         parseFloat(document.getElementById("inq_last_6mths").value)         || 0,
    open_acc:               parseFloat(document.getElementById("open_acc").value)               || 0,
    pub_rec:                parseFloat(document.getElementById("pub_rec").value)                || 0,
    total_acc:              parseFloat(document.getElementById("total_acc").value)              || 0,
    credit_history_years:   parseFloat(document.getElementById("credit_history_years").value)   || 0,
    mths_since_last_delinq: parseFloat(document.getElementById("mths_since_last_delinq").value) || 0,
    issue_year:             parseInt(document.getElementById("issue_year").value)               || 2015,
    term:                   document.getElementById("term").value,
    sub_grade:              document.getElementById("sub_grade").value,
    home_ownership:         document.getElementById("home_ownership").value,
    verification_status:    document.getElementById("verification_status").value,
    purpose:                document.getElementById("purpose").value,
    addr_state:             document.getElementById("addr_state").value,
  };

  try {
    const res = await fetch("/api/predict", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${res.status}`);
    }

    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Prediction failed");

    updateScoreRing(data.risk_score, data.verdict_class);
    updateVerdict(data.verdict, data.verdict_class, data.recommendation);
    updateTimestamp();
    renderShapBars(data.shap);

  } catch (err) {
    console.error("Prediction error:", err);
    showToast("Error: " + err.message, true);
  } finally {
    btn.innerHTML = '<span>⚡</span> Analyze Credit Risk';
  }
}


/* ── Score ring ──────────────────────────────────────────────── */
function updateScoreRing(score, cls) {
  const ringFill     = document.getElementById("ring-fill");
  const scoreDisplay = document.getElementById("score-display");

  // SVG elements: use setAttribute, not className =
  ringFill.setAttribute("class", "score-ring-fill");
  if (cls === "medium") ringFill.classList.add("warn");
  if (cls === "high")   ringFill.classList.add("danger");

  scoreDisplay.textContent = score.toFixed(1);

  const circumference = 502;
  ringFill.style.strokeDashoffset = circumference - (score / 100) * circumference;
}


/* ── Verdict badge ───────────────────────────────────────────── */
function updateVerdict(verdict, cls, recommendation) {
  const badge = document.getElementById("verdict-badge");
  const desc  = document.getElementById("verdict-desc");
  badge.className   = "verdict-badge " + cls;
  const icons       = { low: "✓", medium: "⚠", high: "✗" };
  badge.textContent = `${icons[cls] || "•"}  ${verdict.toUpperCase()}`;
  desc.textContent  = recommendation;
}


/* ── Timestamp ───────────────────────────────────────────────── */
function updateTimestamp() {
  const el = document.getElementById("result-timestamp");
  if (el) el.textContent = new Date().toLocaleTimeString();
}


/* ── SHAP bars with human-readable labels ────────────────────── */
function renderShapBars(shapData) {
  const panel = document.getElementById("shap-panel");
  if (!panel) return;

  if (!shapData || shapData.length === 0) {
    panel.innerHTML = `<div style="color:var(--warn);font-family:var(--mono);font-size:0.8rem;
      text-align:center;padding:1rem;">SHAP values unavailable.</div>`;
    return;
  }

  const maxAbs = Math.max(...shapData.map(d => Math.abs(d.shap_value)));
  if (maxAbs === 0) return;

  const rows = shapData.map(d => {
    const w     = ((Math.abs(d.shap_value) / maxAbs) * 100).toFixed(1);
    const dir   = d.direction;
    const sign  = d.shap_value >= 0 ? "+" : "";
    const color = dir === "pos" ? "var(--danger)" : "var(--safe)";
    const label = featureLabel(d.feature);          // ← human readable
    const tip   = `${d.feature} = ${d.value}`;     // raw name as tooltip

    return `
      <div class="shap-bar-row">
        <div class="shap-feature-name" title="${tip}">${label}</div>
        <div class="shap-bar-track">
          <div class="shap-bar-fill ${dir}" style="width:${w}%"></div>
        </div>
        <div class="shap-val" style="color:${color}">${sign}${d.shap_value.toFixed(3)}</div>
      </div>`;
  }).join("");

  panel.innerHTML = `
    <div class="shap-title">Why this score? (SHAP Feature Contributions)</div>
    ${rows}
    <div style="display:flex;gap:1.5rem;font-family:var(--mono);font-size:10px;
                margin-top:1rem;padding-top:0.75rem;border-top:1px solid var(--border);">
      <span style="color:var(--danger)">■ Increases default risk</span>
      <span style="color:var(--safe)">■ Reduces default risk</span>
      <span style="color:var(--text3);margin-left:auto;">Hover feature name for raw value</span>
    </div>`;
}