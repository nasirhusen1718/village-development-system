import os
import json
import pickle
from typing import Dict, Any

import pandas as pd

try:
    from xgboost import XGBRegressor  # type: ignore
    _HAS_XGB = True
except Exception:  # pragma: no cover
    _HAS_XGB = False

from sklearn.ensemble import RandomForestRegressor

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))  # .../backend
PROJ_ROOT = os.path.dirname(BASE_DIR)  # project root
_CANDIDATE_DATA_PATHS = [
    os.path.join(BASE_DIR, "crop_yield.csv"),        # backend/crop_yield.csv
    os.path.join(PROJ_ROOT, "crop_yield.csv"),       # project-root/crop_yield.csv
]

def _locate_dataset_path() -> str:
    for p in _CANDIDATE_DATA_PATHS:
        if os.path.exists(p):
            return p
    # default to first candidate (for error message)
    return _CANDIDATE_DATA_PATHS[0]
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
MODEL_PATH = os.path.join(MODELS_DIR, "agri_yield_v1.pkl")

FEATURE_COLS = [
    "Crop", "Season", "State",  # categorical
    "Area", "Annual_Rainfall", "Fertilizer", "Pesticide"  # numeric
]
TARGET_COL = "Yield"


def _train_from_csv_if_possible() -> Dict[str, Any]:
    data_path = _locate_dataset_path()
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}")
    df = pd.read_csv(data_path)
    # keep only columns we need and dropna
    missing = [c for c in FEATURE_COLS + [TARGET_COL] if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset missing columns: {missing}")

    data = df[FEATURE_COLS + [TARGET_COL]].dropna().copy()

    # normalize categoricals to reduce sparse dummy columns
    cat_cols = ["Crop", "Season", "State"]
    for c in cat_cols:
        data[c] = data[c].astype(str).str.strip()
    # canonicalize season labels
    season_map = {
        'kharif': 'Kharif',
        'rabi': 'Rabi',
        'summer': 'Summer',
        'winter': 'Winter',
        'whole year': 'Whole Year',
    }
    data['Season'] = data['Season'].str.lower().map(lambda s: season_map.get(s.strip(), s.title()))

    # one-hot encode categoricals
    X_cat = pd.get_dummies(data[cat_cols].astype(str), drop_first=True)
    X_num = data[["Area", "Annual_Rainfall", "Fertilizer", "Pesticide"]].astype(float)
    X = pd.concat([X_num, X_cat], axis=1)
    y = data[TARGET_COL].astype(float)

    if _HAS_XGB:
        model = XGBRegressor(n_estimators=300, max_depth=6, learning_rate=0.08, subsample=0.9, colsample_bytree=0.9, random_state=42)
    else:  # fallback
        model = RandomForestRegressor(n_estimators=300, max_depth=12, random_state=42)
    model.fit(X, y)

    meta = {
        "columns": list(X.columns),
        "cat_bases": {c: sorted(list(data[c].astype(str).unique())) for c in cat_cols},
        "feature_cols": FEATURE_COLS,
        "target": TARGET_COL,
        "model_type": model.__class__.__name__
    }

    os.makedirs(MODELS_DIR, exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump({"model": model, "meta": meta}, f)
    return meta


essential_meta_cache: Dict[str, Any] = {}
model_cache: Any = None


def ensure_model() -> Dict[str, Any]:
    global model_cache, essential_meta_cache
    if model_cache is not None:
        return essential_meta_cache
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            bundle = pickle.load(f)
            model_cache = bundle["model"]
            essential_meta_cache = bundle["meta"]
            return essential_meta_cache
    # try to train if model is missing
    meta = _train_from_csv_if_possible()
    with open(MODEL_PATH, "rb") as f:
        bundle = pickle.load(f)
        model_cache = bundle["model"]
        essential_meta_cache = bundle["meta"]
    return essential_meta_cache


def predict_yield(payload: Dict[str, Any]) -> Dict[str, Any]:
    meta = ensure_model()
    cols = meta["columns"]
    # build one-row design matrix
    crop = str(payload.get("crop", "")).strip()
    season_in = str(payload.get("season", "")).strip().lower()
    season = {
        'kharif': 'Kharif',
        'rabi': 'Rabi',
        'summer': 'Summer',
        'winter': 'Winter',
        'whole year': 'Whole Year',
    }.get(season_in, season_in.title())
    state = str(payload.get("state", "")).strip()
    area = float(payload.get("area", 0) or 0)
    rainfall = float(payload.get("annual_rainfall", 0) or 0)
    fertilizer = float(payload.get("fertilizer", 0) or 0)
    pesticide = float(payload.get("pesticide", 0) or 0)

    # base numerical features first
    row = {
        "Area": area,
        "Annual_Rainfall": rainfall,
        "Fertilizer": fertilizer,
        "Pesticide": pesticide,
    }
    # one-hot for categoricals; if unseen, all zeros
    def _col(name: str) -> str:
        return name.replace(" ", "_")

    X = {c: 0.0 for c in cols}
    for k, v in row.items():
        if k in X:
            X[k] = v
    # set dummy columns if they exist
    for base, val in (("Crop", crop), ("Season", season), ("State", state)):
        prefix = f"{base}_"
        key = None
        for c in cols:
            if c.startswith(prefix) and c[len(prefix):] == str(val):
                key = c
                break
        if key is not None:
            X[key] = 1.0
    import numpy as np
    vec = np.array([[X[c] for c in cols]], dtype=float)
    y_pred = float(model_cache.predict(vec)[0])

    # crude confidence estimate via bounds of training target
    try:
        # read min/max yield for same crop/season/state if possible
        data_path = _locate_dataset_path()
        df = pd.read_csv(data_path, usecols=FEATURE_COLS + [TARGET_COL])
        mask = (
            (df["Crop"].astype(str) == crop) &
            (df["Season"].astype(str) == season) &
            (df["State"].astype(str) == state)
        )
        subset = df.loc[mask, TARGET_COL].astype(float)
        if len(subset) >= 5:
            lo, hi = float(subset.quantile(0.1)), float(subset.quantile(0.9))
            conf = 0.9 if (lo <= y_pred <= hi) else 0.6
        else:
            conf = 0.6
    except Exception:
        conf = 0.6

    return {
        "predicted_yield": y_pred,
        "confidence": conf,
        "model": meta.get("model_type"),
        "features_used": [
            {"name": "Crop", "value": crop},
            {"name": "Season", "value": season},
            {"name": "State", "value": state},
            {"name": "Area", "value": area},
            {"name": "Annual_Rainfall", "value": rainfall},
            {"name": "Fertilizer", "value": fertilizer},
            {"name": "Pesticide", "value": pesticide},
        ],
    }


SEASON_WINDOWS = {
    # very rough generic windows; can be improved with weather APIs later
    "Kharif": {"planting": "Jun-Jul", "harvest": "Oct-Nov"},
    "Rabi": {"planting": "Oct-Nov", "harvest": "Mar-Apr"},
    "Summer": {"planting": "Feb-Mar", "harvest": "May-Jun"},
    "Winter": {"planting": "Nov-Dec", "harvest": "Feb-Mar"},
    "Whole Year": {"planting": "Flexible", "harvest": "Flexible"},
}


def suggest_schedule(crop: str, village_state: str, season: str) -> Dict[str, Any]:
    season_key = season.strip().title()
    if season_key.lower().startswith("kharif"):
        season_key = "Kharif"
    elif season_key.lower().startswith("rabi"):
        season_key = "Rabi"
    win = SEASON_WINDOWS.get(season_key, {"planting": "--", "harvest": "--"})
    return {
        "crop": crop,
        "state": village_state,
        "season": season,
        "planting_window": win["planting"],
        "harvest_window": win["harvest"],
        "rationale": "Heuristic seasonal calendar; refine with local weather later."
    }


def recommend_crops(payload: Dict[str, Any], top_n: int = 5) -> Dict[str, Any]:
    """
    Recommend top crops to plant by predicting yield for each candidate crop.
    Candidates are drawn from the dataset; filtered by State/Season if possible.
    payload expects: state, season, area, annual_rainfall?, fertilizer?, pesticide?
    """
    ensure_model()  # make sure model & columns are loaded
    data_path = _locate_dataset_path()
    df = pd.read_csv(data_path, usecols=["Crop", "Season", "State"]).dropna()
    # normalize
    df["Crop"] = df["Crop"].astype(str).str.strip()
    df["State"] = df["State"].astype(str).str.strip()
    season_in = str(payload.get("season", "")).strip().lower()
    season_norm = {
        'kharif': 'Kharif', 'rabi': 'Rabi', 'summer': 'Summer', 'winter': 'Winter', 'whole year': 'Whole Year'
    }.get(season_in, season_in.title())

    state = str(payload.get("state", "")).strip()

    # filter candidates by state & season if available
    candidates = df
    if state:
        candidates = candidates[candidates["State"].astype(str) == state]
    if season_norm:
        candidates = candidates[candidates["Season"].astype(str).str.strip().str.title() == season_norm]
    crops = sorted(candidates["Crop"].unique().tolist())
    if not crops:
        # fallback to all crops in dataset
        crops = sorted(df["Crop"].unique().tolist())

    results = []
    for crop in crops:
        body = {
            "crop": crop,
            "state": state,
            "season": season_norm,
            "area": float(payload.get("area", 0) or 0),
            "annual_rainfall": float(payload.get("annual_rainfall", 0) or 0),
            "fertilizer": float(payload.get("fertilizer", 0) or 0),
            "pesticide": float(payload.get("pesticide", 0) or 0),
        }
        try:
            pred = predict_yield(body)
            results.append({
                "crop": crop,
                "predicted_yield": pred.get("predicted_yield", 0.0),
                "confidence": pred.get("confidence", 0.6),
            })
        except Exception:
            # skip problematic crop rows silently
            continue

    results.sort(key=lambda r: r["predicted_yield"], reverse=True)
    return {
        "state": state,
        "season": season_norm,
        "count": len(results),
        "top": results[: max(1, top_n)]
    }
