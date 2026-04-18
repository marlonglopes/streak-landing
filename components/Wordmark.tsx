export default function Wordmark({
  className = "",
}: {
  className?: string;
}) {
  return (
    <span
      className={`font-display text-2xl font-bold tracking-tight text-navy ${className}`}
    >
      Streak<span className="text-orange">.</span>
    </span>
  );
}
