
'use server'; // Add this directive

import mysql from 'mysql2/promise';

const connectionConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10, // Optional: connection pool limit
  namedPlaceholders: true, // Important for using object parameters
  // Add SSL options if your Jino.ru MySQL requires it
  // ssl: {
  //   // ca: fs.readFileSync('/path/to/ca-cert.pem'), // if you have a CA cert
  //   rejectUnauthorized: false // Be cautious with this in production, true is more secure
  // }
};

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (!pool) {
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) { // Password can be empty for some local setups
      console.error("Database environment variables DB_HOST, DB_USER, or DB_NAME are not set.");
      throw new Error("Database environment variables are not fully set. Please check your .env.local file.");
    }
    try {
      pool = mysql.createPool(connectionConfig);
      console.log("MySQL connection pool created successfully.");

      // Test the pool by getting a connection (optional, but good for early feedback)
      pool.getConnection()
        .then(connection => {
          console.log("Successfully connected to database via pool.");
          connection.release();
        })
        .catch(err => {
          console.error("Failed to get a connection from pool on startup:", err);
          // Depending on severity, you might want to invalidate the pool or exit
          // For now, we'll let further queries fail if the pool is truly unusable.
        });

    } catch (error) {
      console.error("Failed to create MySQL connection pool:", error);
      // Ensure pool remains null if creation fails
      pool = null;
      throw new Error("Database connection pool could not be created.");
    }
  }
  return pool;
}

export async function query(sql: string, params?: any[] | object): Promise<any> {
  const currentPool = getPool(); // This will throw if pool cannot be initialized

  let connection;
  try {
    connection = await currentPool.getConnection();
    console.log(`Executing SQL: ${sql} with params: ${params ? JSON.stringify(params) : 'No params'}`);
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error: any) {
    console.error('Database query error:', error.message, error.code, error.sqlMessage, error.sql);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
