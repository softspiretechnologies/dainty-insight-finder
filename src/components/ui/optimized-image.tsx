import { cn } from "@/lib/utils";

type OptimizedImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  /** Mark the LCP image — eager load + high fetch priority (one per page). */
  priority?: boolean;
};

export function OptimizedImage({
  priority = false,
  loading,
  fetchPriority,
  decoding = "async",
  className,
  ...props
}: OptimizedImageProps) {
  return (
    <img
      {...props}
      className={cn(className)}
      loading={priority ? "eager" : (loading ?? "lazy")}
      fetchPriority={priority ? "high" : fetchPriority}
      decoding={decoding}
    />
  );
}

/** Responsive `sizes` for 2-col mobile / 3-col desktop catalog grids. */
export const catalogGridSizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 384px";

/** Responsive `sizes` for full-width product hero on small screens. */
export const productHeroSizes = "(max-width: 1024px) 100vw, 55vw";
