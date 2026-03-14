import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("aura_dial.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "order" INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS dials (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    group_id TEXT,
    "order" INTEGER NOT NULL,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/state", (req, res) => {
    try {
      const groups = db.prepare('SELECT * FROM groups ORDER BY "order" ASC').all();
      const dials = db.prepare('SELECT * FROM dials ORDER BY "order" ASC').all();
      
      // Map snake_case to camelCase
      const formattedDials = dials.map((d: any) => ({
        id: d.id,
        url: d.url,
        title: d.title,
        groupId: d.group_id,
        order: d.order
      }));

      res.json({ groups, dials: formattedDials });
    } catch (err) {
      console.error("Error fetching state:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/groups", (req, res) => {
    try {
      const { name, order } = req.body;
      if (!name) return res.status(400).json({ error: "Name is required" });
      
      const id = uuidv4();
      db.prepare('INSERT INTO groups (id, name, "order") VALUES (?, ?, ?)').run(id, name, order || 0);
      res.json({ id, name, order });
    } catch (err) {
      console.error("Error creating group:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/groups/:id", (req, res) => {
    try {
      db.prepare('DELETE FROM groups WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting group:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/dials", (req, res) => {
    try {
      const { url, title, groupId, order } = req.body;
      if (!url || !title) return res.status(400).json({ error: "URL and Title are required" });
      
      const id = uuidv4();
      db.prepare('INSERT INTO dials (id, url, title, group_id, "order") VALUES (?, ?, ?, ?, ?)').run(id, url, title, groupId || null, order || 0);
      res.json({ id, url, title, groupId, order });
    } catch (err) {
      console.error("Error creating dial:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/dials/:id", (req, res) => {
    db.prepare('DELETE FROM dials WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.patch("/api/dials/reorder", (req, res) => {
    try {
      const { dialIds } = req.body; // Array of IDs in the new order
      if (!Array.isArray(dialIds)) return res.status(400).json({ error: "dialIds must be an array" });

      const updateStmt = db.prepare('UPDATE dials SET "order" = ? WHERE id = ?');
      
      const transaction = db.transaction((ids) => {
        for (let i = 0; i < ids.length; i++) {
          updateStmt.run(i, ids[i]);
        }
      });

      transaction(dialIds);
      res.json({ success: true });
    } catch (err) {
      console.error("Error reordering dials:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/dials/:id", (req, res) => {
    const { title, url, groupId, order } = req.body;
    const updates: string[] = [];
    const params: any[] = [];

    if (title !== undefined) { updates.push("title = ?"); params.push(title); }
    if (url !== undefined) { updates.push("url = ?"); params.push(url); }
    if (groupId !== undefined) { updates.push("group_id = ?"); params.push(groupId); }
    if (order !== undefined) { updates.push('"order" = ?'); params.push(order); }

    if (updates.length > 0) {
      params.push(req.params.id);
      db.prepare(`UPDATE dials SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    }
    res.json({ success: true });
  });

  // Vite middleware for development
  const isProd = process.env.NODE_ENV === "production";
  const distPath = path.join(__dirname, "dist");
  const hasDist = fs.existsSync(distPath);

  if (!isProd || !hasDist) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // Explicitly handle SPA fallback for development
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) return next();
      
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
