"use client";

import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useApplicationReview,
  useApproveApplication,
  useRejectApplication,
} from "@/hooks/application/use-application";

export default function ApplicationReviewPage() {
  const params = useParams();
  const id = Number(params.id);

  const { data, isLoading } = useApplicationReview(id);

  const approveMutation = useApproveApplication();
  const rejectMutation = useRejectApplication();

  const application = data?.data;

  if (isLoading) return <div>Loading...</div>;

  if (!application) {
    return <div>Application not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">
          Application Review
        </h1>
        <p className="text-muted-foreground">
          Review citizen application.
        </p>
      </div>

      <Card className="rounded-3xl">
        <CardContent className="space-y-5 p-6">
          <div>
            <h2 className="text-xl font-bold">
              {application.service?.name}
            </h2>
            <p className="text-muted-foreground">
              {application.tracking_number}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {application.data?.map((item: any) => (
              <div
                key={item.id}
                className="rounded-2xl border p-4"
              >
                <p className="text-sm text-muted-foreground">
                  {item.field_name}
                </p>
                <h3 className="mt-1 font-semibold">
                  {item.field_value}
                </h3>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              disabled={approveMutation.isPending}
              onClick={() =>
                approveMutation.mutate({
                  id,
                  payload: { remark: "Approved" },
                })
              }
            >
              Approve
            </Button>

            <Button
              variant="destructive"
              disabled={rejectMutation.isPending}
              onClick={() =>
                rejectMutation.mutate({
                  id,
                  payload: { remark: "Rejected" },
                })
              }
            >
              Reject
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}