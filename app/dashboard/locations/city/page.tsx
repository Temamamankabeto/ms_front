"use client";

import { useState, useEffect, useRef } from "react";

import {
  useCities,
  useCreateCity,
  useUpdateCity,
  useDeleteCity,
} from "@/hooks/location/useCities";

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

type City = {
  id: number;
  name: string;
  code?: string;
};

type ModalProps = {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
};

export default function CitiesPage() {
  // ✅ FIXED HERE
  const { data, isLoading } = useCities(1);

  const cities = data?.data ?? [];

  const createCity = useCreateCity();
  const updateCity = useUpdateCity();
  const deleteCity = useDeleteCity();

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");

  const [editCity, setEditCity] = useState<City | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");

  const menuRef = useRef<HTMLDivElement>(null);

  // ✅ close dropdown menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  if (isLoading) {
    return <p className="p-6">Loading...</p>;
  }

  return (
    <div className="p-6 space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cities</h1>

        <Button onClick={() => setCreateOpen(true)}>
          Create City
        </Button>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {cities.length > 0 ? (
              cities.map((city: City) => (
                <TableRow key={city.id}>
                  <TableCell>{city.id}</TableCell>

                  <TableCell>{city.name}</TableCell>

                  <TableCell>{city.code || "-"}</TableCell>

                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditCity(city);
                          setEditName(city.name);
                          setEditCode(city.code || "");
                        }}
                      >
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (
                            confirm(
                              `Delete ${city.name}?`
                            )
                          ) {
                            deleteCity.mutate(city.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-6"
                >
                  No cities found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* CREATE MODAL */}
      {createOpen && (
        <Modal
          title="Create City"
          onClose={() => {
            setCreateOpen(false);
            setNewName("");
            setNewCode("");
          }}
        >
          <div className="space-y-4">
            <Input
              placeholder="City name"
              value={newName}
              onChange={(e) =>
                setNewName(e.target.value)
              }
            />

            <Input
              placeholder="Code"
              value={newCode}
              onChange={(e) =>
                setNewCode(e.target.value)
              }
            />

            <Button
              className="w-full"
              onClick={() => {
                createCity.mutate({
                  name: newName,
                  code: newCode,
                });

                setCreateOpen(false);
                setNewName("");
                setNewCode("");
              }}
            >
              Save
            </Button>
          </div>
        </Modal>
      )}

      {/* EDIT MODAL */}
      {editCity && (
        <Modal
          title="Edit City"
          onClose={() => setEditCity(null)}
        >
          <div className="space-y-4">
            <Input
              value={editName}
              onChange={(e) =>
                setEditName(e.target.value)
              }
            />

            <Input
              value={editCode}
              onChange={(e) =>
                setEditCode(e.target.value)
              }
            />

            <Button
              className="w-full"
              onClick={() => {
                updateCity.mutate({
                  id: editCity.id,
                  data: {
                    name: editName,
                    code: editCode,
                  },
                });

                setEditCity(null);
              }}
            >
              Update
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* MODAL COMPONENT */
function Modal({
  children,
  title,
  onClose,
}: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="text-xl"
          >
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}