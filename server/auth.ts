import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, insertUserSchema } from "@db/schema";
import type { User as DBUser } from "@db/schema";
import { db } from "@db";
import { eq, sql, or } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    // Check if the password has the expected format
    if (!storedPassword || !storedPassword.includes(".")) {
      console.error("Invalid password format in database");
      return false;
    }
    
    const [hashedPassword, salt] = storedPassword.split(".");
    
    // Additional check to ensure we have both parts
    if (!hashedPassword || !salt) {
      console.error("Password hash or salt is missing");
      return false;
    }
    
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
};

declare global {
  namespace Express {
    // Define a simplified User interface with only the fields we need
    interface User {
      id: number;
      username: string;
      email: string;
      role: "user" | "consultant" | "provider" | "admin";
      // No additional fields that might cause errors
    }
  }
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);

  app.use(
    session({
      secret: process.env.REPL_ID || "esg-marketplace-secret",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({
        checkPeriod: 86400000,
      }),
      cookie: {
        secure: app.get("env") === "production",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'identifier',
        passwordField: 'password',
      },
      async (identifier, password, done) => {
        try {
          // Try to find user by username or email
          const potentialUsers = await db
            .select({
              id: users.id,
              username: users.username,
              email: users.email,
              password: users.password,
              role: users.role
            })
            .from(users)
            .where(
              // Check if identifier matches either username or email
              or(
                eq(users.username, identifier),
                eq(users.email, identifier)
              )
            )
            .limit(1);

          const user = potentialUsers[0];

          if (!user) {
            return done(null, false, { message: "Invalid username or email" });
          }

          const isValid = await crypto.compare(password, user.password);
          if (!isValid) {
            return done(null, false, { message: "Invalid password" });
          }
          
          // We need to extend the user object with any additional properties
          // required by the User interface in the Express namespace
          const userData = { 
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            password: user.password
          };

          return done(null, userData);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      // Get the user from the database
      const users_result = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          role: users.role
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
        
      if (!users_result || users_result.length === 0) {
        return done(new Error('User not found'), null);
      }
      
      const user = users_result[0];
      done(null, user);
    } catch (err) {
      console.error("Error deserializing user:", err);
      done(err, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("Registration attempt:", req.body);
      
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        const errorMsg = "Invalid input: " + result.error.issues.map(i => i.message).join(", ");
        console.log("Registration validation error:", errorMsg);
        return res.status(400).send(errorMsg);
      }

      console.log("Validation passed, creating user");
      
      try {
        const hashedPassword = await crypto.hash(result.data.password);
        const [newUser] = await db
          .insert(users)
          .values({
            ...result.data,
            password: hashedPassword,
          })
          .returning();

        console.log("User created:", newUser.id);
        
        // Create a simplified user object with only the fields we need
        const userForAuth = {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role
        };
        
        // Log the user in after registration
        req.login(userForAuth, (err) => {
          if (err) {
            console.log("Login after registration error:", err);
            return next(err);
          }
          res.json(userForAuth);
        });
      } catch (error) {
        console.log("Database error:", error);
        const dbError = error as any;
        if (dbError.code === '23505') {
          return res.status(400).send("Username or email already exists");
        }
        throw error;
      }
    } catch (error) {
      console.log("Registration error:", error);
      next(error);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });

  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    res.status(401).send("Not authenticated");
  });
}