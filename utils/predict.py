"""
predict.py  —  XGBoost inference + risk verdict
Compatible with scikit-learn 1.6.x / 1.7.x and xgboost 3.x
Cross-version pickle warnings are suppressed via catch_warnings().
"""

import pickle, os, warnings
import numpy as np

_MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models")

with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    with open(os.path.join(_MODELS_DIR, "imputer.pkl"), "rb") as f:
        _IMPUTER = pickle.load(f)
    with open(os.path.join(_MODELS_DIR, "xgb_model.pkl"), "rb") as f:
        _MODEL = pickle.load(f)
    with open(os.path.join(_MODELS_DIR, "model_features.pkl"), "rb") as f:
        _FEATURES = pickle.load(f)


def predict_risk(input_df) -> dict:
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        imputed = _IMPUTER.transform(input_df)
        proba   = _MODEL.predict_proba(imputed)[0]

    p_default  = float(proba[1])
    risk_score = round(p_default * 100, 1)

    if risk_score < 30:
        verdict, cls, rec = "Low Risk",    "low",    "Strong creditworthiness. Recommend micro-loan approval."
    elif risk_score < 55:
        verdict, cls, rec = "Medium Risk", "medium", "Moderate risk profile. Manual review or reduced loan amount advised."
    else:
        verdict, cls, rec = "High Risk",   "high",   "Elevated default probability. Decline or require collateral."

    return {"risk_score": risk_score, "probability": p_default,
            "verdict": verdict, "verdict_class": cls, "recommendation": rec}


def get_feature_importance(top_n: int = 12) -> list:
    fi    = _MODEL.feature_importances_
    pairs = sorted(zip(_FEATURES.tolist(), fi.tolist()), key=lambda x: x[1], reverse=True)[:top_n]
    return [{"feature": k, "importance": round(v, 4)} for k, v in pairs]