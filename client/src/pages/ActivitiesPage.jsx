import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../components/AuthProvider";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

class ActivityErrorBoundary extends React.Component {
  state = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4 sm:px-6 text-white text-center">
          <h1 className="text-2xl sm:text-4xl font-bold mb-4">Manage Activities</h1>
          <p className="text-lg sm:text-xl text-red-300">{this.state.errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full transition-all duration-300 text-sm sm:text-base"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ActivitiesPage = () => {
  const { currentUser, hasRole, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState([]);
  const [newActivity, setNewActivity] = useState({ name: "", description: "", route: "" });
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch all activities
  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/activities`, {
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch activities");
      }
      const data = await response.json();
      if (data.status !== "success") {
        throw new Error(data.message || "Failed to fetch activities");
      }
      const validActivities = (data.data || []).map((activity) => ({
        ...activity,
        activityId: parseInt(activity.activityId, 10),
      })).filter((activity) => activity.activityId && !isNaN(activity.activityId) && activity.name);
      setActivities(validActivities);
      if (validActivities.length === 0 && data.data?.length > 0) {
        toast.error("No valid activities found. Please contact an administrator.");
      }
    } catch (err) {
      console.error("Failed to fetch activities:", err);
      toast.error(err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle activity creation
  const handleCreateActivity = async () => {
    if (!newActivity.name || !newActivity.description) {
      toast.error("Please fill in name and description fields");
      return;
    }
    if (newActivity.route && !newActivity.route.match(/^\/[a-zA-Z0-9-_/:]*$/)) {
      toast.error("Route must start with '/' and contain only letters, numbers, hyphens, underscores, or colons");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newActivity),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create activity");
      }
      const result = await response.json();
      console.log("Created activity:", result.data);
      setActivities([...activities, { ...result.data, activityId: parseInt(result.data.activityId, 10) }]);
      setNewActivity({ name: "", description: "", route: "" });
      toast.success("Activity created successfully!");
    } catch (err) {
      console.error("Error creating activity:", err);
      toast.error(err.message);
    }
  };

  // Handle activity update
  const handleUpdateActivity = async (activityId) => {
    if (!newActivity.name || !newActivity.description) {
      toast.error("Please fill in name and description fields");
      return;
    }
    if (newActivity.route && !newActivity.route.match(/^\/[a-zA-Z0-9-_/:]*$/)) {
      toast.error("Route must start with '/' and contain only letters, numbers, hyphens, underscores, or colons");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/activities/${activityId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newActivity),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update activity");
      }
      const result = await response.json();
      console.log("Updated activity:", result.data);
      setActivities(activities.map((a) =>
        a.activityId === activityId ? { ...result.data, activityId: parseInt(result.data.activityId, 10) } : a
      ));
      setNewActivity({ name: "", description: "", route: "" });
      setEditingActivityId(null);
      toast.success("Activity updated successfully!");
    } catch (err) {
      console.error("Error updating activity:", err);
      toast.error(err.message);
    }
  };

  // Handle activity deletion
  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm("Are you sure you want to delete this activity?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/activities/${activityId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete activity");
      }
      setActivities(activities.filter((a) => a.activityId !== activityId));
      toast.success("Activity deleted successfully!");
    } catch (err) {
      console.error("Error deleting activity:", err);
      toast.error(err.message);
    }
  };

  // Handle activity reordering
  const handleMoveActivity = async (index, direction) => {
    const newActivities = [...activities];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= activities.length) return;

    [newActivities[index], newActivities[newIndex]] = [newActivities[newIndex], newActivities[index]];

    const activityIds = newActivities.map((a) => a.activityId);
    if (activityIds.some(id => !id || isNaN(parseInt(id, 10)))) {
      console.error("Invalid activity IDs:", activityIds);
      toast.error("Cannot reorder activities: Invalid activity IDs");
      return;
    }

    try {
      console.log("Sending activityIds to reorder:", activityIds);
      const response = await fetch(`${API_BASE_URL}/api/activities/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ activities: newActivities.map(({ activityId }) => ({ activityId })) }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Reorder response error:", errorData);
        throw new Error(errorData.message || "Failed to reorder activities");
      }
      const result = await response.json();
      console.log("Reorder response:", result.data);
      setActivities(result.data.map((activity) => ({
        ...activity,
        activityId: parseInt(activity.activityId, 10),
      })));
      toast.success("Activity order updated!");
    } catch (err) {
      console.error("Error reordering activities:", err);
      toast.error(err.message);
    }
  };

  // Navigate to detailed edit page
  const handleEditMoreDetails = (activity) => {
    const targetRoute = activity.route || `/activity/${activity.name.toLowerCase().replace(/\s+/g, '-')}`;
    if (!targetRoute) {
      toast.error("No valid route defined for this activity.");
      return;
    }
    navigate(targetRoute);
  };

  // Fetch activities on mount for admins only
  useEffect(() => {
    if (!authLoading) {
      if (hasRole(3, 4, 5)) {
        fetchActivities();
      } else {
        setLoading(false);
      }
    }
  }, [authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4 sm:px-6 text-white text-center">
        <h1 className="text-2xl sm:text-4xl font-bold mb-4">Manage Activities</h1>
        <p className="text-lg sm:text-xl text-gray-300">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4 sm:px-6 text-white text-center">
        <h1 className="text-2xl sm:text-4xl font-bold mb-4">Manage Activities</h1>
        <p className="text-lg sm:text-xl text-red-300">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full transition-all duration-300 text-sm sm:text-base"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!hasRole(3, 4, 5)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4 sm:px-6 text-white text-center">
        <h1 className="text-2xl sm:text-4xl font-bold mb-4">Manage Activities</h1>
        <p className="text-lg sm:text-xl text-red-300">Access Denied: You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <ActivityErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4 sm:px-6 text-white text-center">
        <Toaster position="top-right" />
        <h1 className="text-2xl sm:text-4xl font-bold mb-6 sm:mb-8">Manage Activities</h1>

        {/* Admin Controls */}
        <div className="max-w-4xl mx-auto bg-white/5 border border-white/20 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Add Activity</h2>
          {/* Activity Creation/Update Form */}
          <div className="mb-6">
            <input
              type="text"
              value={newActivity.name}
              onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
              placeholder="Enter activity name"
              className="w-full bg-white/10 text-white p-3 rounded-lg mb-4 text-sm sm:text-base"
            />
            <textarea
              value={newActivity.description}
              onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
              placeholder="Enter activity description"
              className="w-full bg-white/10 text-white p-3 rounded-lg mb-4 text-sm sm:text-base"
              rows="4"
            />
            <input
              type="text"
              value={newActivity.route}
              onChange={(e) => setNewActivity({ ...newActivity, route: e.target.value })}
              placeholder="Enter activity route (e.g., /quiz)"
              className="w-full bg-white/10 text-white p-3 rounded-lg mb-4 text-sm sm:text-base"
            />
            <div className="flex justify-center gap-2 sm:gap-4 flex-wrap">
              <button
                onClick={editingActivityId ? () => handleUpdateActivity(editingActivityId) : handleCreateActivity}
                disabled={!newActivity.name || !newActivity.description}
                className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {editingActivityId ? "Update Activity" : "Create Activity"}
              </button>
            </div>
          </div>
          {/* Existing Activities */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-4">Existing Activities</h3>
            <AnimatePresence>
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.activityId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/10 p-4 rounded-lg mb-2"
                >
                  <div className="text-left mb-4 sm:mb-0">
                    <span className="font-medium text-sm sm:text-base">{activity.name || "Unnamed Activity"}</span>
                    <p className="text-xs sm:text-sm text-gray-300">{activity.description || "No description available"}</p>
                    <p className="text-xs sm:text-sm text-gray-400">Route: {activity.route || "Not set"}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-start sm:justify-end">
                    <button
                      onClick={() => handleMoveActivity(index, "up")}
                      disabled={index === 0}
                      className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-full disabled:opacity-50 min-w-[40px]"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      onClick={() => handleMoveActivity(index, "down")}
                      disabled={index === activities.length - 1}
                      className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-full disabled:opacity-50 min-w-[40px]"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      onClick={() => handleEditMoreDetails(activity)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-full transition-all duration-300 text-sm sm:text-base min-w-[40px]"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteActivity(activity.activityId)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-full transition-all duration-300 text-sm sm:text-base min-w-[80px]"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </ActivityErrorBoundary>
  );
};

export default ActivitiesPage;