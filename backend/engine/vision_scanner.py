import os
import json
import io
import math
import re
from typing import Dict, Any, Tuple, Optional, List
import numpy as np
from PIL import Image
import cv2

class VisionScanner:
    """
    Lightweight AI-Enabled Optical Wristband Scanner & Neural Network Engine.
    Executes:
    1. QR Code decoding (Employee ID, Plant Unit, Badge Barcode)
    2. Blue dosimeter strip substrate validation (prevents false positives from faces, walls, etc.)
    3. CIELAB color space transformation & multi-patch segmentation (Patch A/B/C)
    4. Zero-dependency 3-layer MLP neural network forward pass for exposure prediction
    5. Photo quality scorecard (lighting, glare, blur)
    """
    def __init__(self, model_path: Optional[str] = None):
        if model_path is None:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            model_path = os.path.join(current_dir, "h2s_strip_model.json")
        
        self.model_path = model_path
        self.model_loaded = False
        self.feature_mean = np.array([0.45, 12.0])
        self.feature_std = np.array([0.25, 6.0])
        self.w1 = np.zeros((2, 12))
        self.b1 = np.zeros(12)
        self.w2 = np.zeros((12, 6))
        self.b2 = np.zeros(6)
        self.w3 = np.zeros((6, 1))
        self.b3 = np.zeros(1)
        
        # QR detector
        self.qr_detector = cv2.QRCodeDetector()
        
        self._load_model()

    def _load_model(self):
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self.feature_mean = np.array(data["featureMean"], dtype=np.float64)
                self.feature_std = np.array(data["featureStd"], dtype=np.float64)
                
                layers = data.get("layers", [])
                if len(layers) >= 3:
                    self.w1 = np.array(layers[0]["W"], dtype=np.float64)
                    self.b1 = np.array(layers[0]["b"], dtype=np.float64)
                    self.w2 = np.array(layers[1]["W"], dtype=np.float64)
                    self.b2 = np.array(layers[1]["b"], dtype=np.float64)
                    self.w3 = np.array(layers[2]["W"], dtype=np.float64)
                    self.b3 = np.array(layers[2]["b"], dtype=np.float64)
                    self.model_loaded = True
                    if self.w3.ndim == 1:
                        self.w3 = self.w3.reshape(-1, 1)
                    if self.b3.ndim == 0:
                        self.b3 = np.array([self.b3])
            except Exception as e:
                print(f"Warning: Failed to load h2s_strip_model.json ({e}). Using default calibration.")
        else:
            print(f"Notice: Model file {self.model_path} not found. Running in fallback calibration mode.")

    @staticmethod
    def rgb_to_lab(rgb: np.ndarray) -> np.ndarray:
        """
        Converts RGB (0-255) array to standard CIELAB (L*, a*, b*) color space.
        """
        rgb_norm = np.clip(rgb, 0, 255) / 255.0
        
        def inv_gamma(u):
            return np.where(u <= 0.04045, u / 12.92, ((u + 0.055) / 1.055) ** 2.4)
            
        rl = inv_gamma(rgb_norm)
        
        M = np.array([
            [0.4124564, 0.3575761, 0.1804375],
            [0.2126729, 0.7151522, 0.0721750],
            [0.0193339, 0.1191920, 0.9503041]
        ])
        
        xyz = rl @ M.T
        Xn, Yn, Zn = 0.95047, 1.0, 1.08883
        xyz_n = xyz / np.array([Xn, Yn, Zn])
        
        def f(t):
            d = 6 / 29
            return np.where(t > (d ** 3), np.cbrt(t), t / (3 * d * d) + 4 / 29)
            
        fxyz = f(xyz_n)
        L = 116.0 * fxyz[..., 1] - 16.0
        a = 500.0 * (fxyz[..., 0] - fxyz[..., 1])
        b = 200.0 * (fxyz[..., 1] - fxyz[..., 2])
        return np.stack([L, a, b], axis=-1)

    @staticmethod
    def is_orange_reaction(rgb: np.ndarray) -> np.ndarray:
        """
        Detects reacted orange colorimetric darkening on the sensing strip substrate.
        """
        r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
        return (r - b > 20) & (r > 135) & (g > 80)

    def detect_qr_code(self, img_bgr: np.ndarray) -> Dict[str, Any]:
        """
        Extracts and parses Employee ID, Unit, and Badge Barcode from QR code if present.
        """
        try:
            decoded_text, points, straight_qrcode = self.qr_detector.detectAndDecode(img_bgr)
            if decoded_text and len(decoded_text.strip()) > 0:
                raw = decoded_text.strip()
                result = {
                    "qr_detected": True,
                    "qr_raw": raw,
                    "employee_id": None,
                    "plant_unit": None,
                    "badge_id": None
                }
                
                # Check for JSON payload
                if raw.startswith("{") and raw.endswith("}"):
                    try:
                        data = json.loads(raw)
                        result["employee_id"] = data.get("emp_id") or data.get("employee_id") or data.get("worker_id")
                        result["plant_unit"] = data.get("unit") or data.get("plant_unit")
                        result["badge_id"] = data.get("badge_id")
                        return result
                    except Exception:
                        pass
                
                # Check for delimited format (e.g. EMP-1042:CDU-1:BAND-01 or EMP-1042,CDU-1)
                parts = re.split(r'[:;,|]', raw)
                for p in parts:
                    p = p.strip()
                    if re.match(r'^EMP-?\d{3,6}$', p, re.IGNORECASE):
                        result["employee_id"] = p.upper()
                    elif p.upper() in ["CDU-1", "CDU-2", "DHDS", "SRU", "TANK FARM", "FLARE HEADER"]:
                        result["plant_unit"] = p.upper()
                    elif p.upper().startswith("BAND-"):
                        result["badge_id"] = p.upper()
                        
                # Direct Regex match if still None
                if not result["employee_id"]:
                    emp_match = re.search(r'\b(EMP[-_]?\d{3,6})\b', raw, re.IGNORECASE)
                    if emp_match:
                        result["employee_id"] = emp_match.group(1).upper()
                        
                return result
        except Exception:
            pass
            
        return {
            "qr_detected": False,
            "qr_raw": None,
            "employee_id": None,
            "plant_unit": None,
            "badge_id": None
        }

    def verify_blue_strip_substrate(self, img_rgb: np.ndarray) -> Tuple[bool, float, Dict[str, Any]]:
        """
        Validates that the image contains the characteristic BLUE substrate of the
        Rakshak dosimeter wristband.
        Prevents faces, skin, background rooms, walls, or random objects from being falsely analyzed.
        """
        # Convert RGB to HSV using OpenCV
        img_bgr = cv2.cvtColor(img_rgb.astype(np.uint8), cv2.COLOR_RGB2BGR)
        hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
        
        # Blue / Cyan Hue Range in OpenCV (H: 0-180, S: 0-255, V: 0-255)
        # Blue / Cyan is roughly H: 85 to 140
        h, s, v = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
        
        # Mask for blue wristband substrate
        blue_mask = (h >= 85) & (h <= 140) & (s >= 35) & (v >= 30)
        
        # Also check RGB blue dominance (B > R + 10 and B > G - 15)
        r, g, b = img_rgb[..., 0], img_rgb[..., 1], img_rgb[..., 2]
        rgb_blue_mask = (b > r + 10) & (b > g - 15) & (b > 50)
        
        combined_mask = blue_mask | rgb_blue_mask
        blue_pixel_fraction = float(combined_mask.mean())
        
        # Check central border / outer regions (where wristband frame sits)
        h_dim, w_dim = img_rgb.shape[:2]
        border_mask = np.ones((h_dim, w_dim), dtype=bool)
        # Exclude only very center reactive spot
        cy_min, cy_max = int(h_dim * 0.35), int(h_dim * 0.65)
        cx_min, cx_max = int(w_dim * 0.35), int(w_dim * 0.65)
        border_mask[cy_min:cy_max, cx_min:cx_max] = False
        
        border_blue_fraction = float(combined_mask[border_mask].mean())
        
        # Genuine Rakshak blue dosimeter strips require >= 4.5% blue substrate in the frame
        is_valid_strip = (blue_pixel_fraction >= 0.045) or (border_blue_fraction >= 0.045)
        
        details = {
            "blue_pixel_fraction": round(blue_pixel_fraction * 100, 1),
            "border_blue_fraction": round(border_blue_fraction * 100, 1),
            "is_valid_strip": is_valid_strip
        }
        
        return is_valid_strip, blue_pixel_fraction, details

    def inspect_photo_quality(self, img_array: np.ndarray) -> Dict[str, Any]:
        """
        Analyzes lighting, glare, contrast, and blurriness of the captured badge photo.
        """
        gray = 0.299 * img_array[..., 0] + 0.587 * img_array[..., 1] + 0.114 * img_array[..., 2]
        
        mean_brightness = float(gray.mean())
        std_contrast = float(gray.std())
        glare_ratio = float((gray > 245).mean())
        
        dx = np.diff(gray, axis=1)
        dy = np.diff(gray, axis=0)
        edge_variance = float(dx.var() + dy.var())
        
        issues = []
        if mean_brightness < 40.0:
            issues.append("Low lighting / Underexposed")
        elif mean_brightness > 230.0:
            issues.append("Overexposed")
            
        if glare_ratio > 0.15:
            issues.append("Excessive glare on strip surface")
            
        if std_contrast < 12.0:
            issues.append("Low contrast / Faded image")
            
        if edge_variance < 25.0:
            issues.append("Possible camera blur / Out of focus")
            
        quality_rating = "EXCELLENT"
        if len(issues) == 1:
            quality_rating = "GOOD"
        elif len(issues) == 2:
            quality_rating = "ACCEPTABLE"
        elif len(issues) >= 3:
            quality_rating = "POOR"
            
        return {
            "quality_rating": quality_rating,
            "mean_brightness": round(mean_brightness, 1),
            "glare_percentage": round(glare_ratio * 100, 1),
            "contrast_score": round(std_contrast, 1),
            "edge_sharpness": round(edge_variance, 1),
            "quality_issues": issues,
            "is_usable": (quality_rating != "POOR")
        }

    def predict_exposure_seconds(self, orange_area_fraction: float, delta_e: float) -> Tuple[float, float]:
        """
        Runs the 3-layer MLP forward pass from h2s_strip_model.json:
        2 inputs -> 12 (ReLU) -> 6 (ReLU) -> 1 (Linear) = log10(seconds)
        """
        if not self.model_loaded:
            approx_log10 = 1.0 + (delta_e / 4.0) + (orange_area_fraction * 2.5)
            approx_sec = 10.0 ** min(5.0, max(1.0, approx_log10))
            return approx_sec, approx_log10
            
        x = np.array([orange_area_fraction, delta_e], dtype=np.float64)
        x_norm = (x - self.feature_mean) / np.maximum(self.feature_std, 1e-6)
        
        h1 = np.maximum(0.0, x_norm @ self.w1 + self.b1)
        h2 = np.maximum(0.0, h1 @ self.w2 + self.b2)
        out = np.squeeze(h2 @ self.w3 + self.b3)
        log10_s = float(out.item() if hasattr(out, 'item') else out)
        
        log10_s = float(np.clip(log10_s, np.log10(8.0), np.log10(43200.0)))
        seconds = float(10.0 ** log10_s)
        
        return seconds, log10_s

    def analyze_badge_image(self, image_bytes: bytes, require_blue_strip: bool = True) -> Dict[str, Any]:
        """
        Full Pipeline:
        1. Decodes full-resolution image.
        2. Detects and parses QR code (Employee ID, Plant Unit, Badge Barcode).
        3. Validates Blue Dosimeter Strip Substrate (rejects human faces/walls).
        4. Assesses image quality & lighting.
        5. Segments Patch A (Active Spot), Patch B (Reference Blank), and Patch C (Integrity Indicator).
        6. Computes CIELAB Delta E and Orange Area Fraction.
        7. Runs MLP Neural Network for predicted exposure duration.
        """
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img_bgr_orig = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img_bgr_orig is None:
                raise ValueError("Could not decode image bytes")
            img_rgb_orig = cv2.cvtColor(img_bgr_orig, cv2.COLOR_BGR2RGB)
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to decode image file: {str(e)}",
                "strip_detected": False,
                "delta_e": 0.0,
                "confidence": "INVALID"
            }

        # 1. QR Code Detection & Decoding
        qr_info = self.detect_qr_code(img_bgr_orig)

        # 2. Blue Dosimeter Substrate Verification
        is_blue_strip, blue_pct, blue_details = self.verify_blue_strip_substrate(img_rgb_orig)
        
        if require_blue_strip and not is_blue_strip:
            quality = self.inspect_photo_quality(img_rgb_orig)
            return {
                "success": False,
                "strip_detected": False,
                "error": "❌ No valid Rakshak dosimeter strip detected. Please align the blue wristband within the camera guide.",
                "qr_data": qr_info,
                "blue_details": blue_details,
                "quality_scorecard": quality,
                "confidence": "INVALID"
            }

        # 3. Resize normalized image for patch analysis
        pil_img = Image.fromarray(img_rgb_orig).resize((128, 128))
        img_arr = np.array(pil_img, dtype=np.float64)

        # 4. Quality Scorecard
        quality = self.inspect_photo_quality(img_arr)
        
        # 5. Segment Patch A (Active Reactive Spot) - Central 64x64
        patch_a_img = img_arr[32:96, 32:96]
        mask_a = self.is_orange_reaction(patch_a_img)
        orange_area_fraction = float(mask_a.mean())
        
        if mask_a.sum() > 3:
            orange_mean_rgb = patch_a_img[mask_a].mean(axis=0)
        else:
            orange_mean_rgb = patch_a_img.reshape(-1, 3).mean(axis=0)
            
        if (~mask_a).sum() > 3:
            bg_mean_rgb = patch_a_img[~mask_a].mean(axis=0)
        else:
            bg_mean_rgb = patch_a_img.reshape(-1, 3).mean(axis=0)
            
        lab_spot = self.rgb_to_lab(orange_mean_rgb)
        lab_bg = self.rgb_to_lab(bg_mean_rgb)
        delta_e = float(np.linalg.norm(lab_spot - lab_bg))
        
        # 6. Segment Patch B (Reference Blank Control) - Top-Left 24x24
        patch_b_img = img_arr[4:28, 4:28]
        lab_b = self.rgb_to_lab(patch_b_img.reshape(-1, 3).mean(axis=0))
        patch_b_drift = float(np.linalg.norm(lab_b - lab_bg))
        patch_b_drift = round(max(0.05, patch_b_drift * 0.4), 2)
        
        # 7. Segment Patch C (Integrity Indicator) - Bottom-Right 24x24
        patch_c_img = img_arr[100:124, 100:124]
        c_mean = patch_c_img.reshape(-1, 3).mean(axis=0)
        
        if c_mean[0] < 90 and c_mean[1] < 90:
            patch_c_condition = "COMPROMISED"
        elif c_mean[2] > 180 or abs(c_mean[0] - c_mean[1]) > 40:
            patch_c_condition = "WARNING"
        else:
            patch_c_condition = "NORMAL"
            
        # 8. Neural Network Forward Pass
        pred_seconds, log10_s = self.predict_exposure_seconds(orange_area_fraction, delta_e)
        
        if pred_seconds < 60:
            human_duration = f"{int(pred_seconds)} sec"
        elif pred_seconds < 3600:
            human_duration = f"{round(pred_seconds / 60, 1)} min"
        else:
            human_duration = f"{round(pred_seconds / 3600, 1)} hrs"

        # 9. Measurement Confidence
        if quality["quality_rating"] == "POOR" or patch_c_condition == "COMPROMISED" or patch_b_drift > 0.7:
            confidence = "LOW"
        elif quality["quality_rating"] == "ACCEPTABLE" or patch_c_condition == "WARNING" or patch_b_drift > 0.35:
            confidence = "MEDIUM"
        else:
            confidence = "HIGH"

        return {
            "success": True,
            "strip_detected": True,
            "qr_data": qr_info,
            "employee_id": qr_info.get("employee_id"),
            "plant_unit": qr_info.get("plant_unit"),
            "badge_id": qr_info.get("badge_id"),
            "delta_e": round(delta_e, 2),
            "orange_area_fraction": round(orange_area_fraction, 3),
            "predicted_seconds": round(pred_seconds, 1),
            "predicted_exposure_human": human_duration,
            "patch_b_drift": patch_b_drift,
            "patch_c_condition": patch_c_condition,
            "blue_details": blue_details,
            "quality_scorecard": quality,
            "confidence": confidence
        }

# Global Singleton instance
vision_scanner = VisionScanner()
