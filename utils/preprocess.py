"""
preprocess.py  —  Form dict → 123-feature DataFrame
"""

import pickle, os
import pandas as pd

_MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models")

with open(os.path.join(_MODELS_DIR, "model_features.pkl"), "rb") as f:
    MODEL_FEATURES = pickle.load(f)

NUMERIC = [
    "loan_amnt","int_rate","emp_length","annual_inc","dti",
    "delinq_2yrs","inq_last_6mths","mths_since_last_delinq",
    "open_acc","pub_rec","revol_bal","revol_util","total_acc",
    "collections_12_mths_ex_med","acc_now_delinq","delinq_amnt",
    "pub_rec_bankruptcies","tax_liens","issue_year","credit_history_years",
]

def build_input_df(form: dict) -> pd.DataFrame:
    row = pd.DataFrame(0.0, index=[0], columns=MODEL_FEATURES)

    for col in NUMERIC:
        if col in form and col in row.columns:
            row[col] = float(form[col])

    _ohe(row, "term_ 60 months",       str(form.get("term","36")) == "60")
    _ohe(row, f"sub_grade_{form.get('sub_grade','')}",                    True)
    _ohe(row, f"home_ownership_{str(form.get('home_ownership','')).upper()}", True)
    _ohe(row, f"verification_status_{form.get('verification_status','')}", True)
    _ohe(row, f"purpose_{str(form.get('purpose','')).lower().replace(' ','_')}", True)
    _ohe(row, f"addr_state_{str(form.get('addr_state','')).upper()}",      True)

    return row

def _ohe(row, col, flag):
    if flag and col in row.columns:
        row[col] = 1.0