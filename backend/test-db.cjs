const { Client } = require("pg");

async function testConnection() {
  const client = new Client({
    host: "127.0.0.1",
    port: 55432,
    user: "nexora_user",
    password: "nexora_dev_password",
    database: "nexora_db",
  });

  try {
    await client.connect();
    console.log("Connected successfully!");
    const result = await client.query("SELECT current_user, current_database()");
    console.log(result.rows[0]);
  } catch (error) {
    console.error("Connection failed:", error.message);
  } finally {
    await client.end().catch(() => {});
  }
}

testConnection();


