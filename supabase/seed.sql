-- ==============================================================================
-- BusStop Alert - Supabase Seed Data
-- ==============================================================================

-- 1. Insert Bus Stops
INSERT INTO bus_stops (id, name, code, latitude, longitude, landmark, zone) VALUES
('b1010001-0000-0000-0000-000000000001', 'Central Railway Station', 'CRS-01', 9.931233, 76.267304, 'Platform 1 Exit / Main Concourse', 'Zone 1 - Downtown'),
('b1010001-0000-0000-0000-000000000002', 'City Civic Center', 'CCC-02', 9.938741, 76.275812, 'Opposite Municipal Corporation', 'Zone 1 - Downtown'),
('b1010001-0000-0000-0000-000000000003', 'Heritage Museum Circle', 'HMC-03', 9.946124, 76.284195, 'Near National Art Gallery', 'Zone 2 - Cultural District'),
('b1010001-0000-0000-0000-000000000004', 'Tech Hub South', 'THS-04', 9.954891, 76.292102, 'Cyber Tower Gate 2', 'Zone 3 - Tech Corridor'),
('b1010001-0000-0000-0000-000000000005', 'Innovation Park', 'INP-05', 9.963212, 76.301452, 'Silicon Square Overpass', 'Zone 3 - Tech Corridor'),
('b1010001-0000-0000-0000-000000000006', 'University North Campus', 'UNC-06', 9.972105, 76.310541, 'Main Administrative Gate', 'Zone 4 - University Hills')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- 2. Insert Bus Route 101
INSERT INTO bus_routes (id, route_number, route_name, description, color_hex, origin, destination, operating_hours, frequency_mins, total_distance_km, polyline) VALUES
(
    'a1010000-0000-0000-0000-000000000101',
    '101',
    'Metro Circle Express',
    'Direct high-frequency transit connecting Central Railway to University North via Tech Hub',
    '#10b981',
    'Central Railway Station',
    'University North Campus',
    '05:30 AM - 11:30 PM',
    10,
    7.8,
    '[[9.931233, 76.267304], [9.934500, 76.271200], [9.938741, 76.275812], [9.942300, 76.280100], [9.946124, 76.284195], [9.950200, 76.288500], [9.954891, 76.292102], [9.959100, 76.296800], [9.963212, 76.301452], [9.967800, 76.306100], [9.972105, 76.310541]]'::jsonb
)
ON CONFLICT (route_number) DO UPDATE SET route_name = EXCLUDED.route_name, color_hex = EXCLUDED.color_hex;

-- 3. Link Route to Stops
INSERT INTO route_stops (route_id, stop_id, stop_order, distance_from_start_km, avg_time_mins) VALUES
('a1010000-0000-0000-0000-000000000101', 'b1010001-0000-0000-0000-000000000001', 1, 0.0, 0),
('a1010000-0000-0000-0000-000000000101', 'b1010001-0000-0000-0000-000000000002', 2, 1.4, 4),
('a1010000-0000-0000-0000-000000000101', 'b1010001-0000-0000-0000-000000000003', 3, 2.8, 8),
('a1010000-0000-0000-0000-000000000101', 'b1010001-0000-0000-0000-000000000004', 4, 4.3, 13),
('a1010000-0000-0000-0000-000000000101', 'b1010001-0000-0000-0000-000000000005', 5, 6.0, 18),
('a1010000-0000-0000-0000-000000000101', 'b1010001-0000-0000-0000-000000000006', 6, 7.8, 24)
ON CONFLICT (route_id, stop_order) DO NOTHING;
