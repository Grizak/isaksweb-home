import React, { useState, useEffect } from "react";
import {
  Github,
  ExternalLink,
  Mail,
  Star,
  Book,
  Headphones,
  Apple,
} from "lucide-react";
import axios from "axios";

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

interface BackendResponse {
  currentlyLearning: string[];
  projects: Project[];
  skills: Skill[];
}

const DeveloperShowcase: React.FC = () => {
  const [typedText, setTypedText] = useState("");
  const [currentProjectFilter, setCurrentProjectFilter] = useState("all");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [currentlyLearning, setCurrentlyLearning] = useState<string[]>([]);
  const [, setError] = useState<string | null>(null);

  const fullText = `const developer = {
  name: "Isak Grönlund",
  role: "Full Stack Developer",
  passion: "Building amazing web experiences",
  specialties: ["TypeScript", "React", "Node.js"],
  packageManager: "pnpm" // because it's faster! 🚀
};`;

  const [projects, setProjects] = useState<Project[]>([]);

  const [skills, setSkills] = useState<Skill[]>([
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
    {
      name: "Typescript",
      level: 90,
      category: "tools",
    },
  ]);

  useEffect(() => {
    (async () => {
      const res = await axios.get<BackendResponse>("/api/data");
      if (!(res.status === 200)) {
        setError("Unexpected error occurred when loading page");
        return;
      }
      setSkills(res.data.skills);
      setCurrentlyLearning(res.data.currentlyLearning);
      setProjects(res.data.projects);
    })();
  });

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 50);

    return () => clearInterval(timer);
  }, []);

  const filteredProjects =
    currentProjectFilter === "all"
      ? projects
      : projects.filter((p) =>
          p.tech.some((t) => t.toLowerCase().includes(currentProjectFilter))
        );

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const ProjectCard: React.FC<{ project: Project }> = ({ project }) => (
    <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors border border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-white">{project.title}</h3>
        <div className="flex gap-2">
          {project.demoUrl && (
            <button className="text-gray-400 hover:text-blue-400 transition-colors">
              <ExternalLink className="w-5 h-5" />
            </button>
          )}
          {project.sourceUrl && (
            <button className="text-gray-400 hover:text-green-400 transition-colors">
              <Github className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      <p className="text-gray-300 mb-4">{project.description}</p>
      <div className="flex flex-wrap gap-2">
        {project.tech.map((tech, i) => (
          <span
            key={i}
            className="px-2 py-1 bg-blue-900 text-blue-200 rounded text-sm"
          >
            {tech}
          </span>
        ))}
      </div>
    </div>
  );

  const SkillBar: React.FC<{ skill: Skill }> = ({ skill }) => (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">{skill.name}</span>
        </div>
        <span className="text-gray-400 text-sm">{skill.level}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
          style={{ width: `${skill.level}%` }}
        />
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div
            className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent cursor-pointer"
            onClick={() => {
              window.location.href = "#";
            }}
          >
            &lt;Developer /&gt;
          </div>
          <div className="flex items-center gap-6">
            <a
              href="#projects"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Projects
            </a>
            <a
              href="#skills"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Skills
            </a>
            <a
              href="#contact"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Contact
            </a>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-6">
                Building the web with{" "}
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  TypeScript
                </span>
              </h1>
              <p className="text-xl text-gray-400 mb-8">
                Full-stack developer crafting modern web experiences with
                type-safe code and cutting-edge technologies.
              </p>
              <div className="flex gap-4">
                <button
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer"
                  onClick={() => {
                    window.location.href = "#projects";
                  }}
                >
                  View Projects
                </button>
                <button className="border border-gray-600 hover:border-gray-500 px-6 py-3 rounded-lg font-medium transition-colors">
                  Download CV
                </button>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 font-mono text-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="ml-2 text-gray-400">developer.ts</span>
              </div>
              <pre className="text-green-400 leading-relaxed">
                {typedText}
                <span className="animate-pulse">|</span>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-20 px-4 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Skills & Technologies
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-6 text-blue-400">
                Frontend
              </h3>
              {skills
                .filter((s) => s.category === "frontend")
                .map((skill, i) => (
                  <SkillBar key={i} skill={skill} />
                ))}
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-6 text-green-400">
                Backend & Tools
              </h3>
              {skills
                .filter(
                  (s) => s.category === "backend" || s.category === "tools"
                )
                .map((skill, i) => (
                  <SkillBar key={i} skill={skill} />
                ))}
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-6 text-purple-400">
                Database
              </h3>
              {skills
                .filter((s) => s.category === "database")
                .map((skill, i) => (
                  <SkillBar key={i} skill={skill} />
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Featured Projects
          </h2>
          <div className="flex justify-center mb-8">
            <div className="flex gap-2 p-1 bg-gray-800 rounded-lg">
              {["all", "react", "typescript", "node"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setCurrentProjectFilter(filter)}
                  className={`px-4 py-2 rounded transition-colors capitalize ${
                    currentProjectFilter === filter
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </section>

      {/* Currently Learning */}
      <section className="py-20 px-4 bg-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Currently Exploring</h2>
          <div className="flex justify-center gap-6 flex-wrap">
            {currentlyLearning.map((tech, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-gray-700 px-4 py-2 rounded-full"
              >
                <Star className="w-4 h-4 text-yellow-400" />
                <span>{tech}</span>
              </div>
            ))}
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <Apple className="w-8 h-8 mx-auto mb-4 text-amber-400" />
              <h3 className="font-semibold mb-2">Love Apples</h3>
              <p className="text-gray-400">Fueled by clean code and an apple</p>
            </div>
            <div className="text-center">
              <Book className="w-8 h-8 mx-auto mb-4 text-blue-400" />
              <h3 className="font-semibold mb-2">Always Learning</h3>
              <p className="text-gray-400">
                Currently learning{" "}
                <a href="https://github.com/facebook/react">React</a>
              </p>
            </div>
            <div className="text-center">
              <Headphones className="w-8 h-8 mx-auto mb-4 text-purple-400" />
              <h3 className="font-semibold mb-2">Music Lover</h3>
              <p className="text-gray-400">Coding to Music. Always</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">
            Let's Build Something Together
          </h2>
          <p className="text-xl text-gray-400 mb-12">
            Always excited to discuss new projects and opportunities
          </p>
          <div className="flex justify-center gap-6">
            <a
              href="mailto:isak@isaksweb.xyz"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
            >
              <Mail className="w-5 h-5" />
              Get In Touch
            </a>
            <a
              href="https://github.com/Grizak"
              className="flex items-center gap-2 border border-gray-600 hover:border-gray-500 px-6 py-3 rounded-lg transition-colors"
            >
              <Github className="w-5 h-5" />
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center text-gray-400">
          <p>
            Built with React, TypeScript, and TailwindCSS. Deployed with pnpm ⚡
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DeveloperShowcase;
