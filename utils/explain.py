"""
explain.py  —  SHAP TreeExplainer for XGBoost
Cross-version pickle warnings suppressed via catch_warnings().
"""

import shap, pickle, os, warnings
import numpy as np

_MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models")

with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    with open(os.path.join(_MODELS_DIR, "xgb_model.pkl"), "rb") as f:
        _MODEL = pickle.load(f)
    with open(os.path.join(_MODELS_DIR, "imputer.pkl"), "rb") as f:
        _IMPUTER = pickle.load(f)
    with open(os.path.join(_MODELS_DIR, "model_features.pkl"), "rb") as f:
        _FEATURES = pickle.load(f)

_EXPLAINER = shap.TreeExplainer(_MODEL)


def get_shap_explanation(input_df, top_n: int = 8) -> list:
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        imputed     = _IMPUTER.transform(input_df)
        shap_values = _EXPLAINER.shap_values(imputed)

    sv = shap_values[1][0] if isinstance(shap_values, list) else shap_values[0]
    input_values = input_df.values[0]

    ranked = sorted(enumerate(sv), key=lambda x: abs(x[1]), reverse=True)[:top_n]

    return [
        {
            "feature":    _FEATURES.tolist()[idx],
            "value":      round(float(input_values[idx]), 3),
            "shap_value": round(float(shap_val), 4),
            "direction":  "pos" if shap_val > 0 else "neg",
        }
        for idx, shap_val in ranked
    ]