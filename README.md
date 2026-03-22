# 💰 FinCredit AI — Explainable Credit Scoring

Explainable credit scoring for India's unbanked population using XGBoost + SHAP.

## 📁 Folder Structure

```
LOAN_RISK/
│
├── app.py                    ← Flask entry point (run this)
├── requirements.txt
├── README.md
│
├── models/
│   ├── xgb_model.pkl         ← Trained XGBoost (XGBClassifier)
│   ├── imputer.pkl           ← SimpleImputer (median strategy)
│   └── model_features.pkl    ← pandas Index of 123 feature names
│
├── utils/
│   ├── __init__.py
│   ├── preprocess.py         ← Form → 123-feature DataFrame
│   ├── predict.py            ← XGBoost inference + verdict
│   └── explain.py            ← SHAP TreeExplainer
│
├── dashboard/
│   └── index.html            ← Jinja2 template (served by Flask)
│
├── assets/
│   ├── css/
│   │   └── style.css         ← All styles
│   └── js/
│       ├── main.js           ← Tab switching, pipeline, FI charts
│       └── predict.js        ← Live predictor, score ring, SHAP bars
│
└── data/                     ← (optional) put loan.csv here
```

## 🚀 Quick Start

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run the app
python app.py
```

Open **http://localhost:5000** in your browser.

## 🔌 API Endpoints

| Method | Route                    | Description                        |
|--------|--------------------------|------------------------------------|
| GET    | `/`                      | Dashboard UI                       |
| POST   | `/api/predict`           | Real XGBoost inference + SHAP      |
| GET    | `/api/feature_importance`| Top-12 XGBoost feature importances |

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
    ...
  ]
}
```

## 🧠 Model Details

- **Algorithm**: XGBClassifier (n_estimators=200, lr=0.05, max_depth=6)
- **Balancing**: SMOTE (synthetic minority oversampling)
- **Features**: 123 (20 numeric + OHE for term, sub_grade, home_ownership, verification_status, purpose, addr_state)
- **Preprocessing**: SimpleImputer (median strategy)
- **Explainability**: SHAP TreeExplainer

## 📊 Performance

| Metric         | Value  |
|----------------|--------|
| Accuracy       | 87.3%  |
| ROC-AUC        | 0.893  |
| Default Recall | 78%    |
| F1 (Macro)     | 0.81   |

## ⚠️ Important Notes

- `scikit-learn==1.6.1` is pinned because the `imputer.pkl` was saved with this version
- Do **not** upgrade scikit-learn without retraining/re-saving the imputer
