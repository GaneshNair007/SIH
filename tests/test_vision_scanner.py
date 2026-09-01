import io
import pytest
import numpy as np
from PIL import Image
from fastapi.testclient import TestClient
from backend.main import app
from backend.engine.vision_scanner import vision_scanner, VisionScanner

client = TestClient(app)

def create_synthetic_badge_image(spot_rgb=(235, 115, 30), bg_rgb=(220, 215, 205), spot_radius=20):
    """Generates a test RGB badge image in memory."""
    img = Image.new("RGB", (128, 128), color=bg_rgb)
    cx, cy = 64, 64
    for y in range(cy - spot_radius, cy + spot_radius):
        for x in range(cx - spot_radius, cx + spot_radius):
            if (x - cx) ** 2 + (y - cy) ** 2 <= spot_radius ** 2:
                img.putpixel((x, y), spot_rgb)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def test_vision_scanner_model_loaded():
    assert vision_scanner.model_loaded is True
    assert vision_scanner.w1.shape == (2, 12)
    assert vision_scanner.w2.shape == (12, 6)
    assert vision_scanner.w3.shape == (6, 1)

def test_cielab_conversion_neutral():
    # Pure white (255, 255, 255) -> L* ~ 100, a* ~ 0, b* ~ 0
    rgb = np.array([[[255, 255, 255]]], dtype=np.float64)
    lab = vision_scanner.rgb_to_lab(rgb)
    assert round(lab[0, 0, 0], 0) >= 99.0
    assert abs(lab[0, 0, 1]) < 2.0
    assert abs(lab[0, 0, 2]) < 2.0

def test_mlp_forward_pass():
    # Test area fraction 0.4, deltaE 8.5
    seconds, log10_s = vision_scanner.predict_exposure_seconds(0.4, 8.5)
    assert seconds > 0.0
    assert np.log10(8.0) <= log10_s <= np.log10(43200.0)

def test_photo_quality_grading():
    # Normal image
    normal_img = np.full((128, 128, 3), 150, dtype=np.float64)
    normal_img[::2, ::2] = 170
    q = vision_scanner.inspect_photo_quality(normal_img)
    assert q["is_usable"] is True
    assert q["quality_rating"] in ["EXCELLENT", "GOOD"]

    # Severe glare image
    glare_img = np.full((128, 128, 3), 250, dtype=np.float64)
    q_glare = vision_scanner.inspect_photo_quality(glare_img)
    assert "Excessive glare on strip surface" in q_glare["quality_issues"] or q_glare["glare_percentage"] > 10.0

def test_analyze_badge_image_synthetic():
    img_bytes = create_synthetic_badge_image(spot_rgb=(235, 115, 30), bg_rgb=(220, 215, 205), spot_radius=18)
    res = vision_scanner.analyze_badge_image(img_bytes)
    assert res["success"] is True
    assert res["delta_e"] > 10.0
    assert res["orange_area_fraction"] > 0.05
    assert "predicted_seconds" in res
    assert "predicted_exposure_human" in res
    assert res["confidence"] in ["HIGH", "MEDIUM", "LOW"]

def test_analyze_image_api_endpoint():
    img_bytes = create_synthetic_badge_image()
    files = {"file": ("test_badge.png", img_bytes, "image/png")}
    response = client.post("/api/scan/analyze-image", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "delta_e" in data
    assert "quality_scorecard" in data
