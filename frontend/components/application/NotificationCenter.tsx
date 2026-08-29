"use client";

import {
  Bell,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NotificationCenter({
  notifications = [],
}: any) {

  return (
    <Card className="rounded-3xl">

      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">

        {notifications.length === 0 && (

          <div className="rounded-2xl border border-dashed p-6 text-center text-muted-foreground">
            No notifications available.
          </div>
        )}

        {notifications.map(
          (notification: any) => (

            <div
              key={notification.id}
              className="flex items-start gap-4 rounded-2xl border p-4"
            >

              <div className="mt-1">
                {notification.type ===
                "success" ? (

                  <CheckCircle2 className="h-5 w-5 text-green-600" />

                ) : (

                  <Clock3 className="h-5 w-5 text-amber-500" />
                )}
              </div>

              <div>
                <h3 className="font-medium">
                  {notification.title}
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  {notification.message}
                </p>
              </div>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
