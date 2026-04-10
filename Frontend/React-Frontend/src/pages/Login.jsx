import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Send, Loader, AlertCircle, CheckCircle } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import EmailBackendSelector from "../components/EmailBackendSelector";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { sendOTP, sendingOTP, otpSent, error } = useContext(AuthContext);
  const navigate = useNavigate();

  // Simple email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setEmailError("");
    setSuccessMessage("");

    // Validate email
    if (!email.trim()) {
      setEmailError("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    const result = await sendOTP(email);

    if (result.success) {
      setSuccessMessage(
        result.testMode 
          ? "OTP generated (check console)" 
          : result.message
      );
      // Redirect to OTP verification page after slight delay
      setTimeout(() => {
        navigate("/verify-otp", { state: { email } });
      }, 1500);
    } else {
      setEmailError(result.message);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header Section */}
        <div className="login-section login-section-header">
          <div className="login-icon">
            <Mail size={40} />
          </div>
          <h1>Dynamic API</h1>
          <p className="login-subtitle">Sign in with Email & OTP</p>
          
          {/* Email Backend Selector */}
          <EmailBackendSelector />
        </div>

        {/* Form Section */}
        <div className="login-section login-section-form">
          <form onSubmit={handleSendOTP} className="login-form">
            {/* Error Message */}
            {error && (
              <div className="alert alert-error">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="alert alert-success">
                <CheckCircle size={18} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Email Input */}
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  placeholder="Enter your email address"
                  disabled={otpSent || isSubmitting}
                  className={emailError ? "input-error" : ""}
                />
              </div>
              {emailError && <span className="error-text">{emailError}</span>}
            </div>

            {/* Info Message */}
            {otpSent ? (
              <div className="info-box">
                <p>✓ OTP sent to <strong>{email}</strong></p>
                <p className="small-text">Check your email and click the link below to verify</p>
              </div>
            ) : (
              <div className="info-box">
                <p>We'll send you a one-time password (OTP) to verify your identity</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={sendingOTP || isSubmitting || otpSent}
              className="btn-send-otp"
            >
              {sendingOTP || isSubmitting ? (
                <>
                  <Loader size={18} className="spinner" />
                  <span>Sending OTP...</span>
                </>
              ) : otpSent ? (
                <>
                  <CheckCircle size={18} />
                  <span>OTP Sent</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Send OTP</span>
                </>
              )}
            </button>
          </form>


          {/* Footer */}
          <div className="login-footer">
            <p>
              <small>
                No databases. No passwords. Your data stays on your device.
              </small>
            </p>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="login-background"></div>
    </div>
  );
};

export default Login;
