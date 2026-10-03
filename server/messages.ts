import { Request, Response } from "express";
import { db } from "@db";
import { eq, and, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";

// Function to create messages table if it doesn't exist
export async function ensureMessagesTableExists() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        consultant_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        is_from_consultant BOOLEAN NOT NULL DEFAULT FALSE,
        is_read BOOLEAN NOT NULL DEFAULT FALSE
      )
    `);
    console.log("Messages table check complete");
  } catch (error) {
    console.error("Error ensuring messages table exists:", error);
    throw error;
  }
}

// Get messages between user and consultant
export async function getMessages(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = req.user.id;
  const consultantId = parseInt(req.params.consultantId);

  try {
    // Ensure table exists
    await ensureMessagesTableExists();

    // Query messages
    const messages = await db.execute(sql`
      SELECT * FROM messages
      WHERE user_id = ${userId} AND consultant_id = ${consultantId}
      ORDER BY created_at ASC
    `);

    res.json(messages.rows);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
}

// Send a message to a consultant
export async function sendMessage(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = req.user.id;
  const consultantId = parseInt(req.params.consultantId);
  const { content } = req.body;

  if (!content || typeof content !== "string" || content.trim() === "") {
    return res.status(400).json({ error: "Message content is required" });
  }

  try {
    // Ensure table exists
    await ensureMessagesTableExists();

    // Insert the message
    const result = await db.execute(sql`
      INSERT INTO messages (user_id, consultant_id, content, is_from_consultant, is_read)
      VALUES (${userId}, ${consultantId}, ${content}, FALSE, FALSE)
      RETURNING *
    `);

    const newMessage = result.rows[0];
    res.status(201).json(newMessage);

    // Simulate consultant response after a delay (for demo purposes)
    setTimeout(async () => {
      try {
        const responses = [
          "Thank you for your message! I'll get back to you shortly.",
          "I appreciate your interest. Can you tell me more about your ESG reporting needs?",
          "Thanks for reaching out. I'm available for a consultation next week. Does that work for you?",
          "Hello! I'd be happy to discuss how I can help with your sustainability strategy.",
          "Thanks for your message. I specialize in ESG frameworks like GRI and SASB. Would you like to know more?",
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        await db.execute(sql`
          INSERT INTO messages (user_id, consultant_id, content, is_from_consultant, is_read)
          VALUES (${userId}, ${consultantId}, ${randomResponse}, TRUE, FALSE)
        `);
      } catch (error) {
        console.error("Error creating consultant response:", error);
      }
    }, 30000); // 30 seconds delay for consultant response
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
}