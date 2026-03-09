import shap
import numpy as np
import pandas as pd


def shap_explain(model, arr, features):

    explainer = shap.TreeExplainer(model)

    shap_values = explainer.shap_values(arr)

    df = pd.DataFrame(arr, columns=features)

    vals = np.abs(shap_values[0])

    top_idx = vals.argsort()[-3:][::-1]

    top_features = df.columns[top_idx]

    return shap_values, df, top_features, explainer