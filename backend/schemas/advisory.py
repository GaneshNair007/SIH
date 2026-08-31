from typing import List, Optional, Literal
from pydantic import BaseModel, Field

PriorityTag = Literal[
    "[LOW / SELF-CARE]",
    "[RECOMMENDED / OPERATIONAL]",
    "[MANDATORY / CLINICAL]"
]

class RecommendationItem(BaseModel):
    priority_level: PriorityTag = Field(
        ..., description="Must be one of '[LOW / SELF-CARE]', '[RECOMMENDED / OPERATIONAL]', '[MANDATORY / CLINICAL]'"
    )
    category: str = Field(
        ..., description="Category: First-Aid, PPE, Operational, Medical-Triage, Statutory-Compliance, Badge-Integrity"
    )
    action_item: str = Field(
        ..., description="Specific, concise instruction (e.g. 'Flush eyes with saline for 15 minutes', 'Replace particulate cartridge')"
    )
    action_item_hi: Optional[str] = Field(
        default=None, description="Hindi translation of the action item in Devanagari"
    )
    regulatory_reference: Optional[str] = Field(
        default=None, description="Citation: OISD-STD-105 Cl. 4.2, DGMS Circular 04/2021, ACGIH TLV-TWA 1ppm, etc."
    )

class BilingualContent(BaseModel):
    summary_banner_hi: str = Field(..., description="Hindi translation of summary banner in Devanagari")
    triage_question_hi: str = Field(..., description="Hindi translation of symptom triage check")
    supervisor_actions_hi: List[str] = Field(default_factory=list, description="Hindi supervisor actions")
    badge_integrity_notice_hi: Optional[str] = Field(default=None, description="Hindi translation of badge integrity check")

class DosimeterAdvisoryPayload(BaseModel):
    summary_banner: str = Field(
        ..., description="Empathetic, clear, plain-language status banner displaying uncertainty ranges (no fake precision)"
    )
    worker_id: str = Field(..., description="Target employee ID")
    
    # Dose Uncertainty Ranges (No single-number fake precision)
    shift_dose_range: str = Field(..., description="Estimated shift dose range, e.g., '12.1–14.8 ppm·h'")
    shift_twa_range: str = Field(..., description="Estimated shift TWA range, e.g., '1.5–1.9 ppm'")
    rolling_7day_range: str = Field(..., description="Estimated 7-day cumulative load range, e.g., '24.5–28.2 ppm·h'")
    
    severity_tier: Literal["TIER 1 (NORMAL)", "TIER 2 (CAUTION)", "TIER 3 (CRITICAL)"] = Field(
        ..., description="Statutory risk tier determined deterministically"
    )
    measurement_confidence: Literal["HIGH", "MEDIUM", "LOW", "INVALID"] = Field(
        default="HIGH", description="Confidence level derived from Patch B drift and Patch C state"
    )
    badge_integrity_notice: Optional[str] = Field(
        default=None, description="Notice if Patch B drift or Patch C chemical integrity warning is flagged"
    )
    
    recommendations: List[RecommendationItem] = Field(
        ..., description="Strictly ascending list of recommendations: [LOW / SELF-CARE] -> [RECOMMENDED / OPERATIONAL] -> [MANDATORY / CLINICAL]"
    )
    triage_question: str = Field(
        ..., description="Targeted single-question neuro/ocular/respiratory symptom check"
    )
    supervisor_actions: List[str] = Field(
        ..., description="Engineering, leak isolation, unit tagging, or statutory filing steps for shift supervisor"
    )
    bilingual_content: Optional[BilingualContent] = None
    mandatory_ohc_override_applied: bool = Field(
        default=False, description="True if backend deterministic override locked a mandatory OHC referral"
    )
    rag_retrieval_mode: str = Field(
        default="HYBRID_RAG", description="HYBRID_RAG or STATIC_PROTOCOL_FALLBACK"
    )
