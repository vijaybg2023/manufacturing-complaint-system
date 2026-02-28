require('dotenv').config();
const { pool } = require('./pool');

const schema = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'operator' CHECK (role IN ('admin','quality_engineer','operator','viewer')),
  firebase_uid VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  customer_name VARCHAR(255),
  customer_part_number VARCHAR(100),
  internal_part_number VARCHAR(100),
  complaint_date DATE NOT NULL DEFAULT CURRENT_DATE,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open','in_progress','pending_approval','closed','rejected')),
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('critical','high','medium','low')),
  complaint_type VARCHAR(50) CHECK (complaint_type IN ('customer','internal','supplier','audit')),
  defect_category VARCHAR(100),
  defect_quantity INTEGER,
  total_quantity INTEGER,
  production_date DATE,
  lot_number VARCHAR(100),
  created_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eight_d_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  d1_team_members TEXT,
  d2_problem_description TEXT,
  d3_containment_actions TEXT,
  d3_containment_date DATE,
  d4_root_cause TEXT,
  d4_ishikawa_data JSONB,
  d5_corrective_actions TEXT,
  d6_implementation_date DATE,
  d6_effectiveness_evidence TEXT,
  d7_preventive_actions TEXT,
  d7_documents_updated TEXT,
  d8_team_recognition TEXT,
  d8_closure_date DATE,
  status VARCHAR(30) DEFAULT 'd1' CHECK (status IN ('d1','d2','d3','d4','d5','d6','d7','d8','closed')),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS corrective_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  eight_d_id UUID REFERENCES eight_d_reports(id),
  action_type VARCHAR(30) CHECK (action_type IN ('containment','corrective','preventive')),
  description TEXT NOT NULL,
  responsible_person UUID REFERENCES users(id),
  target_date DATE,
  completion_date DATE,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','in_progress','completed','verified','overdue')),
  effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),
  verification_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  filename VARCHAR(500) NOT NULL,
  original_name VARCHAR(500),
  gcs_path VARCHAR(1000),
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name VARCHAR(100),
  record_id UUID,
  action VARCHAR(20) CHECK (action IN ('INSERT','UPDATE','DELETE')),
  changed_by UUID REFERENCES users(id),
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to ON complaints(assigned_to);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_complaint ON corrective_actions(complaint_id);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(schema);
    console.log('Migration completed successfully');
    // Insert default admin sequence for complaint numbers
    await client.query(`
      CREATE SEQUENCE IF NOT EXISTS complaint_seq START 1000;
    `);
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
