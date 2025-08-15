import React, { useState, useEffect } from "react";
import { Edit2, Trash2, Shield, User, Crown, Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Filter, Eye, X, Calendar, MapPin, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../components/AuthProvider";
import toast, { Toaster } from "react-hot-toast";
import useApi from "../hooks/useApi";

const ManageUsersPage = () => {
  const { currentUser, hasRole, loading: authLoading } = useAuth();
  const { makeApiCall, loading: apiLoading, error: apiError } = useApi();
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [newRoleId, setNewRoleId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchStr, setSearchStr] = useState("");
  const [usersPerPage] = useState(10);
  const [sortField, setSortField] = useState("userId");
  const [sortDirection, setSortDirection] = useState("asc");
  const [roleFilter, setRoleFilter] = useState("");
  const [hasInitialized, setHasInitialized] = useState(false);
  const [viewingActivities, setViewingActivities] = useState(null);
  const [userActivities, setUserActivities] = useState([]);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [activitiesTotalPages, setActivitiesTotalPages] = useState(1);
  const [loadingActivities, setLoadingActivities] = useState(false);

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

  // Client-side filtering, searching, and sorting
  const processUsers = (users, search, role, sort, direction) => {
    let processed = [...users];

    // Apply search filter
    if (search) {
      processed = processed.filter(user => 
        user.username.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply role filter
    if (role) {
      processed = processed.filter(user => user.role_name === role);
    }

    // Apply sorting
    processed.sort((a, b) => {
      let aVal = a[sort];
      let bVal = b[sort];

      if (sort === "createdAt") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (sort === "points") {
        aVal = aVal || 0;
        bVal = bVal || 0;
      } else if (sort === "userId") {
        aVal = parseInt(aVal) || 0;
        bVal = parseInt(bVal) || 0;
      }

      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });

    return processed;
  };

  const getCurrentPageUsers = () => {
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredUsers.length / usersPerPage);
  };

  const fetchAllUsers = async () => {
    try {
      // Start with a smaller limit to test, then fetch more if needed
      let allUsersData = [];
      let currentPage = 1;
      let hasMoreUsers = true;
      
      while (hasMoreUsers) {
        const data = await makeApiCall(`/admin/users?page=${currentPage}&limit=100&sortBy=userId&sortOrder=asc`, "GET");
        
        if (data.status !== "success") {
          throw new Error(data.message || "Failed to fetch users");
        }
        
        if (!Array.isArray(data.data)) {
          throw new Error("Unexpected API response format - data is not an array");
        }

        allUsersData = [...allUsersData, ...data.data];
        
        // Check if there are more pages
        if (data.pagination && data.pagination.currentPage < data.pagination.totalPages) {
          currentPage++;
        } else {
          hasMoreUsers = false;
        }
        
        // Safety break to avoid infinite loops
        if (currentPage > 100) {
          console.warn("Breaking fetch loop at page 100 to avoid infinite loop");
          hasMoreUsers = false;
        }
      }

      setAllUsers(allUsersData);
      
      // Process users with current filters
      const processed = processUsers(allUsersData, searchStr, roleFilter, sortField, sortDirection);
      setFilteredUsers(processed);
      setCurrentPage(1);
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

      // Update the user in allUsers array
      const updatedAllUsers = allUsers.map((user) =>
        user.userId === userId
          ? { ...user, role_name: roleName, role: data.data.role }
          : user
      );
      setAllUsers(updatedAllUsers);

      // Re-process filtered users
      const processed = processUsers(updatedAllUsers, searchStr, roleFilter, sortField, sortDirection);
      setFilteredUsers(processed);

      setEditingUser(null);
      setNewRoleId("");
      toast.success("User role updated successfully!");
    } catch (err) {
      console.error("Error updating user role:", err);
      toast.error(err.message || "Failed to update user role");
    }
  };

  const handleDeleteUser = async (userId) => {
    const user = allUsers.find((u) => u.userId === userId);
    if (!window.confirm(`Are you sure you want to delete user "${user?.username}"?`)) {
      return;
    }

    try {
      const data = await makeApiCall(`/admin/users/${userId}`, "DELETE");
      if (data.status !== "success") {
        throw new Error(data.message || "Failed to delete user");
      }

      // Remove user from allUsers array
      const updatedAllUsers = allUsers.filter((user) => user.userId !== userId);
      setAllUsers(updatedAllUsers);

      // Re-process filtered users
      const processed = processUsers(updatedAllUsers, searchStr, roleFilter, sortField, sortDirection);
      setFilteredUsers(processed);

      // Adjust current page if necessary
      const newTotalPages = Math.ceil(processed.length / usersPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }

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
    const totalPages = getTotalPages();
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSort = (field) => {
    const newDirection = field === sortField && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(newDirection);
    setCurrentPage(1);
    
    // Re-process users with new sorting
    const processed = processUsers(allUsers, searchStr, roleFilter, field, newDirection);
    setFilteredUsers(processed);
  };

  const handleRoleFilter = (role) => {
    setRoleFilter(role);
    setCurrentPage(1);
    
    // Re-process users with new role filter
    const processed = processUsers(allUsers, searchStr, role, sortField, sortDirection);
    setFilteredUsers(processed);
  };

  const handleSearch = (search) => {
    setSearchStr(search);
    setCurrentPage(1);
    
    // Re-process users with new search
    const processed = processUsers(allUsers, search, roleFilter, sortField, sortDirection);
    setFilteredUsers(processed);
  };

  const handleReset = () => {
    setRoleFilter("");
    setSortField("userId");
    setSortDirection("asc");
    setSearchStr("");
    setCurrentPage(1);
    
    // Re-process users with reset filters
    const processed = processUsers(allUsers, "", "", "userId", "asc");
    setFilteredUsers(processed);
  };

  const fetchUserActivities = async (userId, page = 1) => {
    try {
      setLoadingActivities(true);
      const data = await makeApiCall(`/admin/users/${userId}/activities?page=${page}&limit=10`, "GET");
      
      if (data.status !== "success") {
        throw new Error(data.message || "Failed to fetch user activities");
      }

      setUserActivities(data.data);
      if (data.pagination) {
        setActivitiesPage(data.pagination.currentPage);
        setActivitiesTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch user activities:", err);
      toast.error(err.message || "Failed to load user activities");
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleViewActivities = (user) => {
    setViewingActivities(user);
    fetchUserActivities(user.userId);
  };

  const closeActivitiesModal = () => {
    setViewingActivities(null);
    setUserActivities([]);
    setActivitiesPage(1);
    setActivitiesTotalPages(1);
  };

  const handleActivitiesPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= activitiesTotalPages && viewingActivities) {
      fetchUserActivities(viewingActivities.userId, newPage);
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  // Initialize users on component mount
  useEffect(() => {
    if (!hasInitialized && currentUser && hasRole("admin", "super_admin")) {
      setHasInitialized(true);
      fetchAllUsers();
    }
  }, [currentUser, hasRole, hasInitialized]);

  // Check authentication without redirecting
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

  const currentUsers = getCurrentPageUsers();
  const totalPages = getTotalPages();

  return (
    <div className="p-8 text-white">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-2"
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
              onClick={() => fetchAllUsers()}
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
              onClick={handleReset}
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
              value={searchStr}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-white/10 text-white placeholder-gray-400 border border-white/20 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Search users by username"
            />
          </div>
          <div className="text-sm text-gray-300">
            Showing {currentUsers.length} of {filteredUsers.length} users
            {searchStr && ` (filtered by "${searchStr}")`}
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
                  {currentUsers.length === 0 ? (
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
                              {searchStr || roleFilter ? "No users found matching your criteria" : (apiLoading ? "Loading users..." : "No users found")}
                            </p>
                            <p className="text-sm text-gray-500">
                              {searchStr && !roleFilter && `Try searching for a different username`}
                              {!searchStr && roleFilter && `No users with the "${getRoleInfo(roleFilter).displayName}" role`}
                              {searchStr && roleFilter && `No users with username "${searchStr}" and role "${getRoleInfo(roleFilter).displayName}"`}
                              {!searchStr && !roleFilter && !apiLoading && "Users will appear here once they are registered"}
                            </p>
                            {(searchStr || roleFilter) && (
                              <button
                                onClick={handleReset}
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
                    currentUsers.map((user) => {
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
                                <button
                                  onClick={() => handleViewActivities(user)}
                                  className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors"
                                  title="View Activities"
                                  aria-label="View user activities"
                                >
                                  <Eye size={16} />
                                </button>
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

      {/* User Activities Modal */}
      <AnimatePresence>
        {viewingActivities && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeActivitiesModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Eye className="w-6 h-6" />
                  Activities for {viewingActivities.username}
                </h3>
                <button
                  onClick={closeActivitiesModal}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6 text-gray-300" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[60vh]">
                {loadingActivities ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading activities...</p>
                  </div>
                ) : userActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <Award className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-lg text-gray-400 mb-2">No activities found</p>
                    <p className="text-sm text-gray-500">This user hasn't participated in any activities yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userActivities.map((userActivity) => (
                      <motion.div
                        key={`${userActivity.userId}-${userActivity.activityId}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-lg font-semibold text-white">
                            {userActivity.activity.name}
                          </h4>
                          <div className="flex items-center gap-2 text-green-400">
                            <Award className="w-4 h-4" />
                            <span className="font-medium">+{userActivity.points} points</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-300 mb-3">{userActivity.activity.description}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                          {userActivity.activity.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{userActivity.activity.location.name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Last updated at {new Date(userActivity.updatedAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination for activities */}
              {activitiesTotalPages > 1 && (
                <div className="mt-6 flex justify-center items-center gap-2">
                  <button
                    onClick={() => handleActivitiesPageChange(activitiesPage - 1)}
                    disabled={activitiesPage === 1}
                    className="flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  
                  <span className="px-4 py-2 text-white">
                    Page {activitiesPage} of {activitiesTotalPages}
                  </span>
                  
                  <button
                    onClick={() => handleActivitiesPageChange(activitiesPage + 1)}
                    disabled={activitiesPage === activitiesTotalPages}
                    className="flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                    aria-label="Next page"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageUsersPage;