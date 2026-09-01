import './App.css'

function App() {
  return (
    <div className="login-page">
      
      {/* Left Branding Section */}
      <div className="branding-section">
        <div className="brand-content">
          <div className="logo">VR</div>

          <h1>Vendor Reliability Platform</h1>

          <p>
            A centralized platform for managing vendors,
            procurement activities, and role-based access securely.
          </p>

          <div className="feature-list">
            <div>✓ Centralized Vendor Management</div>
            <div>✓ Secure Role-Based Access</div>
            <div>✓ Procurement Management</div>
          </div>
        </div>
      </div>

      {/* Right Login Section */}
      <div className="login-section">
        <div className="login-card">
          
          <h2>Welcome Back</h2>
          <p className="subtitle">
            Sign in to access your workspace
          </p>

          <form>
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
            />

            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
            />

            <div className="forgot-password">
              <a href="#">Forgot Password?</a>
            </div>

            <button type="submit">Sign In</button>
          </form>

          <p className="register-text">
            Don't have an account? <a href="#">Contact Administrator</a>
          </p>

        </div>
      </div>

    </div>
  )
}

export default App