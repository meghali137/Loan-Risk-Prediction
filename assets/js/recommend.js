"use strict";

async function runRecommendation() {
  const btn = document.getElementById("rec-btn-inner");
  btn.innerHTML = '<span class="loading-spinner"></span> Analysing profile...';

  const payload = {
    loan_amnt:              parseFloat(document.getElementById("rec_loan_amnt").value)              || 0,
    int_rate:               parseFloat(document.getElementById("rec_int_rate").value)               || 0,
    emp_length:             parseFloat(document.getElementById("rec_emp_length").value)             || 0,
    annual_inc:             parseFloat(document.getElementById("rec_annual_inc").value)             || 0,
    dti:                    parseFloat(document.getElementById("rec_dti").value)                    || 0,
    revol_bal:              parseFloat(document.getElementById("rec_revol_bal").value)              || 0,
    revol_util:             parseFloat(document.getElementById("rec_revol_util").value)             || 0,
    delinq_2yrs:            parseFloat(document.getElementById("rec_delinq_2yrs").value)            || 0,
    inq_last_6mths:         parseFloat(document.getElementById("rec_inq_last_6mths").value)         || 0,
    open_acc:               parseFloat(document.getElementById("rec_open_acc").value)               || 0,
    pub_rec:                parseFloat(document.getElementById("rec_pub_rec").value)                || 0,
    total_acc:              parseFloat(document.getElementById("rec_total_acc").value)              || 0,
    credit_history_years:   parseFloat(document.getElementById("rec_credit_history_years").value)   || 0,
    mths_since_last_delinq: parseFloat(document.getElementById("rec_mths_since_last_delinq").value) || 0,
    issue_year:             parseInt(document.getElementById("rec_issue_year").value)               || 2015,
    term:                   document.getElementById("rec_term").value,
    sub_grade:              document.getElementById("rec_sub_grade").value,
    home_ownership:         document.getElementById("rec_home_ownership").value,
    verification_status:    document.getElementById("rec_verification_status").value,
    purpose:                document.getElementById("rec_purpose").value,
    addr_state:             document.getElementById("rec_addr_state").value,
  };

  try {
    const res  = await fetch("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body:   JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Server error " + res.status);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Recommendation failed");

    document.getElementById("rec-results").style.display = "block";
    renderRecSummary(data);
    renderTermComparison(data);
    renderProducts(data);
    renderTips(data);

    document.getElementById("rec-results").scrollIntoView({ behavior: "smooth", block: "start" });

  } catch (err) {
    showToast("Error: " + err.message, true);
  } finally {
    btn.innerHTML = '<span>🎯</span> Get Loan Recommendation';
  }
}


/* ── Summary bar ─────────────────────────────────────────────── */
function renderRecSummary(d) {
  const clsColors = { low: "var(--safe)", medium: "var(--warn)", high: "var(--danger)" };
  const c = clsColors[d.verdict_class];

  document.getElementById("rec-score-num").textContent  = d.score.toFixed(1);
  document.getElementById("rec-verdict-text").textContent = d.verdict.toUpperCase();
  document.getElementById("rec-verdict-text").style.color = c;
  document.getElementById("rec-outlook-text").textContent = d.outlook.label;
  document.getElementById("rec-outlook-text").style.color = c;
  document.getElementById("rec-requested").textContent   = "₹" + Number(d.requested_amount).toLocaleString("en-IN");
  document.getElementById("rec-income").textContent      = "₹" + Number(d.annual_inc).toLocaleString("en-IN") + "/yr";
}


/* ── Term comparison ─────────────────────────────────────────── */
function renderTermComparison(d) {
  const el = document.getElementById("rec-term-compare");
  const c36 = d.score_36mo < d.score_60mo ? "var(--safe)" : "var(--text2)";
  const c60 = d.score_60mo < d.score_36mo ? "var(--safe)" : "var(--text2)";
  const badge = d.best_term === "36"
    ? `<span style="background:rgba(34,197,94,0.12);color:var(--safe);border:1px solid rgba(34,197,94,0.3);border-radius:6px;padding:2px 10px;font-family:var(--mono);font-size:11px;">Recommended</span>`
    : `<span style="background:rgba(245,158,11,0.12);color:var(--warn);border:1px solid rgba(245,158,11,0.3);border-radius:6px;padding:2px 10px;font-family:var(--mono);font-size:11px;">Recommended</span>`;

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
      <div style="padding:1.25rem;background:var(--bg2);border-radius:10px;
                  border:2px solid ${d.best_term==='36' ? 'rgba(34,197,94,0.4)' : 'var(--border)'};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-family:var(--mono);font-size:0.82rem;color:var(--text);">36-month term</span>
          ${d.best_term==='36' ? badge : ''}
        </div>
        <div style="font-family:var(--mono);font-size:2rem;font-weight:600;color:${c36};">${d.score_36mo}</div>
        <div style="font-size:0.78rem;color:var(--text3);margin-top:4px;">Risk score</div>
        <div style="font-size:0.8rem;color:var(--text3);margin-top:8px;line-height:1.6;">Higher monthly EMI. Shorter commitment. Model rates this significantly safer.</div>
      </div>
      <div style="padding:1.25rem;background:var(--bg2);border-radius:10px;
                  border:2px solid ${d.best_term==='60' ? 'rgba(34,197,94,0.4)' : 'var(--border)'};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-family:var(--mono);font-size:0.82rem;color:var(--text);">60-month term</span>
          ${d.best_term==='60' ? badge : ''}
        </div>
        <div style="font-family:var(--mono);font-size:2rem;font-weight:600;color:${c60};">${d.score_60mo}</div>
        <div style="font-size:0.78rem;color:var(--text3);margin-top:4px;">Risk score</div>
        <div style="font-size:0.8rem;color:var(--text3);margin-top:8px;line-height:1.6;">Lower monthly EMI. 5-year commitment. Historically higher default rate.</div>
      </div>
    </div>`;
}


/* ── Product cards ───────────────────────────────────────────── */
function renderProducts(d) {
  const el = document.getElementById("rec-products");
  const clsMap = { safe: "var(--safe)", warn: "var(--warn)", danger: "var(--danger)", accent: "var(--accent)" };

  el.innerHTML = d.products.map((p, i) => {
    const highlight = i === 0;
    const color = clsMap[p.verdict_cls] || "var(--text2)";
    const amt = "₹" + Number(p.amount).toLocaleString("en-IN", { maximumFractionDigits: 0 });
    const monthly = Math.round(p.amount / p.term_mo);
    return `
      <div style="background:var(--bg2);border:${highlight ? '2px' : '1px'} solid ${highlight ? color : 'var(--border)'};
                  border-radius:12px;padding:1.5rem;position:relative;overflow:hidden;">
        ${highlight ? `<div style="position:absolute;top:0;left:0;right:0;height:3px;background:${color};"></div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem;">
          <div>
            <div style="font-family:var(--mono);font-size:0.85rem;font-weight:600;color:var(--text);margin-bottom:4px;">${p.name}</div>
            <div style="font-size:0.78rem;color:var(--text3);">${p.rate_tier}</div>
          </div>
          <span style="background:${color}22;color:${color};border:1px solid ${color}44;
                       border-radius:6px;padding:3px 10px;font-family:var(--mono);font-size:11px;">${p.verdict}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1rem;">
          <div style="background:var(--surface);border-radius:8px;padding:0.75rem;">
            <div style="font-family:var(--mono);font-size:11px;color:var(--text3);margin-bottom:4px;">LOAN AMOUNT</div>
            <div style="font-family:var(--mono);font-size:1.25rem;font-weight:600;color:var(--text);">${amt}</div>
          </div>
          <div style="background:var(--surface);border-radius:8px;padding:0.75rem;">
            <div style="font-family:var(--mono);font-size:11px;color:var(--text3);margin-bottom:4px;">TERM</div>
            <div style="font-family:var(--mono);font-size:1.25rem;font-weight:600;color:var(--text);">${p.term_mo} months</div>
          </div>
        </div>
        <div style="font-size:0.8rem;color:var(--text2);line-height:1.7;margin-bottom:0.75rem;">${p.notes}</div>
        <div style="font-size:0.78rem;color:var(--text3);font-style:italic;">${p.rate_note}</div>
        <div style="margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid var(--border);
                    display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:0.78rem;color:var(--text3);">Approx. monthly EMI</span>
          <span style="font-family:var(--mono);font-size:0.85rem;color:var(--text);">~₹${monthly.toLocaleString("en-IN")}/mo</span>
        </div>
      </div>`;
  }).join("");
}


/* ── Score improvement tips ──────────────────────────────────── */
function renderTips(d) {
  const el = document.getElementById("rec-tips");

  if (!d.tips || d.tips.length === 0) {
    el.innerHTML = `<div style="padding:1.5rem;text-align:center;font-family:var(--mono);font-size:0.82rem;color:var(--safe);">
      Your profile has no major risk factors to improve. You qualify for the best rates.
    </div>`;
    return;
  }

  const timelineColor = { "Immediate": "var(--accent)", "Actionable now": "var(--accent)", "1–3 months": "var(--safe)", "6 months": "var(--warn)", "3–6 months": "var(--warn)", "Long-term": "var(--text3)" };

  el.innerHTML = d.tips.map((t, i) => {
    const tc = timelineColor[t.timeline] || "var(--text3)";
    const saving = t.delta > 0
      ? `<span style="background:rgba(34,197,94,0.1);color:var(--safe);border:1px solid rgba(34,197,94,0.2);
                      border-radius:6px;padding:2px 10px;font-family:var(--mono);font-size:11px;">
           saves ~${t.delta} pts
         </span>`
      : `<span style="font-family:var(--mono);font-size:11px;color:var(--text3);">Long-term benefit</span>`;

    return `
      <div style="display:flex;gap:1rem;align-items:flex-start;padding:1.25rem;
                  background:var(--bg2);border-radius:10px;border:1px solid var(--border);">
        <div style="width:32px;height:32px;background:var(--surface);border:1px solid var(--border);
                    border-radius:8px;display:flex;align-items:center;justify-content:center;
                    font-family:var(--mono);font-size:0.85rem;color:var(--accent);flex-shrink:0;">${i+1}</div>
        <div style="flex:1;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;gap:8px;">
            <div style="font-family:var(--mono);font-size:0.82rem;font-weight:600;color:var(--text);">${t.tip}</div>
            ${saving}
          </div>
          <div style="font-size:0.8rem;color:var(--text3);line-height:1.65;margin-bottom:8px;">${t.rationale}</div>
          <span style="font-family:var(--mono);font-size:10px;color:${tc};
                       border:1px solid ${tc}44;border-radius:4px;padding:2px 8px;">
            ${t.timeline}
          </span>
        </div>
      </div>`;
  }).join("");
}