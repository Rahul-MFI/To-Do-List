import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Filter,
  X,
  Check,
  Calendar,
  Flag,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  XCircle,
} from "lucide-react";
import Spinner from "../components/Spinner";
import axiosInstance from "../../middleware/axiosInstance";
import { useNetwork } from "../components/useNetwork";
import SuccessBar from "../components/SuccessBar";

const TodoApp = ({ workspaceName, currentPage, setCurrentPage }) => {
  const [tasks, setTasks] = useState([]);
  const [tasksPerPage, setTaskPerPage] = useState(5);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const { setSession } = useNetwork();

  const [currentTaskName, setcurrentTaskName] = useState("");

  // Form states
  const [taskName, setTaskName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("medium");

  const priorityMap = {
    low: 1,
    medium: 2,
    high: 3,
  };
  const priorityMapNumber = {
    1: "low",
    2: "medium",
    3: "high",
  };
  const [addTaskError, setAddTaskError] = useState("");
  const [addTaskSuccess, setAddTaskSuccess] = useState("");

  const [editTaskError, setEditTaskError] = useState("");
  const [editTaskSuccess, setEditTaskSuccess] = useState("");

  const [deleteMessage, setDeleteMessage] = useState("");
  const [isSuccessDelete, setIsSuccessDelete] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    completed: "",
    priority: "",
    dueBefore: "",
    sort: "created_at",
    order: "desc",
    crossedDeadline: "false"
  });

  // Pagination
  const [totalTasks, setTotalTasks] = useState(1);
  const totalPages = Math.ceil(totalTasks / tasksPerPage);

  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const showSuccess = (duration = 2000) => {
    setIsVisible(true);
    setIsAnimating(true);
    setTimeout(() => {
      hideSuccess();
    }, duration);
  };

  const hideSuccess = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      setDeleteMessage("");
      setIsSuccessDelete(false);
    }, 300);
  };

  const { setOnline } = useNetwork();

  const getLocalDate = (dateStr) => {
    const date = new Date(dateStr);
    const formatted = date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return formatted.toUpperCase();
  };

  const toDateTimeLocalIST = (dateString) => {
    const date = new Date(dateString);

    const zoned = new Date(
      date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );

    const year = zoned.getFullYear();
    const month = String(zoned.getMonth() + 1).padStart(2, "0");
    const day = String(zoned.getDate()).padStart(2, "0");
    const hours = String(zoned.getHours()).padStart(2, "0");
    const minutes = String(zoned.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const toDateTimeLocalISTNow = () => {
    const now = new Date();
    const istDate = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );

    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, "0");
    const day = String(istDate.getDate()).padStart(2, "0");
    const hours = String(istDate.getHours()).padStart(2, "0");
    const minutes = String(istDate.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const fetchTasks = async () => {
    if (workspaceName === "" || workspaceName == undefined) return;
    setIsLoading(true);
    try {
      let cleanFilters = {};

      if (filters.dueBefore && filters.dueBefore !== "") {
        cleanFilters.dueBefore = new Date(filters.dueBefore).toISOString();
      }

      if (filters.completed && filters.completed !== "") {
        cleanFilters.completed = filters.completed;
      }

      if (filters.priority && filters.priority !== "") {
        cleanFilters.priority = priorityMap[filters.priority];
      }

      if (filters.crossedDeadline && filters.crossedDeadline !== "false"){
        cleanFilters.dueBefore = new Date().toISOString()
      }

      cleanFilters.sort = filters.sort;
      cleanFilters.order = filters.order;

      const params = new URLSearchParams({
        ...cleanFilters,
        w_name: workspaceName,
        page: currentPage,
        limit: tasksPerPage,
      }).toString();

      const response = await axiosInstance.get(`workspace/task?${params}`);
      if (response.status === 200) {
        console.log("logging page task", response.data.tasks);
        setTasks(response.data.tasks);
        setTotalTasks(response.data.total_count);
        if (response.data.tasks < currentPage * tasksPerPage) {
          setCurrentPage(1);
        }
      }
    } catch (err) {
      if (err.status === 401) {
        setSession(false);
        return;
      } else if (err.code === "ERR_NETWORK") {
        setOnline(false);
        return;
      }
      console.error("Error fetching tasks:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const calculateTasksPerPage = () => {
      const screenHeight = window.innerHeight;
      const screenWidth = window.innerWidth;

      const reservedSpace = screenWidth >= 1280 ? 285 : 265;
      const availableHeight = screenHeight - reservedSpace;

      const rowHeight = screenWidth >= 1280 ? 105 : 88;
      const rows = Math.floor(availableHeight / rowHeight);

      setTaskPerPage(rows > 0 ? rows : 1);
    };

    calculateTasksPerPage();
    window.addEventListener("resize", calculateTasksPerPage);

    return () => window.removeEventListener("resize", calculateTasksPerPage);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [filters, currentPage, workspaceName]);

  // Add task
  const addTask = async () => {
    if (!taskName.trim()) {
      setAddTaskError("Task name is required.");
      return;
    }

    if (!deadline.trim()) {
      setAddTaskError("Deadline is required");
      return;
    }

    const deadlineDateTime = new Date(deadline);
    const now = new Date();

    if (isNaN(deadlineDateTime.getTime())) {
      setAddTaskError("Invalid date format");
      return;
    }

    if (deadlineDateTime <= now) {
      setAddTaskError("Deadline must be in the future");
      return;
    }

    const deadlineISO = deadlineDateTime.toISOString();
    try {
      setIsLoading2(true);
      const response = await axiosInstance.post(`/workspace/task`, {
        t_name: taskName,
        priority: priorityMap[priority],
        deadline: deadlineISO,
        w_name: workspaceName,
      });
      if (response.status === 200) {
        setAddTaskError("");
        setAddTaskSuccess("Task added successfully!");
        clearFilters();
        setTimeout(() => {
          fetchTasks();
        }, 0);
        setTimeout(() => {
          resetForm();
          setShowAddModal(false);
        }, 600);
      } else {
        setAddTaskError("Failed to add task. Please try again.");
      }
    } catch (err) {
      if (err.code === "ERR_NETWORK") {
        setOnline(false);
        resetForm();
        setShowAddModal(false);
        return;
      } else if (err.status === 401) {
        setShowAddModal(false);
        setSession(false);
        return;
      } else if (err.response && err.response.data && err.response.data.error) {
        console.log(err.response.data.error);
        setAddTaskError(err.response.data.error);
      } else {
        setAddTaskError("Failed to add task. Please try again.");
      }
    } finally {
      setIsLoading2(false);
    }
  };

  // Edit task
  const editTask = async () => {
    if (!taskName.trim()) {
      setEditTaskError("Task name is required.");
      return;
    }

    if (!deadline.trim()) {
      setEditTaskError("Deadline is required");
      return;
    }

    const deadlineDateTime = new Date(deadline);
    const now = new Date();

    if (isNaN(deadlineDateTime.getTime())) {
      setEditTaskError("Invalid date format");
      return;
    }

    if (deadlineDateTime <= now) {
      setEditTaskError("Deadline must be in the future");
      return;
    }

    const deadlineISO = deadlineDateTime.toISOString();
    try {
      setIsLoading2(true);
      const response = await axiosInstance.put(`tasks/`, {
        t_name: currentTaskName,
        t_name_updated: taskName,
        priority: priorityMap[priority],
        deadline: deadlineISO,
        w_name: workspaceName,
      });
      if (response.status === 200) {
        setEditTaskError("");
        setEditTaskSuccess("Task Edited successfully!");
        fetchTasks();
        setTimeout(() => {
          resetForm();
          setShowEditModal(false);
        }, 600);
      } else {
        setEditTaskError("Failed to edit task. Please try again.");
      }
    } catch (err) {
      if (err.code === "ERR_NETWORK") {
        setOnline(false);
        resetForm();
        setShowEditModal(false);
        return;
      } else if (err.status === 401) {
        setSession(false);
        setShowEditModal(false);
        return;
      } else if (err.response && err.response.data && err.response.data.error) {
        console.log(err.response.data.error);
        setEditTaskError(err.response.data.error);
      } else {
        setEditTaskError("Failed to edit task. Please try again.");
      }
    } finally {
      setIsLoading2(false);
    }
  };

  const toggleTaskCompletion = async (taskName, value) => {
    try {
      const response = await axiosInstance.patch(`tasks/`, {
        t_name: taskName,
        w_name: workspaceName,
        markCompleted: value,
      });
      if (response.status === 200) {
        await fetchTasks();
      }
    } catch (err) {
      if (err.code === "ERR_NETWORK") {
        setOnline(false);
        return;
      } else if (err.status === 401) {
        setSession(false);
        return;
      } else {
        console.log("Failed to toggle task completion:", err);
      }
    }
  };

  const deleteTask = async (taskName) => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.delete(`tasks/`, {
        data: { t_name: taskName, w_name: workspaceName },
      });
      console.log(response);
      if (response.status === 200) {
        await fetchTasks();
        setDeleteMessage("Task deleted successfully!");
        setIsSuccessDelete(true);
        showSuccess();
      } else {
        setIsSuccessDelete(false);
        setDeleteMessage("Failed to delete task");
        showSuccess();
      }
    } catch (err) {
      if (err.code === "ERR_NETWORK") {
        setOnline(false);
        return;
      } else if (err.status === 401) {
        setSession(false);
        setShowEditModal(false);
        return;
      } else {
        setDeleteMessage("Failed to delete task");
        setIsSuccessDelete(false);
        showSuccess();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setTaskName("");
    setDeadline("");
    setPriority("medium");
    setAddTaskError("");
    setEditTaskError("");
    setAddTaskSuccess("");
    setEditTaskSuccess("");
    setcurrentTaskName("");
  };

  const openEditModal = (task) => {
    setTaskName(task.t_name);
    setDeadline(toDateTimeLocalIST(task.deadline));
    setPriority(priorityMapNumber[task.priority]);
    setShowEditModal(true);
  };

  // Get sort order icon
  const getSortIcon = () => {
    if (filters.order === "asc") {
      return <ArrowUp className="w-4 h-4" />;
    } else {
      return <ArrowDown className="w-4 h-4" />;
    }
  };

  // Get sort order label
  const getSortOrderLabel = () => {
    const orderLabels = {
      deadline: filters.order === "asc" ? "Earliest First" : "Latest First",
      priority: filters.order === "asc" ? "Low to High" : "High to Low",
      created_at: filters.order === "asc" ? "Oldest First" : "Newest First",
    };
    return orderLabels[filters.sort] || "";
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      completed: "",
      priority: "",
      dueBefore: "",
      sort: "created_at",
      order: "desc",
    });
  };

  // Priority color classes
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 3:
        return "text-red-600 bg-red-200";
      case 2:
        return "text-yellow-600 bg-yellow-200";
      case 1:
        return "text-green-600 bg-green-200";
      default:
        return "text-gray-600 bg-gray-200";
    }
  };

  return (
    <div className="min-h-full bg-yellow-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm px-6 py-4 mb-6">
          <div className="flex flex-wrap gap-3 justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md  transition-colors ${"bg-blue-500 hover:bg-blue-600 text-white"}`}
              >
                <Filter className="w-5 h-5" />
              
              </button>

              {/* Active filter count */}
              {(filters.completed || filters.priority || filters.dueBefore) && (
                <div className="text-sm text-gray-600">
                  {
                    Object.entries(filters) // convert filters to [key, value] pairs
                      .filter(
                        ([key, value]) =>
                          ["completed", "dueBefore", "priority"].includes(
                            key
                          ) && Boolean(value)
                      )
                      .slice(0, 3).length
                  }{" "}
                  filter(s) active
                </div>
              )}
            </div>

            <div className="flex flex-row justify-center gap-4">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                Add Task
              </button>
              <button
                onClick={clearFilters}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white rounded-lg border">
              <div className="flex flex-wrap justify-between items-end gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.completed}
                    onChange={(e) =>
                      setFilters({ ...filters, completed: e.target.value })
                    }
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    <option value="true">Completed</option>
                    <option value="false">Not Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Priority
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) =>
                      setFilters({ ...filters, priority: e.target.value })
                    }
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Sort by
                  </label>
                  <select
                    value={filters.sort}
                    onChange={(e) =>
                      setFilters({ ...filters, sort: e.target.value })
                    }
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="created_at">Created</option>
                    <option value="deadline">Deadline</option>
                    <option value="priority">Priority</option>
                  </select>
                </div>

                {/* Sort Order Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Order by
                  </label>
                  <button
                    onClick={() => {
                      setFilters({
                        ...filters,
                        order: filters.order === "asc" ? "desc" : "asc",
                      });
                    }}
                    className="border border-gray-300 flex flex-row rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title={`Current: ${getSortOrderLabel()}`}
                  >
                    {getSortIcon()}
                    <span className="text-xs text-gray-600">
                      {getSortOrderLabel()}
                    </span>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Before Date
                  </label>
                  <input
                    type="datetime-local"
                    value={filters.dueBefore}
                    onChange={(e) =>
                      setFilters({ ...filters, dueBefore: e.target.value, crossedDeadline: "false" })
                    }
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Deadline
                  </label>
                  <select
                    value={filters.crossedDeadline}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        crossedDeadline: e.target.value,
                        dueBefore: (e.target.value === "true") ? toDateTimeLocalISTNow() : ""
                      })
                    }
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Task List changed */}
        <div className="bg-white rounded-lg shadow-sm">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Spinner />
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Check className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No tasks found. Add a new task to get started!</p>
            </div>
          ) : (
            <>
              {tasks.map((task) => (
                <div
                  key={task.t_name}
                  className={`border-b border-gray-300 p-4 xl:px-6 xl:py-4 hover:bg-gray-50 transition-colors ${
                    task.markCompleted ? "opacity-60" : ""
                  }`}
                > 
                  <div className="flex flex-col justify-center items-start gap-1 md:gap-2">
                    <div className="flex flex-row items-center gap-4">
                      <button
                        onClick={() =>
                          toggleTaskCompletion(
                            task.t_name,
                            task.markCompleted ? false : true
                          )
                        }
                        className={`w-6 h-6 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                          task.markCompleted
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-gray-300 hover:border-green-400"
                        }`}
                      >
                        {task.markCompleted && <Check className="w-4 h-4" />}
                      </button>
                      <h3
                          className={`font-medium ${
                            task.markCompleted
                              ? "line-through text-gray-500"
                              : "text-gray-800"
                          }`}
                        >
                          {task.t_name}
                        </h3>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex flex-wrap items-center gap-4 mt-2">
                        <span
                            className={`px-1 rounded text-sm font-medium ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            <Flag className="w-4 h-4 inline" />

                          </span>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className={`w-4 h-4 ${new Date(task.deadline) <= Date.now() ? "text-red-500" : "text-gray-500"}`} />
                          <span className={`${new Date(task.deadline) <= Date.now() ? "text-red-500 font-bold line-through" : "text-gray-500"}`}>{getLocalDate(task.deadline)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={task.markCompleted}
                          onClick={() => {
                            openEditModal(task);
                            setcurrentTaskName(task.t_name);
                          }}
                          className={`p-2 bg-blue-200 text-blue-600 rounded transition-colors ${
                            task.markCompleted
                              ? "cursor-not-allowed"
                              : "hover:bg-blue-300"
                          }`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            deleteTask(task.t_name);
                          }}
                          className={`p-2 bg-red-200 text-red-600 rounded transition-colors hover:bg-red-300`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Pagination */}
        {totalTasks > 0 && !isLoading && (
          <div className="flex flex-wrap justify-center items-center gap-2 py-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                currentPage === 1
                  ? ""
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              Previous
            </button>

            {(() => {
              const buttons = [];
 
              // Always show first page if it's not the current page
              if (currentPage !== 1) {
                buttons.push(
                  <button
                    key={1}
                    onClick={() => setCurrentPage(1)}
                    className="px-3 py-2 border rounded-md text-sm transition-colors border-gray-300 hover:bg-blue-100"
                  >
                    1
                  </button>
                );

                // Add dots after first page if there's a gap
                if (currentPage > 2) {
                  buttons.push(
                    <span key="dots-left" className="px-2 text-gray-500">
                      ...
                    </span>
                  );
                }
              }
 
              // Always show current page
              buttons.push(
                <button
                  key={currentPage}
                  onClick={() => setCurrentPage(currentPage)}
                  className="px-3 py-2 border rounded-md text-sm transition-colors bg-blue-500 text-white border-blue-500"
                >
                  {currentPage}
                </button>
              );
 
              // Always show last page if it's not the current page and there's more than 1 page
              if (currentPage !== totalPages && totalPages > 1) {
                // Add dots before last page if there's a gap
                if (currentPage < totalPages - 1) {
                  buttons.push(
                    <span key="dots-right" className="px-2 text-gray-500">
                      ...
                    </span>
                  );
                }

                buttons.push(
                  <button
                    key={totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="px-3 py-2 border rounded-md text-sm transition-colors border-gray-300 hover:bg-blue-100"
                  >
                    {totalPages}
                  </button>
                );
              }
 
              return buttons;
            })()}

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className={`px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                currentPage === totalPages
                  ? ""
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              Next
            </button>

            <span className="text-sm text-gray-600 ml-4">
              Showing {(currentPage - 1) * tasksPerPage + 1}-
              {Math.min(currentPage * tasksPerPage, totalTasks)} of {totalTasks}{" "}
              tasks
            </span>
          </div>
        )}

        {showAddModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center p-4 z-100"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
          >
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg shadow-lg max-w-md w-full">
              <div className="flex items-center justify-between  px-6 pt-6">
                <h2 className="text-xl font-semibold">Add New Task</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-8 h-8 text-red-500 hover:bg-red-200 hover:text-red-500 p-1 rounded-lg" />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Task Name
                    </label>
                    <input
                      type="text"
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter task name..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deadline
                    </label>
                    <input
                      type="datetime-local"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                {addTaskError && (
                  <p className="text-red-500 text-sm mt-2">{addTaskError}</p>
                )}
                {addTaskSuccess && (
                  <p className="text-green-500 text-md mt-2">
                    {addTaskSuccess}
                  </p>
                )}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 xl:text-lg font-semibold rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isLoading2}
                    onClick={addTask}
                    className="flex-1 bg-black hover:bg-gray-700 text-white py-2 px-4 xl:text-lg font-semibold rounded-md transition-colors"
                  >
                    {isLoading2 ? <Spinner /> : `Add Task`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Task Modal */}
        {showEditModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center p-4 z-100"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
          >
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg shadow-lg max-w-md w-full">
              <div className="flex items-center justify-between  px-6 pt-6">
                <h2 className="text-xl font-semibold">Edit Task</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-8 h-8 text-red-500 hover:bg-red-200 hover:text-red-500 p-1 rounded-lg" />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Task Name
                    </label>
                    <input
                      type="text"
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter task name..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deadline
                    </label>
                    <input
                      type="datetime-local"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                {editTaskError && (
                  <p className="text-red-500 text-sm mt-2">{editTaskError}</p>
                )}
                {editTaskSuccess && (
                  <p className="text-green-500 text-md mt-2">
                    {editTaskSuccess}
                  </p>
                )}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 xl:text-lg font-semibold rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isLoading2}
                    onClick={editTask}
                    className="flex-1 bg-black hover:bg-gray-700 text-white py-2 px-4 xl:text-lg font-semibold rounded-md transition-colors"
                  >
                    {isLoading2 ? <Spinner /> : `Edit Task`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isVisible && (
          <SuccessBar
            message={deleteMessage}
            isAnimating={isAnimating}
            hideSuccess={hideSuccess}
            isSuccessDelete={isSuccessDelete}
          />
        )}
      </div>
    </div>
  );
};

export default TodoApp;
