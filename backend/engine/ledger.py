from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.database.models import WorkerModel, ExposureLedgerModel, ShiftScanModel

def update_worker_exposure_ledger(
    db: Session,
    worker_id: str,
    new_shift_dose_low: float,
    new_shift_dose_high: float,
    scan_timestamp: datetime = None
) -> Dict[str, Any]:
    """
    Recalculates rolling 7-day, 30-day, and 90-day cumulative H2S exposure load ranges
    based on past shift logs for this worker.
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
    
    # Query all past scans
    past_scans = (
        db.query(ShiftScanModel)
        .filter(ShiftScanModel.worker_id == worker_id)
        .all()
    )
    
    load_7d_low = new_shift_dose_low
    load_7d_high = new_shift_dose_high
    load_30d = (new_shift_dose_low + new_shift_dose_high) / 2.0
    load_90d = (new_shift_dose_low + new_shift_dose_high) / 2.0
    
    for scan in past_scans:
        s_ts = _ensure_utc(scan.timestamp)
        # Use stored compensated dose as nominal
        d_nom = scan.compensated_dose_ppm_hr
        if s_ts >= cutoff_7d:
            load_7d_low += d_nom * 0.90
            load_7d_high += d_nom * 1.10
        if s_ts >= cutoff_30d:
            load_30d += d_nom
        if s_ts >= cutoff_90d:
            load_90d += d_nom
            
    load_7d_low = round(load_7d_low, 1)
    load_7d_high = round(load_7d_high, 1)
    range_7d_str = f"{load_7d_low:.1f}–{load_7d_high:.1f} ppm·h"
    
    # Update or create ledger record
    ledger = db.query(ExposureLedgerModel).filter(ExposureLedgerModel.worker_id == worker_id).first()
    if not ledger:
        ledger = ExposureLedgerModel(
            worker_id=worker_id,
            rolling_7day_ppm_hr=load_7d_high,
            rolling_30day_ppm_hr=round(load_30d, 1),
            rolling_90day_ppm_hr=round(load_90d, 1),
            lifetime_shifts_logged=1,
            last_updated=scan_timestamp
        )
        db.add(ledger)
    else:
        ledger.rolling_7day_ppm_hr = load_7d_high
        ledger.rolling_30day_ppm_hr = round(load_30d, 1)
        ledger.rolling_90day_ppm_hr = round(load_90d, 1)
        ledger.lifetime_shifts_logged += 1
        ledger.last_updated = scan_timestamp
        
    db.commit()
    db.refresh(ledger)
    
    return {
        "load_7d_low": load_7d_low,
        "load_7d_high": load_7d_high,
        "range_7d_str": range_7d_str,
        "rolling_30day_ppm_hr": round(load_30d, 1),
        "rolling_90day_ppm_hr": round(load_90d, 1),
        "lifetime_shifts_logged": ledger.lifetime_shifts_logged
    }
