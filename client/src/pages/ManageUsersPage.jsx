import React, { useState, useEffect } from "react";
import { Edit2, Trash2, Shield, User, Crown, Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../components/AuthProvider";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import useApi from "../hooks/useApi";

const ManageUsersPage = () => {
  const { currentUser, hasRole, loading: authLoading } = useAuth();
  const { makeApiCall, loading: apiLoading, error: apiError } = useApi();
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [newRoleId, setNewRoleId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [usersPerPage] = useState(10);
  const [isInitialMount, setIsInitialMount] = useState(true);
  const [sortField, setSortField] = useState("userId");
  const [sortDirection, setSortDirection] = useState("asc");
  const [roleFilter, setRoleFilter] = useState("");
  const navigate = useNavigate();

  const roles = [
    { id: 1, name: "user", displayName: "User", icon: User, color: "text-gray-400" },
    { id: 2, name: "content_manager", displayName: "Content Manager", icon: Edit2, color: "text-blue-400" },
    { id: 3, name: "moderator", displayName: "Moderator", icon: Shield, color: "text-green-400" },
    { id: 4, name: "admin", displayName: "Admin", icon: Crown, color: "text-yellow-400" },
    { id: 5, name: "super_admin", displayName: "Super Admin", icon: Crown, color: "text-red-400" },
  ];

  const getRoleInfo = (roleName) => {
    return roles.find((role) => role.name === roleName) || { displayName: "Unknown", icon: User, color: "text-gray-400" };
  };

  const getRoleByName = (roleName) => {
    return roles.find((role) => role.name === roleName);
  };

  const canEditUser = (targetUser) => {
    const currentUserRole = currentUser?.role_name;
    const targetRoleName = targetUser.role_name;

    if (currentUserRole === "super_admin") {
      return targetRoleName !== "super_admin";
    }

    if (currentUserRole === "admin") {
      return ["user", "content_manager", "moderator"].includes(targetRoleName);
    }

    return false;
  };

  const canDeleteUser = (targetUser) => {
    const currentUserRole = currentUser?.role_name;
    const targetRoleName = targetUser.role_name;

    if (currentUserRole === "super_admin") {
      return targetRoleName !== "super_admin";
    }

    if (currentUserRole === "admin") {
      return ["user", "content_manager", "moderator"].includes(targetRoleName);
    }

    return false;
  };

  const getAvailableRoles = () => {
    const currentUserRole = currentUser?.role_name;

    if (currentUserRole === "super_admin") {
      return roles.filter((role) => role.name !== "super_admin");
    }

    if (currentUserRole === "admin") {
      return roles.filter((role) => ["user", "content_manager", "moderator"].includes(role.name));
    }

    return [];
  };

  const fetchUsers = async (page = 1, search = "", sort = sortField, direction = sortDirection, role = roleFilter) => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: usersPerPage.toString(),
        ...(search && { search }),
        ...(sort && { sortBy: sort }),
        ...(direction && { sortOrder: direction }),
        ...(role && { role }),
      });

      const data = await makeApiCall(`/admin/users?${queryParams}`, "GET");
      if (data.status !== "success" || !Array.isArray(data.data)) {
        throw new Error(data.message || "Unexpected API response format");
      }

      setUsers(data.data);
      if (data.pagination) {
        setCurrentPage(data.pagination.currentPage);
        setTotalPages(data.pagination.totalPages);
        setTotalUsers(data.pagination.totalUsers);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast.error(err.message || "Failed to load users");
    }
  };

  const handleUpdateUserRole = async (userId, roleName) => {
    try {
      const role = getRoleByName(roleName);
      if (!role) {
        throw new Error("Invalid role selected");
      }

      const data = await makeApiCall(`/admin/users/${userId}`, "PUT", { role_name: roleName });
      if (data.status !== "success") {
        throw new Error(data.message || "Failed to update user role");
      }

      setUsers(users.map((user) =>
        user.userId === userId
          ? { ...user, role_name: roleName, role: data.data.role }
          : user
      ));

      setEditingUser(null);
      setNewRoleId("");
      toast.success("User role updated successfully!");
    } catch (err) {
      console.error("Error updating user role:", err);
      toast.error(err.message || "Failed to update user role");
    }
  };

  const handleDeleteUser = async (userId) => {
    const user = users.find((u) => u.userId === userId);
    if (!window.confirm(`Are you sure you want to delete user "${user?.username}"?`)) {
      return;
    }

    try {
      const data = await makeApiCall(`/admin/users/${userId}`, "DELETE");
      if (data.status !== "success") {
        throw new Error(data.message || "Failed to delete user");
      }

      setUsers(users.filter((user) => user.userId !== userId));
      toast.success("User deleted successfully!");
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error(err.message || "Failed to delete user");
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

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchUsers(newPage, searchTerm, sortField, sortDirection, roleFilter);
    }
  };

  const handleSort = (field) => {
    const newDirection = field === sortField && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(newDirection);
    setCurrentPage(1);
    fetchUsers(1, searchTerm, field, newDirection, roleFilter);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const handleRoleFilter = (role) => {
    setRoleFilter(role);
    setCurrentPage(1);
    fetchUsers(1, searchTerm, sortField, sortDirection, role);
  };

  useEffect(() => {
    if (isInitialMount) {
      setIsInitialMount(false);
      return;
    }

    const delayedSearch = setTimeout(() => {
      setCurrentPage(1);
      fetchUsers(1, searchTerm, sortField, sortDirection, roleFilter);
    }, 50);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, isInitialMount]);

  useEffect(() => {
    if (!isInitialMount && currentUser && hasRole("admin", "super_admin")) {
      setCurrentPage(1);
      fetchUsers(1, searchTerm, sortField, sortDirection, roleFilter);
    }
  }, [sortField, sortDirection, roleFilter, currentUser, hasRole, isInitialMount]);

  useEffect(() => {
    if (!authLoading && currentUser && !hasRole("admin", "super_admin")) {
      navigate("/");
      toast.error("Access denied. Admin privileges required.");
    }
  }, [currentUser, hasRole, authLoading, navigate]);

  useEffect(() => {
    if (currentUser && hasRole("admin", "super_admin")) {
      fetchUsers(1, "", "userId", "asc", "");
    }
  }, [currentUser, hasRole]);

  if (authLoading || apiLoading) {
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold mb-2">Manage Users</h2>
          <p className="text-gray-300">
            Manage user roles and permissions. You can update roles and delete users based on your permissions.
          </p>
        </motion.div>

        {apiError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500/20 backdrop-blur-md rounded-xl p-6 border border-red-400/30 mb-8"
          >
            <p className="text-red-300">{apiError}</p>
            <button
              onClick={() => fetchUsers(currentPage, searchTerm, sortField, sortDirection, roleFilter)}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full transition-all duration-300"
              aria-label="Retry loading users"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-white/5 border border-white/20 rounded-xl"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Filters:</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Role:</label>
              <select
                value={roleFilter}
                onChange={(e) => handleRoleFilter(e.target.value)}
                className="bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm"
                aria-label="Filter by role"
              >
                <option value="" className="bg-gray-800 text-white">All Roles</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.name} className="bg-gray-800 text-white">
                    {role.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Sort by:</label>
              <select
                value={sortField}
                onChange={(e) => handleSort(e.target.value)}
                className="bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm"
                aria-label="Sort by field"
              >
                <option value="userId" className="bg-gray-800 text-white">User ID</option>
                <option value="points" className="bg-gray-800 text-white">Points</option>
                <option value="createdAt" className="bg-gray-800 text-white">Created Date</option>
              </select>
            </div>
            <button
              onClick={() => {
                setRoleFilter("");
                setSortField("userId");
                setSortDirection("asc");
                setSearchTerm("");
                setCurrentPage(1);
                fetchUsers(1, "", "userId", "asc", "");
              }}
              className="px-4 py-2 text-sm bg-white/10 border border-white/20 hover:bg-white/20 text-white rounded-xl transition-colors backdrop-blur-sm"
              aria-label="Reset filters"
            >
              Reset
            </button>
          </div>
        </motion.div>

        {/* Search and Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by username"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 text-white placeholder-gray-400 border border-white/20 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Search users by username"
            />
            {apiLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              </div>
            )}
          </div>
          <div className="text-sm text-gray-300">
            Showing {users.length} of {totalUsers} users
            {searchTerm && ` (filtered by "${searchTerm}")`}
            {roleFilter && ` (role: ${getRoleInfo(roleFilter).displayName})`}
            {sortField && ` (sorted by ${sortField} ${sortDirection})`}
          </div>
        </motion.div>

        {/* Users List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white/5 border border-white/20 rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/10">
                <tr>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => handleSort("userId")}
                  >
                    <div className="flex items-center gap-2">
                      User
                      {getSortIcon("userId")}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Current Role
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => handleSort("points")}
                  >
                    <div className="flex items-center gap-2">
                      Points
                      {getSortIcon("points")}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center gap-2">
                      Created
                      {getSortIcon("createdAt")}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                <AnimatePresence>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center gap-4"
                        >
                          <User className="w-16 h-16 text-gray-500" />
                          <div>
                            <p className="text-lg text-gray-400 mb-2">
                              {searchTerm || roleFilter ? "No users found matching your criteria" : "No users found"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {searchTerm && !roleFilter && `Try searching for a different username`}
                              {!searchTerm && roleFilter && `No users with the "${getRoleInfo(roleFilter).displayName}" role`}
                              {searchTerm && roleFilter && `No users with username "${searchTerm}" and role "${getRoleInfo(roleFilter).displayName}"`}
                              {!searchTerm && !roleFilter && "Users will appear here once they are registered"}
                            </p>
                            {(searchTerm || roleFilter) && (
                              <button
                                onClick={() => {
                                  setSearchTerm("");
                                  setRoleFilter("");
                                  setCurrentPage(1);
                                  fetchUsers(1, "", "userId", "asc", "");
                                }}
                                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                                aria-label="Clear filters"
                              >
                                Clear Filters
                              </button>
                            )}
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
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
                                aria-label="Select new role"
                              >
                                {getAvailableRoles().map((role) => (
                                  <option key={role.id} value={role.name} className="bg-gray-800 text-white">
                                    {role.displayName}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="flex items-center gap-2">
                                <RoleIcon size={16} className={roleInfo.color} />
                                <span className={`font-medium ${roleInfo.color}`}>
                                  {roleInfo.displayName}
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
                                  aria-label="Save role change"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                                  aria-label="Cancel editing"
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
                                    aria-label="Edit user role"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                )}
                                {canDeleteUser(user) && (
                                  <button
                                    onClick={() => handleDeleteUser(user.userId)}
                                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                                    title="Delete User"
                                    aria-label="Delete user"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-6 flex justify-center items-center gap-2"
          >
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                const isCurrentPage = page === currentPage;

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
                          ? "bg-blue-600 text-white"
                          : "bg-white/10 border border-white/20 text-white hover:bg-white/20"
                      }`}
                      aria-label={`Go to page ${page}`}
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
              aria-label="Next page"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ManageUsersPage;