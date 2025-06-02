import { db } from "./index.ts";

export async function initializeDatabase() {
  try {
    // Create MPs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS mps (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        postCode VARCHAR(20) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        nextOfKin VARCHAR(255) NOT NULL,
        dbsNumber VARCHAR(255),
        dbsExpiry DATE NOT NULL,
        age INTEGER,
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
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        age INTEGER,
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
        id VARCHAR(255) PRIMARY KEY,
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
        age INTEGER,
        hasMp BOOLEAN DEFAULT FALSE,
        hasAttendanceAllowance BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create MP Logs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS mpLogs (
        id VARCHAR(255) PRIMARY KEY,
        date DATE NOT NULL,
        clientId VARCHAR(255) NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        mpId VARCHAR(255) NOT NULL REFERENCES mps(id) ON DELETE CASCADE,
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
        id VARCHAR(255) PRIMARY KEY,
        date DATE NOT NULL,
        clientId VARCHAR(255) NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        volunteerId VARCHAR(255) NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
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
        id VARCHAR(255) PRIMARY KEY,
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
        id VARCHAR(255) PRIMARY KEY,
        clientId VARCHAR(255) NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
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
      "CREATE INDEX IF NOT EXISTS idx_mp_logs_mp_id ON mp_logs(mpId)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_mp_logs_client_id ON mp_logs(clientId)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_volunteer_logs_volunteer_id ON volunteer_logs(volunteerId)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_volunteer_logs_client_id ON volunteer_logs(clientId)"
    );
    await db.query(
      "CREATE INDEX IF NOT EXISTS idx_client_requests_client_id ON client_requests(clientId)"
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
