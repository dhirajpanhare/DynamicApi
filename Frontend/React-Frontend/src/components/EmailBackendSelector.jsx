import { useContext } from "react";
import { EmailBackendContext } from "../context/EmailBackendContext";
import "../styles/EmailBackendSelector.css";

/**
 * Email Backend Selector Component
 * Allows users to dynamically select which backend to use for OTP email service
 * No need to restart dev server - changes take effect immediately
 */
export const EmailBackendSelector = () => {
  const { emailBackend, setEmailBackend, backends, getCurrentBackendName } = useContext(EmailBackendContext);

  if (!emailBackend || !backends) {
    return null;
  }

  return (
    <div className="email-backend-selector">
      <div className="selector-container">
        <label htmlFor="backend-select" className="selector-label">
          📧 Email Backend:
        </label>
        <select
          id="backend-select"
          value={emailBackend}
          onChange={(e) => setEmailBackend(e.target.value)}
          className="selector-dropdown"
        >
          <optgroup label="Express Backends">
            <option value="express-mongodb">Express + MongoDB (3001)</option>
            <option value="express-mssql">Express + MSSQL (3002)</option>
            <option value="express-mysql">Express + MySQL (3003)</option>
          </optgroup>
          <optgroup label="Django Backends">
            <option value="django-mssql">Django + MSSQL (8000)</option>
            <option value="django-mysql">Django + MySQL (8001)</option>
          </optgroup>
          <optgroup label=".NET Backends">
            <option value="dotnet-mssql">.NET + MSSQL (5000)</option>
            <option value="dotnet-mysql">.NET + MySQL (5001)</option>
          </optgroup>
        </select>
        <span className="selector-info">
          Using: <strong>{getCurrentBackendName()}</strong>
        </span>
      </div>
    </div>
  );
};

export default EmailBackendSelector;
