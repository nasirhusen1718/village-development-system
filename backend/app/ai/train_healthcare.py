# backend/app/ai/train_healthcare.py
# Train healthcare models using the uploaded dataset and persist to models/

import sys
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, IsolationForest
import joblib

# Align with ai/healthcare.py FEATURE order
FEATURES = [
    "hr",
    "bp_sys",
    "bp_dia",
    "spo2",
    "temp_c",
    "rr",
    "age",
    "gender",
    "medical_history_count",
    "prior_events_count",
    "env_air_quality_index",
    "env_heat_index",
]

DEFAULTS = {
    "medical_history_count": 0.0,
    "prior_events_count": 0.0,
    "env_air_quality_index": 50.0,
    "env_heat_index": 28.0,
}

# Column mapping from dataset to FEATURES
COLMAP = {
    "Heart Rate": "hr",
    "Systolic Blood Pressure": "bp_sys",
    "Diastolic Blood Pressure": "bp_dia",
    "Oxygen Saturation": "spo2",
    "Body Temperature": "temp_c",
    "Respiratory Rate": "rr",
    "Age": "age",
    "Gender": "gender",
}

LABEL_COL = "Risk Category"  # e.g., "High Risk" vs "Low Risk"


def load_dataset(csv_path: Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    # Normalize columns we need
    missing = []
    for src, dst in COLMAP.items():
        if src not in df.columns:
            missing.append(src)
    if missing:
        raise RuntimeError(f"Missing required columns in dataset: {missing}")

    out = pd.DataFrame()
    for src, dst in COLMAP.items():
        out[dst] = df[src]

    # gender: female->0, male->1
    out["gender"] = (
        out["gender"].astype(str).str.strip().str.lower().map({"female": 0.0, "male": 1.0}).fillna(0.0)
    )

    # Fill defaults for features not present in dataset
    for k, v in DEFAULTS.items():
        out[k] = v

    # Label: 1 for "High Risk" else 0
    if LABEL_COL not in df.columns:
        raise RuntimeError(f"Missing label column '{LABEL_COL}' in dataset")
    y = (df[LABEL_COL].astype(str).str.contains("high", case=False, na=False)).astype(int)

    # Coerce numeric types
    out = out.apply(pd.to_numeric, errors="coerce").fillna(0.0)

    # Ensure correct ordering
    out = out[FEATURES]
    return out, y


def train_and_save(X: np.ndarray, y: np.ndarray, model_dir: Path):
    model_dir.mkdir(parents=True, exist_ok=True)

    # Train/test split for basic validation
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # Classifier: RandomForest
    clf = RandomForestClassifier(n_estimators=300, max_depth=None, random_state=42, class_weight="balanced")
    clf.fit(Xtr, ytr)
    acc = clf.score(Xte, yte)
    print(f"RandomForest accuracy: {acc:.3f}")

    # IsolationForest trained on presumed normal samples (Low Risk)
    X_normal = X[y == 0]
    if len(X_normal) < 50:
        # fallback: use all
        X_normal = X
    iso = IsolationForest(n_estimators=300, contamination=0.05, random_state=42)
    iso.fit(X_normal)

    # Save
    joblib.dump(clf, model_dir / "healthcare_rf.pkl")
    joblib.dump(iso, model_dir / "healthcare_iso.pkl")
    print(f"Saved models to {model_dir}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python -m app.ai.train_healthcare <path_to_csv>")
        sys.exit(1)
    csv_path = Path(sys.argv[1])
    if not csv_path.exists():
        print(f"CSV not found: {csv_path}")
        sys.exit(2)

    Xdf, y = load_dataset(csv_path)
    X = Xdf.to_numpy(dtype=float)

    # model dir relative to this file: app/ai/models
    model_dir = Path(__file__).parent / "models"

    train_and_save(X, y.to_numpy(dtype=int), model_dir)


if __name__ == "__main__":
    main()
