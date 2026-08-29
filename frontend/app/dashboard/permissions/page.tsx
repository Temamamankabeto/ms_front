"use client";

import { useState, useEffect } from "react";
import {
  usePermissions,
  useCreatePermission,
  useUpdatePermission,
  useDeletePermission,
} from "@/hooks/permissions/usePermissions";

type Permission = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

/* ================= DEBOUNCE ================= */
function useDebounce(value: string, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default function PermissionsPage() {
  const [page, setPage] = useState(1);

  // 🔍 SEARCH
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  const { data, isLoading, error } = usePermissions(
    page,
    50,
    debouncedSearch
  );

  const create = useCreatePermission();
  const update = useUpdatePermission();
  const remove = useDeletePermission();

  // ================= STATE =================
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // CREATE
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");

  // EDIT
  const [editPermission, setEditPermission] =
    useState<Permission | null>(null);
  const [editName, setEditName] = useState("");

  if (isLoading) return <p className="p-6">Loading...</p>;
  if (error)
    return <p className="p-6 text-red-500">Failed to load permissions</p>;

  const permissions = data?.data || [];
  const meta = data?.meta;

  // ================= CREATE =================
  const handleCreate = () => {
    if (!newName.trim()) return;

    create.mutate(
      { name: newName },
      {
        onSuccess: () => {
          setNewName("");
          setCreateOpen(false);
        },
      }
    );
  };

  // ================= UPDATE =================
  const handleUpdate = () => {
    if (!editPermission) return;

    update.mutate(
      {
        id: editPermission.id,
        data: { name: editName },
      },
      {
        onSuccess: () => {
          setEditPermission(null);
          setEditName("");
        },
      }
    );
  };

  // ================= DELETE =================
  const handleDelete = (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this permission?"
    );

    if (!confirmed) return;

    remove.mutate(id);
  };

  return (
    <div className="p-6 space-y-4">

      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Permissions</h1>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search permissions..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border px-3 py-2 rounded w-64"
          />

          <button
            onClick={() => setCreateOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Create
          </button>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">ID</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {permissions.map((p: Permission) => (
            <tr key={p.id}>
              <td className="border p-2">{p.id}</td>
              <td className="border p-2">{p.name}</td>

              {/* ACTIONS */}
              <td className="border p-2 text-center relative">
                <button
                  onClick={() =>
                    setOpenMenuId(openMenuId === p.id ? null : p.id)
                  }
                  className="px-2"
                >
                  ⋮
                </button>

                {openMenuId === p.id && (
                  <div className="absolute right-2 top-10 bg-white border shadow-md w-32 rounded z-10">
                    <button
                      onClick={() => {
                        setEditPermission(p);
                        setEditName(p.name);
                        setOpenMenuId(null);
                      }}
                      className="w-full px-3 py-2 hover:bg-gray-100 text-left"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => {
                        setOpenMenuId(null);
                        handleDelete(p.id);
                      }}
                      className="w-full px-3 py-2 hover:bg-gray-100 text-left text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ================= PAGINATION ================= */}
      <div className="flex gap-2 items-center">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Prev
        </button>

        <span>
          Page {meta?.current_page} / {meta?.last_page}
        </span>

        <button
          disabled={page === meta?.last_page}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>

      {/* ================= CREATE MODAL ================= */}
      {createOpen && (
        <Modal
          title="Create Permission"
          onClose={() => setCreateOpen(false)}
        >
          <input
            className="border w-full p-2 mb-4"
            placeholder="Permission name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setCreateOpen(false)}
              className="border px-4 py-2"
            >
              Cancel
            </button>

            <button
              onClick={handleCreate}
              className="bg-blue-600 text-white px-4 py-2"
            >
              Save
            </button>
          </div>
        </Modal>
      )}

      {/* ================= EDIT MODAL ================= */}
      {editPermission && (
        <Modal
          title="Edit Permission"
          onClose={() => setEditPermission(null)}
        >
          <input
            className="border w-full p-2 mb-4"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditPermission(null)}
              className="border px-4 py-2"
            >
              Cancel
            </button>

            <button
              onClick={handleUpdate}
              className="bg-green-600 text-white px-4 py-2"
            >
              Update
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ================= MODAL ================= */
function Modal({
  children,
  title,
  onClose,
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded w-96">
        <div className="flex justify-between mb-4">
          <h2 className="font-bold text-lg">{title}</h2>
          <button onClick={onClose}>✕</button>
        </div>

        {children}
      </div>
    </div>
  );
}