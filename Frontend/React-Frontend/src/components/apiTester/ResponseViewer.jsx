import { CheckCircle, XCircle, Clock, Database } from "lucide-react";
import "./ResponseViewer.css";

const ResponseViewer = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="response-viewer">
        <div className="response-loading">
          <div className="spinner"></div>
          <p>Executing API...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="response-viewer">
        <div className="response-empty">
          <Database size={48} opacity={0.3} />
          <p>Execute an API to see the response</p>
        </div>
      </div>
    );
  }

  const isSuccess = data.status === true;

  return (
    <div className="response-viewer">
      <div className="response-header">
        <div className="response-status">
          {isSuccess ? (
            <>
              <CheckCircle size={20} color="#00d2ff" />
              <span className="status-text success">Success</span>
            </>
          ) : (
            <>
              <XCircle size={20} color="#ff4757" />
              <span className="status-text failed">Failed</span>
            </>
          )}
        </div>
        
        {data.executionTime && (
          <div className="response-time">
            <Clock size={16} />
            <span>{data.executionTime}ms</span>
          </div>
        )}
      </div>

      {data.message && (
        <div className={`response-message ${isSuccess ? 'success' : 'error'}`}>
          {data.message}
        </div>
      )}

      <div className="response-body">
        <div className="response-label">Response Data:</div>
        <pre className="response-json">
          {JSON.stringify(data.data || data, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ResponseViewer;
