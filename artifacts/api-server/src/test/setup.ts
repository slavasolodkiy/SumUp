process.env["NODE_ENV"] = "test";
process.env["SESSION_SECRET"] = "test-secret-for-vitest-only-32-bytes-long";
process.env["DATABASE_URL"] = process.env["DATABASE_URL"] ?? "postgres://localhost:5432/payos_test";
