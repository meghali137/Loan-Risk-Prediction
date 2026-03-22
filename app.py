import os
import pandas as pd
from flask import Flask, render_template, jsonify, request, send_from_directory
from utils.predict import predict_risk, get_feature_importance
from utils.recommend import build_recommendation
from utils.explain import get_shap_explanation
from utils.preprocess import build_input_df

app = Flask(__name__, static_folder="assets", template_folder="dashboard")

@app.route("/favicon.ico")
def favicon():
    return send_from_directory(app.static_folder, "favicon.ico", mimetype="image/vnd.microsoft.icon")

_BASE     = os.path.dirname(__file__)
_DASH_CSV = os.path.join(_BASE, "dashboard", "dashboard_data.csv")

# ── In-memory prediction log (resets on restart; swap for SQLite if needed) ──
_prediction_log: list[dict] = []


# ════════════════════════════════════════════════════════════════
#  PAGES
# ════════════════════════════════════════════════════════════════
@app.route("/")
def index():
    return render_template("index.html")


# ════════════════════════════════════════════════════════════════
#  API — PREDICT
# ════════════════════════════════════════════════════════════════
@app.route("/api/predict", methods=["POST"])
def api_predict():
    """Real XGBoost inference + SHAP for one applicant."""
    data = request.get_json(force=True)
    try:
        input_df  = build_input_df(data)
        result    = predict_risk(input_df)
        shap_vals = get_shap_explanation(input_df)

        # Log the prediction
        _prediction_log.append({
            "risk_score":    result["risk_score"],
            "verdict":       result["verdict"],
            "verdict_class": result["verdict_class"],
            "loan_amnt":     data.get("loan_amnt", 0),
            "int_rate":      data.get("int_rate", 0),
            "annual_inc":    data.get("annual_inc", 0),
            "purpose":       data.get("purpose", "—"),
        })

        return jsonify({"success": True, **result, "shap": shap_vals})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


# ════════════════════════════════════════════════════════════════
#  API — FEATURE IMPORTANCE
# ════════════════════════════════════════════════════════════════
@app.route("/api/feature_importance")
def api_feature_importance():
    """Top-N real XGBoost feature importances."""
    return jsonify(get_feature_importance(top_n=12))


# ════════════════════════════════════════════════════════════════
#  API — DASHBOARD ANALYTICS  (feeds charts.js)
# ════════════════════════════════════════════════════════════════
@app.route("/api/dashboard")
def api_dashboard():
    """
    Returns aggregate stats computed from dashboard_data.csv
    (200 real model predictions on synthetic applicants).
    """
    df = pd.read_csv(_DASH_CSV)

    # Risk distribution
    risk_dist = df["risk_category"].value_counts().to_dict()

    # Avg risk score by loan purpose
    by_purpose = (
        df.groupby("purpose")["risk_score"]
        .mean()
        .round(1)
        .sort_values(ascending=False)
        .to_dict()
    )

    # Risk score histogram (10 bins)
    counts, edges = pd.cut(df["risk_score"], bins=10, retbins=True)
    hist_labels = [f"{int(edges[i])}–{int(edges[i+1])}" for i in range(len(edges)-1)]
    hist_values = counts.value_counts(sort=False).tolist()

    # Avg risk by home ownership
    by_ownership = (
        df.groupby("home_ownership")["risk_score"]
        .mean()
        .round(1)
        .to_dict()
    )

    # Avg risk by term
    by_term = (
        df.groupby("term")["risk_score"]
        .mean()
        .round(1)
        .to_dict()
    )

    # Monthly trend proxy (by issue_year if available, else flat)
    by_year = (
        df.groupby("issue_year")["risk_score"]
        .mean()
        .round(1)
        .to_dict()
        if "issue_year" in df.columns
        else {}
    )

    # Summary KPIs
    kpis = {
        "total_applications":  int(len(df)),
        "avg_risk_score":      round(float(df["risk_score"].mean()), 1),
        "high_risk_pct":       round(float((df["risk_category"] == "High Risk").mean() * 100), 1),
        "avg_loan_amnt":       int(df["loan_amnt"].mean()),
        "avg_int_rate":        round(float(df["int_rate"].mean()), 2),
        "avg_annual_inc":      int(df["annual_inc"].mean()),
    }

    return jsonify({
        "kpis":         kpis,
        "risk_dist":    risk_dist,
        "by_purpose":   by_purpose,
        "hist_labels":  hist_labels,
        "hist_values":  hist_values,
        "by_ownership": by_ownership,
        "by_term":      by_term,
        "by_year":      by_year,
    })


# ════════════════════════════════════════════════════════════════
#  API — PREDICTION LOG  (session history)
# ════════════════════════════════════════════════════════════════
@app.route("/api/history")
def api_history():
    """Returns the last 20 predictions made this session."""
    return jsonify(list(reversed(_prediction_log[-20:])))


# ════════════════════════════════════════════════════════════════
#  API — LOAN RECOMMENDATION ENGINE
# ════════════════════════════════════════════════════════════════
@app.route("/api/recommend", methods=["POST"])
def api_recommend():
    """
    Full loan recommendation engine.
    Returns products, improvement tips, term comparison, approval outlook.
    """
    data = request.get_json(force=True)
    try:
        result = build_recommendation(data)
        return jsonify({"success": True, **result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=True, port=5000)