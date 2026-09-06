import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { MOCK_ROUTES } from '@/lib/data/mockTransitData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query')?.toLowerCase().trim();

  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      let req = supabase.from('bus_routes').select('*, route_stops(*, bus_stops(*))');
      if (query) {
        req = req.or(`route_number.ilike.%${query}%,route_name.ilike.%${query}%,origin.ilike.%${query}%,destination.ilike.%${query}%`);
      }
      const { data, error } = await req;
      if (!error && data && data.length > 0) {
        return NextResponse.json({ routes: data, source: 'database' });
      }
    } catch (e) {
      console.warn('Database query fallback to mock data:', e);
    }
  }

  // Graceful fallback to rich local transit dataset
  let results = MOCK_ROUTES;
  if (query) {
    results = MOCK_ROUTES.filter(
      (r) =>
        r.route_number.toLowerCase().includes(query) ||
        r.route_name.toLowerCase().includes(query) ||
        r.origin.toLowerCase().includes(query) ||
        r.destination.toLowerCase().includes(query) ||
        r.stops?.some((s) => s.stop.name.toLowerCase().includes(query))
    );
  }

  return NextResponse.json({
    routes: results,
    source: 'local_dataset',
    count: results.length,
  });
}
