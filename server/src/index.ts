import express, { Request, Response } from "express";
import path from "path";
import axios from "axios";

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

// ---------------- Data ----------------

const projectsFromGithub: Project[] = [];
const techs: string[] = ["all"];
let nextId = 1; // numeric ID generator

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
    }
  } catch (error) {
    console.error("Failed to fetch GitHub repositories:", error);
  }
}

// ---------------- Express ----------------

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.static(path.join(process.cwd(), "frontend")));

app.get("/api/data", (req: Request, res: Response) => {
  const JsonResponse: {
    currentlyLearning: string[];
    projects: Project[];
    skills: Skill[];
    techs: string[];
  } = {
    currentlyLearning: ["Typescript", "React", "TailwindCSS"],
    projects: [...projectsFromGithub],
    skills: [],
    techs,
  };
  res.json(JsonResponse);
});

app.use((req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), "frontend", "index.html"));
});

// ---------------- Start ----------------

loadProjects().then(() => {
  app.listen(PORT, () => {
    console.log(`Express app listening on port ${PORT}`);
  });
});
