from typing import Dict, Any
from backend.schemas.worker import WorkerProfile

def calculate_chronic_lung_risk_score(worker: WorkerProfile) -> Dict[str, Any]:
    """
    Computes a 0–100 Chronic Occupational Lung-Risk Score combining:
    1. 90-day rolling cumulative exposure load (ppm·hr) [40% weight]
    2. Smoking pack-years [25% weight]
    3. Baseline Spirometry FEV1/FVC ratio [20% weight]
    4. Age and pre-existing respiratory comorbidities [15% weight]
    
    This is an occupational hygiene scoring metric, not a diagnostic tool.
    """
    # 1. 90-day exposure subscore (0 to 100)
    # ACGIH/NIOSH 90d baseline safe threshold ~ 150 ppm·hr
    load_90d = worker.exposure_ledger.rolling_90day_ppm_hr
    exp_subscore = min(100.0, (load_90d / 200.0) * 100.0)
    
    # 2. Smoking subscore
    pack_years = worker.health_profile.smoking_pack_years
    smoke_subscore = min(100.0, (pack_years / 20.0) * 100.0)
    
    # 3. Spirometry subscore (FEV1/FVC: normal > 0.75, obstructive < 0.70)
    fev_ratio = worker.health_profile.baseline_fev1_fvc_ratio or 0.80
    if fev_ratio >= 0.80:
        spiro_subscore = 0.0
    elif fev_ratio >= 0.70:
        spiro_subscore = (0.80 - fev_ratio) / 0.10 * 50.0  # 0-50
    else:
        spiro_subscore = 50.0 + min(50.0, (0.70 - fev_ratio) / 0.20 * 50.0) # 50-100
        
    # 4. Age & Comorbidity subscore
    age_subscore = 0.0
    if worker.age > 50:
        age_subscore += 40.0
    elif worker.age > 40:
        age_subscore += 20.0
        
    comorbidities = worker.health_profile.pre_existing_conditions
    if any("asthma" in c.lower() or "copd" in c.lower() or "bronchitis" in c.lower() for c in comorbidities):
        age_subscore += 50.0
    age_subscore = min(100.0, age_subscore)
    
    # Composite Weighted Score
    total_risk_score = round(
        0.40 * exp_subscore +
        0.25 * smoke_subscore +
        0.20 * spiro_subscore +
        0.15 * age_subscore,
        1
    )
    
    if total_risk_score >= 75.0:
        risk_category = "CRITICAL_SURVEILLANCE"
        recommendation = "Quarterly spirometry review and prioritized shift rotation to non-sour units."
        recommendation_hi = "त्रैमासिक स्पायरोमेट्री समीक्षा और गैर-सॉर इकाइयों में प्राथमिकता से रोटेशन।"
    elif total_risk_score >= 50.0:
        risk_category = "MODERATE_ELEVATED_RISK"
        recommendation = "Biannual respiratory check-up, strict PPE compliance, and smoking cessation counseling."
        recommendation_hi = "अर्धवार्षिक श्वसन जांच, सख्त पीपीई अनुपालन और धूम्रपान बंद करने की सलाह।"
    elif total_risk_score >= 25.0:
        risk_category = "MILD_RISK"
        recommendation = "Annual DGMS PME medical surveillance and standard cartridge hygiene."
        recommendation_hi = "वार्षिक DGMS PME चिकित्सा निगरानी और मानक कार्ट्रिज स्वच्छता।"
    else:
        risk_category = "LOW_BASELINE_RISK"
        recommendation = "Routine workplace occupational health monitoring."
        recommendation_hi = "नियमित कार्यस्थल व्यावसायिक स्वास्थ्य निगरानी।"

    return {
        "worker_id": worker.worker_id,
        "full_name": worker.full_name,
        "chronic_lung_risk_score": total_risk_score,
        "risk_category": risk_category,
        "breakdown": {
            "exposure_90d_load_ppm_hr": round(load_90d, 2),
            "exposure_subscore": round(exp_subscore, 1),
            "smoking_pack_years": pack_years,
            "smoking_subscore": round(smoke_subscore, 1),
            "fev1_fvc_ratio": fev_ratio,
            "spirometry_subscore": round(spiro_subscore, 1),
            "age_comorbidity_subscore": round(age_subscore, 1)
        },
        "recommendation_en": recommendation,
        "recommendation_hi": recommendation_hi
    }
