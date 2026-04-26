from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
import cv2
from PIL import Image
import io
import base64
import pycountry
from tensorflow.keras.applications.vgg16 import preprocess_input


app = Flask(__name__)
CORS(app)


# ================= LOAD TRAINED MODEL =================

model = tf.keras.models.load_model("best_model.h5", compile=False)
IMG_SIZE = 224

for layer in model.layers:
    print(layer.name)

# ================= FACE DETECTOR =================

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)


def detect_face(image):

    image_np = np.array(image)

    # Convert RGB → BGR
    image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)

    gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY)

    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.3,
        minNeighbors=5
    )

    if len(faces) > 0:
        x, y, w, h = faces[0]
        face = image_np[y:y+h, x:x+w]
    else:
        face = image_np

    face = cv2.resize(face, (IMG_SIZE, IMG_SIZE))

    return face


# ================= GRAD-CAM =================
def make_gradcam_heatmap(img_array, model, last_conv_layer_name="block5_conv3"):

    grad_model = tf.keras.models.Model(
        [model.inputs],
        [model.get_layer(last_conv_layer_name).output, model.output]
    )

    with tf.GradientTape() as tape:

        conv_outputs, predictions = grad_model(img_array)

        class_channel = tf.where(
    predictions[:, 0] > 0.5,
    predictions[:, 0],
    1 - predictions[:, 0]
)

    grads = tape.gradient(class_channel, conv_outputs)

    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    conv_outputs = conv_outputs[0]

    heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)

    heatmap = tf.maximum(heatmap, 0)

    if tf.reduce_max(heatmap) == 0:
        heatmap = tf.ones_like(heatmap)

    heatmap /= tf.reduce_max(heatmap)

    return heatmap.numpy()

# ================= HEATMAP OVERLAY =================

def overlay_heatmap(original_img, heatmap):

    heatmap = cv2.resize(
        heatmap,
        (original_img.shape[1], original_img.shape[0])
    )

    heatmap = np.uint8(255 * heatmap)

    heatmap = cv2.applyColorMap(
        heatmap,
        cv2.COLORMAP_JET
    )

    superimposed_img = cv2.addWeighted(
        original_img,
        0.55,
        heatmap,
        0.65,
        0
    )

    return superimposed_img


# ================= PREDICTION ROUTE =================

@app.route("/predict", methods=["POST"])
def predict():

    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    try:

        file = request.files["image"]

        image = Image.open(
            io.BytesIO(file.read())
        ).convert("RGB")

        face = detect_face(image)

        input_face = preprocess_input(face.copy())

        input_face = np.expand_dims(input_face, axis=0)

        prediction = model.predict(input_face)[0][0]

        if prediction > 0.5:
            label = "No Down Syndrome Detected"
            confidence = float(prediction)
        else:
            label = "Down Syndrome Detected"
            confidence = float(1 - prediction)

        heatmap = make_gradcam_heatmap(
            input_face,
            model,
            last_conv_layer_name="block5_conv3"

        )

        gradcam_image = overlay_heatmap(
            face,
            heatmap
        )

        success1, buffer1 = cv2.imencode(".jpg", face)
        success2, buffer2 = cv2.imencode(".jpg", gradcam_image)
        if not success1 or not success2:
             return jsonify({"error": "Image encoding failed"}), 500
        original_base64 = base64.b64encode(buffer1).decode("utf-8")
        gradcam_base64 = base64.b64encode(buffer2).decode("utf-8")
        return jsonify({
            "prediction": label,
            "confidence": round(confidence * 100, 2),
            "original_image": original_base64,
            "gradcam_image": gradcam_base64
        })

    except Exception as e:
           print("Prediction error:", str(e))
           return jsonify({
                "error": str(e)
            }), 500


# ================= GLOBAL STATISTICS ROUTE =================

@app.route("/global-stats")
def global_stats():

    stats = {}

    high_prevalence = {
        "AF","BD","PK","NG","KE","ET","ZA","TZ","UG","SD"
    }

    moderate_high = {
        "IN","BR","MX","ID","PH","EG","VN","TH"
    }

    moderate = {
        "US","CA","AU","RU","CN","AR","TR"
    }

    lower_prevalence = {
        "JP","KR","IS","DK","SE","NL","NO","FI"
    }

    for country in pycountry.countries:

        code = country.alpha_2

        rate = "≈ 1.1 per 1000 births"
        risk = "Maternal age remains primary risk factor"

        if code in high_prevalence:
            rate = "≈ 1.5 per 1000 births"
            risk = "Limited prenatal screening access"

        elif code in moderate_high:
            rate = "≈ 1.3 per 1000 births"
            risk = "Variable screening coverage"

        elif code in moderate:
            rate = "≈ 1.2 per 1000 births"
            risk = "Maternal age trend influence"

        elif code in lower_prevalence:
            rate = "≈ 0.9 per 1000 births"
            risk = "Advanced prenatal diagnosis programs"

        stats[code] = {
            "rate": rate,
            "cases": "Estimated using WHO global epidemiological averages",
            "risk_factor": risk
        }

    return jsonify(stats)


# ================= RUN SERVER =================

if __name__ == "__main__":
    app.run(debug=True, port=5001)