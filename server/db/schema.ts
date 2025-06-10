import { db } from "./index.ts";

export async function initializeDatabase() {
  try {
    // Create updated_at trigger function
    await db.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create MPs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS mps (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        post_code VARCHAR(20) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        next_of_kin VARCHAR(255) NOT NULL,
        dbs_number VARCHAR(255),
        dbs_expiry DATE NOT NULL,
        dob DATE,
        services_offered JSONB NOT NULL DEFAULT '{}',
        specialisms JSONB NOT NULL DEFAULT '{}',
        transport BOOLEAN NOT NULL DEFAULT FALSE,
        capacity VARCHAR(255) NOT NULL,
        training_records JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Volunteers table
    await db.query(`
      CREATE TABLE IF NOT EXISTS volunteers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        dob DATE,
        address TEXT NOT NULL,
        post_code VARCHAR(20) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        next_of_kin VARCHAR(255) NOT NULL,
        dbs_number VARCHAR(255),
        dbs_expiry DATE,
        services_offered JSONB NOT NULL DEFAULT '{}',
        need_types JSONB NOT NULL DEFAULT '{}',
        transport BOOLEAN NOT NULL DEFAULT FALSE,
        capacity VARCHAR(255) NOT NULL,
        specialisms JSONB DEFAULT '{}',
        training_records JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Clients table
    await db.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        dob DATE NOT NULL,
        address TEXT NOT NULL,
        post_code VARCHAR(20) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        next_of_kin VARCHAR(255) NOT NULL,
        referred_by VARCHAR(255) NOT NULL,
        client_agreement_date DATE,
        client_agreement_comments TEXT,
        risk_assessment_date DATE,
        risk_assessment_comments TEXT,
        needs JSONB NOT NULL DEFAULT '{}',
        services_provided JSONB NOT NULL DEFAULT '{}',
        has_mp BOOLEAN DEFAULT FALSE,
        has_attendance_allowance BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create MP Logs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS mp_logs (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        mp_id INT NOT NULL REFERENCES mps(id) ON DELETE CASCADE,
        services JSONB NOT NULL DEFAULT '{}',
        hours_logged DECIMAL(5,2) NOT NULL,
        notes TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Volunteer Logs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS volunteer_logs (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        volunteer_id INT NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
        activity VARCHAR(255) NOT NULL,
        hours_logged DECIMAL(5,2) NOT NULL,
        notes TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create MAG Logs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS mag_logs (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        total INT NOT NULL,
        attendees JSONB NOT NULL DEFAULT '{}',
        notes TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Client Requests table
    await db.query(`
      CREATE TABLE IF NOT EXISTS client_requests (
        id SERIAL PRIMARY KEY,
        client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('paid', 'volunteer')),
        start_date DATE NOT NULL,
        schedule VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create triggers for updated_at columns
    await db.query(`
      CREATE TRIGGER trigger_set_updated_at_mps
      BEFORE UPDATE ON mps
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    `);

    await db.query(`
      CREATE TRIGGER trigger_set_updated_at_volunteers
      BEFORE UPDATE ON volunteers
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    `);

    await db.query(`
      CREATE TRIGGER trigger_set_updated_at_clients
      BEFORE UPDATE ON clients
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    `);

    await db.query(`
      CREATE TRIGGER trigger_set_updated_at_mp_logs
      BEFORE UPDATE ON mp_logs
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    `);

    await db.query(`
      CREATE TRIGGER trigger_set_updated_at_volunteer_logs
      BEFORE UPDATE ON volunteer_logs
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    `);

    await db.query(`
      CREATE TRIGGER trigger_set_updated_at_mag_logs
      BEFORE UPDATE ON mag_logs
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    `);

    await db.query(`
      CREATE TRIGGER trigger_set_updated_at_client_requests
      BEFORE UPDATE ON client_requests
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    `);

    // Create indexes for better performance
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_mp_logs_mp_id ON mp_logs(mp_id)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_mp_logs_client_id ON mp_logs(client_id)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_volunteer_logs_volunteer_id ON volunteer_logs(volunteer_id)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_volunteer_logs_client_id ON volunteer_logs(client_id)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_client_requests_client_id ON client_requests(client_id)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_client_requests_status ON client_requests(status)"
    );

    console.log("Database tables initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

export async function dropAllTables() {
  try {
    await db.query("DROP TABLE IF EXISTS mp_logs CASCADE");
    await db.query("DROP TABLE IF EXISTS volunteer_logs CASCADE");
    await db.query("DROP TABLE IF EXISTS client_requests CASCADE");
    await db.query("DROP TABLE IF EXISTS mag_logs CASCADE");
    await db.query("DROP TABLE IF EXISTS mps CASCADE");
    await db.query("DROP TABLE IF EXISTS volunteers CASCADE");
    await db.query("DROP TABLE IF EXISTS clients CASCADE");
    await db.query("DROP FUNCTION IF EXISTS set_updated_at() CASCADE");

    console.log("All database tables dropped successfully");
  } catch (error) {
    console.error("Error dropping database tables:", error);
    throw error;
  }
}
