"use client";

import Link from "next/link";
import { Eye } from "lucide-react";

import ApplicationStatusBadge from "@/components/application/ApplicationStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useServiceApplications } from "@/hooks/application-workflow/use-application-workflow";

export default function ServiceApplicationsPage() {
  const { data = [], isLoading } = useServiceApplications();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Service Applications</h1>
        <p className="text-sm text-muted-foreground">Admin view of submitted service applications.</p>
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : data.length ? (
                  data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.tracking_number}</TableCell>
                      <TableCell>{item.service?.name || item.service_id}</TableCell>
                      <TableCell>{item.customer?.name || item.customer_id}</TableCell>
                      <TableCell>
                        <ApplicationStatusBadge status={item.status} />
                      </TableCell>
                      <TableCell>{item.submitted_at ? new Date(item.submitted_at).toLocaleString() : "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/service-applications/${item.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      No applications found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
