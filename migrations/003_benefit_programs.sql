CREATE TABLE IF NOT EXISTS rudhira.benefit_programs (
 reward_id text PRIMARY KEY CHECK(reward_id IN ('basic-health-panel','comprehensive-health-panel','plasma-health-program')),
 enabled boolean NOT NULL DEFAULT false, provider text NOT NULL,
 details text NOT NULL, updated_by text NOT NULL, updated_at timestamptz DEFAULT now()
);
ALTER TABLE rudhira.benefit_programs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON rudhira.benefit_programs FROM PUBLIC;
