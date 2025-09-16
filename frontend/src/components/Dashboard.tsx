// frontend/src/components/Dashboard.tsx
import React, { useState, useEffect } from "react";
import {
  LogOut,
  Settings,
  BarChart3,
  FileText,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  Star,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

interface Project {
  id: number;
  title: string;
  description: string | null;
  tech: string; // changed from string[] to string
  demoUrl?: string;
  sourceUrl?: string;
  featured: boolean;
}

interface Skill {
  name: string;
  level: number;
  category: "frontend" | "backend" | "tools" | "database" | "other";
}

interface DashboardStats {
  totalProjects: number;
  featuredProjects: number;
  totalSkills: number;
}

interface DashboardData {
  projects: Project[];
  skills: Skill[];
  currentlyLearning: string[];
  stats: DashboardStats;
}

interface DashboardProps {
  onBackToPortfolio: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onBackToPortfolio }) => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingSkills, setEditingSkills] = useState(false);
  const [editingLearning, setEditingLearning] = useState(false);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    title: "",
    description: "",
    tech: "", // changed from [] to ""
    demoUrl: "",
    sourceUrl: "",
    featured: false,
  });
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  // Add a state to hold the tech input string for editing
  const [editingTechInput, setEditingTechInput] = useState<string>("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // When starting to edit a project, initialize editingTechInput
  useEffect(() => {
    if (editingProject) {
      setEditingTechInput(editingProject.tech); // now just the raw string
    }
  }, [editingProject]);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get("/api/dashboard/data");
      setData(response.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const updateProject = async (project: Project) => {
    // Ensure editingTechInput is a string before splitting
    const techString =
      typeof editingTechInput === "string" ? editingTechInput : "";
    const updatedProject = {
      ...project,
      tech: techString, // keep as string in state
      techArray: techString
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
    };
    try {
      await axios.put(`/api/dashboard/projects/${project.id}`, {
        ...updatedProject,
        tech: updatedProject.techArray, // send as array to backend
      });
      setData((prev) =>
        prev
          ? {
              ...prev,
              projects: prev.projects.map((p) =>
                p.id === project.id
                  ? { ...updatedProject, tech: techString }
                  : p
              ),
            }
          : null
      );
    } catch (error) {
      console.error("Failed to update project:", error);
    } finally {
      setEditingProject(null);
    }
  };

  const addProject = async () => {
    // Convert tech string to array before sending
    const techArray = newProject.tech
      ? newProject.tech
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
      : [];
    try {
      const response = await axios.post("/api/dashboard/projects", {
        ...newProject,
        tech: techArray, // send as array to backend
      });
      if (data) {
        setData({
          ...data,
          projects: [
            ...data.projects,
            {
              ...response.data.project,
              tech: newProject.tech || "",
            },
          ],
        });
      }
      setNewProject({
        title: "",
        description: "",
        tech: "",
        demoUrl: "",
        sourceUrl: "",
        featured: false,
      });
      setShowNewProjectForm(false);
    } catch (error) {
      console.error("Failed to add project:", error);
    }
  };

  const deleteProject = async (id: number) => {
    try {
      await axios.delete(`/api/dashboard/projects/${id}`);
      setData((prev) =>
        prev
          ? {
              ...prev,
              projects: prev.projects.filter((p) => p.id !== id),
            }
          : null
      );
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const updateSkills = async (skills: Skill[]) => {
    try {
      await axios.put("/api/dashboard/skills", { skills });
      setData((prev) => (prev ? { ...prev, skills } : null));
      setEditingSkills(false);
    } catch (error) {
      console.error("Failed to update skills:", error);
    }
  };

  const updateLearning = async (currentlyLearning: string[]) => {
    try {
      await axios.put("/api/dashboard/learning", { currentlyLearning });
      setData((prev) => (prev ? { ...prev, currentlyLearning } : null));
      setEditingLearning(false);
    } catch (error) {
      console.error("Failed to update learning:", error);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 w-64 h-full bg-gray-800 border-r border-gray-700">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-400 mb-8">Dashboard</h1>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === "overview"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Overview
            </button>

            <button
              onClick={() => setActiveTab("projects")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === "projects"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <FileText className="w-5 h-5" />
              Projects
            </button>

            <button
              onClick={() => setActiveTab("skills")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === "skills"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <Settings className="w-5 h-5" />
              Skills & Learning
            </button>
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Back to Portfolio Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={onBackToPortfolio}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors text-gray-200"
          >
            Back to Portfolio
          </button>
        </div>
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Dashboard Overview</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Projects</p>
                    <p className="text-2xl font-bold text-white">
                      {data.stats.totalProjects}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-400" />
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Featured Projects</p>
                    <p className="text-2xl font-bold text-white">
                      {data.stats.featuredProjects}
                    </p>
                  </div>
                  <Star className="w-8 h-8 text-yellow-400" />
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Skills</p>
                    <p className="text-2xl font-bold text-white">
                      {data.stats.totalSkills}
                    </p>
                  </div>
                  <Settings className="w-8 h-8 text-green-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold mb-4">Recent Projects</h3>
                <div className="space-y-3">
                  {data.projects.slice(0, 5).map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{project.title}</p>
                        <p className="text-sm text-gray-400">{project.tech}</p>
                      </div>
                      {project.featured && (
                        <Star className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold mb-4">
                  Currently Learning
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data.currentlyLearning.map((tech, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === "projects" && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Manage Projects</h2>
              <button
                onClick={() => setShowNewProjectForm(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Project
              </button>
            </div>

            {showNewProjectForm && (
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-6">
                <h3 className="text-xl font-semibold mb-4">Add New Project</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Project Title"
                    value={newProject.title}
                    onChange={(e) =>
                      setNewProject({ ...newProject, title: e.target.value })
                    }
                    className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Technologies (comma-separated)"
                    value={newProject.tech || ""}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        tech: e.target.value,
                      })
                    }
                    className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                  <input
                    type="url"
                    placeholder="Demo URL (optional)"
                    value={newProject.demoUrl}
                    onChange={(e) =>
                      setNewProject({ ...newProject, demoUrl: e.target.value })
                    }
                    className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                  <input
                    type="url"
                    placeholder="Source URL (optional)"
                    value={newProject.sourceUrl}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        sourceUrl: e.target.value,
                      })
                    }
                    className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <textarea
                  placeholder="Project Description"
                  value={newProject.description ?? ""}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      description: e.target.value,
                    })
                  }
                  className="w-full mt-4 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white h-24 resize-none"
                />
                <div className="flex items-center mt-4">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={newProject.featured}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        featured: e.target.checked,
                      })
                    }
                    className="mr-2"
                  />
                  <label htmlFor="featured" className="text-gray-300">
                    Featured Project
                  </label>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={addProject}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => setShowNewProjectForm(false)}
                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data.projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-gray-800 p-6 rounded-lg border border-gray-700"
                >
                  {editingProject?.id === project.id ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editingProject.title}
                        onChange={(e) =>
                          setEditingProject({
                            ...editingProject,
                            title: e.target.value,
                          })
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                      />
                      <textarea
                        value={editingProject.description || ""}
                        onChange={(e) =>
                          setEditingProject({
                            ...editingProject,
                            description: e.target.value,
                          })
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white h-20 resize-none"
                      />
                      <input
                        type="text"
                        placeholder="Technologies (comma-separated)"
                        value={editingTechInput}
                        onChange={(e) => setEditingTechInput(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                      />
                      {/* Add demoUrl and sourceUrl fields */}
                      <input
                        type="url"
                        placeholder="Demo URL (optional)"
                        value={editingProject.demoUrl || ""}
                        onChange={(e) =>
                          setEditingProject({
                            ...editingProject,
                            demoUrl: e.target.value,
                          })
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                      />
                      <input
                        type="url"
                        placeholder="Source URL (optional)"
                        value={editingProject.sourceUrl || ""}
                        onChange={(e) =>
                          setEditingProject({
                            ...editingProject,
                            sourceUrl: e.target.value,
                          })
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                      />
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`featured-${project.id}`}
                          checked={editingProject.featured}
                          onChange={(e) =>
                            setEditingProject({
                              ...editingProject,
                              featured: e.target.checked,
                            })
                          }
                          className="mr-2"
                        />
                        <label
                          htmlFor={`featured-${project.id}`}
                          className="text-gray-300"
                        >
                          Featured
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            editingProject &&
                            typeof editingProject.id === "number" &&
                            updateProject(editingProject)
                          }
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={() => setEditingProject(null)}
                          className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                            {project.title}
                            {project.featured && (
                              <Star className="w-4 h-4 text-yellow-400" />
                            )}
                          </h3>
                          <p className="text-gray-300 mt-2">
                            {project.description}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {project.demoUrl && (
                            <a
                              href={project.demoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          {project.sourceUrl && (
                            <a
                              href={project.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-400 hover:text-green-300"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(typeof project.tech === "string"
                          ? project.tech
                              .split(",")
                              .map((t) => t.trim())
                              .filter((t) => t)
                          : Array.isArray(project.tech)
                          ? project.tech
                          : []
                        ).map((tech, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-blue-900 text-blue-200 rounded text-sm"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingProject(project)}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors text-sm"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition-colors text-sm"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === "skills" && (
          <div>
            <h2 className="text-3xl font-bold mb-8">Skills & Learning</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Skills</h3>
                  <button
                    onClick={() => setEditingSkills(!editingSkills)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    {editingSkills ? "Cancel" : "Edit"}
                  </button>
                </div>

                {editingSkills ? (
                  <div className="space-y-4">
                    {data.skills.map((skill, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <input
                          type="text"
                          value={skill.name}
                          onChange={(e) => {
                            const newSkills = [...data.skills];
                            newSkills[index].name = e.target.value;
                            setData({ ...data, skills: newSkills });
                          }}
                          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={skill.level}
                          onChange={(e) => {
                            const newSkills = [...data.skills];
                            newSkills[index].level = parseInt(e.target.value);
                            setData({ ...data, skills: newSkills });
                          }}
                          className="w-20 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                        />
                        <select
                          value={skill.category}
                          onChange={(e) => {
                            const newSkills = [...data.skills];
                            newSkills[index].category = e.target
                              .value as Skill["category"];
                            setData({ ...data, skills: newSkills });
                          }}
                          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                        >
                          <option value="frontend">Frontend</option>
                          <option value="backend">Backend</option>
                          <option value="tools">Tools</option>
                          <option value="database">Database</option>
                          <option value="other">Other</option>
                        </select>
                        <button
                          onClick={() => {
                            const newSkills = data.skills.filter(
                              (_, i) => i !== index
                            );
                            setData({ ...data, skills: newSkills });
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newSkill: Skill = {
                          name: "",
                          level: 50,
                          category: "other",
                        };
                        setData({
                          ...data,
                          skills: [...data.skills, newSkill],
                        });
                      }}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Skill
                    </button>
                    <button
                      onClick={() => updateSkills(data.skills)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.skills.map((skill, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">
                            {skill.name}
                          </span>
                          <span className="text-gray-400 text-sm">
                            {skill.level}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                            style={{ width: `${skill.level}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Currently Learning</h3>
                  <button
                    onClick={() => setEditingLearning(!editingLearning)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    {editingLearning ? "Cancel" : "Edit"}
                  </button>
                </div>

                {editingLearning ? (
                  <div className="space-y-4">
                    <textarea
                      value={data.currentlyLearning.join("\n")}
                      onChange={(e) => {
                        const newLearning = e.target.value.split("\n");
                        setData({ ...data, currentlyLearning: newLearning });
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white h-32 resize-none"
                      placeholder="Enter each technology on a new line"
                    />
                    <button
                      onClick={() =>
                        updateLearning(
                          data.currentlyLearning.filter((t) => t.trim() !== "")
                        )
                      }
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {data.currentlyLearning.map((tech, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
