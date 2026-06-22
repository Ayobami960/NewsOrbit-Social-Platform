"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LegacyUserProfileRedirect() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (id) router.replace(`/profile/user/${id}`);
    else router.replace("/profile");
  }, [id, router]);

  return null;
}
