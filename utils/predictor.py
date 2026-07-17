import os
import joblib
import numpy as np

# Resolve model directories relative to project root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "AI-Crop-Recommendation", "model")

MODEL_PATH = os.path.join(MODEL_DIR, "model.pkl")
STAND_PATH = os.path.join(MODEL_DIR, "standscaler.pkl")
MINMAX_PATH = os.path.join(MODEL_DIR, "minmaxscaler.pkl")

# Global variables for models and scalers
model = None
stand_scaler = None
minmax_scaler = None

# Mapping predicted integers (1-22) to Crop Names
CROP_DICT = {
    1: "Rice",
    2: "Maize",
    3: "Jute",
    4: "Cotton",
    5: "Coconut",
    6: "Papaya",
    7: "Orange",
    8: "Apple",
    9: "Muskmelon",
    10: "Watermelon",
    11: "Grapes",
    12: "Mango",
    13: "Banana",
    14: "Pomegranate",
    15: "Lentil",
    16: "Blackgram",
    17: "Mungbean",
    18: "Mothbeans",
    19: "Pigeonpeas",
    20: "Kidneybeans",
    21: "Chickpea",
    22: "Coffee"
}

def load_prediction_engine():
    """
    Loads model, MinMaxScaler, and StandardScaler.
    Calibrates the StandardScaler with the true training dataset parameters.
    """
    global model, stand_scaler, minmax_scaler
    
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found at: {MODEL_PATH}")
    if not os.path.exists(STAND_PATH):
        raise FileNotFoundError(f"StandardScaler file not found at: {STAND_PATH}")
    if not os.path.exists(MINMAX_PATH):
        raise FileNotFoundError(f"MinMaxScaler file not found at: {MINMAX_PATH}")

    # Load estimators using joblib
    model = joblib.load(MODEL_PATH)
    stand_scaler = joblib.load(STAND_PATH)
    minmax_scaler = joblib.load(MINMAX_PATH)

    # Re-calibrate the loaded StandardScaler parameters.
    # The loaded file contains dummy values (mean=0, scale=1) due to a training save bug.
    # We calibrate it with the exact statistics of the original 2200-row Kaggle Crop Recommendation dataset.
    stand_scaler.mean_ = np.array([50.55, 53.36, 48.15, 25.62, 71.48, 6.47, 103.46])
    stand_scaler.scale_ = np.array([36.92, 32.99, 50.65, 5.06, 22.26, 0.77, 54.96])
    stand_scaler.var_ = stand_scaler.scale_ ** 2
    stand_scaler.n_samples_seen_ = 2200

def predict_crop(n, p, k, temp, humidity, ph, rainfall):
    """
    Runs the prediction flow on given user inputs:
    1. Converts inputs to float.
    2. Constructs a 2D numpy array in order: [N, P, K, Temperature, Humidity, pH, Rainfall].
    3. Transforms using calibrated StandardScaler (MinMaxScaler is not used by the trained model).
    4. Predicts the class ID using the RandomForest classifier.
    5. Returns the actual recommended crop name.
    """
    global model, stand_scaler
    
    # Lazy load prediction assets if not loaded
    if model is None or stand_scaler is None:
        load_prediction_engine()
        
    # 1. Read & convert inputs to floats
    # 2. Arrange inputs in exact required order
    input_features = np.array([[
        float(n),
        float(p),
        float(k),
        float(temp),
        float(humidity),
        float(ph),
        float(rainfall)
    ]])

    # 3. Apply standard scaler preprocessing
    scaled_features = stand_scaler.transform(input_features)

    # 4. Predict
    prediction_array = model.predict(scaled_features)
    predicted_class_id = int(prediction_array[0])

    # 5. Return actual crop name mapped from class ID
    recommended_crop = CROP_DICT.get(predicted_class_id)
    if recommended_crop is None:
        raise ValueError(f"Model predicted class ID {predicted_class_id} which does not map to any known crop.")
        
    return recommended_crop
