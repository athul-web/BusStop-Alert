import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { MOCK_STOPS } from '@/lib/data/mockTransitData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query')?.toLowerCase().trim();

  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      let req = supabase.from('bus_stops').select('*');
      if (query) {
        req = req.or(`name.ilike.%${query}%,code.ilike.%${query}%,landmark.ilike.%${query}%`);
      }
      const { data, error } = await req.limit(30);
      if (!error && data && data.length > 0) {
        return NextResponse.json({ stops: data, source: 'database' });
      }
    } catch (e) {
      console.warn('Database stops query error:', e);
    }
  }

  let stopList = Object.values(MOCK_STOPS);
  if (query) {
    stopList = stopList.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.code.toLowerCase().includes(query) ||
        (s.landmark && s.landmark.toLowerCase().includes(query))
    );
  }

  return NextResponse.json({ stops: stopList, source: 'local_dataset' });
}
