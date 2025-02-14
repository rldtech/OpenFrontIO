import express, { Request, Response } from "express";
import { Item } from "./Types";

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// In-memory storage for items
let items: Item[] = [];

// Example route: Create an item
app.post("/api/items", (req: Request, res: Response) => {
  const newItem: Item = {
    id: Date.now().toString(),
    ...req.body,
  };

  items.push(newItem);
  res.status(201).json(newItem);
});

// Example route: Get all items
app.get("/api/items", (_req: Request, res: Response) => {
  res.json(items);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
