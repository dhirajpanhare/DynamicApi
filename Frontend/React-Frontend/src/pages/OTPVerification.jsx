import { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Loader, AlertCircle, CheckCircle } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import "./OTPVerification.css";

const OTPVerification = () => {
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  
  const { verifyOTP, error: authError, otpEmail } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || otpEmail;

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setOtpError("");

    if (!otp.trim()) {
      setOtpError("Please enter the OTP");
      return;
    }

    if (otp.length !== 6) {
      setOtpError("OTP must be 6 digits");
      return;
    }

    if (!/^\d+$/.test(otp)) {
      setOtpError("OTP must contain only numbers");
      return;
    }

    setIsVerifying(true);
    const result = verifyOTP(email, otp);

    if (result.success) {
      // Redirect to dashboard after success
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1000);
    } else {
      setOtpError(result.message);
    }

    setIsVerifying(false);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const isExpired = timeLeft <= 0;

  return (
    <div className="otp-container">
      <div className="otp-card">
        {/* Back Button */}
        <button className="btn-back" onClick={handleGoBack}>
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="otp-header">
          <h1>Verify Email</h1>
          <p className="otp-subtitle">
            Enter the 6-digit code sent to <strong>{email}</strong>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleVerifyOTP} className="otp-form">
          {/* Error Messages */}
          {authError && (
            <div className="alert alert-error">
              <AlertCircle size={18} />
              <span>{authError}</span>
            </div>
          )}

          {otpError && (
            <div className="alert alert-error">
              <AlertCircle size={18} />
              <span>{otpError}</span>
            </div>
          )}

          {/* OTP Input */}
          <div className="form-group">
            <label htmlFor="otp">One-Time Password</label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength="6"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtp(value);
                setOtpError("");
              }}
              placeholder="000000"
              disabled={isVerifying || isExpired}
              className={`otp-input ${otpError ? "input-error" : ""} ${
                otp.length === 6 ? "complete" : ""
              }`}
            />
            {otpError && <span className="error-text">{otpError}</span>}
          </div>

          {/* Timer */}
          <div className={`timer ${isExpired ? "expired" : ""}`}>
            <span>Code expires in: </span>
            <strong>{formatTime(timeLeft)}</strong>
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={isVerifying || isExpired || otp.length !== 6}
            className="btn-verify-otp"
          >
            {isVerifying ? (
              <>
                <Loader size={18} className="spinner" />
                <span>Verifying...</span>
              </>
            ) : isExpired ? (
              <>
                <AlertCircle size={18} />
                <span>Code Expired</span>
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                <span>Verify OTP</span>
              </>
            )}
          </button>
        </form>

        {/* Info */}
        <div className="otp-info">
          <p>
            <strong>Testing:</strong> Check your browser console for the OTP code
          </p>
        </div>

        {/* Help */}
        <div className="otp-help">
          <p>
            Didn't receive the code?
            <button
              type="button"
              onClick={handleGoBack}
              className="btn-resend"
            >
              Request new code
            </button>
          </p>
        </div>
      </div>

      {/* Background decoration */}
      <div className="otp-background"></div>
    </div>
  );
};

export default OTPVerification;
