export function StampBadge({
  text,
  subtext,
  size = 'md',
  variant = 'accent',
}: {
  text: string;
  subtext?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'accent' | 'dark' | 'bone';
}) {
  const sizes = {
    sm: 'w-24 h-24 text-xs',
    md: 'w-32 h-32 text-sm',
    lg: 'w-44 h-44 text-lg',
  };

  const variants = {
    accent: 'bg-accent text-bone border-ink',
    dark: 'bg-ink text-bone border-ink',
    bone: 'bg-bone text-ink border-ink',
  };

  return (
    <div
      className={`stamp ${sizes[size]} ${variants[variant]} rotate-[-12deg] animate-stamp-in flex-col gap-1`}
    >
      <span className="font-display uppercase leading-none">{text}</span>
      {subtext && (
        <span className="font-body text-[0.6em] uppercase tracking-widest opacity-80">
          {subtext}
        </span>
      )}
    </div>
  );
}
