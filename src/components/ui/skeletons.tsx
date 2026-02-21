import { Skeleton } from "@/components/ui/skeleton";

const ProductCardSkeleton = () => (
  <div className="bg-card rounded-xl sm:rounded-2xl overflow-hidden border border-border/50 flex flex-col">
    <Skeleton className="aspect-square w-full rounded-none" />
    <div className="p-2.5 sm:p-3 md:p-4 flex flex-col flex-1 gap-2">
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-2/3" />
      <div className="flex items-center gap-2 mt-1">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-3.5 w-14" />
      </div>
      <Skeleton className="h-9 sm:h-10 w-full rounded-lg mt-auto" />
    </div>
  </div>
);

const CategoryGridSkeleton = () => (
  <section className="py-4 sm:py-6 md:py-8 lg:py-10 section-container">
    <Skeleton className="h-6 md:h-9 w-48 mx-auto mb-4 md:mb-6" />
    <div className="grid grid-cols-4 gap-3 sm:gap-4 md:flex md:justify-center md:gap-5 lg:gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <Skeleton className="w-full aspect-square md:w-24 md:h-24 rounded-2xl" />
          <Skeleton className="h-3.5 w-14" />
        </div>
      ))}
    </div>
  </section>
);

const BlogCardSkeleton = () => (
  <div className="bg-card rounded-2xl overflow-hidden border border-border/50">
    <Skeleton className="aspect-[16/10] w-full rounded-none" />
    <div className="p-4 space-y-2.5">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-3/4" />
    </div>
  </div>
);

const ProductDetailSkeleton = () => (
  <main className="section-container py-4 md:py-8 pb-24 md:pb-10">
    <Skeleton className="h-4 w-48 mb-4 sm:mb-6" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
      <div>
        <Skeleton className="aspect-square w-full rounded-xl mb-3" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex-shrink-0" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-7 w-32" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-4 h-4 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center gap-3 pt-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-12 flex-1 rounded-lg" />
          <Skeleton className="h-12 flex-1 rounded-lg" />
        </div>
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  </main>
);

export { ProductCardSkeleton, CategoryGridSkeleton, BlogCardSkeleton, ProductDetailSkeleton };
