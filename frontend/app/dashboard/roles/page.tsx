"use client";

import { useEffect, useState } from "react";
import { MoreVertical, Search, Shield } from "lucide-react";

import { useRoles } from "@/hooks/roles/useRoles";
import AssignPermissionModal from "@/components/roles/AssignPermissionModal";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function RolesPage() {
  const { roles, loading, error } = useRoles();

  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpenId, setDropdownOpenId] = useState<number | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const resetBody = () => {
    document.body.style.pointerEvents = "";
    document.body.style.overflow = "";
  };

  useEffect(() => {
    if (!modalOpen && dropdownOpenId === null) resetBody();

    return () => resetBody();
  }, [modalOpen, dropdownOpenId]);

  const safeRoles = (roles ?? []).filter((role: any) =>
    role.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssignPermissions = (roleId: number) => {
    setDropdownOpenId(null);

    requestAnimationFrame(() => {
      resetBody();
      setSelectedRoleId(roleId);
      setModalOpen(true);
    });
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRoleId(null);

    requestAnimationFrame(resetBody);
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading roles...</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card className="rounded-2xl">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Shield className="h-7 w-7 text-primary" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">Roles Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage system roles and assign permissions.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-lg">System Roles</CardTitle>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-20">#</TableHead>
                  <TableHead>Role Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {safeRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-28 text-center text-muted-foreground">
                      No roles found
                    </TableCell>
                  </TableRow>
                ) : (
                  safeRoles.map((role: any, index: number) => (
                    <TableRow key={role.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{index + 1}</TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <Shield className="h-4 w-4 text-primary" />
                          </div>

                          <div>
                            <p className="font-semibold">{role.name}</p>
                            <p className="text-xs text-muted-foreground">System Role</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu
                          open={dropdownOpenId === role.id}
                          onOpenChange={(open) => {
                            setDropdownOpenId(open ? role.id : null);
                            if (!open) requestAnimationFrame(resetBody);
                          }}
                          modal={false}
                        >
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={(event) => {
                                event.preventDefault();
                                handleAssignPermissions(role.id);
                              }}
                            >
                              Assign Permissions
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AssignPermissionModal
        open={modalOpen}
        onClose={handleCloseModal}
        roleId={selectedRoleId}
      />
    </div>
  );
}