import { useState } from "react";
import { Wand2, Loader, AlertCircle, Copy, Check, X } from "lucide-react";
import { generatePayload } from "../../Services/dynamicApi";
import "./PayloadGenerator.css";

const PayloadGenerator = ({ onGenerate, onClose }) => {
  const [procedureDefinition, setProcedureDefinition] = useState("");
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const exampleProcedure = `CREATE PROCEDURE GetProductById(
  IN p_ProductId INT,
  IN p_Category VARCHAR(100)
)
BEGIN
  SELECT * FROM Products 
  WHERE ProductId = p_ProductId 
  AND Category = p_Category;
END`;

  const handleGenerate = async () => {
    if (!procedureDefinition.trim()) {
      setError("Procedure definition is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await generatePayload(procedureDefinition);
      // Handle API response wrapper - extract data if it exists
      const payloadData = result.data || result;
      setPayload(payloadData);
    } catch (err) {
      setError(err.message || "Failed to generate payload");
    } finally {
      setLoading(false);
    }
  };

  const loadExample = () => {
    setProcedureDefinition(exampleProcedure);
    setPayload(null);
  };

  const copyToClipboard = () => {
    const payloadText = JSON.stringify(payload, null, 2);
    navigator.clipboard.writeText(payloadText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyPayload = () => {
    if (payload) {
      onGenerate(payload);
    }
  };

  const handleClose = () => {
    setProcedureDefinition("");
    setPayload(null);
    setError("");
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="payload-generator-modal-overlay" onClick={handleClose}>
      <div className="payload-generator-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="generator-modal-header">
          <h2 className="generator-modal-title">Generate Payload from Procedure Definition</h2>
          <button className="btn-close" onClick={handleClose} title="Close modal">
            <X size={24} />
          </button>
        </div>

        {/* Modal Content - Two Sections */}
        <div className="generator-modal-content">
          {/* Left Section - Input */}
          <div className="generator-left-section">
            <div className="section-header">
              <h3>Procedure Definition</h3>
              <button className="btn-link" onClick={loadExample}>
                Load Example
              </button>
            </div>

            <textarea
              className="generator-textarea"
              placeholder="Paste your CREATE PROCEDURE SQL definition here..."
              value={procedureDefinition}
              onChange={(e) => setProcedureDefinition(e.target.value)}
            />

            {error && (
              <div className="error-message">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <button 
              className="btn-generate"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader size={18} className="spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 size={18} />
                  Generate Payload
                </>
              )}
            </button>
          </div>

          {/* Right Section - Output */}
          <div className="generator-right-section">
            <div className="section-header">
              <h3>Generated Payload</h3>
              {payload && (
                <button 
                  className={`btn-copy ${copied ? 'copied' : ''}`}
                  onClick={copyToClipboard}
                  title="Copy payload to clipboard"
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy
                    </>
                  )}
                </button>
              )}
            </div>

            {payload ? (
              <div className="payload-output">
                <pre className="payload-json">
                  <code>{JSON.stringify(payload, null, 2)}</code>
                </pre>

                <div className="payload-details">
                  <div className="detail-item">
                    <span className="detail-label">Procedure Name:</span>
                    <span className="detail-value">{payload.stringFour || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Parameters:</span>
                    <span className="detail-value">{payload.stringOne && payload.stringOne.trim() ? payload.stringOne : "None"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Separator:</span>
                    <span className="detail-value">{payload.stringTwo || "|"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Delimiter:</span>
                    <span className="detail-value">{payload.stringThree || "="}</span>
                  </div>
                </div>

                <button 
                  className="btn-primary"
                  onClick={handleApplyPayload}
                  title="Apply payload to API Tester"
                >
                  Apply to Tester
                </button>
              </div>
            ) : (
              <div className="empty-state">
                <Wand2 size={48} opacity={0.3} />
                <p>Generate a payload to see it here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayloadGenerator;
