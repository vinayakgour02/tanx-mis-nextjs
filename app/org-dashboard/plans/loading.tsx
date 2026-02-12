import { Skeleton } from '@/components/ui/skeleton';

export default function PlansLoading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="flex gap-4 items-center">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-10 w-[180px]" />
      </div>

      <div className="border rounded-lg">
        <div className="p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex gap-4 items-center py-4 border-b last:border-0"
            >
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-8 w-[100px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 