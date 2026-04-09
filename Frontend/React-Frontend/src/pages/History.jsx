import { useEffect, useState, useContext } from "react";
import { Trash2, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { getApiHistory, clearApiHistory } from "../utils/localStorage";
import { apiConfigs, getCurrentAPIConfig } from "../config/apiConfig";
import "./History.css";

const History = () => {
  const { user } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState("all"); // all, success, failed
  const [selectedFramework, setSelectedFramework] = useState(() => {
    const current = getCurrentAPIConfig();
    return current?.name || apiConfigs[0]?.name || "All Frameworks";
  });
  const [allFrameworksHistory, setAllFrameworksHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, [selectedFramework, user]);

  const loadHistory = () => {
    if (!user || !user.email) {
      setHistory([]);
      return;
    }

    let historyData = [];

    if (selectedFramework === "All Frameworks") {
      // Load history from all frameworks
      const allFrameworks = apiConfigs.map(config => config.name);
      const combined = [];
      allFrameworks.forEach(framework => {
        const frameHistory = getApiHistory(user.email, framework) || [];
        combined.push(...frameHistory);
      });
      // Sort by timestamp (newest first)
      historyData = combined.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeB - timeA;
      });
    } else {
      // Load history for selected framework
      historyData = getApiHistory(user.email, selectedFramework) || [];
    }

    setHistory(historyData);
  };

  const clearFrameworkHistory = () => {
    if (!user || !user.email) return;

    if (selectedFramework === "All Frameworks") {
      if (window.confirm("Are you sure you want to clear history for ALL frameworks?")) {
        apiConfigs.forEach(config => {
          clearApiHistory(user.email, config.name);
        });
        setHistory([]);
      }
    } else {
      if (window.confirm(`Are you sure you want to clear history for ${selectedFramework}?`)) {
        clearApiHistory(user.email, selectedFramework);
        setHistory([]);
      }
    }
  };

  const filteredHistory = history.filter(item => {
    if (filter === "all") return true;
    if (filter === "success") return item.status === "Success";
    if (filter === "failed") return item.status === "Failed";
    return true;
  });

  const frameworkOptions = [
    { name: "All Frameworks", value: "All Frameworks" },
    ...apiConfigs.map(config => ({ name: config.label, value: config.name }))
  ];

  return (
    <div className="history-page">
      <div className="history-header">
        <div>
          <h1 className="history-title">API History</h1>
          <p className="history-subtitle">View all past API executions for {selectedFramework}</p>
        </div>
        
        <div className="history-actions">
          <select
            className="framework-selector"
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value)}
          >
            {frameworkOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.name}
              </option>
            ))}
          </select>
          <button className="btn-icon" onClick={loadHistory} title="Refresh">
            <RefreshCw size={18} />
          </button>
          <button className="btn-danger" onClick={clearFrameworkHistory}>
            <Trash2 size={18} />
            Clear History
          </button>
        </div>
      </div>

      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({history.length})
        </button>
        <button 
          className={`filter-tab ${filter === "success" ? "active" : ""}`}
          onClick={() => setFilter("success")}
        >
          <CheckCircle size={16} />
          Success ({history.filter(h => h.status === "Success").length})
        </button>
        <button 
          className={`filter-tab ${filter === "failed" ? "active" : ""}`}
          onClick={() => setFilter("failed")}
        >
          <XCircle size={16} />
          Failed ({history.filter(h => h.status === "Failed").length})
        </button>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="empty-state">
          <Clock size={48} opacity={0.3} />
          <p>No history found for {selectedFramework}</p>
        </div>
      ) : (
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Procedure</th>
                <th>Parameters</th>
                <th>Status</th>
                <th>Response Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item, index) => (
                <tr key={item.id || index}>
                  <td className="cell-timestamp">{new Date(item.timestamp).toLocaleString()}</td>
                  <td className="cell-procedure">{item.procedure}</td>
                  <td className="cell-params">
                    <code>{item.parameters || "No parameters"}</code>
                  </td>
                  <td>
                    <span className={`status-badge ${item.status.toLowerCase()}`}>
                      {item.status === "Success" ? (
                        <CheckCircle size={14} />
                      ) : (
                        <XCircle size={14} />
                      )}
                      {item.status}
                    </span>
                  </td>
                  <td className="cell-time">{item.responseTime}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default History;
