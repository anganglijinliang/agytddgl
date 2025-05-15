"use client";

import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: UserRole;
}

export function useCurrentUser(): User | null {
  const { data } = useSession();
  
  if (!data?.user) {
    return null;
  }

  return {
    id: data.user.id as string,
    name: data.user.name || null,
    email: data.user.email || null,
    image: data.user.image || null,
    role: (data.user.role as UserRole) || UserRole.READ_ONLY,
  };
} 