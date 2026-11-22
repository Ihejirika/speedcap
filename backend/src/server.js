import { createServer } from "node:http";
import { handler } from "./app.js";

const PORT = Number(process.env.PORT) || 8080;
createServer(handler).listen(PORT, () => console.log(`SpeedCap API listening on http://localhost:${PORT}`));
