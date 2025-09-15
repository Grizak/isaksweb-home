import express, { Request, Response } from "express";
import path from "path";

// Load environment variables
import "dotenv/config";

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
  category: "frontend" | "backend" | "tools" | "database";
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

// ---------------- Authentication ----------------

// Simple token store (in production, use proper session management)
// TODO: Replace with a proper database in the future
const activeSessions = new Set<string>();

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function isValidToken(token: string): boolean {
  return activeSessions.has(token);
}

// Middleware to check authentication
function requireAuth(req: Request, res: Response, next: Function) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token || !isValidToken(token)) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  next();
}

// ---------------- Data ----------------

const techs: string[] = ["all"];
let nextId = 1; // numeric ID generator

// In-memory data store for dashboard modifications
let dashboardProjects: Project[] = [];
let dashboardSkills: Skill[] = [
  {
    name: "TypeScript",
    level: 95,
    category: "frontend",
  },
  {
    name: "React",
    level: 90,
    category: "frontend",
  },
  {
    name: "Node.js",
    level: 85,
    category: "backend",
  },
  {
    name: "MongoDB",
    level: 80,
    category: "database",
  },
  {
    name: "TailwindCSS",
    level: 88,
    category: "frontend",
  },
  {
    name: "Express.js",
    level: 95,
    category: "backend",
  },
];

let currentlyLearning: string[] = ["Typescript", "React", "TailwindCSS"];

// ---------------- Express ----------------

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Middleware
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "frontend")));

// ---------------- Auth Routes ----------------

app.post("/api/auth/login", (req: Request, res: Response) => {
  const { username, password } = req.body as LoginRequest;

  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "password";

  if (username === adminUsername && password === adminPassword) {
    const token = generateToken();
    activeSessions.add(token);

    // Remove token after 24 hours
    setTimeout(() => {
      activeSessions.delete(token);
    }, 24 * 60 * 60 * 1000);

    res.json({ success: true, token } as AuthResponse);
  } else {
    res
      .status(401)
      .json({ success: false, message: "Invalid credentials" } as AuthResponse);
  }
});

app.post("/api/auth/logout", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (token) {
    activeSessions.delete(token);
  }

  res.json({ success: true });
});

app.get("/api/auth/verify", (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (token && isValidToken(token)) {
    res.json({ success: true, valid: true });
  } else {
    res.json({ success: true, valid: false });
  }
});

// ---------------- Public API Routes ----------------

app.get("/api/data", (req: Request, res: Response) => {
  const JsonResponse: {
    currentlyLearning: string[];
    projects: Project[];
    skills: Skill[];
    techs: string[];
  } = {
    currentlyLearning,
    projects: [...dashboardProjects],
    skills: [...dashboardSkills],
    techs,
  };
  res.json(JsonResponse);
});

// ---------------- Dashboard API Routes ----------------

// Get dashboard data (protected)
app.get("/api/dashboard/data", requireAuth, (req: Request, res: Response) => {
  res.json({
    projects: dashboardProjects,
    skills: dashboardSkills,
    currentlyLearning,
    stats: {
      totalProjects: dashboardProjects.length,
      featuredProjects: dashboardProjects.filter((p) => p.featured).length,
      totalSkills: dashboardSkills.length,
    },
  });
});

// Update project (protected)
app.put(
  "/api/dashboard/projects/:id",
  requireAuth,
  (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const projectIndex = dashboardProjects.findIndex((p) => p.id === id);

    if (projectIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    dashboardProjects[projectIndex] = {
      ...dashboardProjects[projectIndex],
      ...req.body,
    };
    res.json({ success: true, project: dashboardProjects[projectIndex] });
  }
);

// Add new project (protected)
app.post(
  "/api/dashboard/projects",
  requireAuth,
  (req: Request, res: Response) => {
    const newProject: Project = {
      id: Math.max(...dashboardProjects.map((p) => p.id)) + 1,
      ...req.body,
    };

    dashboardProjects.push(newProject);
    res.json({ success: true, project: newProject });
  }
);

// Delete project (protected)
app.delete(
  "/api/dashboard/projects/:id",
  requireAuth,
  (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const projectIndex = dashboardProjects.findIndex((p) => p.id === id);

    if (projectIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    dashboardProjects.splice(projectIndex, 1);
    res.json({ success: true });
  }
);

// Update skills (protected)
app.put("/api/dashboard/skills", requireAuth, (req: Request, res: Response) => {
  dashboardSkills = req.body.skills;
  res.json({ success: true, skills: dashboardSkills });
});

// Update currently learning (protected)
app.put(
  "/api/dashboard/learning",
  requireAuth,
  (req: Request, res: Response) => {
    currentlyLearning = req.body.currentlyLearning;
    res.json({ success: true, currentlyLearning });
  }
);

// ---------------- Catch-all route ----------------

app.use((req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), "frontend", "index.html"));
});

// ---------------- Start ----------------

app.listen(PORT, () => {
  console.log(`Express app listening on port ${PORT}`);
  console.log(
    `Dashboard credentials: ${process.env.ADMIN_USERNAME || "admin"} / ${
      process.env.ADMIN_PASSWORD || "password"
    }`
  );
});
