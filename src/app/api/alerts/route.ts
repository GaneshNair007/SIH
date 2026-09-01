import { NextResponse } from 'next/server';
import { z } from 'zod';
import { dataService } from '@/lib/dataService';

const ackSchema = z.object({
  alert_id: z.string(),
  acknowledged_by: z.string().optional(),
  action_notes: z.string().optional(),
});

export async function GET() {
  try {
    const alerts = await dataService.getAlerts();
    return NextResponse.json(alerts, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve alerts';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const json = await request.json();
    const parsed = ackSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid alert acknowledgment payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const updated = await dataService.acknowledgeAlert(
      parsed.data.alert_id,
      parsed.data.acknowledged_by || 'u-manager-01',
      parsed.data.action_notes
    );

    return NextResponse.json({ success: true, alert: updated }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to acknowledge alert';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
