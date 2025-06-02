import { Pool } from "pg";

export const pool = new Pool({
  user: process.env.DB_USER || "benjo",
  password: process.env.DB_PASSWORD || "password",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  database: process.env.DB_NAME || "paddock",
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),

  // Helper methods for common operations
  async findById<T>(table: string, id: string): Promise<T | null> {
    const result = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [
      id,
    ]);
    return result.rows[0] || null;
  },

  async findAll<T>(table: string): Promise<T[]> {
    const result = await pool.query(`SELECT * FROM ${table}`);
    return result.rows;
  },

  async create<T>(table: string, data: Record<string, any>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    const columns = keys.join(", ");

    const result = await pool.query(
      `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async update<T>(
    table: string,
    id: string,
    data: Record<string, any>
  ): Promise<T | null> {
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

    const result = await pool.query(
      `UPDATE ${table} SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0] || null;
  },

  async delete(table: string, id: string): Promise<boolean> {
    const result = await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  },
};

process.on("exit", () => {
  pool.end();
});
