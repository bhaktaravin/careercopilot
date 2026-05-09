import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-xl bg-card/50">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-6 text-muted-foreground">
        {icon || <FileQuestion className="w-8 h-8" />}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-8">{description}</p>
      {action}
    </div>
  );
}
