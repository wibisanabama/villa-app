import { runMaintenance } from "./services.js";

runMaintenance()
  .then((result) => { console.log(JSON.stringify(result)); })
  .catch((error: unknown) => { console.error(error); process.exitCode = 1; });

