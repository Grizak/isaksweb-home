import express, { Request, Response } from "express";
import path from "path";
import axios from "axios";

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

interface GitHubLicense {
  key: string;
  name: string;
  spdx_id: string;
  url: string;
  node_id: string;
}

interface GitHubOwner {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: "User" | "Organization";
  user_view_type: string;
  site_admin: boolean;
}

interface GitHubRepository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: GitHubOwner;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  forks_url: string;
  keys_url: string;
  collaborators_url: string;
  teams_url: string;
  hooks_url: string;
  issue_events_url: string;
  events_url: string;
  assignees_url: string;
  branches_url: string;
  tags_url: string;
  blobs_url: string;
  git_tags_url: string;
  git_refs_url: string;
  trees_url: string;
  statuses_url: string;
  languages_url: string;
  stargazers_url: string;
  contributors_url: string;
  subscribers_url: string;
  subscription_url: string;
  commits_url: string;
  git_commits_url: string;
  comments_url: string;
  issue_comment_url: string;
  contents_url: string;
  compare_url: string;
  merges_url: string;
  archive_url: string;
  downloads_url: string;
  issues_url: string;
  pulls_url: string;
  milestones_url: string;
  notifications_url: string;
  labels_url: string;
  releases_url: string;
  deployments_url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  git_url: string;
  ssh_url: string;
  clone_url: string;
  svn_url: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  has_discussions: boolean;
  forks_count: number;
  mirror_url: string | null;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  license: GitHubLicense | null;
  allow_forking: boolean;
  is_template: boolean;
  web_commit_signoff_required: boolean;
  topics: string[];
  visibility: "public" | "private" | "internal";
  forks: number;
  open_issues: number;
  watchers: number;
  default_branch: string;
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

type GithubRepositoriesResponse = GitHubRepository[];

async function fetchAllRepos(username: string): Promise<GitHubRepository[]> {
  const repos: GitHubRepository[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = `https://api.github.com/users/${username}/repos?per_page=${perPage}&page=${page}`;
    const { data } = await axios.get<GithubRepositoriesResponse>(url);

    repos.push(...data);

    if (data.length < perPage) {
      // No more pages
      break;
    }

    page++;
  }

  return repos;
}

// ---------------- Authentication ----------------

// Simple token store (in production, use proper session management)
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

const projectsFromGithub: Project[] = [];
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

// ---------------- Initialization ----------------

async function loadProjects(): Promise<void> {
  try {
    const repos = await fetchAllRepos("Grizak");

    if (repos) {
      repos.forEach((repo) => {
        const newProject: Project = {
          id: nextId++,
          title: repo.name,
          description: repo.description,
          tech: repo.language ? [repo.language] : [],
          sourceUrl: repo.html_url,
          featured: false,
        };
        projectsFromGithub.push(newProject);

        // Fix: Check if language exists and isn't already in techs array
        if (repo.language && !techs.includes(repo.language)) {
          techs.push(repo.language);
        }
      });

      // Initialize dashboard projects with GitHub data
      dashboardProjects = [...projectsFromGithub];
    }
  } catch (error) {
    console.error("Failed to fetch GitHub repositories:", error);
  }
}

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
      githubRepos: projectsFromGithub.length,
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

// Refresh GitHub data (protected)
app.post(
  "/api/dashboard/refresh-github",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      await loadProjects();
      res.json({
        success: true,
        message: "GitHub data refreshed",
        projects: projectsFromGithub,
      });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Failed to refresh GitHub data" });
    }
  }
);

// ---------------- Catch-all route ----------------

app.use((req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), "frontend", "index.html"));
});

// ---------------- Start ----------------

loadProjects().then(() => {
  app.listen(PORT, () => {
    console.log(`Express app listening on port ${PORT}`);
  });
});
