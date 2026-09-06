import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { route_id, destination_stop_id, alert_radius_meters, start_latitude, start_longitude } = body;

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('journeys')
        .insert([
          {
            route_id,
            destination_stop_id,
            alert_radius_meters: alert_radius_meters || 300,
            start_latitude,
            start_longitude,
            status: 'active',
          },
        ])
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({ journey: data, success: true });
      }
    }

    // Local in-memory ID if Supabase not yet connected
    const fakeId = `journey-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    return NextResponse.json({
      journey: {
        id: fakeId,
        route_id,
        destination_stop_id,
        alert_radius_meters: alert_radius_meters || 300,
        status: 'active',
        created_at: new Date().toISOString(),
      },
      success: true,
      savedToDb: false,
    });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Failed to record journey';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
