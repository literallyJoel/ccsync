interface SkeletonGridProps {
  label: string;
  count?: number;
}

const SkeletonGrid = ({ label, count = 2 }: SkeletonGridProps) => (
  <div className="flex flex-col gap-2">
    <p
      className="text-xs font-medium"
      style={{ color: "rgba(255,255,255,0.4)" }}
    >
      {label}
    </p>
    <div className="grid grid-cols-2 gap-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-white/5" />
      ))}
    </div>
  </div>
);

export default SkeletonGrid;
