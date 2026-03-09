def risk_segment(prob):

    if prob < 0.30:
        return "LOW RISK"

    elif prob < 0.60:
        return "MEDIUM RISK"

    else:
        return "HIGH RISK"


def make_prediction(model, imputer, df):

    arr = imputer.transform(df)

    prob = model.predict_proba(arr)[:,1][0]

    category = risk_segment(prob)

    return prob, category, arr