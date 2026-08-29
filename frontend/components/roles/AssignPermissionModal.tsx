"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import {
  getPermissions,
  getRolePermissions,
  assignPermissions,
} from "@/services/permissions/service";

export default function AssignPermissionModal({
  open,
  onClose,
  roleId,
}: {
  open: boolean;
  onClose: () => void;
  roleId: number | null;
}) {
  const [permissions, setPermissions] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // ---------------------------
  // GROUP BY FIRST LETTER
  // ---------------------------
  const groupPermissions = (permissions: any[]) => {
    return permissions.reduce((acc: any, perm: any) => {
      const letter = perm.name.charAt(0).toUpperCase();

      if (!acc[letter]) acc[letter] = [];
      acc[letter].push(perm);

      return acc;
    }, {});
  };

  // ---------------------------
  // LOAD DATA
  // ---------------------------
  useEffect(() => {
    if (!roleId || !open) return;

    const load = async () => {
      setLoading(true);

      try {
        const perms = await getPermissions();
const rolePerms = await getRolePermissions(roleId);
        setPermissions(perms || []);
        // setSelected(rolePerms || []);
setSelected(rolePerms.map((p: any) => p.name));

      } catch (err) {
        console.error("Failed loading permissions", err);
      }

      setLoading(false);
    };

    load();
  }, [roleId, open]);

  // ---------------------------
  // TOGGLE PERMISSION
  // ---------------------------
  const toggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name)
        ? prev.filter((p) => p !== name)
        : [...prev, name]
    );
  };

  // ---------------------------
  // SAVE
  // ---------------------------
  const save = async () => {
  if (!roleId) return;

  const payload = selected.map((p: any) =>
    typeof p === "string" ? p : p.name
  );

  await assignPermissions(roleId, payload);

  onClose();
};
  // grouped data
  const grouped = groupPermissions(permissions);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">

        {/* TITLE */}
        <DialogHeader>
          <DialogTitle>Assign Permissions</DialogTitle>
        </DialogHeader>

        {/* CONTENT */}
        {loading ? (
          <p className="py-6">Loading...</p>
        ) : (
          <div className="max-h-[450px] overflow-auto pr-2">

            {Object.entries(grouped).map(([letter, perms]: any) => (
              <div key={letter} className="mb-4">

                {/* GROUP HEADER */}
                <div className="font-bold text-sm text-gray-600 mb-2 border-b pb-1">
                  {letter}
                </div>

                {/* PERMISSIONS */}
                <div className="grid grid-cols-3 gap-2">
                  {perms.map((p: any) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(p.name)}
                        onChange={() => toggle(p.name)}
                      />
                      {p.name}
                    </label>
                  ))}
                </div>

              </div>
            ))}

          </div>
        )}

        {/* ACTIONS */}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>
            Save
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}