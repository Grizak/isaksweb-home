import express from "express";

interface Project {
  id: number;
  title: string;
  description: string;
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

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.get("/api/data", (req, res) => {
  const JsonResponse: {
    currentlyLearning: string[];
    projects: Project[];
    skills: Skill[];
  } = {
    currentlyLearning: ["Typescript", "React", "TailwindCSS"],
    projects: [],
    skills: [],
  };
  res.json(JsonResponse);
});

app.listen(PORT, () => {
  console.log(`Express app listening on port ${PORT}`);
});
