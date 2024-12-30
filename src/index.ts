import { Hono } from "hono";
import { uploadRoute } from "./routes/upload";
import { serveStatic } from "hono/bun";

const app = new Hono();

app.use("/public/*", serveStatic({ root: "./" }));
app.route("/upload", uploadRoute);

export default app;
