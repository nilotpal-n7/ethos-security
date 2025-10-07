import os
import warnings
import argparse
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import random

# --- Configuration ---
warnings.filterwarnings("ignore", category=UserWarning)
MODEL_DIR = "model_artifacts"
DATA_DIR = "datasets"
MODEL_PATH = os.path.join(MODEL_DIR, "owner_prediction_model.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "owner_feature_scaler.pkl")
TRAINING_DATA_PATH = os.path.join(MODEL_DIR, "training_features.csv")
API_PORT = 5001
FEATURE_COLUMNS = ['time_diff_wifi', 'same_location_wifi', 'is_in_booking', 'has_alibi', 'time_diff_cctv_face', 'face_match_in_frame']

# --- Phase 1: Feature Engineering ---

def create_features_from_raw_data(anchor_events, candidate_user, all_evidence):
    """
    Calculates a numerical feature vector for a single (anchor_event, candidate_user) pair.
    This is the core logic, used for both training and live prediction.
    """
    best_time_diff_wifi = 999
    same_location_wifi = 0
    is_in_booking = 0
    has_alibi = 0
    best_time_diff_cctv = 999
    face_match_in_frame = 0

    candidate_face_id = all_evidence.get('user_to_face_map', {}).get(candidate_user['id'])

    for event in anchor_events:
        try:
            event_time = datetime.fromisoformat(event['timestamp'].replace('Z', '+00:00'))
            event_location_id = event.get('locationId')
            if not event_location_id: continue
        except (ValueError, TypeError): continue

        for log in all_evidence.get('wifiLogs', []):
            if log.get('device', {}).get('userId') == candidate_user['id'] and log.get('accessPointId') == event_location_id:
                same_location_wifi = 1
                try:
                    log_time = datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00'))
                    time_diff = abs((event_time - log_time).total_seconds())
                    if time_diff < best_time_diff_wifi: best_time_diff_wifi = time_diff
                except (ValueError, TypeError): continue
        
        for booking in all_evidence.get('bookings', []):
            if booking.get('userId') == candidate_user['id'] and booking.get('locationId') == event_location_id:
                is_in_booking = 1
                
        for alibi in all_evidence.get('alibiSwipes', []):
            if alibi.get('card', {}).get('userId') == candidate_user['id']:
                has_alibi = 1
        
        for frame in all_evidence.get('cctvFrames', []):
            if frame.get('locationId') == event_location_id:
                try:
                    frame_time = datetime.fromisoformat(frame['timestamp'].replace('Z', '+00:00'))
                    time_diff = abs((event_time - frame_time).total_seconds())
                    if time_diff < best_time_diff_cctv:
                        best_time_diff_cctv = time_diff
                    if candidate_face_id and candidate_face_id in frame.get('detectedFaceIds', []):
                        face_match_in_frame = 1
                except (ValueError, TypeError): continue
    
    return {
        "time_diff_wifi": best_time_diff_wifi, "same_location_wifi": same_location_wifi,
        "is_in_booking": is_in_booking, "has_alibi": has_alibi,
        "time_diff_cctv_face": best_time_diff_cctv, "face_match_in_frame": face_match_in_frame
    }

def generate_training_data_from_csvs():
    """
    Reads all raw CSV data and synthesizes a labeled training dataset
    by calling the SAME feature engineering function used in production.
    """
    print("Generating training data from raw CSV files...")
    if os.path.exists(TRAINING_DATA_PATH):
        print(f"'{TRAINING_DATA_PATH}' already exists. Loading from file.")
        return pd.read_csv(TRAINING_DATA_PATH)

    try:
        # Load all necessary raw data sources
        users_df = pd.read_csv(os.path.join(DATA_DIR, 'student_or_staff_profiles.csv'))
        swipes_df = pd.read_csv(os.path.join(DATA_DIR, 'campus_card_swipes.csv'))
        wifi_df = pd.read_csv(os.path.join(DATA_DIR, 'wifi_associations_logs.csv'))
        cctv_df = pd.read_csv(os.path.join(DATA_DIR, 'cctv_frames.csv'))
        notes_df = pd.read_csv(os.path.join(DATA_DIR, 'free_text_notes (helpdesk or RSVps).csv'))
        lab_df = pd.read_csv(os.path.join(DATA_DIR, 'lab_bookings.csv'))
        library_df = pd.read_csv(os.path.join(DATA_DIR, 'library_checkouts.csv'))
    except FileNotFoundError as e:
        print(f"Error: Required CSV not found - {e}. Aborting training.")
        return None

    # Convert dataframes to the list of dictionaries format our API expects
    all_users = users_df.rename(columns={'entity_id': 'id', 'full_name': 'fullName', 'student_id': 'externalId'}).to_dict('records')
    all_swipes = swipes_df.to_dict('records')
    all_wifi = wifi_df.to_dict('records')
    all_cctv = cctv_df.to_dict('records')
    all_notes = notes_df.to_dict('records')
    all_lab = lab_df.to_dict('records')
    all_library = library_df.to_dict('records')

    
    # Create a mapping from card_id to the user who owns it
    card_to_user_map = {user['card_id']: user for user in all_users if pd.notna(user.get('card_id'))}
    all_user_ids = [user['id'] for user in all_users]

    features_list = []
    
    # Iterate through a sample of swipes to generate training examples
    for anchor_swipe in all_swipes[:2000]: # Use a subset for faster generation
        true_owner = card_to_user_map.get(anchor_swipe['card_id'])
        if not true_owner:
            continue
            
        # This simulates the "allEvidence" payload sent from the Node.js API
        # In a real scenario, you'd filter this more intelligently around the event time
        mock_evidence = {
            "wifiLogs": all_wifi,
            "bookings": all_lab,
            "alibiSwipes": all_library,
            "cctvFrames": all_cctv,
            "notes": all_notes,
            "user_to_face_map": {},
        }
        
        # --- Positive Sample (the true owner) ---
        positive_features = create_features_from_raw_data([anchor_swipe], true_owner, mock_evidence)
        positive_features['is_owner'] = 1
        features_list.append(positive_features)

        # --- Negative Samples (random other users) ---
        for _ in range(4): # Generate 4 negative samples for each positive one
            random_user_id = random.choice(all_user_ids)
            if random_user_id == true_owner['id']:
                continue
            
            random_user = next((user for user in all_users if user['id'] == random_user_id), None)
            if random_user:
                negative_features = create_features_from_raw_data([anchor_swipe], random_user, mock_evidence)
                negative_features['is_owner'] = 0
                features_list.append(negative_features)

    df = pd.DataFrame(features_list)
    os.makedirs(MODEL_DIR, exist_ok=True)
    df.to_csv(TRAINING_DATA_PATH, index=False)
    print(f"Training data with {len(df)} samples saved to '{TRAINING_DATA_PATH}'.")
    return df

# --- Phase 2: Model Training ---
def train_model():
    """
    Loads feature data, trains a model, evaluates it, and saves the artifacts.
    """
    print("\n--- Starting Model Training ---")
    features_df = generate_training_data_from_csvs()
    if features_df is None: return

    X = features_df[FEATURE_COLUMNS]
    y = features_df['is_owner']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    scaler = StandardScaler().fit(X_train)
    X_train_scaled = scaler.transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = LogisticRegression(random_state=42, class_weight='balanced')
    model.fit(X_train_scaled, y_train)
    
    print("\n--- Model Evaluation ---")
    y_pred = model.predict(X_test_scaled)
    print(f"Accuracy on Test Set: {accuracy_score(y_test, y_pred):.4f}")
    print(classification_report(y_test, y_pred))

    importance = model.coef_[0]
    print("\n--- Feature Importance ---")
    for i, feature in enumerate(FEATURE_COLUMNS):
        print(f"{feature}: {importance[i]:.4f}")
    print("--------------------------\n")
    
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    print(f"Model and scaler saved to '{MODEL_DIR}' directory.")
    print("--- Training Complete ---")

# --- Phase 3: API Deployment ---
app = Flask(__name__)
CORS(app)

try:
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    print(f"\nModel and scaler loaded successfully from '{MODEL_DIR}'. API is ready.")
except FileNotFoundError:
    model, scaler = None, None

@app.route('/predict/owner', methods=['POST'])
def predict():
    if not model or not scaler:
        return jsonify({"error": "Model not trained. Run 'python prediction_service.py train' first."}), 500

    data = request.get_json()
    if 'anchorEvents' not in data or 'candidateUsers' not in data or 'allEvidence' not in data:
        return jsonify({"error": "Invalid request body: Missing required keys."}), 400

    feature_vectors = [create_features_from_raw_data(data['anchorEvents'], user, data['allEvidence']) for user in data['candidateUsers']]
    features_df = pd.DataFrame(feature_vectors)
    
    scaled_features = scaler.transform(features_df)
    probabilities = model.predict_proba(scaled_features)[:, 1]

    response = []
    for i, user in enumerate(data['candidateUsers']):
        features = feature_vectors[i]
        evidence = []
        if features['face_match_in_frame'] == 1: evidence.append(f"User's face was detected by a nearby CCTV camera within {features['time_diff_cctv_face']:.0f} seconds.")
        if features['has_alibi'] == 1: evidence.append("CONFLICT: User had known activity at a different location.")
        if features['is_in_booking'] == 1: evidence.append("User had an active booking for this location at the time of the event.")
        if features['same_location_wifi'] == 1: evidence.append(f"A known device connected to a nearby Wi-Fi AP within {features['time_diff_wifi']:.0f} seconds.")
        if not evidence: evidence.append("No strong contextual evidence found to link this user.")
        
        response.append({
            "user": { "id": user['id'], "fullName": user['fullName'], "externalId": user['externalId'] },
            "score": probabilities[i],
            "evidence": evidence
        })

    sorted_response = sorted(response, key=lambda x: (x['score'], len(x['evidence'])), reverse=True)
    return jsonify({"predictions": sorted_response})

def run_api():
    if not model or not scaler:
        print("\nCannot start API. Please run 'python prediction_service.py train' first.")
        return
    print(f"\n* Starting Flask server on http://127.0.0.1:{API_PORT}")
    app.run(port=API_PORT, debug=False)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Ethos Security: ML Owner Prediction Service")
    parser.add_argument('mode', choices=['train', 'run'], help="Mode: 'train' to build the model, 'run' to start the API.")
    args = parser.parse_args()

    if args.mode == 'train':
        train_model()
    elif args.mode == 'run':
        run_api()
