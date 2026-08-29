"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { useUser, useUpdateUser } from "@/hooks/user/useUsers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading } = useUser(id);
  const customer = data?.data;
  const updateUser = useUpdateUser();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    date_of_birth: "",
    address: "",
    status: "active",
  });

  useEffect(() => {
    if (!customer) return;

    setForm({
      name: customer.name ?? "",
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      gender: customer.gender ?? "",
      date_of_birth: customer.date_of_birth
        ? String(customer.date_of_birth).slice(0, 10)
        : "",
      address: customer.address ?? "",
      status: customer.is_active ? "active" : "disabled",
    });
  }, [customer]);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      await updateUser.mutateAsync({
        id,
        data: {
          ...form,
          role: "customer",
        },
      });

      toast.success("Customer updated successfully");
      router.push(`/dashboard/users/customers/${id}`);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        Object.values(error?.response?.data?.errors ?? {})?.[0]?.[0] ||
        "Failed to update customer";
      toast.error(message);
    }
  }

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
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Customer</h1>
          <p className="text-sm text-muted-foreground">
            Update {customer.name}&apos;s account details.
          </p>
        </div>

        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} disabled />
              <p className="text-xs text-muted-foreground">
                Phone number cannot be changed.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Gender</Label>
              <Select
                value={form.gender}
                onValueChange={(value) => update("gender", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => update("date_of_birth", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => update("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <Button type="submit" disabled={updateUser.isPending}>
                {updateUser.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
