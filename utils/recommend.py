"""
recommend.py  —  Loan Recommendation Engine
Uses real XGBoost model + SHAP to generate:
  - Personalised loan products (amount, term, rate tier)
  - SHAP-driven score improvement tips with quantified impact
  - Approval outlook
"""

import warnings
from utils.preprocess import build_input_df
from utils.predict import predict_risk
from utils.explain import get_shap_explanation


# Human-readable tip map: feature → (label, what to change, value, timeline)
_TIP_MAP = {
    "term_ 60 months":        ("Switch to a 36-month term",                         "term",           "36",  "Immediate",    "Shorter term = much lower default risk in this model"),
    "purpose_small_business": ("Change loan purpose to Debt Consolidation",          "purpose",        "debt_consolidation", "Immediate", "Debt consolidation has 13.7pt lower average risk than small business"),
    "revol_util":             ("Reduce credit card usage below 30%",                 "revol_util",     25.0,  "1–3 months",   "Pay down card balances before applying"),
    "delinq_2yrs":            ("Clear all overdue payments immediately",             "delinq_2yrs",    0,     "Actionable now","Even one cleared delinquency improves your record"),
    "inq_last_6mths":         ("Stop applying for new credit for 6 months",         "inq_last_6mths", 0,     "6 months",     "Multiple recent inquiries signal desperation to lenders"),
    "dti":                    ("Pay down existing EMIs to bring DTI below 20%",      "dti",            18.0,  "3–6 months",   "Lower DTI shows more room in your budget for new repayments"),
    "int_rate":               ("Improve your credit grade to qualify for lower rate","int_rate",       None,  "Long-term",    "A better grade means lower interest and lower risk score"),
    "pub_rec":                ("Settle any outstanding court judgements or liens",   None,             None,  "Long-term",    "Public records take years to fade — settle them early"),
    "home_ownership_RENT":    ("Owning or mortgaging a home reduces perceived risk", None,             None,  "Long-term",    "Homeownership signals stability to lenders"),
    "verification_status_Verified": (None, None, None, None, None),  # skip — positive direction
}


def build_recommendation(form: dict) -> dict:
    """
    Parameters
    ----------
    form : dict — same payload as /api/predict

    Returns
    -------
    dict with full recommendation structure
    """
    df           = build_input_df(form)
    result       = predict_risk(df)
    shap_vals    = get_shap_explanation(df, top_n=12)
    orig_score   = result["risk_score"]
    cls          = result["verdict_class"]
    annual_inc   = float(form.get("annual_inc", 300000))
    requested    = float(form.get("loan_amnt", 50000))

    # ── Term comparison ───────────────────────────────────────────
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        f36 = dict(form); f36["term"] = "36"
        f60 = dict(form); f60["term"] = "60"
        s36 = predict_risk(build_input_df(f36))["risk_score"]
        s60 = predict_risk(build_input_df(f60))["risk_score"]

    best_term  = "36" if s36 <= s60 else "60"
    best_score = min(s36, s60)

    # ── Loan products tailored to risk tier ───────────────────────
    products = _build_products(cls, annual_inc, requested, form)

    # ── SHAP-driven improvement tips ──────────────────────────────
    tips = _build_tips(form, shap_vals, orig_score)

    # ── Approval outlook ──────────────────────────────────────────
    outlook_map = {
        "low":    {"label": "Likely Approved",             "color": "safe"},
        "medium": {"label": "Conditional Approval",        "color": "warn"},
        "high":   {"label": "High Risk — Likely Declined", "color": "danger"},
    }

    return {
        "score":           orig_score,
        "verdict":         result["verdict"],
        "verdict_class":   cls,
        "recommendation":  result["recommendation"],
        "score_36mo":      round(s36, 1),
        "score_60mo":      round(s60, 1),
        "best_term":       best_term,
        "best_score":      round(best_score, 1),
        "annual_inc":      annual_inc,
        "requested_amount": requested,
        "products":        products,
        "tips":            tips,
        "outlook":         outlook_map[cls],
        "shap":            shap_vals[:6],
    }


def _build_products(cls, annual_inc, requested, form):
    """Generate 2–3 personalised loan product options."""
    if cls == "low":
        return [
            {
                "name":      "Standard Microloan",
                "amount":    min(requested, annual_inc * 0.30),
                "term_mo":   36,
                "rate_tier": "Standard Rate",
                "rate_note": "Your risk profile qualifies for standard pricing",
                "notes":     "Full requested amount. 36-month term minimises cost.",
                "verdict":   "Recommended",
                "verdict_cls": "safe",
            },
            {
                "name":      "Extended Loan",
                "amount":    min(requested * 1.5, annual_inc * 0.50),
                "term_mo":   60,
                "rate_tier": "Standard Rate",
                "rate_note": "Slightly higher total interest over 5 years",
                "notes":     "Higher amount, longer repayment. Monthly EMI is smaller.",
                "verdict":   "Available",
                "verdict_cls": "safe",
            },
            {
                "name":      "Premium Fast-Track",
                "amount":    min(requested * 0.5, annual_inc * 0.15),
                "term_mo":   12,
                "rate_tier": "Preferential Rate",
                "rate_note": "Lowest interest — fastest repayment",
                "notes":     "Smaller amount, 12-month term. Closes quickly, builds credit.",
                "verdict":   "Best Value",
                "verdict_cls": "accent",
            },
        ]
    elif cls == "medium":
        safe = round(annual_inc * 0.15 / 1000) * 1000
        return [
            {
                "name":      "Reduced Microloan",
                "amount":    safe,
                "term_mo":   36,
                "rate_tier": "Standard Rate",
                "rate_note": "Reduced amount improves approval probability",
                "notes":     f"Reduced to ₹{safe:,.0f} (15% of income). Best chance of approval.",
                "verdict":   "Recommended",
                "verdict_cls": "warn",
            },
            {
                "name":      "Secured Loan",
                "amount":    round(safe * 1.5 / 1000) * 1000,
                "term_mo":   36,
                "rate_tier": "Higher Rate",
                "rate_note": "Requires collateral or guarantor",
                "notes":     "Larger amount possible with a co-signer or asset as security.",
                "verdict":   "With Guarantor",
                "verdict_cls": "warn",
            },
            {
                "name":      "Step-Up Loan",
                "amount":    round(safe * 0.4 / 1000) * 1000,
                "term_mo":   12,
                "rate_tier": "Standard Rate",
                "rate_note": "Small starter to build credit record",
                "notes":     "Start small, repay on time, refinance to larger amount in 12 months.",
                "verdict":   "Credit Builder",
                "verdict_cls": "accent",
            },
        ]
    else:  # high
        micro = round(min(annual_inc * 0.08, 20000) / 1000) * 1000
        return [
            {
                "name":      "Emergency Microloan",
                "amount":    micro,
                "term_mo":   12,
                "rate_tier": "Higher Rate",
                "rate_note": "Small amount, requires guarantor",
                "notes":     f"Maximum ₹{micro:,.0f} at this risk level. Requires co-signer.",
                "verdict":   "Conditional",
                "verdict_cls": "danger",
            },
            {
                "name":      "Group Lending (SHG)",
                "amount":    micro,
                "term_mo":   12,
                "rate_tier": "Standard Rate",
                "rate_note": "Self-Help Group model — joint liability",
                "notes":     "Joint liability group (like Grameen Bank). Lower individual risk. No collateral needed.",
                "verdict":   "Alternative",
                "verdict_cls": "warn",
            },
        ]


def _build_tips(form, shap_vals, orig_score):
    """Generate top 3 actionable score improvement tips with quantified impact."""
    tips = []
    seen = set()

    risk_increasing = [s for s in shap_vals if s["direction"] == "pos" and s["shap_value"] > 0.03]

    for s in risk_increasing:
        feat = s["feature"]
        if feat not in _TIP_MAP or feat in seen:
            continue
        label, field, val, timeline, rationale = _TIP_MAP[feat]
        if label is None:
            continue
        seen.add(feat)

        # Quantify the improvement
        delta = 0.0
        if field and val is not None:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                f2 = dict(form); f2[field] = val
                from utils.predict import predict_risk as _pr
                from utils.preprocess import build_input_df as _bi
                new_score = _pr(_bi(f2))["risk_score"]
                delta = round(orig_score - new_score, 1)

        tips.append({
            "tip":       label,
            "rationale": rationale,
            "timeline":  timeline,
            "shap":      round(s["shap_value"], 3),
            "delta":     delta,
            "feature":   feat,
        })

        if len(tips) >= 3:
            break

    return tips