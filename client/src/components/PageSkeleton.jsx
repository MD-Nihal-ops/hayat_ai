export default function PageSkeleton({ rows = 4, label = "Loading page" }) {
  return (
    <div className="space-y-4" role="status" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div className="skeleton h-8 w-2/5 rounded-lg" />
      {Array.from({ length: rows }, (_, index) => (
        <div className="card-surface space-y-3" key={index}>
          <div className="skeleton h-5 w-1/3 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-4/5 rounded" />
        </div>
      ))}
    </div>
  );
}
