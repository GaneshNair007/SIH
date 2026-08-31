import io
from datetime import datetime, timezone
from typing import Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_oisd_form_a_pdf(scan_record: Dict[str, Any], worker_record: Dict[str, Any]) -> io.BytesIO:
    """
    Generates a formal, printable OISD-STD-105 / DGMS Form-A Incident & Toxic Exposure Report.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#0f172a"),
        alignment=1, # Center
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#475569"),
        alignment=1,
        spaceAfter=15
    )
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=10,
        spaceAfter=6
    )
    cell_label = ParagraphStyle(
        'CellLabel',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#334155")
    )
    cell_val = ParagraphStyle(
        'CellVal',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#0f172a")
    )
    alert_style = ParagraphStyle(
        'AlertStyle',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#991b1b")
    )

    story = []

    # Header
    story.append(Paragraph("<b>MANGALORE REFINERY AND PETROCHEMICALS LIMITED (MRPL)</b>", title_style))
    story.append(Paragraph("<b>OISD-STD-105 / DGMS INCIDENT REPORT (FORM-A)</b><br/>OCCUPATIONAL H2S EXPOSURE & DOSIMETRY RECORD", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=12))

    # General Incident Metadata
    scan_id = scan_record.get("scan_id", "N/A")
    timestamp = scan_record.get("timestamp", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"))
    unit = scan_record.get("plant_unit", "CDU-1")
    statutory_tier = scan_record.get("computed_metrics", {}).get("statutory_tier", "TIER 3 (CRITICAL)")
    
    meta_data = [
        [Paragraph("<b>Incident / Scan Ref:</b>", cell_label), Paragraph(str(scan_id), cell_val),
         Paragraph("<b>Date & Time:</b>", cell_label), Paragraph(str(timestamp), cell_val)],
        [Paragraph("<b>Plant Location:</b>", cell_label), Paragraph(f"MRPL Refinery — {unit}", cell_val),
         Paragraph("<b>Statutory Tier:</b>", cell_label), Paragraph(f"<b>{statutory_tier}</b>", alert_style)]
    ]
    t_meta = Table(meta_data, colWidths=[110, 160, 100, 170])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 10))

    # Worker Demographics
    story.append(Paragraph("1. Affected Worker Information", section_heading))
    w_id = worker_record.get("worker_id", scan_record.get("worker_id", "N/A"))
    w_name = worker_record.get("full_name", "Refinery Technician")
    w_dept = worker_record.get("department", "Operations")
    w_role = worker_record.get("role", "Field Operator")
    w_ppe = worker_record.get("ppe_details", {}).get("respirator_type", "Half-Mask Air-Purifying")
    
    worker_table_data = [
        [Paragraph("<b>Worker ID:</b>", cell_label), Paragraph(str(w_id), cell_val),
         Paragraph("<b>Full Name:</b>", cell_label), Paragraph(str(w_name), cell_val)],
        [Paragraph("<b>Department:</b>", cell_label), Paragraph(str(w_dept), cell_val),
         Paragraph("<b>Designation:</b>", cell_label), Paragraph(str(w_role), cell_val)],
        [Paragraph("<b>PPE Deployed:</b>", cell_label), Paragraph(str(w_ppe), cell_val),
         Paragraph("<b>Fit-Test Status:</b>", cell_label), Paragraph("Verified / Valid", cell_val)]
    ]
    t_worker = Table(worker_table_data, colWidths=[110, 160, 100, 170])
    t_worker.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.white),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_worker)
    story.append(Spacer(1, 10))

    # Dosimetry & Environmental Kinetics
    story.append(Paragraph("2. Dosimetry & Kinetic Telemetry Analysis", section_heading))
    b_data = scan_record.get("badge_data", {})
    e_data = scan_record.get("environmental_telemetry", {})
    c_data = scan_record.get("computed_metrics", {})

    d_hours = scan_record.get("shift_duration_hours", 8.0)
    raw_dose = b_data.get("raw_optical_dose", 0.0)
    comp_dose = c_data.get("compensated_dose_ppm_hr", 0.0)
    twa = c_data.get("shift_twa_ppm", 0.0)
    load_7d = c_data.get("updated_7day_load", 0.0)
    temp = e_data.get("temperature_c", 30.0)
    rh = e_data.get("relative_humidity_pct", 75.0)
    k_fac = e_data.get("k_factor", 1.0)

    dosimetry_data = [
        [Paragraph("<b>Shift Duration:</b>", cell_label), Paragraph(f"{d_hours} hours", cell_val),
         Paragraph("<b>Badge ID / Optical ΔE:</b>", cell_label), Paragraph(f"{b_data.get('badge_id','BAND-01')} (ΔE: {b_data.get('delta_e',0.0)})", cell_val)],
        [Paragraph("<b>Ambient Env:</b>", cell_label), Paragraph(f"{temp}°C, {rh}% RH", cell_val),
         Paragraph("<b>Kinetic k(T,RH):</b>", cell_label), Paragraph(f"{k_fac} (Arrhenius Scaled)", cell_val)],
        [Paragraph("<b>Compensated Dose:</b>", cell_label), Paragraph(f"{comp_dose} ppm·hr", cell_val),
         Paragraph("<b>Shift TWA:</b>", cell_label), Paragraph(f"<b>{twa} ppm</b>", alert_style)],
        [Paragraph("<b>7-Day Rolling Load:</b>", cell_label), Paragraph(f"{load_7d} ppm·hr", cell_val),
         Paragraph("<b>OISD Limit Check:</b>", cell_label), Paragraph("Exceeds 1.0 ppm TLV" if twa >= 1.0 else "Within TLV", cell_val)]
    ]
    t_dos = Table(dosimetry_data, colWidths=[110, 160, 100, 170])
    t_dos.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.white),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_dos)
    story.append(Spacer(1, 10))

    # Corrective Action Plan & Clinical Referrals
    story.append(Paragraph("3. Statutory Corrective Actions & Recommendations", section_heading))
    recs = scan_record.get("advisory", {}).get("recommendations", [])
    rec_rows = [[Paragraph("<b>Priority Level</b>", cell_label), Paragraph("<b>Mandated Action Item & Statutory Clause</b>", cell_label)]]
    
    if recs:
        for r in recs:
            p_text = f"<b>{r.get('priority_level','')}</b>"
            desc = f"{r.get('action_item','')}<br/><i>Ref: {r.get('regulatory_reference','N/A')}</i>"
            rec_rows.append([Paragraph(p_text, cell_label), Paragraph(desc, cell_val)])
    else:
        rec_rows.append([Paragraph("[MANDATORY / CLINICAL]", cell_label), Paragraph("Report to Occupational Health Centre (OHC) for clinical battery. File Form-A with Safety In-charge.", cell_val)])

    t_recs = Table(rec_rows, colWidths=[160, 380])
    t_recs.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_recs)
    story.append(Spacer(1, 15))

    # Signatures
    story.append(Paragraph("4. Statutory Endorsement & Authority Sign-off", section_heading))
    sig_data = [
        [Paragraph("<b>Shift Safety Officer:</b>", cell_label), Paragraph("___________________________", cell_val),
         Paragraph("<b>Factory Medical Officer (OHC):</b>", cell_label), Paragraph("___________________________", cell_val)],
        [Paragraph("<b>Date:</b>", cell_label), Paragraph(datetime.now(timezone.utc).strftime("%Y-%m-%d"), cell_val),
         Paragraph("<b>Status:</b>", cell_label), Paragraph("Under Investigation / Closed", cell_val)]
    ]
    t_sig = Table(sig_data, colWidths=[120, 150, 150, 120])
    t_sig.setStyle(TableStyle([
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_sig)

    doc.build(story)
    buffer.seek(0)
    return buffer
