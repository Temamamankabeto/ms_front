"use client";

import { useState } from "react";
import {
  useOffices,
  useCreateOffice,
  useUpdateOffice,
  useDeleteOffice,
} from "@/hooks/offices/useOffices";

type Office = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

export default function OfficesPage() {
  const { data: offices = [], isLoading, error } = useOffices();

  const createOffice = useCreateOffice();
  const updateOffice = useUpdateOffice();
  const deleteOffice = useDeleteOffice();

  // ================= STATE =================
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // CREATE
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");

  // EDIT
  const [editOffice, setEditOffice] = useState<Office | null>(null);
  const [editName, setEditName] = useState("");

  // ================= CREATE =================
  const handleCreate = () => {
    if (!newName.trim()) return;

    createOffice.mutate(
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
    if (!editOffice) return;

    updateOffice.mutate({
      id: editOffice.id,
      data: { name: editName },
    });

    setEditOffice(null);
  };

  // ================= DELETE =================
  const handleDelete = (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this office?"
    );

    if (!confirmed) return;

    deleteOffice.mutate(id);
  };

  if (isLoading) return <p className="p-6">Loading...</p>;
  if (error) return <p className="p-6 text-red-500">Failed to load</p>;

  return (
    <div className="p-6">

      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Offices</h1>

        <button
          onClick={() => setCreateOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Create Office
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">TL</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {offices.map((office) => (
            <tr key={office.id}>
              <td className="border p-2">{office.id}</td>
              <td className="border p-2">{office.name}</td>

              {/* ACTIONS */}
              <td className="border p-2 text-center relative">
                <button
                  onClick={() =>
                    setOpenMenuId(openMenuId === office.id ? null : office.id)
                  }
                  className="px-2"
                >
                  ⋮
                </button>

                {openMenuId === office.id && (
                  <div className="absolute right-2 top-10 bg-white border shadow-md w-32 rounded z-10">
                    <button
                      onClick={() => {
                        setEditOffice(office);
                        setEditName(office.name);
                      }}
                      className="w-full px-3 py-2 hover:bg-gray-100 text-left"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(office.id)}
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

      {/* ================= CREATE MODAL ================= */}
      {createOpen && (
        <Modal onClose={() => setCreateOpen(false)} title="Create Office">
          <input
            className="border w-full p-2 mb-4"
            placeholder="Office name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />

          <div className="flex justify-end gap-2">
            <button onClick={() => setCreateOpen(false)} className="border px-4 py-2">
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
      {editOffice && (
        <Modal onClose={() => setEditOffice(null)} title="Edit Office">
          <input
            className="border w-full p-2 mb-4"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditOffice(null)}
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

/* ================= MODAL COMPONENT ================= */
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
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