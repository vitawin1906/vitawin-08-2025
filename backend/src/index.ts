import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import productsRouter from "./routes/productsRouter.js";

dotenv.config();
import "../config/db.js";

const app = express();
console.log("DATABASE_URL =", process.env.DATABASE_URL);

// ---------------------- Security ----------------------
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ---------------------- Parsers ----------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
app.use(cookieParser());

// ---------------------- Compression ----------------------
app.use(compression({
  threshold: 1024,
  level: 6,
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    return compression.filter(req, res);
  }
}));

// ---------------------- Caching ----------------------
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    res.setHeader("Cache-Control", "public, max-age=60");
  } else if (/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/.test(req.path)) {
    res.setHeader("Cache-Control", "public, max-age=31536000");
  }
  next();
});

// ---------------------- Static Uploads ----------------------
app.use("/uploads", express.static("uploads"));

// ---------------------- Logging ----------------------
app.use((req, res, next) => {
  const start = Date.now();
  const requestPath = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (requestPath.startsWith("/api") && (res.statusCode >= 400 || duration > 1000)) {
      console.log(`${req.method} ${requestPath} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

// ---------------------- API Routes ----------------------
app.use("/api/products", productsRouter); // <-- теперь здесь

// ---------------------- Startup ----------------------
(async () => {
  // Search engine verification
  app.get("/googlef83aa8e382644bb1.html", (_req, res) => {
    res.type("text/plain").send("google-site-verification: googlef83aa8e382644bb1.html");
  });

  app.get("/yandex_86c923468bce03a6.html", (_req, res) => {
    res.type("text/html").send(`<html><body>Verification: 86c923468bce03a6</body></html>`);
  });

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error(err);
  });

  // Start server
  const port = process.env.PORT || 8000;
  app.listen(port, () => {
    console.log(`🚀 API server started on port ${port}`);
  });
})();
