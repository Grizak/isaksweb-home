console.time("Total startup time");
import express, { Request, Response } from "express";
import path from "path";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// ---------------- Configuration variables ----------------
let isReady = false;

// ---------------- MongoDB Connection ----------------

const MONGODB_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/portfolio";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

console.time("MongoDB connection");
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    console.timeEnd("MongoDB connection");
  })
  .catch((error) => console.error("MongoDB connection error:", error));

// ---------------- Mongoose Schemas ----------------

const projectSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, required: true },
    title: { type: String, required: true },
    description: { type: String, default: null },
    tech: [{ type: String }],
    demoUrl: { type: String },
    sourceUrl: { type: String },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    level: { type: Number, required: true, min: 0, max: 100 },
    category: {
      type: String,
      required: true,
      enum: ["frontend", "backend", "tools", "database", "other"],
    },
  },
  { timestamps: true }
);

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

// Models
const Project = mongoose.model("Project", projectSchema);
const Skill = mongoose.model("Skill", skillSchema);
const Settings = mongoose.model("Settings", settingsSchema);

// ---------------- Interfaces ----------------

interface Project {
  id: number;
  title: string;
  description: string | null;
  tech: string[];
  demoUrl?: string;
  sourceUrl?: string;
  featured: boolean;
}

interface Skill {
  name: string;
  level: number;
  category: "frontend" | "backend" | "tools" | "database" | "other";
}

interface LoginRequest {
  username: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  message?: string;
}

// ---------------- Database Helpers ----------------

async function initializeDefaultData() {
  try {
    // Initialize default skills if none exist
    const skillCount = await Skill.countDocuments();
    if (skillCount === 0) {
      const defaultSkills = [
        { name: "TypeScript", level: 95, category: "frontend" as const },
        { name: "React", level: 90, category: "frontend" as const },
        { name: "Node.js", level: 85, category: "backend" as const },
        { name: "MongoDB", level: 80, category: "database" as const },
        { name: "TailwindCSS", level: 88, category: "frontend" as const },
        { name: "Express.js", level: 95, category: "backend" as const },
      ];
      await Skill.insertMany(defaultSkills);
      console.log("Default skills created");
    }

    // Initialize currently learning if not set
    const currentlyLearning = await Settings.findOne({
      key: "currentlyLearning",
    });
    if (!currentlyLearning) {
      await Settings.create({
        key: "currentlyLearning",
        value: ["Typescript", "React", "TailwindCSS"],
      });
      console.log("Currently learning initialized");
    }
  } catch (error) {
    console.error("Error initializing default data:", error);
  }
}

// Get next project ID
async function getNextProjectId(): Promise<number> {
  const lastProject = await Project.findOne().sort({ id: -1 });
  return lastProject ? lastProject.id + 1 : 1;
}

// ---------------- Authentication ----------------

function generateToken(): string {
  return jwt.sign({ authenticated: true }, JWT_SECRET, { expiresIn: "24h" });
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch (error) {
    return false;
  }
}

// Middleware to check authentication
async function requireAuth(req: Request, res: Response, next: Function) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
  }

  const isValid = await verifyToken(token);
  if (!isValid) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  next();
}

// ---------------- Express ----------------

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.get("/favicon.ico", (req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), "frontend", "favicon.jpg"));
});

app.use((req, res, next) => {
  if (!isReady) {
    res.setHeader("Retry-After", "10"); // Suggest client to retry after 10 seconds
    return res.status(503).json({
      success: false,
      message: "Server is initializing, please try again later.",
    });
  }
  next();
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "frontend")));

// ---------------- Auth Routes ----------------

app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as LoginRequest;

    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "password";

    if (username === adminUsername && password === adminPassword) {
      const token = generateToken();
      res.json({ success: true, token } as AuthResponse);
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      } as AuthResponse);
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    } as AuthResponse);
  }
});

app.post("/api/auth/logout", (req: Request, res: Response) => {
  // With JWT, logout is handled client-side by removing the token
  res.json({ success: true });
});

app.get("/api/auth/verify", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.json({ success: true, valid: false });
  }

  const isValid = await verifyToken(token);
  res.json({ success: true, valid: isValid });
});

// ---------------- Public API Routes ----------------

app.get("/api/data", async (req: Request, res: Response) => {
  try {
    const [projects, skills, currentlyLearningSetting] = await Promise.all([
      Project.find().select("-_id -__v -createdAt -updatedAt"),
      Skill.find().select("-_id -__v -createdAt -updatedAt"),
      Settings.findOne({ key: "currentlyLearning" }),
    ]);

    const techs = ["all"]; // You might want to generate this dynamically from projects
    const currentlyLearning = currentlyLearningSetting?.value || [];

    const JsonResponse = {
      currentlyLearning,
      projects,
      skills,
      techs,
    };
    res.json(JsonResponse);
  } catch (error) {
    console.error("Error fetching public data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------- Dashboard API Routes ----------------

// Get dashboard data (protected)
app.get(
  "/api/dashboard/data",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const [projects, skills, currentlyLearningSetting] = await Promise.all([
        Project.find().select("-_id -__v -createdAt -updatedAt"),
        Skill.find().select("-_id -__v -createdAt -updatedAt"),
        Settings.findOne({ key: "currentlyLearning" }),
      ]);

      const currentlyLearning = currentlyLearningSetting?.value || [];

      res.json({
        projects,
        skills,
        currentlyLearning,
        stats: {
          totalProjects: projects.length,
          featuredProjects: projects.filter((p: any) => p.featured).length,
          totalSkills: skills.length,
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update project (protected)
app.put(
  "/api/dashboard/projects/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updatedProject = await Project.findOneAndUpdate(
        { id },
        { ...req.body },
        { new: true, runValidators: true }
      ).select("-_id -__v -createdAt -updatedAt");

      if (!updatedProject) {
        return res
          .status(404)
          .json({ success: false, message: "Project not found" });
      }

      res.json({ success: true, project: updatedProject });
    } catch (error) {
      console.error("Error updating project:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

// Add new project (protected)
app.post(
  "/api/dashboard/projects",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const nextId = await getNextProjectId();
      const newProject = new Project({
        id: nextId,
        ...req.body,
      });

      await newProject.save();

      // Fetch the saved project with selected fields only
      const savedProject = await Project.findOne({ id: nextId }).select(
        "-_id -__v -createdAt -updatedAt"
      );

      res.json({ success: true, project: savedProject });
    } catch (error) {
      console.error("Error creating project:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

// Delete project (protected)
app.delete(
  "/api/dashboard/projects/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deletedProject = await Project.findOneAndDelete({ id });

      if (!deletedProject) {
        return res
          .status(404)
          .json({ success: false, message: "Project not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting project:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

// Update skills (protected)
app.put(
  "/api/dashboard/skills",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      // Clear existing skills and insert new ones
      await Skill.deleteMany({});
      await Skill.insertMany(req.body.skills);

      const updatedSkills = await Skill.find().select(
        "-_id -__v -createdAt -updatedAt"
      );
      res.json({ success: true, skills: updatedSkills });
    } catch (error) {
      console.error("Error updating skills:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

// Update currently learning (protected)
app.put(
  "/api/dashboard/learning",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      await Settings.findOneAndUpdate(
        { key: "currentlyLearning" },
        { value: req.body.currentlyLearning },
        { upsert: true }
      );

      res.json({
        success: true,
        currentlyLearning: req.body.currentlyLearning,
      });
    } catch (error) {
      console.error("Error updating currently learning:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

// ---------------- Catch-all route ----------------

app.use((req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), "frontend", "index.html"));
});

// ---------------- Start ----------------

app.listen(PORT, async () => {
  console.log(`Express app listening on port ${PORT}`);

  console.timeEnd("Total startup time");

  // Wait a moment to ensure MongoDB connection is established
  await new Promise((resolve) => setTimeout(resolve, 10000));

  // Initialize default data
  await initializeDefaultData();

  console.log("Server ready with MongoDB integration");
  isReady = true;
});
