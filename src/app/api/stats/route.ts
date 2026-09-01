import { NextResponse } from 'next/server';
import { dataService } from '@/lib/dataService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id') || undefined;

    const stats = await dataService.getManagerStats(companyId);
    return NextResponse.json(stats, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve telemetry stats';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
