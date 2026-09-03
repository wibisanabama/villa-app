import dns from "node:dns";
import { app } from "./app.js";
import { env } from "./config.js";

dns.setDefaultResultOrder("ipv4first");
app.listen(env.PORT, () => {
  console.log(`Vilara API listening on ${env.PORT}`);
});

