"use client";

import { useState } from "react";
import {
  useWoredas,
  useCreateWoreda,
  useUpdateWoreda,
  useDeleteWoreda,
} from "@/hooks/location/useWoredas";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Woreda = {
  id: number;
  name: string;
  subcity_id: number;
};

export default function WoredaPage() {
  const [page] = useState(1);

  const { data, isLoading } = useWoredas(page);

  // ✅ FIX API STRUCTURE
  const woredas: Woreda[] = Array.isArray(data?.data)
    ? data.data
    : [];

  const createWoreda = useCreateWoreda();
  const updateWoreda = useUpdateWoreda();
  const deleteWoreda = useDeleteWoreda();

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // CREATE
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSubcityId, setNewSubcityId] = useState("");

  // EDIT
  const [editItem, setEditItem] = useState<Woreda | null>(null);
  const [editName, setEditName] = useState("");
  const [editSubcityId, setEditSubcityId] = useState("");

  if (isLoading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Woredas</h1>

        <Button onClick={() => setCreateOpen(true)}>
          + Add Woreda
        </Button>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>SubCity ID</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {woredas.map((w) => (
              <TableRow key={w.id}>
                <TableCell>{w.id}</TableCell>
                <TableCell>{w.name}</TableCell>
                <TableCell>{w.subcity_id}</TableCell>

                <TableCell className="text-right relative">
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setOpenMenuId(openMenuId === w.id ? null : w.id)
                    }
                  >
                    ⋮
                  </Button>

                  {openMenuId === w.id && (
                    <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-md z-50">
                      <button
                        className="w-full px-3 py-2 hover:bg-gray-100 text-left"
                        onClick={() => {
                          setEditItem(w);
                          setEditName(w.name);
                          setEditSubcityId(String(w.subcity_id));
                          setOpenMenuId(null);
                        }}
                      >
                        Edit
                      </button>

                      <button
                        className="w-full px-3 py-2 hover:bg-red-100 text-red-600 text-left"
                        onClick={() => {
                          setOpenMenuId(null);
                          if (confirm("Delete woreda?")) {
                            deleteWoreda.mutate(w.id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* CREATE */}
      {createOpen && (
        <Modal onClose={() => setCreateOpen(false)} title="Create Woreda">
          <Input
            placeholder="Woreda name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />

          <Input
            placeholder="SubCity ID"
            value={newSubcityId}
            onChange={(e) => setNewSubcityId(e.target.value)}
          />

          <Button
            onClick={() => {
              createWoreda.mutate({
                name: newName,
                subcity_id: Number(newSubcityId),
              });

              setCreateOpen(false);
              setNewName("");
              setNewSubcityId("");
            }}
          >
            Save
          </Button>
        </Modal>
      )}

      {/* EDIT */}
      {editItem && (
        <Modal onClose={() => setEditItem(null)} title="Edit Woreda">
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />

          <Input
            value={editSubcityId}
            onChange={(e) => setEditSubcityId(e.target.value)}
          />

          <Button
            onClick={() => {
              updateWoreda.mutate({
                id: editItem.id,
                data: {
                  name: editName,
                  subcity_id: Number(editSubcityId),
                },
              });

              setEditItem(null);
            }}
          >
            Update
          </Button>
        </Modal>
      )}
    </div>
  );
}

/* ================= MODAL ================= */
function Modal({ children, title, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-96 space-y-4 shadow-xl">
        <div className="flex justify-between">
          <h2 className="font-bold text-lg">{title}</h2>
          <button onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}