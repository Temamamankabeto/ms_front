"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Search, RefreshCw } from "lucide-react";

import {
  useUsers,
  useDeleteUser,
  useToggleUserStatus,
} from "@/hooks/user/useUsers";

import { useCities } from "@/hooks/location/useCities";
import { useSubcities } from "@/hooks/location/useSubcities";
import { useWoredas } from "@/hooks/location/useWoredas";

import {
  normalizeRoleName,
  roleLabel,
  locationLevelLabel,
} from "@/config/roles.config";

import { authService } from "@/services/auth/auth.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

function toList(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function canToggleUsers() {
  const user = authService.getStoredUser() as any;
  const roles = authService.getStoredRoles();
  const role = normalizeRoleName(roles?.[0] || user?.role);

  if (role === "super_admin" || role === "admin") return true;

  if (role !== "front_officer" && role !== "back_officer") return false;

  return (
    user?.location_level === "city" ||
    (user?.city_id && !user?.subcity_id && !user?.woreda_id)
  );
}
function currentUserScope() {
  const user = authService.getStoredUser() as any;

  if (!user) {
    return {
      level: "",
      cityId: "",
      subcityId: "",
      woredaId: "",
      locked: false,
      label: "All users",
    };
  }

  const level =
    user.location_level ||
    (user.woreda_id ? "woreda" : user.subcity_id ? "subcity" : user.city_id ? "city" : "");

  return {
    level,
    cityId: user.city_id ? String(user.city_id) : "",
    subcityId: user.subcity_id ? String(user.subcity_id) : "",
    woredaId: user.woreda_id ? String(user.woreda_id) : "",
    locked: level === "subcity" || level === "woreda",
    label:
      level === "woreda"
        ? "Showing users in your woreda only"
        : level === "subcity"
          ? "Showing subcity-level users only"
          : level === "city"
            ? "Showing users in your city"
            : "All users",
  };
}




function getUserScope(user: any, role?: string | null) {
  const normalizedRole = normalizeRoleName(
    role || user?.role || user?.roles?.[0]?.name
  );

  if (normalizedRole.includes("woreda_admin") || user?.woreda_id) {
    return {
      level: "woreda",
      city_id: user?.city_id,
      subcity_id: user?.subcity_id,
      woreda_id: user?.woreda_id,
      locked: true,
    };
  }

  if (normalizedRole.includes("subcity_admin") || user?.subcity_id) {
    return {
      level: "subcity",
      city_id: user?.city_id,
      subcity_id: user?.subcity_id,
      woreda_id: null,
      locked: true,
    };
  }

  if (
    normalizedRole.includes("city_admin") ||
    normalizedRole === "admin" ||
    user?.city_id
  ) {
    return {
      level: "city",
      city_id: user?.city_id,
      subcity_id: null,
      woreda_id: null,
      locked: false,
    };
  }

  return {
    level: "system",
    city_id: null,
    subcity_id: null,
    woreda_id: null,
    locked: false,
  };
}


export default function UsersPage() {
  const currentUser =
    authService.getStoredUser() || {};
  const currentRoles =
    authService.getStoredRoles();
  const currentRole = Array.isArray(currentRoles) ? currentRoles[0] : currentRoles;
  const userScope = getUserScope(currentUser, currentRole);
  const scope = userScope;

  const router = useRouter();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [cityId, setCityId] = useState("");
  const [subcityId, setSubcityId] = useState("");
  const [woredaId, setWoredaId] = useState("");

  const { data: citiesData } = useCities(1);
  const { data: subcitiesData } = useSubcities(1);
  const { data: woredasData } = useWoredas(1);

  const cities = toList(citiesData);

  const subcities = toList(subcitiesData).filter((subcity) =>
    cityId ? Number(subcity.city_id) === Number(cityId) : true
  );

  const woredas = toList(woredasData).filter((woreda) =>
    subcityId ? Number(woreda.subcity_id) === Number(subcityId) : true
  );

  const { data, isLoading, refetch } = useUsers({
    page,
    search,
    status,
    role,
    city_id: cityId,
    subcity_id: subcityId,
    woreda_id: woredaId,
  });

  const users = data?.data || [];
  const meta = data?.meta || {};

  const deleteUser = useDeleteUser();
  const toggleStatus = useToggleUserStatus();
  const showToggleAction = canToggleUsers();

  function handleDelete(id: number) {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUser.mutate(id);
    }
  }

  function clearFilters() {
    setSearch("");
    setStatus("");
    setRole("");
    setCityId("");
    setSubcityId("");
    setWoredaId("");
    setPage(1);
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div> <h1 className="text-3xl font-bold tracking-tight">Users ({meta?.total ?? 0})</h1>
          <p className="text-sm text-muted-foreground">
            Manage users by role and location hierarchy.
          </p>
        </div>

        <Button onClick={() => router.push("/dashboard/users/add")}>
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>

            <Select value={status || "all"} onValueChange={(value) => {
              setStatus(value === "all" ? "" : value);
              setPage(1);
            }}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent className="z-[9999]">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={role || "all"} onValueChange={(value) => {
              setRole(value === "all" ? "" : value);
              setPage(1);
            }}>
              <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent className="z-[9999]">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="back_officer">Back Officer</SelectItem>
                <SelectItem value="front_officer">Front Officer</SelectItem>
                <SelectItem value="citizen">Citizen</SelectItem>
              </SelectContent>
            </Select>

           <Select
  value={(scope.locked ? String(scope.city_id || "") : cityId) || "all"}
  disabled={scope.locked}
  onValueChange={(value) => {
              const selected = value === "all" ? "" : value;
              setCityId(selected);
              setSubcityId("");
              setWoredaId("");
              setPage(1);
            }}>
              <SelectTrigger><SelectValue placeholder="City" /></SelectTrigger>
              <SelectContent className="z-[9999]">
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={String(city.id)}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={subcityId || "all"}
              disabled={!cityId}
              onValueChange={(value) => {
                const selected = value === "all" ? "" : value;
                setSubcityId(selected);
                setWoredaId("");
                setPage(1);
              }}
            >
              <SelectTrigger><SelectValue placeholder="Subcity" /></SelectTrigger>
              <SelectContent className="z-[9999]">
                <SelectItem value="all">All Subcities</SelectItem>
                {subcities.map((subcity) => (
                  <SelectItem key={subcity.id} value={String(subcity.id)}>
                    {subcity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={woredaId || "all"}
              disabled={!subcityId}
              onValueChange={(value) => {
                const selected = value === "all" ? "" : value;
                setWoredaId(selected);
                setPage(1);
              }}
            >
              <SelectTrigger><SelectValue placeholder="Woreda" /></SelectTrigger>
              <SelectContent className="z-[9999]">
                <SelectItem value="all">All Woredas</SelectItem>
                {woredas.map((woreda) => (
                  <SelectItem key={woreda.id} value={String(woreda.id)}>
                    {woreda.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Subcity</TableHead>
                  <TableHead>Woreda</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-10 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-10 text-center">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone || "-"}</TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(user.role_names || [user.role])
                            .filter(Boolean)
                            .map((item: string) => (
                              <span
                                key={item}
                                className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"
                              >
                                {roleLabel(item)}
                              </span>
                            ))}
                        </div>
                      </TableCell>

                      <TableCell>{locationLevelLabel(user.location_level) || "-"}</TableCell>
                      <TableCell>{user.city?.name || "-"}</TableCell>
                      <TableCell>{user.subcity?.name || "-"}</TableCell>
                      <TableCell>{user.woreda?.name || "-"}</TableCell>

                      <TableCell>
                        <span
                          className={`rounded px-2 py-1 text-xs font-medium ${
                            user.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.is_active ? "Active" : "Disabled"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/dashboard/users/${user.id}`)}
                            >
                              View
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => router.push(`/dashboard/users/${user.id}/edit`)}
                            >
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/dashboard/users/${user.id}/change-password`)
                              }
                            >
                              Change Password
                            </DropdownMenuItem>

                            {showToggleAction && (
                              <DropdownMenuItem
                                onClick={() => toggleStatus.mutate(user.id)}
                              >
                                {user.is_active ? "Disable" : "Enable"}
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(user.id)}
                            >
                              Delete
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

          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-muted-foreground">
              Page {meta?.current_page || 1} of {meta?.last_page || 1}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={(meta?.current_page || 1) <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                Prev
              </Button>

              <Button
                variant="outline"
                disabled={(meta?.current_page || 1) >= (meta?.last_page || 1)}
                onClick={() =>
                  setPage((p) => Math.min(p + 1, meta?.last_page || p))
                }
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}