import { db } from "./index.ts";

export async function initializeDatabase() {
  try {
    // Create MPs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS mps (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        postCode VARCHAR(20) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        nextOfKin VARCHAR(255) NOT NULL,
        dbsNumber VARCHAR(255),
        dbsExpiry DATE NOT NULL,
        dob DATE,
        servicesOffered TEXT[] NOT NULL DEFAULT '{}',
        specialisms TEXT[] NOT NULL DEFAULT '{}',
        transport VARCHAR(255) NOT NULL,
        capacity VARCHAR(255) NOT NULL,
        trainingRecords JSONB NOT NULL DEFAULT '[]',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Volunteers table
    await db.query(`
      CREATE TABLE IF NOT EXISTS volunteers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        dob DATE,
        address TEXT NOT NULL,
        postCode VARCHAR(20) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        nextOfKin VARCHAR(255) NOT NULL,
        dbsNumber VARCHAR(255),
        dbsExpiry DATE,
        servicesOffered TEXT[] NOT NULL DEFAULT '{}',
        needTypes TEXT[] NOT NULL DEFAULT '{}',
        transport VARCHAR(255) NOT NULL,
        capacity VARCHAR(255) NOT NULL,
        specialisms TEXT[] DEFAULT '{}',
        trainingRecords JSONB NOT NULL DEFAULT '[]',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Clients table
    await db.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        dob DATE NOT NULL,
        address TEXT NOT NULL,
        postCode VARCHAR(20) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        nextOfKin VARCHAR(255) NOT NULL,
        referredBy VARCHAR(255) NOT NULL,
        clientAgreementDate DATE,
        clientAgreementComments TEXT,
        riskAssessmentDate DATE,
        riskAssessmentComments TEXT,
        needs TEXT[] NOT NULL DEFAULT '{}',
        servicesProvided TEXT[] NOT NULL DEFAULT '{}',
        hasMp BOOLEAN DEFAULT FALSE,
        hasAttendanceAllowance BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create MP Logs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS mpLogs (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        clientId INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        mpId INT NOT NULL REFERENCES mps(id) ON DELETE CASCADE,
        services TEXT[] NOT NULL DEFAULT '{}',
        hoursLogged DECIMAL(5,2) NOT NULL,
        notes TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Volunteer Logs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS volunteerLogs (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        clientId INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        volunteerId INT NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
        activity VARCHAR(255) NOT NULL,
        hoursLogged DECIMAL(5,2) NOT NULL,
        notes TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create MAG Logs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS magLogs (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        attendees TEXT[] NOT NULL DEFAULT '{}',
        notes TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Client Requests table
    await db.query(`
      CREATE TABLE IF NOT EXISTS clientRequests (
        id SERIAL PRIMARY KEY,
        clientId INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        requestType VARCHAR(20) NOT NULL CHECK (requestType IN ('paid', 'volunteer')),
        startDate DATE NOT NULL,
        schedule VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_mp_logs_mp_id ON mpLogs(mpId)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_mp_logs_client_id ON mpLogs(clientId)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_volunteer_logs_volunteer_id ON volunteerLogs(volunteerId)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_volunteer_logs_client_id ON volunteerLogs(clientId)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_client_requests_client_id ON clientRequests(clientId)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_client_requests_status ON clientRequests(status)"
    );

    console.log("Database tables initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

export async function dropAllTables() {
  try {
    await db.query("DROP TABLE IF EXISTS mpLogs CASCADE");
    await db.query("DROP TABLE IF EXISTS volunteerLogs CASCADE");
    await db.query("DROP TABLE IF EXISTS clientRequests CASCADE");
    await db.query("DROP TABLE IF EXISTS magLogs CASCADE");
    await db.query("DROP TABLE IF EXISTS mps CASCADE");
    await db.query("DROP TABLE IF EXISTS volunteers CASCADE");
    await db.query("DROP TABLE IF EXISTS clients CASCADE");

    console.log("All database tables dropped successfully");
  } catch (error) {
    console.error("Error dropping database tables:", error);
    throw error;
  }
}
