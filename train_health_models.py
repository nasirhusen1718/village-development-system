#!/usr/bin/env python3
"""
Train healthcare prediction models on real dataset
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import joblib
from pathlib import Path
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from app.ai.healthcare import FEATURES, _MODEL_DIR

def train_healthcare_models():
    """Train healthcare models on real dataset"""

    # Load the health dataset
    dataset_path = "/Users/nasirhusen/Desktop/village-development-system/human_vital_signs_dataset_2024.csv"

    if not os.path.exists(dataset_path):
        print(f"❌ Dataset not found: {dataset_path}")
        return False

    print(f"📊 Loading dataset from: {dataset_path}")
    df = pd.read_csv(dataset_path)

    print(f"📈 Dataset shape: {df.shape}")
    print(f"📋 Columns: {list(df.columns)}")

    # Map risk categories to binary classification (0=Low Risk, 1=High Risk)
    risk_mapping = {
        'Low Risk': 0,
        'Medium Risk': 0,
        'High Risk': 1,
        'Critical': 1
    }

    df['target'] = df['Risk Category'].map(risk_mapping)
    print(f"🎯 Target distribution:\n{df['target'].value_counts()}")

    # Prepare features
    feature_cols = [
        'Heart Rate', 'Respiratory Rate', 'Body Temperature',
        'Oxygen Saturation', 'Systolic Blood Pressure', 'Diastolic Blood Pressure',
        'Age', 'Gender', 'Weight (kg)', 'Height (m)'
    ]

    df['Gender_numeric'] = df['Gender'].map({'Female': 0, 'Male': 1})

    # Calculate BMI
    df['BMI'] = df['Weight (kg)'] / (df['Height (m)'] ** 2)

    # Select only the 9 features that match the healthcare module
    X = df[[
        'Heart Rate', 'Respiratory Rate', 'Body Temperature',
        'Oxygen Saturation', 'Systolic Blood Pressure', 'Diastolic Blood Pressure',
        'Age', 'Gender_numeric', 'Weight (kg)'
    ]].copy()

    # Add medical_history_count to make it 9 features total
    X['medical_history_count'] = 0  # Default value

    y = df['target']

    print(f"🔧 Features shape: {X.shape}")
    print(f"🎯 Target shape: {y.shape}")
    print(f"📋 Feature columns: {list(X.columns)}")
    X = X.fillna(X.mean())
    y = y.fillna(0)

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"📊 Train set: {X_train.shape}, Test set: {X_test.shape}")

    # Train Random Forest Classifier
    print("🤖 Training Random Forest Classifier...")
    rf_clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        min_samples_split=10,
        min_samples_leaf=5,
        random_state=42,
        n_jobs=-1
    )

    rf_clf.fit(X_train, y_train)

    # Train Isolation Forest for anomaly detection
    print("🌲 Training Isolation Forest...")
    iso_forest = IsolationForest(
        n_estimators=200,
        contamination=0.1,
        random_state=42
    )

    iso_forest.fit(X_train)

    # Evaluate models
    print("\n📊 Model Evaluation:")
    y_pred_rf = rf_clf.predict(X_test)
    y_pred_proba = rf_clf.predict_proba(X_test)[:, 1]

    print("Random Forest Results:")
    print(classification_report(y_test, y_pred_rf))

    # Save models
    print(f"💾 Saving models to {_MODEL_DIR}...")

    joblib.dump(rf_clf, _MODEL_DIR / "healthcare_rf.pkl")
    joblib.dump(iso_forest, _MODEL_DIR / "healthcare_iso.pkl")

    print("✅ Models trained and saved successfully!")

    # Test prediction
    test_sample = X_test.iloc[0:1]
    rf_pred = rf_clf.predict(test_sample)[0]
    rf_proba = rf_clf.predict_proba(test_sample)[0][1]

    print("\n🧪 Test Prediction:")
    print(f"Predicted class: {rf_pred}")
    print(f"Probability: {rf_proba:.3f}")
    print(f"Actual class: {y_test.iloc[0]}")

    return True

if __name__ == "__main__":
    print("🏥 Training Healthcare Prediction Models...")
    print("=" * 50)

    success = train_healthcare_models()

    if success:
        print("\n🎉 Training completed successfully!")
        print("📋 Models saved in: backend/app/ai/models/")
        print("🔮 Ready for health predictions!")
    else:
        print("\n❌ Training failed!")
        sys.exit(1)
