import React, { useState, useEffect } from "react";
import { X, Users, Activity, Settings } from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ActivitiesPage from "./ActivitiesPage";
import ManageUsersPage from "./ManageUsersPage";

const AdminDashboard = () => {
  const { currentUser, hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("activities");

  // Check admin permissions
  useEffect(() => {
    if (!authLoading && currentUser && !hasRole("content_manager", "moderator", "admin", "super_admin")) {
      navigate('/');
    }
  }, [currentUser, hasRole, authLoading, navigate]);

  // Set active tab based on URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/admin/users')) {
      setActiveTab("users");
    } else if (path.includes('/admin/activities')) {
      setActiveTab("activities");
    }
  }, [location.pathname]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Update URL without triggering a full navigation
    const newPath = `/admin/${tab}`;
    window.history.pushState(null, '', newPath);
  };

  const handleClose = () => {
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!currentUser || !hasRole("content_manager", "moderator", "admin", "super_admin")) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Access Denied</div>
      </div>
    );
  }

  const sidebarItems = [
    {
      id: "activities",
      label: "Manage Activities",
      icon: Activity,
      allowedRoles: ["content_manager", "moderator", "admin", "super_admin"],
    },
    {
      id: "users",
      label: "Manage Users",
      icon: Users,
      allowedRoles: ["admin", "super_admin"],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-64 bg-black/30 border-r border-white/20 flex flex-col"
      >
        {/* Dashboard Header */}
        <div className="p-6 border-b border-white/20">
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-300 text-sm mt-2">
            Welcome, {currentUser?.username}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const hasAccess = hasRole(...item.allowedRoles);
              
              if (!hasAccess) return null;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                      activeTab === item.id
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-gray-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-white/20">
          <div className="flex items-center gap-3 text-gray-300">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {currentUser?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">{currentUser?.username}</p>
              <p className="text-xs text-gray-400">
                Role: {currentUser?.role_name}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-black/20 border-b border-white/20 p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white capitalize">
            {activeTab === "activities" ? "Manage Activities" : "Manage Users"}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 transition-all duration-200"
            title="Close Admin Dashboard"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            {activeTab === "activities" && (
              <motion.div
                key="activities"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <ActivitiesPage isEmbedded={true} />
              </motion.div>
            )}
            {activeTab === "users" && hasRole("admin", "super_admin") && (
              <motion.div
                key="users"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <ManageUsersPage />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
