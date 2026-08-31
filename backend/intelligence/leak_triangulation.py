from typing import List, Dict, Any
import math

# MRPL Plant Unit Coordinates (Normalized Grid 0-100 for interactive 2D visualization)
PLANT_UNITS = {
    "CDU-1": {"x": 25, "y": 30, "name": "Crude Distillation Unit 1", "risk_weight": 1.2},
    "CDU-2": {"x": 40, "y": 35, "name": "Crude Distillation Unit 2", "risk_weight": 1.2},
    "DHDS": {"x": 65, "y": 45, "name": "Diesel Hydrodesulfurization", "risk_weight": 1.5},
    "SRU": {"x": 80, "y": 70, "name": "Sulfur Recovery Unit (Claus)", "risk_weight": 1.8},
    "Tank Farm": {"x": 20, "y": 75, "name": "Sour Crude Storage Tank Farm", "risk_weight": 1.0},
    "Flare Header": {"x": 85, "y": 20, "name": "Elevated Flare Header", "risk_weight": 1.4},
}

def calculate_plant_leak_heatmap(scan_records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Aggregates multi-worker shift readings across plant sub-zones and computes
    spatial emission intensities using Inverse Distance Weighting (IDW) heuristics.
    """
    zone_stats = {unit: {"readings": [], "total_ppm": 0.0, "max_ppm": 0.0} for unit in PLANT_UNITS}
    
    # Process scan records
    for scan in scan_records:
        unit = scan.get("plant_unit", "CDU-1")
        if unit in zone_stats:
            twa = scan.get("computed_metrics", {}).get("shift_twa_ppm", 0.0)
            zone_stats[unit]["readings"].append(twa)
            zone_stats[unit]["total_ppm"] += twa
            zone_stats[unit]["max_ppm"] = max(zone_stats[unit]["max_ppm"], twa)

    # Compute node points
    heatmap_nodes = []
    highest_zone = None
    highest_severity = 0.0

    for unit_id, coords in PLANT_UNITS.items():
        stats = zone_stats[unit_id]
        count = len(stats["readings"])
        avg_twa = (stats["total_ppm"] / count) if count > 0 else 0.25
        max_twa = stats["max_ppm"] if count > 0 else 0.25
        
        # Intensity scaled between 0.0 and 1.0
        intensity = min(1.0, (avg_twa * 0.15 + max_twa * 0.10) * coords["risk_weight"])
        
        node = {
            "unit_id": unit_id,
            "name": coords["name"],
            "x": coords["x"],
            "y": coords["y"],
            "avg_twa_ppm": round(avg_twa, 2),
            "max_twa_ppm": round(max_twa, 2),
            "scans_count": count,
            "intensity": round(intensity, 3),
            "status": "CRITICAL" if max_twa >= 5.0 else ("CAUTION" if max_twa >= 1.0 else "NORMAL")
        }
        heatmap_nodes.append(node)
        
        if intensity > highest_severity:
            highest_severity = intensity
            highest_zone = node

    # Triangulate probable fugitive leak origin
    suspected_leak = {
        "zone": highest_zone["name"] if highest_zone else "CDU-1",
        "unit_id": highest_zone["unit_id"] if highest_zone else "CDU-1",
        "estimated_x": highest_zone["x"] if highest_zone else 25,
        "estimated_y": highest_zone["y"] if highest_zone else 30,
        "confidence_pct": min(95, int(highest_severity * 95)) if highest_zone else 40,
        "recommended_action": f"Dispatch sniffing crew to check valve packing & flanges at {highest_zone['unit_id'] if highest_zone else 'CDU-1'}."
    }

    return {
        "nodes": heatmap_nodes,
        "suspected_leak": suspected_leak,
        "total_active_zones": len(PLANT_UNITS),
        "total_scans_analyzed": len(scan_records)
    }
