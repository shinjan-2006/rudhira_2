CREATE SCHEMA IF NOT EXISTS rudhira;
REVOKE ALL ON SCHEMA rudhira FROM PUBLIC;
CREATE TABLE IF NOT EXISTS rudhira.profiles (
 id text PRIMARY KEY,
 role text NOT NULL CHECK(role IN ('donor','hospital','fractionator')),
 name text NOT NULL, email text NOT NULL, city text NOT NULL,
 blood_group text CHECK(blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
 age integer CHECK(age BETWEEN 18 AND 100),
 organization text, license_number text,
 status text NOT NULL CHECK(status IN ('active','pending','approved','rejected','suspended')),
 review_note text, reviewed_by text, reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK((role='donor' AND blood_group IS NOT NULL AND age IS NOT NULL) OR (role<>'donor' AND organization IS NOT NULL AND license_number IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS rudhira.camps (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), hospital_id text NOT NULL REFERENCES rudhira.profiles(id),
 title text NOT NULL, city text NOT NULL, address text NOT NULL,
 starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL, capacity integer NOT NULL CHECK(capacity BETWEEN 1 AND 1000),
 kind text NOT NULL CHECK(kind IN ('blood','plasma','apheresis')), status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','cancelled','completed')),
 created_at timestamptz NOT NULL DEFAULT now(), CHECK(ends_at > starts_at)
);
CREATE TABLE IF NOT EXISTS rudhira.bookings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), donor_id text NOT NULL REFERENCES rudhira.profiles(id), camp_id uuid NOT NULL REFERENCES rudhira.camps(id),
 status text NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','confirmed','cancelled','completed','declined')),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(donor_id,camp_id)
);
CREATE TABLE IF NOT EXISTS rudhira.donations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), booking_id uuid UNIQUE NOT NULL REFERENCES rudhira.bookings(id),
 donor_id text NOT NULL REFERENCES rudhira.profiles(id), hospital_id text NOT NULL REFERENCES rudhira.profiles(id),
 kind text NOT NULL CHECK(kind IN ('blood','plasma','apheresis')),
 donated_at timestamptz NOT NULL, reference text NOT NULL, status text NOT NULL DEFAULT 'verified' CHECK(status IN ('verified','void')),
 verified_at timestamptz NOT NULL DEFAULT now(), UNIQUE(hospital_id,reference)
);
CREATE INDEX IF NOT EXISTS donor_history ON rudhira.donations(donor_id, donated_at DESC);
CREATE TABLE IF NOT EXISTS rudhira.reward_claims (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), donor_id text NOT NULL REFERENCES rudhira.profiles(id),
 reward_id text NOT NULL, year integer NOT NULL, tier_at_claim text NOT NULL,
 status text NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','fulfilled','declined')),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(donor_id,reward_id,year)
);
CREATE TABLE IF NOT EXISTS rudhira.plasma_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), fractionator_id text NOT NULL REFERENCES rudhira.profiles(id),
 title text NOT NULL, city text NOT NULL, litres integer NOT NULL CHECK(litres BETWEEN 1 AND 100000),
 required_by date NOT NULL, requirements text NOT NULL,
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed','cancelled')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rudhira.partner_responses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_id uuid NOT NULL REFERENCES rudhira.plasma_requests(id),
 hospital_id text NOT NULL REFERENCES rudhira.profiles(id), message text NOT NULL,
 status text NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','accepted','declined')),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(request_id,hospital_id)
);
CREATE TABLE IF NOT EXISTS rudhira.audit_log (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, actor_id text NOT NULL,
 action text NOT NULL, resource_id text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rudhira.rate_limits (
 account_id text NOT NULL, bucket bigint NOT NULL, hits integer NOT NULL, PRIMARY KEY(account_id,bucket)
);
ALTER TABLE rudhira.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rudhira.camps ENABLE ROW LEVEL SECURITY;
ALTER TABLE rudhira.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rudhira.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rudhira.reward_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE rudhira.plasma_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rudhira.partner_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rudhira.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE rudhira.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA rudhira FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA rudhira FROM PUBLIC;
