import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExternalLinkButtonProps {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function ExternalLinkButton({
  href,
  children,
  icon,
  className,
}: ExternalLinkButtonProps) {
  return (
    <Button variant="outline" size="sm" asChild className={cn(className)}>
      <a href={href} target="_blank" rel="noopener noreferrer">
        {icon}
        {children}
        <ExternalLink className="h-3 w-3 ml-1" />
      </a>
    </Button>
  );
}
