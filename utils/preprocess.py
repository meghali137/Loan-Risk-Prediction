import pandas as pd

def preprocess_input(new_user, features):

    df = pd.DataFrame(0, index=[0], columns=features)

    for key,value in new_user.items():

        if key in df.columns:
            df[key] = value

        elif key == "grade":
            col = f"grade_{value}"
            if col in df.columns:
                df[col] = 1

        elif key == "home_ownership":
            col = f"home_ownership_{value}"
            if col in df.columns:
                df[col] = 1

        elif key == "purpose":
            col = f"purpose_{value}"
            if col in df.columns:
                df[col] = 1

    return df