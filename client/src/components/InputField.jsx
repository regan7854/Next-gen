export default function InputField({ label, error, ...props }) {
  return (
    <label className={`field${error ? ' has-error' : ''}`}>
      <span className="field-label">{label}</span>
      <input {...props} />
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}
