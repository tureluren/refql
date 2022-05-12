const userConfig = {
  user: process.env.DB_USER || "test",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "soccer",
  password: process.env.DB_PASSWORD || "test",
  port: process.env.DB_PORT ? Number (process.env.DB_PORT) : 5432
};

export default userConfig;