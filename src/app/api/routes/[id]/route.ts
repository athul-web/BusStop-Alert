import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { MOCK_ROUTES } from '@/lib/data/mockTransitData';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const routeId = params.id;
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('bus_routes')
        .select(`
          *,
          stops:route_stops (
            id,
            stop_order,
            distance_from_start_km,
            avg_time_mins,
            stop:bus_stops (*)
          )
        `)
        .eq('id', routeId)
        .order('stop_order', { referencedTable: 'route_stops', ascending: true })
        .single();

      if (!error && data) {
        return NextResponse.json({ route: data, source: 'database' });
      }
    } catch (e) {
      console.warn('Database single route query fallback:', e);
    }
  }

  // Fallback to mock transit data by id or route_number
  const found = MOCK_ROUTES.find(
    (r) => r.id === routeId || r.route_number.toLowerCase() === routeId.toLowerCase()
  );

  if (!found) {
    return NextResponse.json({ error: 'Route not found' }, { status: 404 });
  }

  return NextResponse.json({ route: found, source: 'local_dataset' });
}
