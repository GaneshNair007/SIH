from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.database.models import WorkerModel, ExposureLedgerModel, ShiftScanModel

def update_worker_exposure_ledger(
    db: Session,
    worker_id: str,
    new_scan_compensated_dose: float,
    scan_timestamp: datetime = None
) -> Dict[str, float]:
    """
    Recalculates rolling 7-day, 30-day, and 90-day cumulative H2S exposure load (ppm·hr)
    based on past scan logs for this worker.
    """
    def _ensure_utc(dt: datetime) -> datetime:
        if dt is None:
            return datetime.now(timezone.utc)
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt

    scan_timestamp = _ensure_utc(scan_timestamp)
    cutoff_7d = scan_timestamp - timedelta(days=7)
    cutoff_30d = scan_timestamp - timedelta(days=30)
    cutoff_90d = scan_timestamp - timedelta(days=90)
    
    # Query all scans for worker
    past_scans = (
        db.query(ShiftScanModel)
        .filter(ShiftScanModel.worker_id == worker_id)
        .all()
    )
    
    load_7d = new_scan_compensated_dose
    load_30d = new_scan_compensated_dose
    load_90d = new_scan_compensated_dose
    
    for scan in past_scans:
        s_ts = _ensure_utc(scan.timestamp)
        if s_ts >= cutoff_7d:
            load_7d += scan.compensated_dose_ppm_hr
        if s_ts >= cutoff_30d:
            load_30d += scan.compensated_dose_ppm_hr
        if s_ts >= cutoff_90d:
            load_90d += scan.compensated_dose_ppm_hr
            
    # Update or create ledger record
    ledger = db.query(ExposureLedgerModel).filter(ExposureLedgerModel.worker_id == worker_id).first()
    if not ledger:
        ledger = ExposureLedgerModel(
            worker_id=worker_id,
            rolling_7day_ppm_hr=round(load_7d, 4),
            rolling_30day_ppm_hr=round(load_30d, 4),
            rolling_90day_ppm_hr=round(load_90d, 4),
            lifetime_shifts_logged=1,
            last_updated=scan_timestamp
        )
        db.add(ledger)
    else:
        ledger.rolling_7day_ppm_hr = round(load_7d, 4)
        ledger.rolling_30day_ppm_hr = round(load_30d, 4)
        ledger.rolling_90day_ppm_hr = round(load_90d, 4)
        ledger.lifetime_shifts_logged += 1
        ledger.last_updated = scan_timestamp
        
    db.commit()
    db.refresh(ledger)
    
    return {
        "rolling_7day_ppm_hr": round(load_7d, 4),
        "rolling_30day_ppm_hr": round(load_30d, 4),
        "rolling_90day_ppm_hr": round(load_90d, 4),
        "lifetime_shifts_logged": ledger.lifetime_shifts_logged
    }
