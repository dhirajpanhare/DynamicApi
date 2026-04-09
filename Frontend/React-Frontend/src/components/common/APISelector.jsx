import { useState, useRef, useEffect } from "react";
import { Server, ChevronDown, Check } from "lucide-react";
import { 
  getSelectedAPI, 
  setSelectedAPI, 
  getGroupedAPIs,
  getCurrentAPIConfig
} from "../../config/apiConfig";
import "./APISelector.css";

const APISelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAPI, setLocalSelectedAPI] = useState(getSelectedAPI());
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const groupedAPIs = getGroupedAPIs();
  const currentConfig = getCurrentAPIConfig();

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const newTop = rect.bottom + 8;
      const newLeft = Math.max(20, rect.left);
      
      setDropdownPos({
        top: newTop,
        left: newLeft
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          buttonRef.current && !buttonRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelectAPI = (apiId) => {
    setSelectedAPI(apiId);
    setLocalSelectedAPI(apiId);
    setIsOpen(false);
  };

  return (
    <div className="api-selector-container">
      <button
        ref={buttonRef}
        className="api-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Select API Backend"
      >
        <Server size={18} />
        <span className="api-selector-label">{currentConfig.name}</span>
        <ChevronDown size={16} className={isOpen ? "open" : ""} />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="api-selector-dropdown"
          style={{
            top: `${dropdownPos.top}px`,
            left: `${dropdownPos.left}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="api-selector-header">
            <h4>Available Backends</h4>
          </div>

          {/* .NET Backends */}
          {groupedAPIs.dotnet.length > 0 && (
            <div className="api-group">
              <div className="api-group-title">.NET Backends</div>
              {groupedAPIs.dotnet.map(api => (
                <div
                  key={api.id}
                  className={`api-option ${selectedAPI === api.id ? "selected" : ""}`}
                  onClick={() => handleSelectAPI(api.id)}
                >
                  <div className="api-option-header">
                    <span className="api-name">{api.name}</span>
                    <span className="api-type-badge">{api.type}</span>
                  </div>
                  <div className="api-option-details">
                    <span className="api-description">{api.description}</span>
                    <span className="api-port">Port: {api.port}</span>
                  </div>
                  {selectedAPI === api.id && (
                    <Check size={16} className="check-icon" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Django Backends */}
          {groupedAPIs.django.length > 0 && (
            <div className="api-group">
              <div className="api-group-title">Django Backends</div>
              {groupedAPIs.django.map(api => (
                <div
                  key={api.id}
                  className={`api-option ${selectedAPI === api.id ? "selected" : ""}`}
                  onClick={() => handleSelectAPI(api.id)}
                >
                  <div className="api-option-header">
                    <span className="api-name">{api.name}</span>
                    <span className="api-type-badge">{api.type}</span>
                  </div>
                  <div className="api-option-details">
                    <span className="api-description">{api.description}</span>
                    <span className="api-port">Port: {api.port}</span>
                  </div>
                  {selectedAPI === api.id && (
                    <Check size={16} className="check-icon" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Express Backends */}
          {groupedAPIs.express.length > 0 && (
            <div className="api-group">
              <div className="api-group-title">Express Backends</div>
              {groupedAPIs.express.map(api => (
                <div
                  key={api.id}
                  className={`api-option ${selectedAPI === api.id ? "selected" : ""}`}
                  onClick={() => handleSelectAPI(api.id)}
                >
                  <div className="api-option-header">
                    <span className="api-name">{api.name}</span>
                    <span className="api-type-badge">{api.type}</span>
                  </div>
                  <div className="api-option-details">
                    <span className="api-description">{api.description}</span>
                    <span className="api-port">Port: {api.port}</span>
                  </div>
                  {selectedAPI === api.id && (
                    <Check size={16} className="check-icon" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isOpen && <div className="api-selector-overlay" onClick={() => setIsOpen(false)} />}
    </div>
  );
};

export default APISelector;
