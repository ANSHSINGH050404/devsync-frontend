import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "../context/user.context";
import { PersonStanding, PlusSquare, UserIcon, X } from "lucide-react";
import axios from "../config/axios";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get("/projects/all");
      setProjects(res.data.projects || []);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setProjects([]);
    }
  };

  const handleOpenForm = () => setIsFormOpen(true);

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setProjectName("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) {
      alert("Please enter a project name");
      return;
    }
    setIsLoading(true);
    try {
      const res = await axios.post("/projects/create", {
        name: projectName.trim(),
      });
      const newProject =
        res.data.project ||
        res.data || {
          _id: Date.now().toString(),
          name: projectName.trim(),
        };
      setProjects((prevProjects) => [...prevProjects, newProject]);
      handleCloseForm();
    } catch (err) {
      console.error("Failed to create project:", err);
      alert("Failed to create project. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      {/* Create Project Button */}
      <div className="flex justify-start mb-8">
        <button
          onClick={handleOpenForm}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
        >
          <PlusSquare className="size-5" />
          <span className="text-sm font-medium">New Project</span>
        </button>
      </div>

      {/* Projects List */}
      <div className="mt-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Your Projects</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length > 0 ? (
            projects.map((project) => (
              <div
                key={project._id}
                onClick={() =>
                  navigate("/project", {
                    state: { project },
                  })
                }
                className="bg-white p-5 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-blue-200"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{project.name}</h3>
                <div className="flex items-center gap-2 text-gray-600">
                  <UserIcon className="size-4" />
                  <p className="text-sm">Collaborators: {project.users.length}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-gray-500 text-lg">No projects found. Create your first project!</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Create New Project</h2>
              <button
                onClick={handleCloseForm}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <X className="size-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="projectName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Project Name
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                  placeholder="Enter project name"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;