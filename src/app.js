import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { indexRouter } from "./routes/index.route.js";
import { ApiResponse } from "./utils/ApiResponse.js";
import cors from "cors";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  cors({
    origin: ["https://we-shine.vercel.app", "https://we-shine-admin.vercel.app", "http://localhost:3000", "http://localhost:3001"],
    methods: "GET,POST,PUT,PATCH,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  })
);


app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/", indexRouter);

app.use("/*", (req, res, next) => {
  return res
    .status(404)
    .send(new ApiResponse(404, null, "No such route exists"));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .send(new ApiResponse(500, null, "An unexpected error occurred"));
});

export { app };
