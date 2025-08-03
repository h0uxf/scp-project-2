import React, { useState, useEffect } from "react";
import { Edit2, Trash2, Shield, User, Crown, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../components/AuthProvider";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const ManageUsersPage = () => {
  const { currentUser, hasRole, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newRoleId, setNewRoleId] = useState("");
  const [csrfToken, setCsrfToken] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [usersPerPage] = useState(10);
  const [isInitialMount, setIsInitialMount] = useState(true);
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

  // Fetch all users with pagination
  const fetchUsers = async (page = 1, search = "", isSearch = false) => {
    try {
      if (isSearch) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: usersPerPage.toString(),
        ...(search && { search })
      });
      
      const response = await fetch(`${API_BASE_URL}/api/admin/users?${queryParams}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch users");
      }
      
      const data = await response.json();
      setUsers(data.data || []);
      
      if (data.pagination) {
        setCurrentPage(data.pagination.currentPage);
        setTotalPages(data.pagination.totalPages);
        setTotalUsers(data.pagination.totalUsers);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast.error(err.message);
    } finally {
      if (isSearch) {
        setSearchLoading(false);
      } else {
        setLoading(false);
      }
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

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchUsers(newPage, searchTerm, !!searchTerm);
    }
  };

  // Debounced search - for all search term changes including empty string
  useEffect(() => {
    // Skip the initial mount to avoid duplicate API calls
    if (isInitialMount) {
      setIsInitialMount(false);
      return;
    }
    
    const delayedSearch = setTimeout(() => {
      setCurrentPage(1);
      fetchUsers(1, searchTerm, true); // Mark as search operation
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, isInitialMount]);

  // Check admin permissions
  useEffect(() => {
    if (!authLoading && currentUser && !hasRole("admin", "super_admin")) {
      navigate('/');
      toast.error('Access denied. Admin privileges required.');
    }
  }, [currentUser, hasRole, authLoading, navigate]);

  // Fetch users on mount - only run once when user is authenticated
  useEffect(() => {
    if (currentUser && hasRole("admin", "super_admin")) {
      fetchCsrfToken(); // Fetch CSRF token on mount
      fetchUsers(1, "", false); // Always start with empty search on mount, mark as initial load
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

        {/* Search and Stats */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by username"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 text-white placeholder-gray-400 border border-white/20 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              </div>
            )}
          </div>
          <div className="text-sm text-gray-300">
            Showing {users.length} of {totalUsers} users
            {searchTerm && ` (filtered by "${searchTerm}")`}
          </div>
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                const isCurrentPage = page === currentPage;
                
                // Show first, last, current, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        isCurrentPage
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return <span key={page} className="px-2 text-gray-400">...</span>;
                }
                return null;
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {users.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              {searchTerm ? `No users found matching "${searchTerm}".` : "No users found."}
            </p>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                  fetchUsers(1, "", false);
                }}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsersPage;
