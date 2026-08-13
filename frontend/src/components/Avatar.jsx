const PALETTE = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-violet-600',
  'bg-rose-600',
  'bg-cyan-600',
];

function initialsOf(fullname = '') {
  const parts = fullname.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function colorFor(fullname = '') {
  let hash = 0;
  for (let i = 0; i < fullname.length; i += 1) {
    hash = (hash * 31 + fullname.charCodeAt(i)) % PALETTE.length;
  }
  return PALETTE[Math.abs(hash)];
}

export default function Avatar({ fullname, size = 'h-9 w-9' }) {
  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center rounded-full ${colorFor(fullname)} text-sm font-semibold text-white`}
      title={fullname}
    >
      {initialsOf(fullname)}
    </div>
  );
}
