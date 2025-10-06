import os
import warnings
import argparse
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from collections import defaultdict

# --- Configuration ---
warnings.filterwarnings("ignore", category=UserWarning)
MODEL_DIR = "model_artifacts"
DATA_DIR = "datasets"
MODEL_PATH = os.path.join(MODEL_DIR, "location_prediction_model.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "location_feature_scaler.pkl")
LOCATION_ENCODER_PATH = os.path.join(MODEL_DIR, "location_encoder.pkl")
TRANSITION_MATRIX_PATH = os.path.join(MODEL_DIR, "transition_matrix.pkl") # For Journey Analysis
API_PORT = 5002
FEATURE_COLUMNS = ['hour_of_day', 'day_of_week', 'is_weekend', 'historical_frequency']

# --- Phase 1 & 2: Training Pipeline ---

def train_model():
    """
    Loads all raw CSV data, engineers features, trains a model for historical patterns,
    creates a journey transition matrix, and saves all artifacts.
    """
    print("\n--- Starting Location Prediction Model Training ---")
    
    try:
        profiles_df = pd.read_csv(os.path.join(DATA_DIR, 'student_or_staff_profiles.csv'), dtype=str)
        swipes_df = pd.read_csv(os.path.join(DATA_DIR, 'campus_card_swipes.csv'), dtype=str)
    except FileNotFoundError as e:
        print(f"Error: Required CSV not found - {e}. Aborting training.")
        return

    # --- Journey Analysis: Build Transition Matrix ---
    print("Building journey transition matrix...")
    card_to_entity = {row['card_id']: row['entity_id'] for _, row in profiles_df.dropna(subset=['card_id', 'entity_id']).iterrows()}
    swipes_df['entity_id'] = swipes_df['card_id'].map(card_to_entity)
    swipes_df = swipes_df.dropna(subset=['entity_id', 'timestamp', 'location_id'])
    swipes_df['timestamp'] = pd.to_datetime(swipes_df['timestamp'])
    swipes_df = swipes_df.sort_values(by=['entity_id', 'timestamp'])

    transitions = defaultdict(lambda: defaultdict(int))
    for _, group in swipes_df.groupby('entity_id'):
        locations = group['location_id'].tolist()
        for i in range(len(locations) - 1):
            transitions[locations[i]][locations[i+1]] += 1
    
    joblib.dump(dict(transitions), TRANSITION_MATRIX_PATH)
    print(f"Transition matrix saved to '{TRANSITION_MATRIX_PATH}'.")

    # --- ML Model Training (Historical Patterns) ---
    print("Training historical pattern model...")
    swipes_df['hour_of_day'] = swipes_df['timestamp'].dt.hour
    swipes_df['day_of_week'] = swipes_df['timestamp'].dt.dayofweek
    swipes_df['is_weekend'] = (swipes_df['day_of_week'] >= 5).astype(int)

    location_counts = swipes_df.groupby(['entity_id', 'location_id']).size().reset_index(name='counts')
    total_counts = location_counts.groupby('entity_id')['counts'].sum().reset_index(name='total')
    location_counts = pd.merge(location_counts, total_counts, on='entity_id')
    location_counts['historical_frequency'] = location_counts['counts'] / location_counts['total']
    
    features_df = pd.merge(swipes_df, location_counts, on=['entity_id', 'location_id'])
    X = features_df[FEATURE_COLUMNS]
    y = features_df['location_id']

    location_encoder = LabelEncoder().fit(y)
    y_encoded = location_encoder.transform(y)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded)
    scaler = StandardScaler().fit(X_train)
    X_train_scaled = scaler.transform(X_train)
    
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train_scaled, y_train)
    
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    joblib.dump(location_encoder, LOCATION_ENCODER_PATH)
    print("Model, scaler, and encoder saved.")
    print("--- Training Complete ---")

# --- Phase 3: API Deployment ---
app = Flask(__name__)
CORS(app)

try:
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    location_encoder = joblib.load(LOCATION_ENCODER_PATH)
    transitions = joblib.load(TRANSITION_MATRIX_PATH)
    print(f"\nAll location prediction artifacts loaded successfully. API is ready.")
except FileNotFoundError:
    model, scaler, location_encoder, transitions = None, None, None, None

@app.route('/predict/location', methods=['POST'])
# In location_prediction_service.py

@app.route('/predict/location', methods=['POST'])
def predict():
    if not model or not scaler or not location_encoder or not transitions:
        return jsonify({"error": "Model artifacts not loaded. Please train the model first."}), 500

    data = request.get_json()
    if not data or not all(k in data for k in ['startTime', 'historicalActivity', 'allLocations', 'locationBefore', 'locationAfter']):
        return jsonify({"error": "Invalid request body: Missing required keys."}), 400

    start_time = datetime.fromisoformat(data['startTime'].replace('Z', '+00:00'))
    loc_before = data['locationBefore']['name']
    loc_after = data['locationAfter']['name']

    # --- 1. Historical Model Prediction (This part is correct) ---
    history_df = pd.DataFrame(data['historicalActivity'])
    location_counts = history_df.groupby('locationId').size().reset_index(name='counts')
    total_events = len(history_df)
    location_counts['historical_frequency'] = location_counts['counts'] / total_events if total_events > 0 else 0
    
    feature_vectors, historical_scores = [], {}
    for location in data['allLocations']:
        freq_row = location_counts[location_counts['locationId'] == location['id']]
        frequency = freq_row['historical_frequency'].iloc[0] if not freq_row.empty else 0
        feature_vectors.append({'hour_of_day': start_time.hour, 'day_of_week': start_time.weekday(), 'is_weekend': 1 if start_time.weekday() >= 5 else 0, 'historical_frequency': frequency})
    
    X_live_scaled = scaler.transform(pd.DataFrame(feature_vectors))
    probabilities = model.predict_proba(X_live_scaled)

    for i, loc_id_encoded in enumerate(model.classes_):
        loc_name = location_encoder.inverse_transform([loc_id_encoded])[0]
        historical_scores[loc_name] = probabilities[:, i].sum()
    
    # --- 2. Journey Model Prediction (This part is correct) ---
    journey_scores = {}
    total_transitions = sum(transitions.get(loc_before, {}).values())
    if total_transitions > 0:
        for loc_B, count in transitions.get(loc_before, {}).items():
            next_transitions = transitions.get(loc_B, {})
            if loc_after in next_transitions:
                prob_A_to_B = count / total_transitions
                prob_B_to_C = next_transitions[loc_after] / sum(next_transitions.values())
                journey_scores[loc_B] = prob_A_to_B * prob_B_to_C

    # --- 3. Hybrid Scoring (This part is correct) ---
    final_scores = {}
    all_loc_names = {loc['name'] for loc in data['allLocations']}
    for loc_name in all_loc_names:
        hist_score = historical_scores.get(loc_name, 0)
        jour_score = journey_scores.get(loc_name, 0)
        final_scores[loc_name] = (jour_score * 0.7) + (hist_score * 0.3)

    if not final_scores or all(score == 0 for score in final_scores.values()):
        return jsonify({"prediction": None, "reason": "Not enough historical data to predict a likely journey."})

    # **THE FIX:** The result of max() is the location NAME (a string).
    best_location_name = max(final_scores, key=lambda k: final_scores[k])
    confidence = final_scores[best_location_name]
    
    # Find the full location object that has the matching name. Do NOT convert to int.
    predicted_location = next((loc for loc in data['allLocations'] if loc['name'] == best_location_name), None)
    
    reason = f"The most likely path from '{loc_before}' to '{loc_after}' is via this location. Model confidence: {confidence*100:.0f}%."

    return jsonify({"prediction": predicted_location, "reason": reason})

def run_api():
    if not model:
        print("\nCannot start API. Please run 'python location_prediction_service.py train' first.")
        return
    print(f"\n* Starting Location Prediction server on http://12-7.0.0.1:{API_PORT}")
    app.run(port=API_PORT, debug=False)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Location Prediction Service")
    parser.add_argument('mode', choices=['train', 'run'])
    args = parser.parse_args()
    if args.mode == 'train':
        train_model()
    else:
        run_api()
