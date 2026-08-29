"use client";

import { useMemo, useState } from "react";

import {
  Activity,
  Calendar,
  Filter,
  MoreVertical,
  Search,
  User2,
  Trash2,
  Pencil,
  PlusCircle,
} from "lucide-react";

import { format } from "date-fns";

import { useAuditLogs } from "@/hooks/audit-logs/use-audit-logs";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

export default function AuditLogsPage() {
  const { logs, loading } = useAuditLogs();

  const [selectedLog, setSelectedLog] = useState<any>(null);

  const [search, setSearch] = useState("");

  const [activity, setActivity] = useState("all");

  const [dateFilter, setDateFilter] = useState("all");

  /*
  |--------------------------------------------------------------------------
  | FILTERED LOGS
  |--------------------------------------------------------------------------
  */

  const filteredLogs = useMemo(() => {
    let filtered = [...(logs || [])];

    // SEARCH
    if (search) {
      filtered = filtered.filter((log: any) =>
        `
        ${log.entity_type}
        ${log.action}
        ${log.message}
        ${log.role_name}
      `
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    // ACTIVITY
    if (activity !== "all") {
      filtered = filtered.filter(
        (log: any) => log.action === activity
      );
    }

    // DATE FILTER
    if (dateFilter !== "all") {
      const now = new Date();

      filtered = filtered.filter((log: any) => {
        const logDate = new Date(log.created_at);

        switch (dateFilter) {
          case "today":
            return (
              logDate.toDateString() ===
              now.toDateString()
            );

          case "7days":
            return (
              now.getTime() - logDate.getTime() <=
              7 * 24 * 60 * 60 * 1000
            );

          case "30days":
            return (
              now.getTime() - logDate.getTime() <=
              30 * 24 * 60 * 60 * 1000
            );

          default:
            return true;
        }
      });
    }

    return filtered;
  }, [logs, search, activity, dateFilter]);

  return (
    <div className="min-h-screen bg-muted/30 p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Audit Logs
          </h1>

          <p className="text-muted-foreground mt-1">
            Enterprise activity tracking dashboard
          </p>
        </div>

        <Button className="rounded-2xl shadow-sm">
          <Activity className="w-4 h-4 mr-2" />
          Live Monitoring
        </Button>
      </div>

      {/* DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* TOTAL */}
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  Total Activities
                </p>

                <h2 className="text-4xl font-bold mt-2">
                  {filteredLogs.length}
                </h2>

                <p className="text-xs text-green-600 mt-2">
                  Live tracking active
                </p>
              </div>

              <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center">
                <Activity className="w-8 h-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CREATED */}
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  Created
                </p>

                <h2 className="text-4xl font-bold mt-2">
                  {
                    filteredLogs.filter(
                      (l: any) => l.action === "created"
                    ).length
                  }
                </h2>

                <p className="text-xs text-muted-foreground mt-2">
                  New records
                </p>
              </div>

              <div className="w-16 h-16 rounded-3xl bg-green-100 flex items-center justify-center">
                <PlusCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* UPDATED */}
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  Updated
                </p>

                <h2 className="text-4xl font-bold mt-2">
                  {
                    filteredLogs.filter(
                      (l: any) => l.action === "updated"
                    ).length
                  }
                </h2>

                <p className="text-xs text-muted-foreground mt-2">
                  Modified records
                </p>
              </div>

              <div className="w-16 h-16 rounded-3xl bg-blue-100 flex items-center justify-center">
                <Pencil className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DELETED */}
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  Deleted
                </p>

                <h2 className="text-4xl font-bold mt-2">
                  {
                    filteredLogs.filter(
                      (l: any) => l.action === "deleted"
                    ).length
                  }
                </h2>

                <p className="text-xs text-muted-foreground mt-2">
                  Removed records
                </p>
              </div>

              <div className="w-16 h-16 rounded-3xl bg-red-100 flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTERS */}
      <Card className="rounded-3xl border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* SEARCH */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />

              <Input
                placeholder="Search activity..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="pl-10 rounded-2xl"
              />
            </div>

            {/* ACTIVITY */}
            <Select
              value={activity}
              onValueChange={setActivity}
            >
              <SelectTrigger className="rounded-2xl">
                <Filter className="w-4 h-4 mr-2" />

                <SelectValue placeholder="Activity" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  All Activities
                </SelectItem>

                <SelectItem value="created">
                  Created
                </SelectItem>

                <SelectItem value="updated">
                  Updated
                </SelectItem>

                <SelectItem value="deleted">
                  Deleted
                </SelectItem>

                <SelectItem value="login">
                  Login
                </SelectItem>

                <SelectItem value="logout">
                  Logout
                </SelectItem>

                <SelectItem value="approved">
                  Approved
                </SelectItem>
              </SelectContent>
            </Select>

            {/* DATE */}
            <Select
              value={dateFilter}
              onValueChange={setDateFilter}
            >
              <SelectTrigger className="rounded-2xl">
                <Calendar className="w-4 h-4 mr-2" />

                <SelectValue placeholder="Date" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  All Time
                </SelectItem>

                <SelectItem value="today">
                  Today
                </SelectItem>

                <SelectItem value="7days">
                  Last 7 Days
                </SelectItem>

                <SelectItem value="30days">
                  Last 30 Days
                </SelectItem>
              </SelectContent>
            </Select>

            {/* TOTAL */}
            <div className="rounded-2xl border bg-background px-4 flex items-center">
              <div>
                <p className="text-sm text-muted-foreground">
                  Results
                </p>

                <h2 className="text-2xl font-bold">
                  {filteredLogs.length}
                </h2>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card className="rounded-3xl border-0 shadow-sm overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle>
            System Activity History
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-20"
                  >
                    Loading audit logs...
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length ? (
                filteredLogs.map((log: any) => (
                  <TableRow
                    key={log.id}
                    className="hover:bg-muted/40 transition"
                  >
                    {/* USER */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <User2 className="w-5 h-5 text-primary" />
                        </div>

                        <div>
                          <p className="font-medium">
                            User #{log.user_id || "-"}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {log.role_name || "System"}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* ACTION */}
                    <TableCell>
                      <Badge className="rounded-xl">
                        {log.action}
                      </Badge>
                    </TableCell>

                    {/* ENTITY */}
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {log.entity_type || "-"}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          #{log.entity_id || "-"}
                        </p>
                      </div>
                    </TableCell>

                    {/* MESSAGE */}
                    <TableCell>
                      <p className="max-w-[300px] truncate">
                        {log.message || "-"}
                      </p>
                    </TableCell>

                    {/* DATE */}
                    <TableCell>
                      {format(
                        new Date(log.created_at),
                        "PPP p"
                      )}
                    </TableCell>

                    {/* ACTION MENU */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="rounded-xl"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              setSelectedLog(log)
                            }
                          >
                            View History
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-20"
                  >
                    No audit activity found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DETAILS POPUP */}
      <Dialog
        open={!!selectedLog}
        onOpenChange={() => setSelectedLog(null)}
      >
        <DialogContent className="max-w-4xl rounded-3xl">
          <DialogHeader>
            <DialogTitle>
              Audit Activity Details
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-5">
              {/* TOP */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="rounded-2xl">
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground">
                      Action
                    </p>

                    <Badge className="mt-2">
                      {selectedLog.action}
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground">
                      Entity
                    </p>

                    <p className="font-semibold mt-2">
                      {selectedLog.entity_type} #
                      {selectedLog.entity_id}
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground">
                      User
                    </p>

                    <p className="font-semibold mt-2">
                      #{selectedLog.user_id || "-"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* MESSAGE */}
              <Card className="rounded-2xl">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground mb-2">
                    Message
                  </p>

                  <p>{selectedLog.message}</p>
                </CardContent>
              </Card>

              {/* BEFORE */}
              <div>
                <h3 className="font-semibold mb-3">
                  Before Changes
                </h3>

                <div className="bg-muted rounded-2xl p-5 overflow-auto max-h-80">
                  <pre className="text-sm">
                    {JSON.stringify(
                      selectedLog.before,
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>

              {/* AFTER */}
              <div>
                <h3 className="font-semibold mb-3">
                  After Changes
                </h3>

                <div className="bg-muted rounded-2xl p-5 overflow-auto max-h-80">
                  <pre className="text-sm">
                    {JSON.stringify(
                      selectedLog.after,
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}