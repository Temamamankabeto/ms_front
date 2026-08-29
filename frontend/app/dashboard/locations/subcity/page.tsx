"use client";

import { useState } from "react";
import {
  useSubcities,
  useCreateSubcity,
  useUpdateSubcity,
  useDeleteSubcity,
} from "@/hooks/location/useSubcities";

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

type SubCity = {
  id: number;
  name: string;
  city_id: number;
  city: {
    name: string;
  };
};

export default function SubCitiesPage() {
  const [page] = useState(1);

  const { data, isLoading } = useSubcities(page);

  // ✅ FIX: backend returns {data, meta}
  const subcities: SubCity[] = Array.isArray(data?.data)
    ? data.data
    : [];

  const createSubCity = useCreateSubcity();
  const updateSubCity = useUpdateSubcity();
  const deleteSubCity = useDeleteSubcity();

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCityId, setNewCityId] = useState("");

  const [editItem, setEditItem] = useState<SubCity | null>(null);
  const [editName, setEditName] = useState("");
  const [editCityId, setEditCityId] = useState("");

  if (isLoading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sub Cities</h1>

        <Button onClick={() => setCreateOpen(true)}>
          + Add SubCity
        </Button>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>City ID</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {subcities.map((sc) => (
              <TableRow key={sc.id}>
                <TableCell>{sc.id}</TableCell>
                <TableCell>{sc.name}</TableCell>
                <TableCell>{sc.city.name}</TableCell>

                <TableCell className="text-right relative">
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setOpenMenuId(openMenuId === sc.id ? null : sc.id)
                    }
                  >
                    ⋮
                  </Button>

                  {openMenuId === sc.id && (
                    <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-md z-50">
                      <button
                        className="w-full px-3 py-2 hover:bg-gray-100 text-left"
                        onClick={() => {
                          setEditItem(sc);
                          setEditName(sc.name);
                          setEditCityId(String(sc.city_id));
                          setOpenMenuId(null);
                        }}
                      >
                        Edit
                      </button>

                      <button
                        className="w-full px-3 py-2 hover:bg-red-100 text-red-600 text-left"
                        onClick={() => {
                          setOpenMenuId(null);
                          if (confirm("Delete subcity?")) {
                            deleteSubCity.mutate(sc.id);
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
        <Modal onClose={() => setCreateOpen(false)} title="Create SubCity">
          <Input
            placeholder="SubCity name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />

          <Input
            placeholder="City ID"
            value={newCityId}
            onChange={(e) => setNewCityId(e.target.value)}
          />

          <Button
            onClick={() => {
              createSubCity.mutate({
                name: newName,
                city_id: Number(newCityId),
              });

              setCreateOpen(false);
              setNewName("");
              setNewCityId("");
            }}
          >
            Save
          </Button>
        </Modal>
      )}

      {/* EDIT */}
      {editItem && (
        <Modal onClose={() => setEditItem(null)} title="Edit SubCity">
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />

          <Input
            value={editCityId}
            onChange={(e) => setEditCityId(e.target.value)}
          />

          <Button
            onClick={() => {
              updateSubCity.mutate({
                id: editItem.id,
                data: {
                  name: editName,
                  city_id: Number(editCityId),
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

/* MODAL */
function Modal({
  children,
  title,
  onClose,
}: any) {
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