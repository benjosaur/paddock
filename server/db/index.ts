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
    let query = "";
    try {
      query = `SELECT * FROM ${table} WHERE id = $1`;
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("SQL Query Failed in findById:");
      console.error("Table:", table);
      console.error("ID:", id);
      console.error("Query:", query);
      console.error("Error:", error);
      throw error;
    }
  },

  async findAll<T>(table: string): Promise<T[]> {
    let query = "";
    try {
      const query = `SELECT * FROM ${table}`;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error("SQL Query Failed in findAll:");
      console.error("Table:", table);
      console.error("Query:", query);
      console.error("Error:", error);
      throw error;
    }
  },

  async create<T>(table: string, data: Record<string, any>): Promise<T> {
    let query = "";
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);

      const placeholders = keys
        .map((key, i) => {
          const value = data[key];
          if (
            Array.isArray(value) ||
            (typeof value === "object" && value !== null)
          ) {
            return `$${i + 1}::jsonb`;
          }
          return `$${i + 1}`;
        })
        .join(", ");

      const columns = keys.join(", ");

      const processedValues = values.map((value) => {
        if (
          Array.isArray(value) ||
          (typeof value === "object" && value !== null)
        ) {
          return JSON.stringify(value);
        }
        return value;
      });

      query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;
      const result = await pool.query(query, processedValues);
      return result.rows[0];
    } catch (error) {
      console.error("SQL Query Failed in create:");
      console.error("Table:", table);
      console.error("Data:", data);
      console.error("Query:", query);
      console.error("Error:", error);
      throw error;
    }
  },

  async update<T>(
    table: string,
    id: number,
    data: Record<string, any>
  ): Promise<T | null> {
    let query = "";
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);

      const setClause = keys
        .map((key, i) => {
          const value = data[key];
          if (
            Array.isArray(value) ||
            (typeof value === "object" && value !== null)
          ) {
            return `${key} = $${i + 2}::jsonb`;
          }
          return `${key} = $${i + 2}`;
        })
        .join(", ");

      const processedValues = values.map((value) => {
        if (
          Array.isArray(value) ||
          (typeof value === "object" && value !== null)
        ) {
          return JSON.stringify(value);
        }
        return value;
      });

      query = `UPDATE ${table} SET ${setClause} WHERE id = $1 RETURNING *`;
      const result = await pool.query(query, [id, ...processedValues]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("SQL Query Failed in update:");
      console.error("Table:", table);
      console.error("ID:", id);
      console.error("Data:", data);
      console.error("Query:", query);
      console.error("Error:", error);
      throw error;
    }
  },

  async delete(table: string, id: number): Promise<boolean> {
    let query = "";
    try {
      query = `DELETE FROM ${table} WHERE id = $1`;
      const result = await pool.query(query, [id]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("SQL Query Failed in delete:");
      console.error("Table:", table);
      console.error("ID:", id);
      console.error("Query:", query);
      console.error("Error:", error);
      throw error;
    }
  },
};

process.on("exit", () => {
  pool.end();
});
