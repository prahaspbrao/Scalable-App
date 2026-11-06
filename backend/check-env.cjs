require("dotenv").config();

const url = new URL(process.env.DATABASE_URL);

console.log("Username:", url.username);
console.log(
  "Password matches:",
  decodeURIComponent(url.password) === "nexora_dev_password"
);
console.log("Host:", url.hostname);
console.log("Port:", url.port);
console.log("Database:", url.pathname);