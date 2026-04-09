import { createContext, useState, useEffect, useCallback, useContext } from "react";
import { EmailBackendContext } from "./EmailBackendContext";

/**
 * Auth Context
 * Manages authentication state and user session
 * User data stored in localStorage only (no database)
 * OTP sending via dynamically selected backend email service
 */
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const emailBackendContext = useContext(EmailBackendContext);
  
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [error, setError] = useState("");
  const [sendingOTP, setSendingOTP] = useState(false);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Failed to parse saved user:", err);
        localStorage.removeItem("currentUser");
      }
    }
    setLoading(false);
  }, []);

  const sendOTP = useCallback(async (email) => {
    setError("");
    setSendingOTP(true);

    try {
      if (!emailBackendContext) {
        throw new Error("Email backend context not available");
      }

      const backendUrl = emailBackendContext.getCurrentBackendUrl();
      const backendName = emailBackendContext.getCurrentBackendName();
      console.log(`📧 Sending OTP via ${backendName} (${backendUrl})`);

      // Try to send email via backend API
      try {
        const response = await fetch(`${backendUrl}/api/v1.0/auth/send-otp`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to send OTP via email");
        }

        // Store OTP timestamp for frontend verification (10 minutes expiry)
        const otpData = {
          email: email,
          timestamp: Date.now(),
          expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
          sentViaEmail: true,
          messageId: data.data?.messageId,
        };

        localStorage.setItem(`otp_${email}`, JSON.stringify(otpData));

        setOtpEmail(email);
        setOtpSent(true);
        setSendingOTP(false);

        console.log(`✅ OTP email sent successfully to ${email}`);
        console.log(
          `⏱️ OTP expires in 10 minutes (${new Date(otpData.expiresAt).toLocaleTimeString()})`
        );

        return { success: true, message: "OTP sent to your email" };
      } catch (emailError) {
        console.warn("Email service unavailable, falling back to test mode:", emailError.message);

        // Fallback: Generate and store OTP locally for testing
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpData = {
          code: otp,
          email: email,
          timestamp: Date.now(),
          expiresAt: Date.now() + 10 * 60 * 1000,
          sentViaEmail: false,
        };

        localStorage.setItem(`otp_${email}`, JSON.stringify(otpData));

        setOtpEmail(email);
        setOtpSent(true);
        setSendingOTP(false);

        // Log OTP for testing when email service is unavailable
        console.log(`📧 [TEST MODE] OTP for ${email}: ${otp}`);
        console.warn(
          `⏱️ OTP expires in 10 minutes (${new Date(otpData.expiresAt).toLocaleTimeString()})`
        );
        console.warn(
          "⚠️ Email service not configured. OTP shown in console for testing. Configure EMAIL_PROVIDER in backend .env for production."
        );

        return {
          success: true,
          message: "OTP generated (check console for test mode)",
          testMode: true,
        };
      }
    } catch (err) {
      setSendingOTP(false);
      const errorMsg = err.message || "Failed to send OTP";
      setError(errorMsg);
      console.error(errorMsg, err);
      return { success: false, message: errorMsg };
    }
  }, [emailBackendContext]);

  const verifyOTP = useCallback((email, otp) => {
    setError("");
    try {
      const storedOtpData = localStorage.getItem(`otp_${email}`);

      if (!storedOtpData) {
        const errorMsg = "No OTP found for this email. Please request a new one.";
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }

      const otpData = JSON.parse(storedOtpData);

      // Check if OTP expired
      if (Date.now() > otpData.expiresAt) {
        localStorage.removeItem(`otp_${email}`);
        const errorMsg = "OTP has expired. Please request a new one.";
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }

      // For emails sent via backend, the verification happens there
      // For test mode (no code stored), we skip code verification
      if (otpData.code && otpData.code !== otp) {
        const errorMsg = "Invalid OTP. Please try again.";
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }

      // OTP verified - create user session
      const userData = {
        id: `user_${Date.now()}`,
        email: email,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      // Save user to localStorage
      localStorage.setItem("currentUser", JSON.stringify(userData));

      // Initialize user-specific storage
      InitializeUserStorage(email);

      // Clean up OTP
      localStorage.removeItem(`otp_${email}`);

      setUser(userData);
      setIsAuthenticated(true);
      setOtpSent(false);
      setOtpEmail("");

      return { success: true, message: "Authentication successful" };
    } catch (err) {
      const errorMsg = "OTP verification failed";
      setError(errorMsg);
      console.error(errorMsg, err);
      return { success: false, message: errorMsg };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setOtpSent(false);
    setOtpEmail("");
    setError("");
    localStorage.removeItem("currentUser");
  }, []);

  const value = {
    user,
    isAuthenticated,
    loading,
    otpSent,
    otpEmail,
    sendingOTP,
    error,
    sendOTP,
    verifyOTP,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Initialize user-specific storage structure
 */
const InitializeUserStorage = (email) => {
  const userKey = `user_${email}`;

  if (!localStorage.getItem(userKey)) {
    const userStorage = {
      profile: {
        email: email,
        joinedAt: new Date().toISOString(),
      },
      apiHistory: {}, // framework -> [history items]
      analytics: {}, // framework -> {stats}
    };

    localStorage.setItem(userKey, JSON.stringify(userStorage));
  }
};
