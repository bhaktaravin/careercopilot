import { Badge } from "@/components/ui/badge";

type Status = "saved" | "applied" | "interview" | "offer" | "rejected" | "withdrawn";

export function StatusBadge({ status }: { status: string }) {
  const s = status as Status;
  
  const config = {
    saved: { label: "Saved", className: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20" },
    applied: { label: "Applied", className: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border-purple-500/20" },
    interview: { label: "Interview", className: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20" },
    offer: { label: "Offer", className: "bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20" },
    rejected: { label: "Rejected", className: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20" },
    withdrawn: { label: "Withdrawn", className: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 border-gray-500/20" },
  };

  const current = config[s] || { label: status, className: "bg-muted text-muted-foreground" };

  return (
    <Badge variant="outline" className={`font-medium ${current.className}`}>
      {current.label}
    </Badge>
  );
}
