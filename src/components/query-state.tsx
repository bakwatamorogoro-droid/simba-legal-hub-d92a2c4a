import type { ReactNode } from "react";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoadingState({ label = "Inapakia..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({
  title = "Imeshindikana kupakia taarifa",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <div>
        <p className="font-display text-lg text-primary">{title}</p>
        {message && <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" /> Jaribu tena
        </Button>
      )}
    </div>
  );
}

export function QueryBoundary({
  isLoading,
  isError,
  isEmpty,
  onRetry,
  emptyState,
  children,
  loadingLabel,
}: {
  isLoading: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  onRetry?: () => void;
  emptyState?: ReactNode;
  children: ReactNode;
  loadingLabel?: string;
}) {
  if (isLoading) return <LoadingState label={loadingLabel} />;
  if (isError) return <ErrorState onRetry={onRetry} />;
  if (isEmpty && emptyState) return <>{emptyState}</>;
  return <>{children}</>;
}
