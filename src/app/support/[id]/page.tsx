"use client";

import { useParams } from "next/navigation";
import SupportThread from "@/components/SupportThread";

export default function SupportTicketPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <SupportThread ticketId={id} isAdminView={false} backHref="/support" />
    </div>
  );
}
