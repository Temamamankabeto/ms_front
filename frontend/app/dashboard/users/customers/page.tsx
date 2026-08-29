"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Search, RefreshCw } from "lucide-react";

import {
  useUsers,
  useToggleUserStatus,
} from "@/hooks/user/useUsers";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CustomersPage() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading, refetch } = useUsers({
    page,
    search,
    status,
    role: "customer",
  });

  const customers = data?.data || [];
  const meta = data?.meta || {};

  const toggleStatus = useToggleUserStatus();

  function clearFilters() {
    setSearch("");
    setStatus("");
    setPage(1);
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Customers ({meta?.total ?? 0})
          </h1>
          <p className="text-sm text-muted-foreground">
            Customer accounts — separate from staff/officer users.
          </p>
        </div>

        <Button onClick={() => router.push("/dashboard/users/customers/add")}>
          Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>

            <Select
              value={status || "all"}
              onValueChange={(value) => {
                setStatus(value === "all" ? "" : value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
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
          <CardTitle>Customer List</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer: any) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        {customer.name}
                      </TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone || "-"}</TableCell>

                      <TableCell>
                        <span
                          className={`rounded px-2 py-1 text-xs font-medium ${
                            customer.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {customer.is_active ? "Active" : "Disabled"}
                        </span>
                      </TableCell>

                      <TableCell>
                        {customer.created_at
                          ? new Date(
                                customer.created_at
                            ).toLocaleDateString()
                          : "-"}
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
                              onClick={() =>
                                router.push(
                                  `/dashboard/users/customers/${customer.id}`
                                )
                              }
                            >
                              View
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/dashboard/users/customers/${customer.id}/edit`
                                )
                              }
                            >
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() =>
                                toggleStatus.mutate(customer.id)
                              }
                            >
                              {customer.is_active ? "Disable" : "Enable"}
                            </DropdownMenuItem>

                            {/* Intentionally no Delete action — customer
                                accounts cannot be deleted. */}
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
