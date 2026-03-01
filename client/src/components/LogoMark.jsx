export default function LogoMark({ size = 40 }) {
  const fs = Math.round(size * 0.38);
  return (
    <div
      className="logo-mark"
      style={{ width: size, height: size, fontSize: fs }}
      aria-label="NextGen"
      role="img"
    >
      <span>N</span>
    </div>
  );
}
