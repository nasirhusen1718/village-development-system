# backend/app/ai/healthcare.py
# Lightweight healthcare alerts module
# - Computes anomaly likelihood and severity based on vitals, age, history, and environment
# - Uses IsolationForest on synthetic baseline for anomaly detection
# - Computes a heuristic probability (logistic-like) for disease/anomaly
# - Designed to run without heavy ML frameworks; extendable with real models later

from __future__ import annotations

from typing import Dict, Any, List
import math
import numpy as np
from sklearn.ensemble import IsolationForest
from pathlib import Path
import joblib

# Feature order definition for consistency (matching trained model)
FEATURES = [
    "hr",                 # heart rate (bpm)
    "bp_sys",             # systolic BP
    "bp_dia",             # diastolic BP
    "spo2",               # oxygen saturation (%)
    "temp_c",             # body temperature (C)
    "rr",                 # respiratory rate (breaths/min)
    "age",                # years
    "gender",             # 0=female, 1=male (mapping)
    "weight",             # weight (kg)
    "medical_history_count",  # medical history count
]

DEFAULTS = {
    "hr": 80.0,
    "bp_sys": 120.0,
    "bp_dia": 80.0,
    "spo2": 98.0,
    "temp_c": 36.8,
    "rr": 16.0,
    "age": 40.0,
    "gender": 0.0,
    "weight": 70.0,
    "medical_history_count": 0.0,
}

# Build a synthetic baseline distribution for IsolationForest training
# This is a placeholder; replace with historical healthy population data if available
# Try to load trained models if present
_BASE_DIR = Path(__file__).parent
_MODEL_DIR = _BASE_DIR / "models"
_MODEL_DIR.mkdir(exist_ok=True)

_clf = None
_iso_trained = None
try:
    clf_path = _MODEL_DIR / "healthcare_rf.pkl"
    iso_path = _MODEL_DIR / "healthcare_iso.pkl"
    if clf_path.exists():
        _clf = joblib.load(clf_path)
    if iso_path.exists():
        _iso_trained = joblib.load(iso_path)
except Exception:
    _clf = None
    _iso_trained = None

# Build a synthetic baseline distribution for IsolationForest training if no trained model
_rng = np.random.default_rng(42)

_baseline = np.column_stack([
    _rng.normal(80, 10, 2000),     # hr
    _rng.normal(120, 12, 2000),    # bp_sys
    _rng.normal(80, 8, 2000),      # bp_dia
    _rng.normal(98.0, 1.0, 2000),  # spo2
    _rng.normal(36.8, 0.3, 2000),  # temp_c
    _rng.normal(16, 3, 2000),      # rr
    _rng.normal(40, 12, 2000),     # age
    _rng.integers(0, 2, 2000),     # gender
    _rng.normal(70, 15, 2000),     # weight
    _rng.poisson(1.0, 2000),       # medical_history_count
])

_iso = _iso_trained or IsolationForest(n_estimators=200, contamination=0.05, random_state=42)
if _iso_trained is None:
    _iso.fit(_baseline)

# Means/stds for basic scaling in heuristic risk
_means = _baseline.mean(axis=0)
_stds = _baseline.std(axis=0) + 1e-6

_gender_map = {"female": 0.0, "male": 1.0}


def _coerce_gender(value: Any) -> float:
    if value is None:
        return DEFAULTS["gender"]
    if isinstance(value, (int, float)):
        return float(1.0 if value >= 0.5 else 0.0)
    s = str(value).strip().lower()
    return float(_gender_map.get(s, 0.0))


def _extract_features(payload: Dict[str, Any]) -> np.ndarray:
    x = []
    for f in FEATURES:
        if f == "gender":
            x.append(_coerce_gender(payload.get("gender")))
        else:
            v = payload.get(f)
            try:
                x.append(float(v)) if v is not None else x.append(float(DEFAULTS[f]))
            except Exception:
                x.append(float(DEFAULTS[f]))
    return np.array(x, dtype=float)


def _heuristic_probability(x: np.ndarray) -> float:
    # Scale
    z = (x - _means) / _stds
    # Weights emphasize abnormal vitals and history
    w = np.array([
        0.8,   # hr
        0.6,   # bp_sys
        0.5,   # bp_dia
        -0.9,  # spo2 (lower is worse)
        1.2,   # temp_c
        0.7,   # rr
        0.4,   # age
        0.1,   # gender
        0.3,   # weight
        0.5,   # medical_history_count
    ])
    score = float(np.dot(z, w))
    # Increase risk for very low SpO2 or very high temp as hard flags
    spo2 = x[FEATURES.index("spo2")]
    temp = x[FEATURES.index("temp_c")]
    if spo2 < 92:
        score += 2.0
    if temp >= 39.0:
        score += 1.5
    # Logistic transform to [0,1]
    prob = 1.0 / (1.0 + math.exp(-score))
    # Clamp
    return float(max(0.0, min(1.0, prob)))


def _anomaly_score(x: np.ndarray) -> float:
    # IsolationForest decision_function -> higher is less anomalous; invert
    df = float(_iso.decision_function([x])[0])  # ~[-0.5, 0.5]
    # Convert so that 0 = normal, 1 = highly anomalous
    # First, shift and scale
    s = (0.5 - df)  # normal ~ 0, anomalous > 0
    # Normalize roughly to [0,1]
    score = max(0.0, min(1.0, s))
    return score


def _severity(prob: float, anomaly: float) -> int:
    # Combine with heavier weight on probability
    sev = 100.0 * (0.7 * prob + 0.3 * anomaly)
    return int(round(max(0.0, min(100.0, sev))))


def model_status() -> Dict[str, Any]:
    """Return status flags indicating whether trained models are loaded."""
    return {
        "classifier_loaded": _clf is not None,
        "anomaly_loaded": _iso_trained is not None,
        "feature_count": len(FEATURES),
    }


def predict_health(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Compute likelihood and severity for a single patient sample.

    payload keys (recommended):
      hr, bp_sys, bp_dia, spo2, temp_c, rr,
      age, gender, weight, medical_history_count
    """
    x = _extract_features(payload)
    # Use trained classifier probability if available; fallback to heuristic
    if _clf is not None:
        try:
            prob = float(_clf.predict_proba([x])[0][1])
        except Exception:
            prob = _heuristic_probability(x)
    else:
        prob = _heuristic_probability(x)
    anom = _anomaly_score(x)
    sev = _severity(prob, anom)

    factors: List[str] = []
    if x[FEATURES.index("spo2")] < 92:
        factors.append("low_spo2")
    if x[FEATURES.index("temp_c")] >= 38.0:
        factors.append("fever")
    if x[FEATURES.index("bp_sys")] >= 160:
        factors.append("hypertension")
    if x[FEATURES.index("medical_history_count")] > 2:
        factors.append("medical_history")
    if x[FEATURES.index("weight")] < 50 or x[FEATURES.index("weight")] > 120:
        factors.append("abnormal_weight")

    return {
        "likelihood": prob,
        "anomaly": anom,
        "severity": sev,
        "factors": factors,
        "features": {k: float(v) for k, v in zip(FEATURES, x)},
    }


def batch_predict(payloads: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [predict_health(p) for p in payloads]
