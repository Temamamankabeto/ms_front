"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { UserQrCard } from "@/components/user-management/user-qr-card";

export default function UserQrManagementPage() {
  const params = useParams();
  const id = String(params.id);
  const [user, setUser] = useState<{ id: string | number; name: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get(`/admin/users/${id}`)
      .then(({ data }) => {
        const value = data?.data?.user ?? data?.data;
        if (active) setUser({ id: value.id, name: value.name });
      })
      .catch(() => { if (active) setError("User not found or access denied."); });
    return () => { active = false; };
  }, [id]);

  return <main className="mx-auto max-w-3xl space-y-6 p-6">
    <Link href="/dashboard/users" className="text-sm underline">Back to users</Link>
    <h1 className="text-2xl font-bold">User QR login management</h1>
    {error && <p role="alert" className="text-red-600">{error}</p>}
    {user ? <UserQrCard userId={user.id} name={user.name} /> : !error && <p>Loading user...</p>}
  </main>;
}
