const userConfig = (db: "pg" | "mysql") => ({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number (process.env[`${db.toUpperCase ()}_PORT`])
});

export default userConfig;