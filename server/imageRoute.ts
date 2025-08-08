import { Express } from "express";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";

export function addSimpleImageRoute(app: Express) {
  app.get("/api/uploads/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      if (!filename.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i)) {
        return res.status(400).json({ error: "Invalid file type" });
      }
      const filePath = path.join(process.cwd(), "uploads", filename);
      if (fsSync.existsSync(filePath)) {
        const buffer = await fs.readFile(filePath);
        const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
        const mimeTypes: Record<string, string> = {
          jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
          gif: "image/gif", webp: "image/webp", svg: "image/svg+xml",
          bmp: "image/bmp", tiff: "image/tiff"
        };
        res.setHeader("Content-Type", mimeTypes[ext] || "image/jpeg");
        res.setHeader("Cache-Control", "public, max-age=86400");
        res.setHeader("Content-Length", buffer.length);
        if (process.env.NODE_ENV !== "production") {
          console.log(`[IMG] Served: ${filename}, size: ${buffer.length} bytes`);
        }
        return res.send(buffer);
      }
      if (process.env.NODE_ENV !== "production") {
        console.log(`[IMG] Not found: ${filename}`);
      }
      return res.status(404).json({ error: "Image not found" });
    } catch (error) {
      console.error(`[IMG] Error:`, error);
      return res.status(500).json({ error: "Server error" });
    }
  });
}
