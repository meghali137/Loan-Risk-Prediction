import streamlit as st
import joblib
import pandas as pd
import os
import shap
import matplotlib.pyplot as plt

from utils.preprocess import preprocess_input
from utils.predict import make_prediction
from utils.explain import shap_explain

# -----------------------------
# Load saved objects
# -----------------------------
model = joblib.load("models/loan_model.pkl")
imputer = joblib.load("models/imputer.pkl")
features = joblib.load("models/model_features.pkl")

dashboard_file = "dashboard/dashboard_data.csv"

# -----------------------------
# Sidebar Navigation
# -----------------------------
st.sidebar.title("Navigation")

page = st.sidebar.radio(
    "Go to",
    ["Loan Prediction", "Risk Dashboard"]
)

# ======================================================
# 1️⃣ LOAN PREDICTION PAGE
# ======================================================

if page == "Loan Prediction":

    st.title("💳 Loan Default Risk Predictor")

    st.subheader("Enter Loan Details")

    loan_amnt = st.number_input(
        "Loan Amount",
        min_value=500,
        max_value=1000000,
        value=15000
    )

    term = st.selectbox(
        "Loan Term (months)",
        [36, 60]
    )

    annual_inc = st.number_input(
        "Annual Income",
        min_value=5000,
        value=50000
    )

    grade = st.selectbox(
        "Credit Grade",
        ["A","B","C","D","E"]
    )

    home = st.selectbox(
        "Home Ownership",
        ["RENT","OWN","MORTGAGE"]
    )

    purpose = st.selectbox(
        "Loan Purpose",
        [
            "credit_card",
            "debt_consolidation",
            "home_improvement"
        ]
    )

    # ----------------------------------
    # Prediction
    # ----------------------------------

    if st.button("Predict Risk"):

        new_user = {
            "loan_amnt": loan_amnt,
            "term": term,
            "annual_inc": annual_inc,
            "grade": grade,
            "home_ownership": home,
            "purpose": purpose
        }

        processed = preprocess_input(new_user, features)

        prob, category, arr = make_prediction(
            model,
            imputer,
            processed
        )

        st.subheader("Prediction Result")

        st.metric(
            "Default Risk",
            f"{prob*100:.2f}%"
        )

        if category == "HIGH RISK":
            st.error(f"Risk Category: {category}")
        elif category == "MEDIUM RISK":
            st.warning(f"Risk Category: {category}")
        else:
            st.success(f"Risk Category: {category}")

        # ----------------------------------
        # SHAP Explainability
        # ----------------------------------

        shap_values, df, top_features, explainer = shap_explain(
            model,
            arr,
            features
        )

        st.subheader("Top Risk Factors")

        for f in top_features:
            st.write("•", f)

        st.subheader("Feature Impact on Prediction")

        fig, ax = plt.subplots()

        shap.bar_plot(
            shap_values[0],
            feature_names=features,
            max_display=6
        )

        st.pyplot(fig)

        # ----------------------------------
        # Save Prediction for Dashboard
        # ----------------------------------

        row = pd.DataFrame({
            "loan_amount":[loan_amnt],
            "income":[annual_inc],
            "grade":[grade],
            "purpose":[purpose],
            "risk_score":[prob],
            "risk_category":[category]
        })

        if not os.path.exists("dashboard"):
            os.makedirs("dashboard")

        if not os.path.exists(dashboard_file):
            row.to_csv(dashboard_file, index=False)
        else:
            row.to_csv(
                dashboard_file,
                mode="a",
                header=False,
                index=False
            )

# ======================================================
# 2️⃣ RISK DASHBOARD PAGE
# ======================================================

elif page == "Risk Dashboard":

    st.title("📊 Loan Portfolio Risk Monitor")

    if not os.path.exists(dashboard_file):

        st.warning("No prediction data available yet.")

    else:

        df = pd.read_csv(dashboard_file)

        avg_risk = df["risk_score"].mean()
        total_loans = len(df)

        high_risk = len(
            df[df["risk_category"] == "HIGH RISK"]
        )

        col1, col2, col3 = st.columns(3)

        col1.metric("Total Loans", total_loans)

        col2.metric(
            "Average Risk",
            f"{avg_risk*100:.2f}%"
        )

        col3.metric(
            "High Risk Loans",
            high_risk
        )

        st.divider()

        # Risk Category Distribution
        st.subheader("Risk Category Distribution")

        risk_counts = df["risk_category"].value_counts()
        st.bar_chart(risk_counts)

        # Loan Amount vs Risk
        st.subheader("Loan Amount vs Risk Score")

        st.scatter_chart(
            df,
            x="loan_amount",
            y="risk_score"
        )

        # Income vs Risk
        st.subheader("Income vs Risk")

        st.scatter_chart(
            df,
            x="income",
            y="risk_score"
        )

        # Loan Purpose Analysis
        st.subheader("Risk by Loan Purpose")

        purpose_risk = df.groupby(
            "purpose"
        )["risk_score"].mean()

        st.bar_chart(purpose_risk)

        # Highest Risk Loans
        st.subheader("Highest Risk Loans")

        high_risk_loans = df.sort_values(
            "risk_score",
            ascending=False
        ).head(10)

        st.dataframe(high_risk_loans)

        # Recent Predictions
        st.subheader("Recent Predictions")

        st.dataframe(df.tail(10))