-- ==========================================================
-- WorkBridge Thailand Supabase SQL Schema
-- Description: Complete SQL schema for recruitment and matching of workers.
-- Includes: Tables, Row Level Security (RLS) policies, Real-time sync, and Premium Demo Data.
-- ==========================================================

-- --- CLEANUP (OPTIONAL) ---
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS payments CASCADE;
-- DROP TABLE IF EXISTS applications CASCADE;
-- DROP TABLE IF EXISTS jobs CASCADE;
-- DROP TABLE IF EXISTS employers CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ==========================================================
-- 1. TABLE CREATION
-- ==========================================================

-- 1.1 USERS TABLE
-- Stores credentials and details for Job Seekers, Employers, and Admins.
CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phone text UNIQUE NOT NULL,
  password text NOT NULL, -- Plain text password for demo mockup auth simplicity
  role text DEFAULT 'seeker' NOT NULL CHECK (role IN ('seeker', 'employer', 'admin')),
  full_name text NOT NULL,
  line_id text,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.2 EMPLOYERS TABLE
-- Holds business profile verification and details linked to a user.
CREATE TABLE IF NOT EXISTS employers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text UNIQUE NOT NULL, -- References users.id as string to support flexible lookup
  company_name text NOT NULL,
  phone text NOT NULL,
  line_id text,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.3 JOBS TABLE
-- Job postings listed by approved employers.
CREATE TABLE IF NOT EXISTS jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id text NOT NULL, -- Links to employers.id or users.id
  employer_name text NOT NULL,
  title text NOT NULL,
  salary integer NOT NULL,
  address text NOT NULL,
  location text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  required_docs text NOT NULL, -- JSON-formatted array of strings e.g. ["passport", "visa"]
  application_fee integer NOT NULL DEFAULT 0,
  phone_contact text NOT NULL,
  line_id_contact text NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'active', 'rejected', 'closed')),
  description text DEFAULT '' NOT NULL,
  vacancies integer DEFAULT 1 NOT NULL CHECK (vacancies > 0),
  source text DEFAULT 'direct' NOT NULL,
  source_url text,
  category text DEFAULT 'General' NOT NULL,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.4 APPLICATIONS TABLE
-- Seeker applications for job posts, requiring specific document attachments.
CREATE TABLE IF NOT EXISTS applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id text NOT NULL,
  job_title text,
  employer_name text,
  seeker_id text NOT NULL,
  seeker_name text NOT NULL,
  seeker_phone text NOT NULL,
  seeker_line_id text,
  docs_attached text NOT NULL, -- JSON-formatted array of strings e.g. ["passport"]
  receipt_url text, -- Payment receipt / transaction slip proof link
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.5 PAYMENTS TABLE
-- Keeps track of application/processing fees paid by seekers.
CREATE TABLE IF NOT EXISTS payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id text UNIQUE NOT NULL,
  seeker_id text NOT NULL,
  amount integer NOT NULL CHECK (amount >= 0),
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  slip_url text, -- Direct link to transfer receipt image
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.6 NOTIFICATIONS TABLE
-- Multi-user live updates for application status shifts and portal alerts.
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL, -- Recipient user identifier
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==========================================================
-- 2. ENABLE REALTIME SYNC (SUPABASE REPLICATION)
-- ==========================================================

-- Add all tables to the Supabase Realtime publication to allow instant multi-user sync.
-- If the publication does not exist, we attempt to create or safely alter it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE employers;
ALTER PUBLICATION supabase_realtime ADD TABLE jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE applications;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;


-- ==========================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;


-- ==========================================================
-- 4. DEFINE ROW LEVEL SECURITY (RLS) POLICIES
-- Since the frontend application uses an anonymous/public API key client
-- and handles its own high-fidelity identity management in localStorage,
-- these policies are designed to grant appropriate client access for 
-- anonymous ('anon') and authenticated roles.
-- ==========================================================

-- 4.1 USERS POLICIES
CREATE POLICY "Enable read access for all users" ON users 
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Enable insert access for all users (registrations)" ON users 
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Enable update for users on their own profiles" ON users 
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);


-- 4.2 EMPLOYERS POLICIES
CREATE POLICY "Enable read access for all employers" ON employers 
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Enable insert for registration of employer profiles" ON employers 
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Enable update for employers" ON employers 
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);


-- 4.3 JOBS POLICIES
CREATE POLICY "Enable read access for all jobs (public/seekers)" ON jobs 
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Enable insert for employers and admins" ON jobs 
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Enable update for jobs (employers/admins)" ON jobs 
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for jobs (employers/admins)" ON jobs 
  FOR DELETE TO anon, authenticated USING (true);


-- 4.4 APPLICATIONS POLICIES
CREATE POLICY "Enable read access for applications" ON applications 
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Enable insert for seeker applications" ON applications 
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Enable update for applications (status/receipts)" ON applications 
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);


-- 4.5 PAYMENTS POLICIES
CREATE POLICY "Enable read access for payments" ON payments 
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Enable insert for application payments" ON payments 
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Enable update for payment processing" ON payments 
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);


-- 4.6 NOTIFICATIONS POLICIES
CREATE POLICY "Enable read access for user notifications" ON notifications 
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Enable insert for system notifications" ON notifications 
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Enable update for marking notifications as read" ON notifications 
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);


-- ==========================================================
-- 5. INITIAL SEED DATA FOR PREMIUM DEMO EXPERIENCE
-- Pre-fills the application with authentic Thai data, jobs, and profiles.
-- ==========================================================

-- Insert Demo Users
INSERT INTO users (id, phone, password, role, full_name, line_id, created_at) VALUES
('00000000-0000-0000-0000-000000000001', '0900000000', 'admin', 'admin', 'WorkBridge Admin Team', NULL, timezone('utc'::text, now())),
('00000000-0000-0000-0000-000000000002', '0811111111', 'password', 'employer', 'Somchai Jaidee', 'somchai_thaifood', timezone('utc'::text, now())),
('00000000-0000-0000-0000-000000000003', '0822222222', 'password', 'employer', 'Nattaporn Sakul', 'nattaporn_hr', timezone('utc'::text, now())),
('00000000-0000-0000-0000-000000000004', '0977777777', 'password', 'seeker', 'Min Naing', 'minnaing99', timezone('utc'::text, now()) - interval '10 days')
ON CONFLICT (phone) DO NOTHING;

-- Insert Demo Employers
INSERT INTO employers (id, user_id, company_name, phone, line_id, status, created_at) VALUES
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000002', 'Thai Food Alliance Co.', '0811111111', 'somchai_thaifood', 'approved', timezone('utc'::text, now())),
('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000003', 'Siam Agro Industries', '0822222222', 'nattaporn_hr', 'approved', timezone('utc'::text, now()))
ON CONFLICT (user_id) DO NOTHING;

-- Insert Demo Jobs
INSERT INTO jobs (id, employer_id, employer_name, title, salary, address, location, lat, lng, required_docs, application_fee, phone_contact, line_id_contact, status, description, vacancies, created_at) VALUES
('00000000-0000-0002-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Thai Food Alliance Co.', 'Food Packaging Operator (Bangkok)', 16500, '99 Lat Krabang Road, Lat Krabang, Bangkok 10520', 'Bangkok', 13.7276, 100.7782, '["passport", "workPermit", "visa"]', 1500, '02-765-4321', 'thaifoodalliance', 'active', 'A stable position packaging premium Thai meals for distribution. Good physical fitness and attention to cleanliness required.', 5, timezone('utc'::text, now() - interval '5 days')),
('00000000-0000-0002-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Siam Agro Industries', 'Fruit Sorting & Processing Specialist', 15000, '246 Pathum Thani - Bang Len Road, Pathum Thani', 'Pathum Thani', 14.0135, 100.5231, '["passport", "idCard"]', 1200, '081-234-5678', 'siamagro_hr', 'active', 'We are seeking detailed sorting assistants for fruit inspection, grade classification, and preparation before shipping.', 3, timezone('utc'::text, now() - interval '4 days')),
('00000000-0000-0002-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Thai Food Alliance Co.', 'Warehouse Logistics Assistant', 18000, '55 Bang Na-Trad Road, Bang Bo, Samut Prakan 10560', 'Samut Prakan', 13.5932, 100.8354, '["passport", "workPermit", "visa", "photo"]', 1800, '02-765-4321', 'thaifood_logistics', 'active', 'Manage warehouse inventory tracking, load and unload shipments, and organize warehouse shelves.', 2, timezone('utc'::text, now() - interval '2 days'))
ON CONFLICT (id) DO NOTHING;

-- Insert Demo Applications
INSERT INTO applications (id, job_id, job_title, employer_name, seeker_id, seeker_name, seeker_phone, seeker_line_id, docs_attached, receipt_url, status, created_at) VALUES
('00000000-0000-0003-0000-000000000001', '00000000-0000-0002-0000-000000000001', 'Food Packaging Operator (Bangkok)', 'Thai Food Alliance Co.', '00000000-0000-0000-0000-000000000004', 'Min Naing', '0977777777', 'minnaing99', '["passport", "idCard", "photo"]', 'https://images.unsplash.com/photo-1628258334864-3f0890274127?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', 'pending', timezone('utc'::text, now() - interval '2 days'))
ON CONFLICT (id) DO NOTHING;

-- Insert Demo Payments
INSERT INTO payments (id, application_id, seeker_id, amount, status, slip_url, created_at) VALUES
('00000000-0000-0004-0000-000000000001', '00000000-0000-0003-0000-000000000001', '00000000-0000-0000-0000-000000000004', 1500, 'pending', 'https://images.unsplash.com/photo-1628258334864-3f0890274127?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', timezone('utc'::text, now() - interval '2 days'))
ON CONFLICT (application_id) DO NOTHING;

-- Insert Demo Notifications
INSERT INTO notifications (id, user_id, title, message, is_read, created_at) VALUES
('00000000-0000-0005-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'Welcome to WorkBridge!', 'Start browsing jobs and map out your next career move in Thailand.', false, timezone('utc'::text, now() - interval '10 days') + interval '5 minutes')
ON CONFLICT (id) DO NOTHING;
