import re
from typing import List, Tuple
from backend.schemas.advisory import DosimeterAdvisoryPayload

# Disallowed clinical terms / prescription patterns
DISALLOWED_CLINICAL_PATTERNS = [
    r'\b(?:mg|milligram|mcg|ml)\b',
    r'\b(?:prescribe|prescription|rx|take\s+\d+\s+tablets?)\b',
    r'\b(?:salbutamol|albuterol|prednisone|dexamethasone|antibiotic|bronchodilator)\b',
    r'\b(?:diagnosed\s+with|confirmed\s+diagnosis|pathology|prognosis)\b',
    r'\b(?:inject|iv\s+drip|intubation)\b'
]

def check_clinical_scope_violations(text: str) -> List[str]:
    """
    Returns any prohibited medical diagnostic or prescription patterns detected.
    """
    violations = []
    for pattern in DISALLOWED_CLINICAL_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            violations.append(match.group(0))
    return violations

def sanitize_advisory_payload(advisory: DosimeterAdvisoryPayload) -> Tuple[DosimeterAdvisoryPayload, bool]:
    """
    Verifies that advisory text contains only first-aid, PPE, operational, and triage language.
    Cleanses or flags any unauthorized clinical claims.
    """
    sanitized = False
    
    # Check summary banner
    banner_violations = check_clinical_scope_violations(advisory.summary_banner)
    if banner_violations:
        advisory.summary_banner = "Shift dosimeter reading analyzed. Follow standard occupational hygiene guidance below."
        sanitized = True
        
    # Check recommendations
    for rec in advisory.recommendations:
        violations = check_clinical_scope_violations(rec.action_item)
        if violations:
            rec.action_item = "Refer to Occupational Health Centre (OHC) for clinical assessment and guidance."
            sanitized = True
            
    return advisory, sanitized
