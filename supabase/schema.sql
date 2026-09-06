-- ==============================================================================
-- BusStop Alert - Supabase Database Schema
-- Run this in your Supabase SQL Editor to provision all tables, indexes & policies
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Bus Routes Table
CREATE TABLE IF NOT EXISTS bus_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_number VARCHAR(30) NOT NULL UNIQUE,
    route_name VARCHAR(150) NOT NULL,
    description TEXT,
    color_hex VARCHAR(10) DEFAULT '#10b981',
    origin VARCHAR(120) NOT NULL,
    destination VARCHAR(120) NOT NULL,
    operating_hours VARCHAR(100),
    frequency_mins INT DEFAULT 15,
    total_distance_km NUMERIC(5,2) DEFAULT 0.0,
    polyline JSONB, -- Array of [lat, lng] coordinates
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bus Stops Table
CREATE TABLE IF NOT EXISTS bus_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    code VARCHAR(30) NOT NULL UNIQUE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    landmark VARCHAR(200),
    zone VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Route Stops Junction Table (Many-to-Many with Ordering)
CREATE TABLE IF NOT EXISTS route_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES bus_routes(id) ON DELETE CASCADE,
    stop_id UUID NOT NULL REFERENCES bus_stops(id) ON DELETE CASCADE,
    stop_order INT NOT NULL,
    distance_from_start_km NUMERIC(5,2) DEFAULT 0.0,
    avg_time_mins INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_route_stop_order UNIQUE (route_id, stop_order),
    CONSTRAINT unique_route_stop_pair UNIQUE (route_id, stop_id)
);

-- 4. Journeys Table (User active/completed trips)
CREATE TABLE IF NOT EXISTS journeys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- Optional Supabase auth user id or client session
    route_id UUID NOT NULL REFERENCES bus_routes(id) ON DELETE CASCADE,
    destination_stop_id UUID NOT NULL REFERENCES bus_stops(id) ON DELETE CASCADE,
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'approaching', 'arrived', 'cancelled')),
    alert_radius_meters INT DEFAULT 300,
    alert_triggered BOOLEAN DEFAULT FALSE,
    start_latitude DOUBLE PRECISION,
    start_longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 5. Favourite Routes Table
CREATE TABLE IF NOT EXISTS favourite_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- Optional user ID or anonymous device uuid
    route_id UUID NOT NULL REFERENCES bus_routes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_favourite UNIQUE (user_id, route_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_route_stops_route_id ON route_stops(route_id, stop_order);
CREATE INDEX IF NOT EXISTS idx_bus_stops_coords ON bus_stops(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_journeys_user ON journeys(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journeys_active ON journeys(status) WHERE status = 'active';

-- Enable Row Level Security (RLS)
ALTER TABLE bus_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE favourite_routes ENABLE ROW LEVEL SECURITY;

-- Public Read Policies for Transit Info
CREATE POLICY "Allow public read access to bus_routes" ON bus_routes FOR SELECT USING (true);
CREATE POLICY "Allow public read access to bus_stops" ON bus_stops FOR SELECT USING (true);
CREATE POLICY "Allow public read access to route_stops" ON route_stops FOR SELECT USING (true);

-- Journeys & Favourites Policies
CREATE POLICY "Allow anonymous journey inserts" ON journeys FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow journey updates" ON journeys FOR UPDATE USING (true);
CREATE POLICY "Allow public read of journeys" ON journeys FOR SELECT USING (true);
CREATE POLICY "Allow favourite routes management" ON favourite_routes FOR ALL USING (true);
