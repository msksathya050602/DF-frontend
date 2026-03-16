import "./login.scss";

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-card">
        <h1 className="login-title">Welcome to Daily-Fresh</h1>
        <p className="login-subtitle">Sign in to continue to Daily-Fresh.</p>
        <form className="login-form">
          <label className="login-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="login-input"
          />

          <label className="login-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            className="login-input"
          />

          <button type="submit" className="login-button">
            Sign In
          </button>
        </form>
      </section>
    </main>
  );
}
