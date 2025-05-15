"use client";

import { useState } from "react";
import { UserButton } from "@/components/user/user-button";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { NotificationBadge } from "@/components/notification/notification-badge";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface NavbarProps {
  onToggleSidebar: () => void;
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="md:hidden mr-2">
          <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1"></div>
        <div className="flex items-center space-x-3">
          <NotificationBadge />
          <ModeToggle />
          <UserButton />
        </div>
      </div>
    </div>
  );
} 