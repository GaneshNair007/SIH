import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rgbToLab, calculateDeltaE, deltaEToExposure, evaluateConfidence, getExposureZone } from '@/lib/colorimetry';

const rgbSchema = z.object({
  r: z.number().min(0).max(255),
  g: z.number().min(0).max(255),
  b: z.number().min(0).max(255),
});

const scanPayloadSchema = z.object({
  worker_id: z.string(),
  band_id: z.string().optional(),
  shift_id: z.string().optional(),
  reading_type: z.enum(['START', 'END']),
  patch_a_rgb: rgbSchema,
  patch_b_rgb: rgbSchema,
  patch_c_rgb: rgbSchema,
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = scanPayloadSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid optical scan payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { patch_a_rgb, patch_b_rgb, patch_c_rgb } = parsed.data;

    // Convert to CIE L*a*b*
    const labA = rgbToLab(patch_a_rgb);
    const labB = rgbToLab(patch_b_rgb);
    const labC = rgbToLab(patch_c_rgb);

    // Calculate Delta E colorimetric shift between unexposed baseline (A) and exposed reactive patch (B)
    const deltaE = calculateDeltaE(labA, labB);

    // Convert Delta E to exposure dosage ranges
    const dose = deltaEToExposure(deltaE);

    // Evaluate Patch C (7-day chemical expiry reference shift relative to baseline)
    const deltaEC = calculateDeltaE(labA, labC);
    const isPatchCExpired = deltaEC > 10.0;
    const isSaturated = deltaE >= 38.0;

    // Evaluate confidence based on patch C status and saturation
    const confidence = evaluateConfidence(deltaE, isPatchCExpired ? 'EXPIRED' : 'ACTIVE', isSaturated);
    const zone = getExposureZone(dose.maxPpmH);
    const nominalPpmH = Number(((dose.minPpmH + dose.maxPpmH) / 2).toFixed(2));

    return NextResponse.json(
      {
        success: true,
        delta_e: parseFloat(deltaE.toFixed(2)),
        dose_low_ppm_h: dose.minPpmH,
        dose_high_ppm_h: dose.maxPpmH,
        dose_nominal_ppm_h: nominalPpmH,
        confidence: confidence || dose.confidence,
        saturation_detected: isSaturated,
        zone,
        message: isSaturated
          ? 'Sensor patch saturation detected! Mandatory band retirement triggered.'
          : 'Optical reading processed successfully.',
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Optical calculation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
