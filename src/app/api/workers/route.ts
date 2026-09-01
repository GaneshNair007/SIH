import { NextResponse } from 'next/server';
import { z } from 'zod';
import { dataService } from '@/lib/dataService';

const workerInsertSchema = z.object({
  worker_code: z.string().min(2, 'Worker code must be at least 2 characters'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  employee_hr_id: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  department: z.string().optional(),
  designation: z.string().optional(),
  plant_id: z.string().optional(),
  default_region_id: z.string().optional(),
  default_work_area_id: z.string().optional(),
  company_id: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';

    let workers = await dataService.getWorkers();

    if (search) {
      workers = workers.filter((w) =>
        w.full_name.toLowerCase().includes(search) ||
        w.worker_code.toLowerCase().includes(search) ||
        (w.department && w.department.toLowerCase().includes(search))
      );
    }

    return NextResponse.json(workers, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve workers';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = workerInsertSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const newWorker = await dataService.registerWorker({
      ...parsed.data,
      company_id: parsed.data.company_id || 'c-apex-01',
    });

    return NextResponse.json({ success: true, worker: newWorker }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to register worker';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
