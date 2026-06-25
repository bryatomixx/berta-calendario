interface AvatarProps {
  name:  string;
  color: string;
  size?: number;
}

/** Circulo de color con las iniciales del miembro. */
export function Avatar({ name, color, size = 28 }: AvatarProps) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <span
      title={name}
      aria-label={name}
      className="inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0 ring-1 ring-white shadow-xs"
      style={{
        backgroundColor: color,
        width:            size,
        height:           size,
        fontSize:         size * 0.38,
      }}
    >
      {initials}
    </span>
  );
}
