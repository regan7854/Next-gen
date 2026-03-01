import InputField from './InputField.jsx';

export default function AuthCard({
  mode,
  onModeChange,
  loginForm,
  registerForm,
  onLoginChange,
  onRegisterChange,
  onLoginSubmit,
  onRegisterSubmit,
  loading,
  error,
}) {
  const isRegister = mode === 'register';

  return (
    <section className="auth-card">
      <header className="auth-card-header">
        <h2>{isRegister ? 'Create account' : 'Welcome back'}</h2>
        <p>{isRegister ? 'Start your journey with NextGen' : 'Sign in to continue'}</p>
      </header>

      <div className="mode-toggle">
        <button
          type="button"
          className={mode === 'login' ? 'active' : ''}
          onClick={() => onModeChange('login')}
        >
          Log in
        </button>
        <button
          type="button"
          className={mode === 'register' ? 'active' : ''}
          onClick={() => onModeChange('register')}
        >
          Register
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {isRegister ? (
        <form onSubmit={onRegisterSubmit} autoComplete="off">
          <InputField
            label="Username"
            name="username"
            type="text"
            value={registerForm.username}
            onChange={onRegisterChange}
            placeholder="Choose a unique username"
            required
            minLength={3}
            maxLength={30}
          />
          <InputField
            label="Display Name"
            name="displayName"
            type="text"
            value={registerForm.displayName}
            onChange={onRegisterChange}
            placeholder="Your name"
            required
          />
          <InputField
            label="Email"
            name="email"
            type="email"
            value={registerForm.email}
            onChange={onRegisterChange}
            placeholder="you@example.com"
            required
          />
          <InputField
            label="Password"
            name="password"
            type="password"
            value={registerForm.password}
            onChange={onRegisterChange}
            placeholder="Min 8 chars, letters &amp; numbers"
            required
            minLength={8}
          />
          <InputField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={registerForm.confirmPassword}
            onChange={onRegisterChange}
            placeholder="Re-enter password"
            required
          />
          <InputField
            label="Bio (optional)"
            name="biography"
            type="text"
            value={registerForm.biography}
            onChange={onRegisterChange}
            placeholder="Tell us about yourself"
          />
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating account\u2026' : 'Create account'}
          </button>
        </form>
      ) : (
        <form onSubmit={onLoginSubmit} autoComplete="off">
          <InputField
            label="Email or Username"
            name="identifier"
            type="text"
            value={loginForm.identifier}
            onChange={onLoginChange}
            placeholder="you@example.com or username"
            required
          />
          <InputField
            label="Password"
            name="password"
            type="password"
            value={loginForm.password}
            onChange={onLoginChange}
            placeholder="Enter your password"
            required
          />
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Signing in\u2026' : 'Sign in'}
          </button>
        </form>
      )}
    </section>
  );
}
