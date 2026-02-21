import { Skeleton } from "@/components/ui/skeleton";

const ProductCardSkeleton = () => (
  <div className="bg-card rounded-xl sm:rounded-2xl overflow-hidden border border-border/50 flex flex-col animate-fade-in">
    <Skeleton className="aspect-square w-full rounded-none" />
    <div className="p-2.5 sm:p-3 md:p-4 flex flex-col flex-1">
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-3/4 mb-3" />
      <Skeleton className="h-5 w-1/3 mb-3" />
      <Skeleton className="h-10 w-full rounded-lg mt-auto" />
    </div>
  </div>
);

export default ProductCardSkeleton;
