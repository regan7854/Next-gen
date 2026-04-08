export default function LogoMark({ height = 32 }) {
  return (
    <img
      src="/logo.png"
      alt="NextGen"
      style={{ height, width: 'auto', display: 'block' }}
    />
  );
}
