import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Loader, AlertCircle, CheckCircle } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { EmailBackendContext } from "../context/EmailBackendContext";
import { setSelectedAPI } from "../config/apiConfig";
import "./OTPVerification.css";

const OTPVerification = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const otpInputs = useRef([]);
  
  const { verifyOTP, error: authError, otpEmail } = useContext(AuthContext);
  const { emailBackend } = useContext(EmailBackendContext);
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

  const handleOTPChange = (index, value) => {
    const numValue = value.replace(/\D/g, "").slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = numValue;
    setOtp(newOtp);
    setOtpError("");

    // Auto-focus next input
    if (numValue && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text");
    const pasteDigits = paste.replace(/\D/g, "").slice(0, 6).split("");
    const newOtp = [...otp];
    pasteDigits.forEach((digit, idx) => {
      if (idx < 6) newOtp[idx] = digit;
    });
    setOtp(newOtp);
    if (pasteDigits.length > 0) {
      otpInputs.current[Math.min(pasteDigits.length - 1, 5)]?.focus();
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setOtpError("");

    const otpString = otp.join("");

    if (!otpString.trim()) {
      setOtpError("Please enter the OTP");
      return;
    }

    if (otpString.length !== 6) {
      setOtpError("OTP must be 6 digits");
      return;
    }

    if (!/^\d+$/.test(otpString)) {
      setOtpError("OTP must contain only numbers");
      return;
    }

    setIsVerifying(true);
    const result = verifyOTP(email, otpString);

    if (result.success) {
      // Sync email backend to API config for dashboard
      if (emailBackend) {
        setSelectedAPI(emailBackend);
      }
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
  const isComplete = otp.every(digit => digit !== "");

  return (
    <div className="otp-container">
      <div className="otp-card">
        {/* Header Section */}
        <div className="otp-section otp-section-header">
          <button className="btn-back" onClick={handleGoBack}>
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          
          <h1>Verify Email</h1>
          <p className="otp-subtitle">
            Enter the 6-digit code sent to <strong>{email}</strong>
          </p>

          {/* Timer */}
          <div className={`timer ${isExpired ? "expired" : ""}`}>
            <span>Code expires in: </span>
            <strong>{formatTime(timeLeft)}</strong>
          </div>
        </div>

        {/* Form Section */}
        <div className="otp-section otp-section-form">
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
              <div className="otp-input-container">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOTPChange(index, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(index, e)}
                    onPaste={handleOTPPaste}
                    disabled={isVerifying || isExpired}
                    className={`otp-input-box ${digit ? "filled" : ""} ${otpError ? "error" : ""}`}
                    placeholder="0"
                  />
                ))}
              </div>
              {otpError && <span className="error-text">{otpError}</span>}
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={isVerifying || isExpired || !isComplete}
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
      </div>

      {/* Background decoration */}
      <div className="otp-background"></div>
    </div>
  );
};

export default OTPVerification;
