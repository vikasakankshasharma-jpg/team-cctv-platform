import { StaffManagementClient } from "@/components/admin/StaffManagementClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff & Access Control | Command Centre",
  description: "Manage internal staff roles, permissions, and territory access.",
};

export default function StaffManagementPage() {
  return <StaffManagementClient />;
}
