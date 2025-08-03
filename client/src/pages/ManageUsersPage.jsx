import React, { useState, useEffect } from "react";
import { Edit2, Trash2, Shield, User, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../components/AuthProvider";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const ManageUsersPage = () => {
  const { currentUser, hasRole, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [newRoleId, setNewRoleId] = useState("");
  const [csrfToken, setCsrfToken] = useState(null);
  const navigate = useNavigate();

  // Fetch CSRF token
  const fetchCsrfToken = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/csrf-token`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setCsrfToken(data.csrfToken);
        return data.csrfToken;
      }
    } catch (error) {
      console.error("Failed to fetch CSRF token:", error);
    }
    return null;
  };

  // Get headers with CSRF token
  const getHeaders = async () => {
    let token = csrfToken;
    if (!token) {
      token = await fetchCsrfToken();
    }
    return {
      "Content-Type": "application/json",
      ...(token && { "X-CSRF-Token": token }),
    };
  };

  const roles = [
    { id: 1, name: "user", displayName: "User", icon: User, color: "text-gray-400" },
    { id: 2, name: "content_manager", displayName: "Content Manager", icon: Edit2, color: "text-blue-400" },
    { id: 3, name: "moderator", displayName: "Moderator", icon: Shield, color: "text-green-400" },
    { id: 4, name: "admin", displayName: "Admin", icon: Crown, color: "text-yellow-400" },
    { id: 5, name: "super_admin", displayName: "Super Admin", icon: Crown, color: "text-red-400" },
  ];

  const getRoleInfo = (roleName) => {
    return roles.find(role => role.name === roleName) || { displayName: "Unknown", icon: User, color: "text-gray-400" };
  };

  const getRoleByName = (roleName) => {
    return roles.find(role => role.name === roleName);
  };

  const canEditUser = (targetUser) => {
    const currentUserRole = currentUser?.role_name;
    const targetRoleName = targetUser.role_name;
    
    // Super admin can edit anyone except other super admins
    if (currentUserRole === "super_admin") {
      return targetRoleName !== "super_admin";
    }
    
    // Admin can edit users, content managers, and moderators
    if (currentUserRole === "admin") {
      return ["user", "content_manager", "moderator"].includes(targetRoleName);
    }
    
    return false;
  };

  const canDeleteUser = (targetUser) => {
    const currentUserRole = currentUser?.role_name;
    const targetRoleName = targetUser.role_name;
    
    // Super admin can delete anyone except other super admins
    if (currentUserRole === "super_admin") {
      return targetRoleName !== "super_admin";
    }
    
    // Admin can delete users, content managers, and moderators
    if (currentUserRole === "admin") {
      return ["user", "content_manager", "moderator"].includes(targetRoleName);
    }
    
    return false;
  };

  const getAvailableRoles = () => {
    const currentUserRole = currentUser?.role_name;
    
    if (currentUserRole === "super_admin") {
      // Super admin can assign up to admin role
      return roles.filter(role => role.name !== "super_admin");
    }
    
    if (currentUserRole === "admin") {
      // Admin can assign up to moderator role
      return roles.filter(role => ["user", "content_manager", "moderator"].includes(role.name));
    }
    
    return [];
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch users");
      }
      
      const data = await response.json();
      setUsers(data.data || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update user role
  const handleUpdateUserRole = async (userId, roleName) => {
    try {
      const role = getRoleByName(roleName);
      if (!role) {
        toast.error("Invalid role selected");
        return;
      }
      
      const headers = await getHeaders();
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify({ role_name: roleName }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user role");
      }
      
      const result = await response.json();
      
      // Update the user in the local state
      setUsers(users.map(user => 
        user.userId === userId 
          ? { ...user, role_name: roleName, role: result.data.role }
          : user
      ));
      
      setEditingUser(null);
      setNewRoleId("");
      toast.success("User role updated successfully!");
    } catch (err) {
      console.error("Error updating user role:", err);
      toast.error(err.message);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    const user = users.find(u => u.userId === userId);
    if (!window.confirm(`Are you sure you want to delete user "${user?.username}"?`)) {
      return;
    }
    
    try {
      const headers = await getHeaders();
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers,
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete user");
      }
      
      setUsers(users.filter(user => user.userId !== userId));
      toast.success("User deleted successfully!");
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error(err.message);
    }
  };

  const startEditing = (user) => {
    setEditingUser(user);
    setNewRoleId(user.role_name);
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setNewRoleId("");
  };

  // Check admin permissions
  useEffect(() => {
    if (!authLoading && currentUser && !hasRole("admin", "super_admin")) {
      navigate('/');
      toast.error('Access denied. Admin privileges required.');
    }
  }, [currentUser, hasRole, authLoading, navigate]);

  // Fetch users on mount
  useEffect(() => {
    if (currentUser && hasRole("admin", "super_admin")) {
      fetchCsrfToken(); // Fetch CSRF token on mount
      fetchUsers();
    }
  }, [currentUser, hasRole]);

  if (authLoading || loading) {
    return (
      <div className="p-8 text-white text-center">
        <p className="text-lg">Loading users...</p>
      </div>
    );
  }

  if (!currentUser || !hasRole("admin", "super_admin")) {
    return (
      <div className="p-8 text-white text-center">
        <p className="text-lg text-red-300">Access Denied: Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="p-8 text-white">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Manage Users</h2>
          <p className="text-gray-300">
            Manage user roles and permissions. You can update roles and delete users based on your permissions.
          </p>
        </div>

        {/* Users List */}
        <div className="bg-white/5 border border-white/20 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Current Role
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                <AnimatePresence>
                  {users.map((user) => {
                    const roleInfo = getRoleInfo(user.role_name);
                    const RoleIcon = roleInfo.icon;
                    const isEditing = editingUser?.userId === user.userId;

                    return (
                      <motion.tr
                        key={user.userId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium">
                                {user.username?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-white">{user.username}</p>
                              <p className="text-sm text-gray-400">ID: {user.userId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <select
                              value={newRoleId}
                              onChange={(e) => setNewRoleId(e.target.value)}
                              className="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2"
                            >
                              {getAvailableRoles().map((role) => (
                                <option key={role.id} value={role.id} className="bg-gray-800">
                                  {role.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="flex items-center gap-2">
                              <RoleIcon size={16} className={roleInfo.color} />
                              <span className={`font-medium ${roleInfo.color}`}>
                                {roleInfo.name}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {user.points || 0}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isEditing ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleUpdateUserRole(user.userId, newRoleId)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              {canEditUser(user) && (
                                <button
                                  onClick={() => startEditing(user)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                                  title="Edit Role"
                                >
                                  <Edit2 size={16} />
                                </button>
                              )}
                              {canDeleteUser(user) && (
                                <button
                                  onClick={() => handleDeleteUser(user.userId)}
                                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                                  title="Delete User"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No users found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsersPage;
