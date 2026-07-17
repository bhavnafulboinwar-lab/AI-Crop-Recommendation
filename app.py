import os
from flask import Flask, render_template, request, jsonify, send_from_directory
from utils.predictor import load_prediction_engine, predict_crop

# Initialize Flask application
# Point template folder to the design workspace and static folder to design assets
app = Flask(
    __name__, 
    template_folder='AI-Crop-Recommendation', 
    static_folder='AI-Crop-Recommendation/assets',
    static_url_path='/assets'
)

# Attempt to load the prediction engine (models, scalers) at startup to catch load errors early
prediction_engine_status = "Not Initialized"
try:
    load_prediction_engine()
    prediction_engine_status = "Ready"
    print("--------------------------------------------------")
    print("AI Crop Recommendation Prediction Engine: LOADED SUCCESSFULLY")
    print("--------------------------------------------------")
except Exception as e:
    prediction_engine_status = f"Failed to Load: {e}"
    print("--------------------------------------------------")
    print(f"CRITICAL ERROR: Failed to load ML prediction models:\n{e}")
    print("--------------------------------------------------")

# =====================================================
# HTML PAGE ROUTING
# =====================================================

@app.route('/')
@app.route('/index.html')
def home():
    """Renders the main landing homepage."""
    return render_template('index.html')

@app.route('/predict.html')
def predict_page():
    """Renders the prediction inputs page."""
    # If the model fails to load, communicate it to the template
    return render_template('predict.html', engine_status=prediction_engine_status)

@app.route('/dashboard.html')
def dashboard_page():
    """Renders the dashboard page."""
    return render_template('dashboard.html')

@app.route('/about.html')
def about_page():
    """Renders the about info page."""
    return render_template('about.html')

@app.route('/result.html')
def result_page():
    """Renders the recommendation result page."""
    return render_template('result.html')

# =====================================================
# ML PREDICTION ENDPOINT
# =====================================================

@app.route('/predict', methods=['POST'])
def predict():
    """
    Endpoint that processes soil/climate inputs and returns the ML model's prediction.
    Accepts both JSON payloads and URL-encoded form data.
    """
    # Verify if prediction engine is healthy
    if prediction_engine_status != "Ready":
        return jsonify({
            "error": f"Machine Learning engine is offline. Initialization error: {prediction_engine_status}"
        }), 500

    try:
        # Determine format of incoming request
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form

        # Extract values
        n = data.get('nitrogen')
        p = data.get('phosphorus')
        k = data.get('potassium')
        temp = data.get('temp')
        humidity = data.get('humidity')
        ph = data.get('ph')
        rainfall = data.get('rainfall')

        # 1. Field presence validation
        fields = {
            "Nitrogen (N)": n,
            "Phosphorus (P)": p,
            "Potassium (K)": k,
            "Temperature": temp,
            "Humidity": humidity,
            "pH Value": ph,
            "Rainfall": rainfall
        }
        for name, value in fields.items():
            if value is None or str(value).strip() == "":
                return jsonify({"error": f"Input field '{name}' is missing or empty."}), 400

        # 2. Conversion and numeric validation
        try:
            n_val = float(n)
            p_val = float(p)
            k_val = float(k)
            temp_val = float(temp)
            humidity_val = float(humidity)
            ph_val = float(ph)
            rainfall_val = float(rainfall)
        except ValueError:
            return jsonify({"error": "All parameters must be valid numeric decimal values."}), 400

        # 3. Value boundary validations matching form ranges in predict.html
        if not (0 <= n_val <= 150):
            return jsonify({"error": "Nitrogen (N) must be a value between 0 and 150 mg/kg."}), 400
        if not (0 <= p_val <= 150):
            return jsonify({"error": "Phosphorus (P) must be a value between 0 and 150 mg/kg."}), 400
        if not (0 <= k_val <= 250):
            return jsonify({"error": "Potassium (K) must be a value between 0 and 250 mg/kg."}), 400
        if not (0 <= temp_val <= 50):
            return jsonify({"error": "Temperature must be a value between 0°C and 50°C."}), 400
        if not (0 <= humidity_val <= 100):
            return jsonify({"error": "Humidity must be a value between 0% and 100%."}), 400
        if not (0 <= ph_val <= 14):
            return jsonify({"error": "pH must be a value between 0.0 and 14.0."}), 400
        if not (0 <= rainfall_val <= 400):
            return jsonify({"error": "Rainfall must be a value between 0.0mm and 400.0mm."}), 400

        # 4. Predict using the ML engine
        recommended_crop = predict_crop(n_val, p_val, k_val, temp_val, humidity_val, ph_val, rainfall_val)
        
        # Return predicted recommended crop
        return jsonify({"crop": recommended_crop})

    except Exception as err:
        return jsonify({"error": f"Prediction server error: {str(err)}"}), 500

if __name__ == "__main__":
    # Start the Flask app locally on Port 5000 in debug mode
    app.run(debug=True, port=5000)