import { useState, useContext } from "react";
import { Play, FileCode, Loader, AlertCircle, Zap } from "lucide-react";
import { executeDynamicApi, generatePayload } from "../Services/dynamicApi";
import { formatParams } from "../utils/formatParams";
import { addApiHistory, updateAnalytics } from "../utils/localStorage";
import { AuthContext } from "../context/AuthContext";
import { getCurrentAPIConfig } from "../config/apiConfig";
import ResponseViewer from "../components/apiTester/ResponseViewer";
import ParamsInput from "../components/apiTester/ParamsInput";
import PayloadGenerator from "../components/apiTester/PayloadGenerator";
import "./ApiTester.css";

const ApiTester = () => {
  const { user } = useContext(AuthContext);
  const [testMode, setTestMode] = useState("procedure"); // "procedure" or "payload"
  const [procedure, setProcedure] = useState("");
  const [paramsObj, setParamsObj] = useState({});
  const [payloadJson, setPayloadJson] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showGenerator, setShowGenerator] = useState(false);

  const handleExecuteByProcedure = async () => {
    if (!procedure.trim()) {
      setError("Procedure name is required");
      return;
    }

    setLoading(true);
    setError("");
    setResponse(null);

    const paramString = formatParams(paramsObj);
    const start = Date.now();

    try {
      const result = await executeDynamicApi(procedure, paramString);
      const end = Date.now();
      const timeTaken = end - start;

      setResponse({ ...result, executionTime: timeTaken });

      // Track in user history and analytics
      if (user && user.email) {
        const apiConfig = getCurrentAPIConfig();
        const framework = apiConfig?.name || "Unknown";

        // Add to history
        const historyItem = {
          procedure,
          parameters: paramString,
          status: result.status ? "Success" : "Failed",
          responseTime: timeTaken,
          response: result
        };
        addApiHistory(user.email, framework, historyItem);

        // Update analytics
        const isSuccess = result.status ? 1 : 0;
        updateAnalytics(user.email, framework, {
          totalCalls: 1,
          successCalls: isSuccess,
          failedCalls: isSuccess ? 0 : 1,
          avgResponseTime: timeTaken
        });
      }

      // Keep backward compatibility
      const historyItem = {
        procedure,
        params: paramString,
        status: result.status ? "Success" : "Failed",
        time: timeTaken,
        timestamp: new Date().toLocaleString(),
        response: result
      };
      const oldHistory = JSON.parse(localStorage.getItem("api_history")) || [];
      localStorage.setItem("api_history", JSON.stringify([historyItem, ...oldHistory].slice(0, 100)));
    } catch (err) {
      setError(err.message || "API Error");

      // Track failed call in analytics
      if (user && user.email) {
        const apiConfig = getCurrentAPIConfig();
        const framework = apiConfig?.name || "Unknown";
        updateAnalytics(user.email, framework, {
          totalCalls: 1,
          successCalls: 0,
          failedCalls: 1,
          avgResponseTime: Date.now() - start
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteByPayload = async () => {
    if (!payloadJson.trim()) {
      setError("Payload JSON is required");
      return;
    }

    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const payload = JSON.parse(payloadJson);
      const start = Date.now();

      const result = await executeDynamicApi(
        payload.stringFour,
        payload.stringOne,
        payload.stringTwo,
        payload.stringThree
      );

      const end = Date.now();
      const timeTaken = end - start;

      setResponse({ ...result, executionTime: timeTaken });

      // Track in user history and analytics
      if (user && user.email) {
        const apiConfig = getCurrentAPIConfig();
        const framework = apiConfig?.name || "Unknown";

        // Add to history
        const historyItem = {
          procedure: payload.stringFour,
          parameters: payload.stringOne,
          status: result.status ? "Success" : "Failed",
          responseTime: timeTaken,
          response: result
        };
        addApiHistory(user.email, framework, historyItem);

        // Update analytics
        const isSuccess = result.status ? 1 : 0;
        updateAnalytics(user.email, framework, {
          totalCalls: 1,
          successCalls: isSuccess,
          failedCalls: isSuccess ? 0 : 1,
          avgResponseTime: timeTaken
        });
      }

      // Keep backward compatibility
      const historyItem = {
        procedure: payload.stringFour,
        params: payload.stringOne,
        status: result.status ? "Success" : "Failed",
        time: timeTaken,
        timestamp: new Date().toLocaleString(),
        response: result
      };
      const oldHistory = JSON.parse(localStorage.getItem("api_history")) || [];
      localStorage.setItem("api_history", JSON.stringify([historyItem, ...oldHistory].slice(0, 100)));
    } catch (parseErr) {
      if (parseErr instanceof SyntaxError) {
        setError("Invalid JSON format");
      } else {
        setError(parseErr.message || "API Error");
      }

      // Track failed call in analytics
      if (user && user.email) {
        const apiConfig = getCurrentAPIConfig();
        const framework = apiConfig?.name || "Unknown";
        updateAnalytics(user.email, framework, {
          totalCalls: 1,
          successCalls: 0,
          failedCalls: 1,
          avgResponseTime: Date.now() - start
        });
      }
    } finally {
      setLoading(false);
    }
  };


  const handleGeneratedPayload = (payload) => {
    setProcedure(payload.stringFour);
    
    // Parse stringOne to create params object
    if (payload.stringOne) {
      const params = {};
      const pairs = payload.stringOne.split(payload.stringTwo || "|");
      pairs.forEach(pair => {
        const [key, value] = pair.split(payload.stringThree || "=");
        if (key) params[key] = value || "";
      });
      setParamsObj(params);
    }
    
    setShowGenerator(false);
  };

  const pastePayloadAsJson = () => {
    const payload = {
      stringOne: "",
      stringTwo: "|",
      stringThree: "=",
      stringFour: ""
    };
    setPayloadJson(JSON.stringify(payload, null, 2));
  };

  return (
    <div className="api-tester">
      <div className="tester-header">
        <div>
          <h1 className="tester-title">API Tester</h1>
          <p className="tester-subtitle">Execute stored procedures and view results</p>
        </div>
        <button 
          className="btn-secondary"
          onClick={() => setShowGenerator(!showGenerator)}
        >
          <FileCode size={18} />
          {showGenerator ? "Hide" : "Generate"} Payload
        </button>
      </div>

      {showGenerator && (
        <PayloadGenerator 
          onGenerate={handleGeneratedPayload}
          onClose={() => setShowGenerator(false)}
        />
      )}

      {/* Test Mode Tabs */}
      <div className="test-mode-tabs">
        <button
          className={`tab-button ${testMode === "procedure" ? "active" : ""}`}
          onClick={() => setTestMode("procedure")}
        >
          <Zap size={16} />
          Procedure Method
        </button>
        <button
          className={`tab-button ${testMode === "payload" ? "active" : ""}`}
          onClick={() => setTestMode("payload")}
        >
          <FileCode size={16} />
          Payload Method
        </button>
      </div>

      <div className="tester-content">
        {/* Left Section */}
        <div className="input-section">
          {testMode === "procedure" ? (
            <>
              <div className="form-group">
                <label className="form-label">Procedure Name</label>
                <input
                  className="form-input"
                  placeholder="e.g., GetProductById"
                  value={procedure}
                  onChange={(e) => setProcedure(e.target.value)}
                />
              </div>

              <ParamsInput value={paramsObj} onChange={setParamsObj} />

              <button 
                className="btn-primary"
                onClick={handleExecuteByProcedure}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader size={18} className="spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    Execute
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <div className="form-group">
                <div className="form-label-with-action">
                  <label className="form-label">Paste Payload JSON</label>
                  <button className="btn-link-small" onClick={pastePayloadAsJson}>
                    Paste Template
                  </button>
                </div>
                <textarea
                  className="form-textarea"
                  placeholder={`{\n  "stringOne": "p_ProductId=1",\n  "stringTwo": "|",\n  "stringThree": "=",\n  "stringFour": "GetProductById"\n}`}
                  value={payloadJson}
                  onChange={(e) => setPayloadJson(e.target.value)}
                  rows={12}
                />
              </div>

              <button 
                className="btn-primary"
                onClick={handleExecuteByPayload}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader size={18} className="spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    Test Payload
                  </>
                )}
              </button>
            </>
          )}

          {error && (
            <div className="error-message">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
        </div>

        <ResponseViewer data={response} loading={loading} />
      </div>
    </div>
  );
};

export default ApiTester;
