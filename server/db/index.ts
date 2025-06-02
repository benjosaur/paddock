import { Pool } from "pg";

export const pool = new Pool({
  user: process.env.DB_USER || "benjo",
  password: process.env.DB_PASSWORD || "password",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  database: process.env.DB_NAME || "paddock",
});

export const db = {
  query: async (text: string, params?: any[]) => {
    try {
      return await pool.query(text, params);
    } catch (error) {
      console.error("SQL Query Failed:");
      console.error("Query:", text);
      console.error("Params:", params);
      console.error("Error:", error);
      throw error;
    }
  },

  // Helper methods for common operations
  async findById<T>(table: string, id: number): Promise<T | null> {
    try {
      const query = `SELECT * FROM ${table} WHERE id = $1`;
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("SQL Query Failed in findById:");
      console.error("Table:", table);
      console.error("ID:", id);
      console.error("Error:", error);
      throw error;
    }
  },

  async findAll<T>(table: string): Promise<T[]> {
    try {
      const query = `SELECT * FROM ${table}`;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error("SQL Query Failed in findAll:");
      console.error("Table:", table);
      console.error("Error:", error);
      throw error;
    }
  },

  async create<T>(table: string, data: Record<string, any>): Promise<T> {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);

      const placeholders = keys
        .map((key, i) => {
          const value = data[key];
          if (Array.isArray(value)) {
            let arrayType = "TEXT[]";

            if (value.length > 0) {
              const firstElement = value[0];
              const elementType = typeof firstElement;

              switch (elementType) {
                case "string":
                  arrayType = "TEXT[]";
                  break;
                case "number":
                  // Check if it's an integer or float
                  arrayType = Number.isInteger(firstElement)
                    ? "INT[]"
                    : "DOUBLE PRECISION[]";
                  break;
                case "boolean":
                  arrayType = "BOOLEAN[]";
                  break;
                default:
                  arrayType = "TEXT[]"; // fallback for objects, etc.
              }
            }
            return `$${i + 1}::${arrayType}`;
          }
          return `$${i + 1}`;
        })
        .join(", ");

      const columns = keys.join(", ");

      const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("SQL Query Failed in create:");
      console.error("Table:", table);
      console.error("Data:", data);
      console.error("Error:", error);
      throw error;
    }
  },

  async update<T>(
    table: string,
    id: number,
    data: Record<string, any>
  ): Promise<T | null> {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);

      const setClause = keys
        .map((key, i) => {
          const value = data[key];
          if (Array.isArray(value)) {
            let arrayType = "TEXT[]"; // default fallback

            if (value.length > 0) {
              const firstElement = value[0];
              const elementType = typeof firstElement;

              switch (elementType) {
                case "string":
                  arrayType = "TEXT[]";
                  break;
                case "number":
                  // Check if it's an integer or float
                  arrayType = Number.isInteger(firstElement)
                    ? "INT[]"
                    : "DOUBLE PRECISION[]";
                  break;
                case "boolean":
                  arrayType = "BOOLEAN[]";
                  break;
                default:
                  arrayType = "TEXT[]"; // fallback for objects, etc.
              }
            }

            return `${key} = $${i + 2}::${arrayType}`;
          }
          return `${key} = $${i + 2}`;
        })
        .join(", ");

      const query = `UPDATE ${table} SET ${setClause} WHERE id = $1 RETURNING *`;
      const result = await pool.query(query, [id, ...values]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("SQL Query Failed in update:");
      console.error("Table:", table);
      console.error("ID:", id);
      console.error("Data:", data);
      console.error("Error:", error);
      throw error;
    }
  },

  async delete(table: string, id: number): Promise<boolean> {
    try {
      const query = `DELETE FROM ${table} WHERE id = $1`;
      const result = await pool.query(query, [id]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("SQL Query Failed in delete:");
      console.error("Table:", table);
      console.error("ID:", id);
      console.error("Error:", error);
      throw error;
    }
  },
};

process.on("exit", () => {
  pool.end();
});
