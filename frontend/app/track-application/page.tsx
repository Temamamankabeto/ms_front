"use client";

import {
  Suspense,
  useEffect,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

function TrackApplicationRedirectContent() {
  const router = useRouter();

  const params =
    useSearchParams();

  useEffect(() => {
    const query =
      params.toString();

    router.replace(
      `/dashboard/track-application${
        query
          ? `?${query}`
          : ""
      }`
    );
  }, [router, params]);

  return null;
}

export default function TrackApplicationRedirectPage() {
  return (
    <Suspense fallback={null}>
      <TrackApplicationRedirectContent />
    </Suspense>
  );
}