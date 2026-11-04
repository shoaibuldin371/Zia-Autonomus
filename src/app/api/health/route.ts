import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const isProduction = process.env.NODE_ENV === 'production';
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasSupabaseKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dbConnected = hasSupabaseUrl && hasSupabaseKey;

  // In production, mode must be supabase_postgresql and connected must be true
  const dbMode = isProduction
    ? (dbConnected ? 'supabase_postgresql' : 'disconnected')
    : (dbConnected ? 'supabase_postgresql' : 'in_memory_dev');

  const emergencyStop = process.env.EMERGENCY_STOP === 'true';

  // Last run simulation / timestamp tracking
  const now = new Date();
  const lastRunAt = null; // Will read from DB checkpoints once DB is initialized
  const hoursSinceLastRun = null;
  const overdueAlert = false;

  const healthData = {
    status: dbConnected || !isProduction ? 'healthy' : 'degraded',
    version: '2.0.0',
    timestamp: now.toISOString(),
    database: {
      mode: dbMode,
      connected: dbConnected,
    },
    scheduler: {
      lastRunAt,
      hoursSinceLastRun,
      overdueAlert,
    },
    safety: {
      emergencyStopActive: emergencyStop,
      operatorEmail: 'ziauldin371@gmail.com',
      timezone: 'Asia/Karachi',
    },
  };

  return NextResponse.json(healthData, {
    status: healthData.status === 'healthy' ? 200 : 503,
  });
}
