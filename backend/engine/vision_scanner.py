import os
import json
import io
import math
from typing import Dict, Any, Tuple, Optional, List
import numpy as np
from PIL import Image

class VisionScanner:
    """
    Lightweight AI-Enabled Optical Wristband Scanner & Neural Network Engine.
    Executes CIELAB color space transformation, multi-patch segmentation (Patch A/B/C),
    photo quality grading, and zero-dependency 3-layer MLP neural network forward pass.
    """
    def __init__(self, model_path: Optional[str] = None):
        if model_path is None:
            # Default to scanner backend/h2s_strip_model.json
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            model_path = os.path.join(base_dir, "scanner backend", "h2s_strip_model.json")
        
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
                    # Reshape w3 and b3 if necessary
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
        
        # Inverse sRGB gamma companding
        def inv_gamma(u):
            return np.where(u <= 0.04045, u / 12.92, ((u + 0.055) / 1.055) ** 2.4)
            
        rl = inv_gamma(rgb_norm)
        
        # sRGB to CIE XYZ Matrix (D65 illuminant, 2° observer)
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

    def inspect_photo_quality(self, img_array: np.ndarray) -> Dict[str, Any]:
        """
        Analyzes lighting, glare, contrast, and blurriness of the captured badge photo.
        """
        gray = 0.299 * img_array[..., 0] + 0.587 * img_array[..., 1] + 0.114 * img_array[..., 2]
        
        mean_brightness = float(gray.mean())
        std_contrast = float(gray.std())
        glare_ratio = float((gray > 245).mean())
        shadow_ratio = float((gray < 25).mean())
        
        # Simple edge Laplacian variance proxy
        dx = np.diff(gray, axis=1)
        dy = np.diff(gray, axis=0)
        edge_variance = float(dx.var() + dy.var())
        
        issues = []
        if mean_brightness < 45.0:
            issues.append("Low lighting / Underexposed")
        elif mean_brightness > 225.0:
            issues.append("Overexposed")
            
        if glare_ratio > 0.12:
            issues.append("Excessive glare on strip surface")
            
        if std_contrast < 15.0:
            issues.append("Low contrast / Faded image")
            
        if edge_variance < 30.0:
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
        Returns: (predicted_seconds, log10_seconds)
        """
        if not self.model_loaded:
            # Analytical power-law fallback: t ~ exp(0.35 * delta_E + 2.0 * area)
            approx_log10 = 1.0 + (delta_e / 4.0) + (orange_area_fraction * 2.5)
            approx_sec = 10.0 ** min(5.0, max(1.0, approx_log10))
            return approx_sec, approx_log10
            
        # 1. Standardize inputs
        x = np.array([orange_area_fraction, delta_e], dtype=np.float64)
        x_norm = (x - self.feature_mean) / np.maximum(self.feature_std, 1e-6)
        
        # 2. Layer 1 (2 -> 12 ReLU)
        h1 = np.maximum(0.0, x_norm @ self.w1 + self.b1)
        
        # 3. Layer 2 (12 -> 6 ReLU)
        h2 = np.maximum(0.0, h1 @ self.w2 + self.b2)
        
        # 4. Layer 3 (6 -> 1 Linear)
        out = np.squeeze(h2 @ self.w3 + self.b3)
        log10_s = float(out.item() if hasattr(out, 'item') else out)
        
        # Clip to realistic badge response range (8 seconds to 12 hours)
        log10_s = float(np.clip(log10_s, np.log10(8.0), np.log10(43200.0)))
        seconds = float(10.0 ** log10_s)
        
        return seconds, log10_s

    def analyze_badge_image(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Main analysis pipeline:
        1. Decodes and crops badge photo.
        2. Assesses image quality & lighting.
        3. Segments Patch A (Active Spot), Patch B (Control Blank), and Patch C (Integrity Indicator).
        4. Calculates Delta E and Orange Area Fraction.
        5. Runs MLP neural network for predicted exposure time.
        6. Derives measurement confidence and badge integrity flags.
        """
        try:
            pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            # Resize for consistent processing
            pil_img = pil_img.resize((128, 128))
            img_arr = np.array(pil_img, dtype=np.float64)
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to decode image file: {str(e)}",
                "delta_e": 0.0,
                "confidence": "INVALID"
            }

        # 1. Quality Inspection
        quality = self.inspect_photo_quality(img_arr)
        
        # 2. Segment Patch A (Active Spot) - Central 64x64 region
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
        
        # 3. Segment Patch B (Reference Blank Control) - Top-Left 24x24
        patch_b_img = img_arr[4:28, 4:28]
        lab_b = self.rgb_to_lab(patch_b_img.reshape(-1, 3).mean(axis=0))
        patch_b_drift = float(np.linalg.norm(lab_b - lab_bg))
        patch_b_drift = round(max(0.05, patch_b_drift * 0.4), 2)
        
        # 4. Segment Patch C (Integrity Indicator) - Bottom-Right 24x24
        patch_c_img = img_arr[100:124, 100:124]
        c_mean = patch_c_img.reshape(-1, 3).mean(axis=0)
        
        # If Patch C has severe discoloration towards gray/magenta -> COMPROMISED
        if c_mean[0] < 90 and c_mean[1] < 90:
            patch_c_condition = "COMPROMISED"
        elif c_mean[2] > 180 or abs(c_mean[0] - c_mean[1]) > 40:
            patch_c_condition = "WARNING"
        else:
            patch_c_condition = "NORMAL"
            
        # 5. Neural Network Inference
        pred_seconds, log10_s = self.predict_exposure_seconds(orange_area_fraction, delta_e)
        
        # Format human readable duration
        if pred_seconds < 60:
            human_duration = f"{int(pred_seconds)} sec"
        elif pred_seconds < 3600:
            human_duration = f"{round(pred_seconds / 60, 1)} min"
        else:
            human_duration = f"{round(pred_seconds / 3600, 1)} hrs"

        # 6. Determine Measurement Confidence
        if quality["quality_rating"] == "POOR" or patch_c_condition == "COMPROMISED" or patch_b_drift > 0.7:
            confidence = "LOW"
        elif quality["quality_rating"] == "ACCEPTABLE" or patch_c_condition == "WARNING" or patch_b_drift > 0.35:
            confidence = "MEDIUM"
        else:
            confidence = "HIGH"

        return {
            "success": True,
            "delta_e": round(delta_e, 2),
            "orange_area_fraction": round(orange_area_fraction, 3),
            "predicted_seconds": round(pred_seconds, 1),
            "predicted_exposure_human": human_duration,
            "patch_b_drift": patch_b_drift,
            "patch_c_condition": patch_c_condition,
            "quality_scorecard": quality,
            "confidence": confidence
        }

# Global Singleton instance
vision_scanner = VisionScanner()
