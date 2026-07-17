"use client";

import { useParams } from "next/navigation";
import SupportThread from "@/components/SupportThread";

export default function AdminSupportTicketPage() {
  const { id } = useParams<{ id: string }>();
  return <SupportThread ticketId={id} isAdminView backHref="/admin/support" />;
}
