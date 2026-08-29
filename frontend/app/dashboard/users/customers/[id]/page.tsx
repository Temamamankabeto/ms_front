"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  User,
  Activity,
  Calendar,
  Hash,
  Pencil,
} from "lucide-react";

import { useUser } from "@/hooks/user/useUsers";
import { Button } from "@/components/ui/button";

export default function CustomerShowPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, isLoading } = useUser(id);
  const customer = data?.data;

  if (isLoading) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        Loading customer...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-10 text-center text-destructive">
        Customer not found
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-muted/30 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Profile</h1>
          <p className="text-muted-foreground">
            Manage customer information
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/users/customers/${id}/edit`)
            }
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-6 rounded-xl bg-card p-6 shadow">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-600">
          {customer.name?.charAt(0)}
        </div>

        <div>
          <h2 className="text-2xl font-bold">{customer.name}</h2>

          <p className="flex items-center gap-2 text-muted-foreground">
            <Mail size={16} />
            {customer.email}
          </p>

          <p className="mt-1 flex items-center gap-2 text-muted-foreground">
            <Phone size={16} />
            {customer.phone || "-"}
          </p>

          <div className="mt-3 flex gap-2">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
              Customer
            </span>

            <span
              className={`rounded-full px-3 py-1 text-sm ${
                customer.is_active
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {customer.is_active ? "active" : "disabled"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-card p-6 shadow">
          <h3 className="mb-5 font-bold">Account Information</h3>

          <div className="space-y-5">
            <InfoItem
              icon={<User size={18} />}
              title="Full Name"
              value={customer.name}
            />
            <InfoItem
              icon={<Phone size={18} />}
              title="Phone"
              value={customer.phone || "-"}
            />
            <InfoItem
              icon={<Activity size={18} />}
              title="Status"
              value={customer.is_active ? "Active" : "Disabled"}
            />
          </div>
        </div>

        <div className="rounded-xl bg-card p-6 shadow">
          <h3 className="mb-5 font-bold">System Information</h3>

          <div className="space-y-5">
            <InfoItem
              icon={<Hash size={18} />}
              title="Customer ID"
              value={`#${customer.id}`}
            />
            <InfoItem
              icon={<Calendar size={18} />}
              title="Joined"
              value={
                customer.created_at
                  ? new Date(customer.created_at).toLocaleDateString()
                  : "-"
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  title,
  value,
}: {
  icon: any;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
        {icon}
      </div>

      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
