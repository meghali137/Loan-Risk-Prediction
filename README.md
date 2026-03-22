# CredZ — Explainable Credit Scoring for Unbanked India

> XGBoost + SHAP · Financial Inclusion AI · RBI Compliance-Ready

CredZ is an AI-powered credit scoring system built for India's **190 million unbanked citizens** — people with no CIBIL score, no credit card, and no formal bank history. Instead of rejecting them, CredZ scores their creditworthiness using **alternative data signals** (mobile usage, utility bills, employment tenure) and explains every decision using **SHAP values** — making it fully auditable and RBI-compliant.

---

## What it does

- Scores loan applicants on a **0–100 risk scale** using a trained XGBoost model
- Explains every prediction with **real-time SHAP feature contributions**
- Recommends tailored **loan products** based on risk tier and income
- Generates **score improvement tips** — "do X to save Y points"
- Provides a **portfolio analytics dashboard** with Chart.js visualisations
- Meets RBI's AI/ML lending guidelines (Right to Explanation, audit trail, no discriminatory features)

---

## Live Demo Screenshots

| Live Predictor | SHAP Explanation | Loan Recommender |
|---|---|---|
| Risk score ring with Low / Medium / High verdict | Per-feature SHAP bars with human-readable labels | Tailored loan products + improvement tips |

---

## 📁 Folder Structure

```
LOAN_RISK/
│
├── app.py                     ← Flask entry point — all API routes
├── run.py                     ← Start the server with this
├── requirements.txt
├── README.md
│
├── models/
│   ├── xgb_model.pkl          ← Trained XGBoost (XGBClassifier)
│   ├── imputer.pkl            ← SimpleImputer (median strategy)
│   └── model_features.pkl     ← pandas Index of 123 feature names
│
├── utils/
│   ├── __init__.py
│   ├── preprocess.py          ← Form dict → 123-feature DataFrame
│   ├── predict.py             ← XGBoost inference + risk verdict
│   ├── explain.py             ← SHAP TreeExplainer
│   └── recommend.py           ← Loan recommendation engine
│
├── dashboard/
│   ├── index.html             ← Jinja2 template (all 8 tabs)
│   └── dashboard_data.csv     ← 200 real model predictions for analytics
│
├── assets/
│   ├── favicon.ico
│   ├── css/
│   │   └── style.css          ← Full dashboard styles
│   └── js/
│       ├── main.js            ← Tab switching, feature importance charts
│       ├── predict.js         ← Live predictor, score ring, SHAP bars
│       ├── charts.js          ← Analytics dashboard (Chart.js)
│       └── recommend.js       ← Recommendation engine UI
│
└── data/                      ← Place loan.csv here for retraining
```

---

## 🚀 Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/CredZ-Loan-Risk-Prediction.git
cd CredZ-Loan-Risk-Prediction

# 2. Create virtual environment
python -m venv venv
venv\Scripts\activate           # Windows
source venv/bin/activate        # Mac / Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the app
python run.py
```

Open **http://localhost:5000** in your browser.

> ⚠️ Use `python run.py` — not `python -m app.py` (causes ModuleNotFoundError)

---

## 🔌 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | Dashboard UI (8 tabs) |
| POST | `/api/predict` | XGBoost inference + SHAP values |
| POST | `/api/recommend` | Loan products + improvement tips |
| GET | `/api/feature_importance` | Top-12 XGBoost feature importances |
| GET | `/api/dashboard` | Aggregated analytics for charts |
| GET | `/api/history` | Last 20 session predictions |

### POST `/api/predict` — Request Body

```json
{
  "loan_amnt": 50000,
  "int_rate": 14.5,
  "emp_length": 5,
  "annual_inc": 360000,
  "dti": 18.0,
  "revol_bal": 5000,
  "revol_util": 50.0,
  "delinq_2yrs": 0,
  "inq_last_6mths": 1,
  "open_acc": 8,
  "pub_rec": 0,
  "total_acc": 20,
  "credit_history_years": 8,
  "mths_since_last_delinq": 0,
  "issue_year": 2015,
  "term": "36",
  "sub_grade": "B3",
  "home_ownership": "RENT",
  "verification_status": "Verified",
  "purpose": "debt_consolidation",
  "addr_state": "CA"
}
```

### Response

```json
{
  "success": true,
  "risk_score": 14.75,
  "probability": 0.1475,
  "verdict": "Low Risk",
  "verdict_class": "low",
  "recommendation": "Strong creditworthiness. Recommend micro-loan approval.",
  "shap": [
    { "feature": "term_ 60 months", "value": 0.0, "shap_value": -0.312, "direction": "neg" },
    { "feature": "annual_inc", "value": 360000.0, "shap_value": -0.505, "direction": "neg" }
  ]
}
```

### POST `/api/recommend` — Response (additional fields)

```json
{
  "success": true,
  "score": 42.0,
  "verdict": "Medium Risk",
  "score_36mo": 41.3,
  "score_60mo": 42.0,
  "best_term": "36",
  "products": [
    {
      "name": "Reduced Microloan",
      "amount": 27000,
      "term_mo": 36,
      "rate_tier": "Standard Rate",
      "verdict": "Recommended"
    }
  ],
  "tips": [
    {
      "tip": "Change loan purpose to Debt Consolidation",
      "delta": 13.7,
      "timeline": "Immediate"
    }
  ]
}
```

---

## 🧠 Model Details

| Component | Detail |
|-----------|--------|
| Algorithm | XGBClassifier (n_estimators=200, learning_rate=0.05, max_depth=6) |
| Balancing | SMOTE — synthetic minority oversampling (imbalanced-learn) |
| Features | 123 total: 20 numeric + OHE for term, sub_grade, home_ownership, verification_status, purpose, addr_state |
| Preprocessing | SimpleImputer (median strategy) |
| Explainability | SHAP TreeExplainer — exact Shapley values for every prediction |
| Training data | LendingClub loan dataset — 18,429 rows |

### Why XGBoost and not a Neural Network?

Tabular data + small dataset (18K rows) + need for SHAP explainability = XGBoost's exact strength. An ANN on this problem would give at best +0.01 ROC-AUC while making SHAP explanations slower and harder — and breaking RBI compliance. The better upgrade path is stacking XGBoost + LightGBM.

---

## 📊 Model Performance

| Model | Accuracy | ROC-AUC | Default Recall | F1 Macro |
|-------|----------|---------|----------------|----------|
| Logistic Regression | 84.1% | 0.734 | 6% | 0.51 |
| Decision Tree | 82.0% | 0.710 | 41% | 0.57 |
| Random Forest | 85.0% | 0.780 | 52% | 0.64 |
| XGBoost (imbalanced) | 85.5% | 0.803 | 58% | 0.67 |
| **XGBoost + SMOTE** | **87.3%** | **0.893** | **78%** | **0.81** |

SMOTE was the key improvement — it raised default recall from **6% to 78%** by balancing the training data from 84/16 to 50/50.

---

## 🏛️ RBI Compliance

CredZ is designed to meet India's AI lending regulations:

| Requirement | How CredZ meets it |
|-------------|-------------------|
| Right to Explanation (RBI 2021) | SHAP values on every prediction with human-readable labels |
| No discriminatory features | Zero gender, religion, caste, or community features in all 123 inputs |
| Audit trail | Every prediction logged via `/api/history` with full SHAP attribution |
| DPDP Act 2023 | Consent-based alternative data collection, no raw data stored |
| Human oversight | Medium Risk verdict triggers manual review — model never decides alone |

---

## 🗂️ Dashboard Tabs

| Tab | What it shows |
|-----|--------------|
| **Overview** | Model metrics, feature importances, alternative data sources, unbanked explainer |
| **Live Predictor** | Full form → real XGBoost inference → score ring + SHAP bars |
| **Analytics** | Portfolio charts (risk distribution, by purpose, by state, by year) |
| **Model Comparison** | All 7 models head-to-head with performance bars |
| **Explainability** | How SHAP works, global feature importance, sample force plot |
| **Impact** | Social impact stats, alternative data signal strength |
| **Loan Recommender** | Tailored loan products + SHAP-powered score improvement tips |
| **Docs** | Full project write-up, pipeline, roadmap |
| **RBI Guide** | Plain-English breakdown of all 5 RBI compliance pillars |

---

## 🧪 Test Examples

| Risk Level | Key Inputs | Expected Score |
|------------|-----------|----------------|
| Low Risk | int_rate=7.5%, income=₹9L, sub_grade=A2, 36mo, OWN | ~1.4 |
| Medium Risk | int_rate=20%, income=₹1.8L, sub_grade=E3, 60mo, RENT, 2 delinquencies | ~42.0 |
| High Risk | int_rate=24%, income=₹24K, sub_grade=G5, 60mo, RENT, 5 delinquencies | ~63.4 |

The Live Predictor tab has one-click buttons to auto-fill all three examples.

---

## ⚠️ Important Notes

- Use `python run.py` to start — not `python -m app.py`
- `scikit-learn>=1.6.1` required — the `imputer.pkl` was saved on 1.6.1; upgrading to 1.8+ will break it
- All cross-version warnings (sklearn + XGBoost serialization) are suppressed via `warnings.catch_warnings()` — the models still produce correct predictions
- The `addr_state` field accepts Indian state names which are mapped internally to US state codes from the LendingClub training data

---

## 🛠️ Tech Stack

- **Python 3.12** · **Flask 3.0** · **XGBoost 3.2** · **SHAP 0.51**
- **scikit-learn 1.6** · **imbalanced-learn** · **pandas 2.2** · **NumPy 2.0**
- **Chart.js 4.4** · **Inter + JetBrains Mono + Playfair Display** (fonts)

---

