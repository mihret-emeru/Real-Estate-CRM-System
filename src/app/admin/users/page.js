"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

import {
  FaPlus,
  FaSearch,
  FaEye,
  FaEdit,
  FaUserCheck,
  FaUserTimes,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

import CustomDropdown from "@/components/common/CustomDropdown";

import "@/styles/admin/users.css";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const limit = 10;

  async function fetchUsers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/users", {
        cache: "no-store",
      });

      const responseText = await response.text();

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Users API returned an invalid response (${response.status}).`,
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load users.");
      }

      setUsers(data.data || []);
    } catch (error) {
      console.error("Admin users error:", error);

      setError(
        error instanceof Error ? error.message : "Failed to load users.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatRole(role) {
    if (!role) return "-";

    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  const filteredUsers = users.filter((user) => {
    const searchValue = search.toLowerCase().trim();

    const matchesSearch =
      !searchValue ||
      user.name?.toLowerCase().includes(searchValue) ||
      user.email?.toLowerCase().includes(searchValue) ||
      user.phone?.toLowerCase().includes(searchValue);

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.isActive) ||
      (statusFilter === "inactive" && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / limit));

  const paginatedUsers = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, page]);

  const startItem = filteredUsers.length === 0 ? 0 : (page - 1) * limit + 1;

  const endItem = Math.min(page * limit, filteredUsers.length);

  async function handleToggleStatus(user) {
    const action = user.isActive ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.name}?`,
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/users/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !user.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || `Failed to ${action} user.`);
      }

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser._id === user._id ? data.data : currentUser,
        ),
      );
    } catch (error) {
      console.error("Toggle user status error:", error);

      alert(
        error instanceof Error ? error.message : `Failed to ${action} user.`,
      );
    }
  }

  async function handleDelete(user) {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${user.name}?`,
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/users/${user._id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete user.");
      }

      setUsers((currentUsers) =>
        currentUsers.filter((currentUser) => currentUser._id !== user._id),
      );
    } catch (error) {
      console.error("Delete user error:", error);

      alert(error instanceof Error ? error.message : "Failed to delete user.");
    }
  }

  if (loading) {
    return (
      <div className="admin-users-page">
        <div className="admin-users-loading">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-users-page">
        <div className="admin-users-error">
          <h2>Unable to load users</h2>
          <p>{error}</p>
          <button onClick={fetchUsers}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users-page">
      <div className="admin-users-header">
        <div>
          <span className="admin-users-eyebrow">Administration</span>

          <h1>User Management</h1>

          <p>Manage system users, roles, and account access.</p>
        </div>

        <Link href="/admin/users/add" className="admin-users-add-btn">
          <FaPlus />
          <span>Add User</span>
        </Link>
      </div>

      <div className="admin-users-toolbar">
        <div className="admin-users-search">
          <FaSearch />

          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>

        <CustomDropdown
          value={roleFilter}
          onChange={(value) => {
            setRoleFilter(value);
            setPage(1);
          }}
          options={[
            {
              value: "all",
              label: "All Roles",
            },
            {
              value: "admin",
              label: "Admin",
            },
            {
              value: "manager",
              label: "Manager",
            },
            {
              value: "agent",
              label: "Agent",
            },
            {
              value: "client",
              label: "Client",
            },
          ]}
        />

        <CustomDropdown
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
          options={[
            {
              value: "all",
              label: "All Statuses",
            },
            {
              value: "active",
              label: "Active",
            },
            {
              value: "inactive",
              label: "Inactive",
            },
          ]}
        />
      </div>

      <div className="admin-users-summary">
        <div className="admin-users-summary-card">
          <span>Total Users</span>
          <strong>{users.length}</strong>
        </div>

        <div className="admin-users-summary-card">
          <span>Managers</span>
          <strong>
            {users.filter((user) => user.role === "manager").length}
          </strong>
        </div>

        <div className="admin-users-summary-card">
          <span>Agents</span>
          <strong>
            {users.filter((user) => user.role === "agent").length}
          </strong>
        </div>

        <div className="admin-users-summary-card">
          <span>Clients</span>
          <strong>
            {users.filter((user) => user.role === "client").length}
          </strong>
        </div>

        <div className="admin-users-summary-card">
          <span>Active Users</span>
          <strong>{users.filter((user) => user.isActive).length}</strong>
        </div>
      </div>

      <div className="admin-users-table-container">
        {filteredUsers.length === 0 ? (
          <div className="admin-users-empty">
            <p>No users match your search or filters.</p>
          </div>
        ) : (
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="admin-users-user">
                      <div className="admin-users-avatar">
                        {user.profileImage ? (
                          <img src={user.profileImage} alt={user.name} />
                        ) : (
                          user.name?.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div>
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="admin-users-phone">
                      {user.phone || "-"}
                    </span>
                  </td>

                  <td>
                    <span className={`admin-users-role ${user.role}`}>
                      {formatRole(user.role)}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`admin-users-status ${
                        user.isActive ? "active" : "inactive"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td>
                    <span className="admin-users-date">
                      {formatDate(user.createdAt)}
                    </span>
                  </td>

                  <td>
                    <div className="admin-users-actions">
                      <Link
                        href={`/admin/users/${user._id}`}
                        className="admin-users-view-btn"
                        title="View"
                      >
                        <FaEye />
                      </Link>

                      <Link
                        href={`/admin/users/${user._id}/edit`}
                        className="admin-users-edit-btn"
                        title="Edit"
                      >
                        <FaEdit />
                      </Link>

                      {user.role !== "admin" && (
                        <button
                          type="button"
                          className={
                            user.isActive
                              ? "admin-users-deactivate-btn"
                              : "admin-users-activate-btn"
                          }
                          title={user.isActive ? "Deactivate" : "Activate"}
                          onClick={() => handleToggleStatus(user)}
                        >
                          {user.isActive ? <FaUserTimes /> : <FaUserCheck />}
                        </button>
                      )}

                      {user.role !== "admin" && (
                        <button
                          type="button"
                          className="admin-users-delete-btn"
                          title="Delete"
                          onClick={() => handleDelete(user)}
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filteredUsers.length > 0 && (
        <div className="admin-users-pagination">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((currentPage) => currentPage - 1)}
          >
            <FaChevronLeft />
          </button>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (pageNumber) => (
              <button
                type="button"
                key={pageNumber}
                className={page === pageNumber ? "active" : ""}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ),
          )}

          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage((currentPage) => currentPage + 1)}
          >
            <FaChevronRight />
          </button>
        </div>
      )}

      <div className="admin-users-results">
        Showing {filteredUsers.length} of {users.length} users
      </div>
    </div>
  );
}

