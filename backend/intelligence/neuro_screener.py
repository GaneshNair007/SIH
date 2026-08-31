from typing import Dict, Any, List
from pydantic import BaseModel, Field

class NeuroScreeningResponse(BaseModel):
    worker_id: str
    can_smell_rotten_egg: bool = Field(..., description="Did you notice rotten egg smell disappearing while working?")
    eye_stinging_severity: int = Field(..., ge=0, le=3, description="0: None, 1: Mild, 2: Moderate, 3: Severe")
    headache_dizziness: bool = Field(..., description="Experiencing lightheadedness, nausea or frontal headache?")
    reflex_reaction_time_ms: int = Field(default=320, description="Reaction time from simple visual prompt in milliseconds")

def evaluate_neuro_olfactory_screen(response: NeuroScreeningResponse) -> Dict[str, Any]:
    """
    Evaluates worker responses for H2S-induced olfactory nerve fatigue and neurological pre-knockdown symptoms.
    H2S paralyzes olfactory nerves at >= 5 ppm, giving workers a false sense of safety.
    """
    score = 0
    flags: List[str] = []
    
    # Olfactory fatigue indicator (severe risk if gas was present but smell vanished)
    if response.can_smell_rotten_egg:
        score += 35
        flags.append("Olfactory nerve desensitization / rapid fatigue detected (suggests ambient H2S >= 5 ppm).")
        
    # Eye irritation
    if response.eye_stinging_severity == 3:
        score += 30
        flags.append("Severe keratoconjunctival irritation ('gas eye' precursor).")
    elif response.eye_stinging_severity == 2:
        score += 20
        flags.append("Moderate ocular burning.")
    elif response.eye_stinging_severity == 1:
        score += 10
        
    # Neurological symptoms
    if response.headache_dizziness:
        score += 25
        flags.append("CNS manifestation: lightheadedness/headache indicates toxic vapor absorption.")
        
    # Delayed reflex (normal ~ 250-350ms, delayed > 450ms)
    if response.reflex_reaction_time_ms > 480:
        score += 15
        flags.append(f"Impaired psychomotor reflex latency ({response.reflex_reaction_time_ms} ms).")
        
    fatigue_index = min(100, score)
    
    if fatigue_index >= 60:
        status = "HIGH_RISK_FATIGUE"
        directive_en = "🚨 CRITICAL: Severe olfactory fatigue & CNS symptoms. DO NOT return to unit. Report directly to OHC."
        directive_hi = "🚨 गंभीर: गंभीर गंध संवेदनहीनता और तंत्रिका संबंधी लक्षण। प्लांट में वापस न जाएं। तुरंत OHC जाएं।"
    elif fatigue_index >= 30:
        status = "MODERATE_FATIGUE"
        directive_en = "⚠️ CAUTION: Moderate olfactory suppression. Rest in positive-pressure shelter for 30 minutes."
        directive_hi = "⚠️ सावधानी: मध्यम गंध थकान। पॉजिटिव-प्रेशर शेल्टर में 30 मिनट आराम करें।"
    else:
        status = "NORMAL"
        directive_en = "✅ NORMAL: No significant neuro-olfactory fatigue detected."
        directive_hi = "✅ सामान्य: कोई महत्वपूर्ण गंध संवेदनहीनता नहीं पाई गई।"

    return {
        "worker_id": response.worker_id,
        "olfactory_fatigue_index": fatigue_index,
        "screening_status": status,
        "clinical_flags": flags,
        "directive_en": directive_en,
        "directive_hi": directive_hi
    }
