import { useEffect, useRef, useState } from "react";
import {
  ClipboardList,
  Menu,
  Plus,
  Settings,
  Trash2,
  User,
  User2Icon,
  WifiOff,
  X,
} from "lucide-react";
import Spinner from "../components/Spinner";
import TodoApp from "./TodoApp";
import axiosInstance from "../../middleware/axiosInstance";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useNetwork } from "../components/useNetwork";

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(menuItems[0] || {});
  const [loading, setLoading] = useState(true);
  const [loading2, setLoading2] = useState(false);
  const [searchParams] = useSearchParams();
  const wid = searchParams.get("wid");
  const [workspaceError, setWorkspaceError] = useState("");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [showWorkspaceModel, setShowWorkspaceModel] = useState(false);
  const [showWorkspaceDeleteModal, setShowWorkspaceDeleteModal] =
    useState(false);
  const [workspaceName, setWorkspaceName] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const { online, setOnline, session, setSession, soundEnabled } = useNetwork();
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'push-sound') {
        console.log('Received push-sound message in Dashboard:', event.data);
        if (soundEnabled) {
          try {
            const audio = new Audio('/audio.mp3');
            audio.volume = 0.5;
            audio.play().catch(error => {
              console.error('Error playing notification sound:', error);
            });
          } catch (error) {
            console.error('Error creating audio:', error);
          }
        }
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
    };
  }, [soundEnabled]);
  

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigate = useNavigate();

  const handleNavigation = (item) => {
    setCurrentWorkspace(item);
    localStorage.setItem("wid", item.w_id);
    setCurrentPage(1);
    console.log("navigate to ", item.w_name);
    navigate(`/dashboard?wid=${item.w_id}`, { replace: true });
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  const handleLogout = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      let subscription = await registration.pushManager.getSubscription();
      subscription = JSON.parse(JSON.stringify(subscription));
      await axiosInstance.post("unsubscribe", {
        endpoint: subscription.endpoint,
        expirationTime: null,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      });
    } catch (error) {
      console.error("Error unsubscribing:", error);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("wid");
    navigate("/login", { replace: true });
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("workspace/");
      const workspaces = response.data?.data || [];
      setMenuItems(workspaces);
    } catch (err) {
      if (err.code === "ERR_NETWORK") {
        setOnline(false);
        return;
      } else if (err.status === 401) {
        setSession(false);
        return;
      }
      console.error("Error fetching menu items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  useEffect(() => {
    const fetchcurrentWorkspaceId = () => {
      try {
        if (menuItems.length === 0) {
          navigate(`/dashboard`, { replace: true });
          return;
        }
        const storedWid = localStorage.getItem("wid");
        const selectedWorkspaceWid = menuItems.find(
          (item) => String(item.w_id) === String(wid)
        );
        const selectedWorkspaceStoredWid = menuItems.find(
          (item) => String(item.w_id) === String(storedWid)
        );
        if (selectedWorkspaceWid) {
          setCurrentWorkspace(selectedWorkspaceWid);
          navigate(`/dashboard?wid=${selectedWorkspaceWid.w_id}`, {
            replace: true,
          });
        } else if (selectedWorkspaceStoredWid) {
          setCurrentWorkspace(selectedWorkspaceStoredWid);
          navigate(`/dashboard?wid=${selectedWorkspaceStoredWid.w_id}`, {
            replace: true,
          });
        } else {
          const fallbackWorkspace = menuItems[0];
          setCurrentWorkspace(fallbackWorkspace);
          navigate(`/dashboard?wid=${fallbackWorkspace.w_id}`, {
            replace: true,
          });
        }
      } catch (err) {
        console.error("Error setting current workspace:", err);
      }
    };

    fetchcurrentWorkspaceId();
  }, [menuItems, searchParams, navigate, wid]);

  async function addWorkspace() {
    if (!workspaceName.trim()) {
      setWorkspaceError("Workspace name should not empty.");
      return;
    }
    if (workspaceName.length > 20) {
      setWorkspaceError("Workspace name should not exceed 20 characters.");
      return;
    }
    try {
      setLoading2(true);
      const response = await axiosInstance.post("workspace/", {
        w_name: workspaceName,
      });
      if (response.status === 200) {
        const new_wid = response.data.wid;
        localStorage.setItem("wid", new_wid);

        const newWorkspace = { w_id: new_wid, w_name: workspaceName };
        setShowWorkspaceModel(false);
        setWorkspaceName("");
        setWorkspaceError("");
        setCurrentWorkspace(newWorkspace);
        if (window.innerWidth < 768) {
          toggleSidebar();
        }
        window.location.replace(`/dashboard?wid=${new_wid}`);
      } else {
        setWorkspaceError("Failed to create workspace. Please try again.");
      }
    } catch (err) {
      if (err.code === "ERR_NETWORK") {
        setOnline(false);
        setWorkspaceError("");
        setWorkspaceName("");
        setShowWorkspaceModel(false);
        return;
      } else if (err.status === 401) {
        setShowWorkspaceModel(false);
        setSession(false);
        return;
      } else if (err.response && err.response.data && err.response.data.error) {
        setWorkspaceError(err.response.data.error);
      } else {
        setWorkspaceError("An unexpected error occurred. Please try again.");
      }
      console.error("Error creating workspace:", err);
    } finally {
      setLoading2(false);
    }
  }

  async function deleteWorkspace() {
    if (!currentWorkspace.w_id) {
      return;
    }
    try {
      setLoading2(true);
      const response = await axiosInstance.delete(
        `workspace/?wid=${currentWorkspace.w_id}`
      );
      if (response.status === 200) {
        setShowWorkspaceDeleteModal(false);
        localStorage.removeItem("wid");
        const updatedMenu = menuItems.filter(
          (item) => item.w_id !== currentWorkspace.w_id
        );
        setMenuItems(updatedMenu);

        if (updatedMenu.length > 0) {
          const nextWorkspace = updatedMenu[0];
          setCurrentWorkspace(nextWorkspace);
          localStorage.setItem("wid", nextWorkspace.w_id);
          navigate(`/dashboard?wid=${nextWorkspace.w_id}`, { replace: true });
          setCurrentPage(1);
        } else {
          setCurrentWorkspace({});
          localStorage.removeItem("wid");
          navigate(`/dashboard`, { replace: true });
        }
      } else {
        setWorkspaceError("Failed to delete workspace. Please try again.");
      }
    } catch (err) {
      if (err.code === "ERR_NETWORK") {
        setOnline(false);
        setWorkspaceError("");
        setShowWorkspaceDeleteModal(false);
        return;
      } else if (err.status === 401) {
        setSession(false);
        setShowWorkspaceDeleteModal(false);
        return;
      } else if (err.response && err.response.data && err.response.data.error) {
        setWorkspaceError(err.response.data.error);
      } else {
        setWorkspaceError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading2(false);
    }
  }

  function handleCreateWorkspace(value) {
    setShowWorkspaceModel(value);
  }

  return (
    <div className="">
      {loading ? (
        <div className="h-dvh flex flex-col justify-center items-center">
          <Spinner />
        </div>
      ) : (
        <div className="flex h-screen bg-gray-50">
          <>
            {isSidebarOpen && (
              <div
                className="fixed inset-0 bg-opacity-50 z-40 sm:hidden"
                onClick={toggleSidebar}
              />
            )}

            <div
              className={`
                  fixed top-0 left-0 flex flex-col h-screen min-w-64 bg-yellow-100 shadow-lg transform transition-transform duration-300 ease-in-out z-100
                  ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
                  md:translate-x-0 md:static md:shadow-none
                `}
            >
              <div className="flex flex-col my-auto justify-start py-4 h-5/6">
                <div className="flex items-center w-full justify-center relative">
                  <h1
                    className={`text-xl xl:text-3xl items-center sm:text-2xl font-bold text-yellow-600 bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text`}
                  >
                    <span>TaskSphere</span>
                  </h1>
                  <button
                    onClick={toggleSidebar}
                    className="absolute right-4 p-2 rounded-lg hover:bg-red-200 hover:text-red-500 md:hidden"
                  >
                    <X size={20} />
                  </button>
                </div>

                <nav className="h-5/6 xl:h-4/5 flex flex-col py-3">
                  <div className="px-4 mb-4">
                    <button
                      onClick={() => {
                        handleCreateWorkspace(true);
                      }}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 xl:py-3 xl:px-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 font-medium xl:text-lg"
                    >
                      <span>+ Create Workspace</span>
                    </button>
                  </div>
                  <div className="border-b border-yellow-700 mx-4 mb-2"></div>
                  <div className="flex-1 overflow-y-auto">
                    <ul className=" px-4">
                      {menuItems.length === 0 && (
                        <div className="w-full h-full flex justify-center items-center">
                          <ClipboardList
                            size={64}
                            className="text-yellow-300 opacity-60 animate-pulse"
                          />
                          <li className="text-yellow-700 text-center">
                            No Workspaces Available
                          </li>
                        </div>
                      )}
                      {menuItems.map((item) => {
                        const isActive = currentWorkspace.w_id === item.w_id;
                        return (
                          <li className="" key={item.w_id}>
                            <div
                              className={`flex flex-row justify-between items-center px-4 rounded-lg ${
                                isActive
                                  ? "bg-yellow-200 text-yellow-700"
                                  : "text-yellow-700 hover:bg-yellow-200"
                              }`}
                            >
                              <button
                                onClick={() => handleNavigation(item)}
                                className={`
                                  w-full flex items-center space-x-3 py-3 xl:py-3
                                  rounded-lg text-left transition-colors duration-200 xl:text-lg
                                `}
                              >
                                {item.w_name.length <= 15
                                  ? item.w_name
                                  : item.w_name.slice(0, 15) + "..."}
                              </button>
                              {isActive && (
                                <button
                                  onClick={() =>
                                    setShowWorkspaceDeleteModal(true)
                                  }
                                  className="p-2 hover:text-red-600 hover:bg-red-300 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 text-red-700" />
                                </button>
                              )}
                            </div>
                            <div className="border-b border-yellow-300 mx-4 mb-2"></div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </nav>
              </div>
              <div className="px-4 mb-4 xl:mb-8">
                <button
                  onClick={() => {
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 xl:py-3 xl:px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-semibold"
                >
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </>

          <div className="flex-1 flex flex-col md:ml-0">
            {menuItems.length > 0 && (
              <header className="bg-yellow-500 shadow-sm px-4 py-3 md:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 w-full">
                    <button
                      onClick={toggleSidebar}
                      className="p-2 rounded-lg md:hidden"
                    >
                      <Menu size={24} className="text-white font-bold" />
                    </button>
                    <div className="text-lg xl:text-xl w-full font-bold text-white flex flex-row items-center justify-between space-x-4 ">
                      {currentWorkspace.w_name}
                      <div className="relative px-4" ref={dropdownRef}>
                        <button
                          onClick={() =>
                            setShowProfileDropdown(!showProfileDropdown)
                          }
                          className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 rounded-full"
                        >
                          <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center hover:bg-yellow-100 transition-colors">
                            <User className="w-5 h-5 text-yellow-800" />
                          </div>
                        </button>
                        {showProfileDropdown && (
                          <ProfileDropdown
                            setShowProfileDropdown={setShowProfileDropdown}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </header>
            )}
            <main className="flex-1 overflow-y-auto">
              {menuItems.length > 0 ? (
                <TodoApp
                  workspaceName={currentWorkspace.w_name}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                />
              ) : (
                <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100">
                  <div className="text-center py-16 px-6">
                    <div className="max-w-4xl mx-auto">
                      <h1 className="text-xl xl:text-3xl font-bold text-yellow-600 mb-6">
                        Create a Workspace
                      </h1>

                      {/* Subtitle */}
                      <p className="text-md xl:text-xl text-gray-600 mb-8 mx-auto leading-relaxed">
                        Increase your productivity by creating new workspace for
                        managing your tasks.
                      </p>

                      {/* CTA Button */}
                      <button
                        onClick={() => {
                          handleCreateWorkspace(true);
                        }}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-xl text-lg shadow-lg transform hover:scale-105 transition-all duration-200 hover:shadow-xl"
                      >
                        <Plus className="w-6 h-6 inline-block mr-2" />
                        Create Your First Workspace
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      )}
      {showWorkspaceModel && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center p-4 z-100"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
        >
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center justify-between px-6 pt-6">
              <h2 className="text-xl font-semibold">Create New Workspace</h2>
              <button
                onClick={() => {
                  setShowWorkspaceModel(false);
                  setWorkspaceName("");
                  setWorkspaceError("");
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
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter workspace name..."
                  />
                </div>
              </div>
              <div>
                {workspaceError && (
                  <p className="text-red-500 text-sm mt-2">{workspaceError}</p>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowWorkspaceModel(false);
                    setWorkspaceError("");
                    setWorkspaceName("");
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 xl:text-lg rounded-md font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={loading2}
                  onClick={addWorkspace}
                  className="flex-1 bg-black hover:bg-gray-700 text-white px-4 py-2 xl:text-lg font-semibold rounded-md transition-colors"
                >
                  {loading2 ? <Spinner style="inline w-4 h-4" /> : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showWorkspaceDeleteModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center p-4 z-100"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
        >
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center justify-end px-3 pt-3">
              <button
                onClick={() => {
                  setShowWorkspaceDeleteModal(false);
                  setWorkspaceError("");
                }}
                className=" text-gray-400 hover:text-gray-600"
              >
                <X className="w-8 h-8 text-red-500 hover:bg-red-200 hover:text-red-500 p-1 rounded-lg" />
              </button>
            </div>
            <div className="flex flex-col gap-3 px-4 py-3">
              <h2 className="text-xl font-semibold break-words">
                Are you sure you want to delete the workspace{" "}
                <span className="text-red-500">
                  "{currentWorkspace.w_name}"{" "}
                </span>
                ?
              </h2>
              <div>
                {workspaceError && (
                  <p className="text-red-500 text-sm mt-2">{workspaceError}</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowWorkspaceDeleteModal(false);
                    setWorkspaceError("");
                  }}
                  className="flex-1 bg-black hover:bg-gray-700 text-white px-4 py-2 xl:text-lg rounded-md font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={loading2}
                  onClick={deleteWorkspace}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 xl:text-lg font-semibold rounded-md transition-colors"
                >
                  {loading2 ? <Spinner style="inline w-4 h-4" /> : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!online && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center p-4 z-100"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
        >
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6 pb-4">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-yellow-200 p-3 rounded-full">
                  <WifiOff className="w-8 h-8 text-yellow-700" />
                </div>
              </div>

              <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">
                No Internet Connection
              </h2>

              <p className="text-gray-600 text-center text-sm leading-relaxed">
                Please check your network connection and try again. Make sure
                you're connected to Wi-Fi or mobile data.
              </p>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={() => {
                  setOnline(true);
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 xl:py-3 xl:px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-semibold"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {!session && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center p-4 z-100"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
        >
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6 pb-4">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-yellow-200 p-3 rounded-full">
                  <User2Icon className="w-8 h-8 text-yellow-700" />
                </div>
              </div>

              <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">
                Session Expired
              </h2>

              <p className="text-gray-600 text-center text-sm leading-relaxed">
                Your session has been expired. Please try to login or create a
                new account.
              </p>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={() => {
                  setSession(true);
                  localStorage.removeItem("token");
                  localStorage.removeItem("wid");
                  navigate("/login", { replace: true });
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 xl:py-3 xl:px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-semibold"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

function ProfileDropdown({ setShowProfileDropdown }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchPersonalInfo = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get("auth/profile");
        setUsername(response.data.username);
        setEmail(response.data.email);
        console.log(response);
      } catch (error) {
        console.error("Error fetching personal info:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPersonalInfo();
  }, []);

  return (
    <div className="absolute top-16 right-0 bg-white rounded-lg shadow-lg border border-yellow-200 w-56 z-100">
      <div className="p-4 w-full flex flex-row justify-center items-center border-b border-yellow-100">
        {isLoading ? (
          <Spinner style={"text-black"} />
        ) : (
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-yellow-800" />
            </div>
            <div>
              <h2 className="font-semibold text-black">
                {username.length > 10
                  ? username.slice(0, 10) + "..."
                  : username}
              </h2>
              <p className="text-sm text-black">
                {email.length > 15 ? email.slice(0, 15) + "..." : email}
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="p-2">
        <button
          onClick={() => {
            setShowProfileDropdown(false);
            navigate("/settings");
          }}
          className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-yellow-50 rounded-md transition-colors"
        >
          <Settings className="w-6 h-6 text-yellow-600" />
          <span className="text-lg text-black">Settings</span>
        </button>
      </div>
    </div>
  );
}
