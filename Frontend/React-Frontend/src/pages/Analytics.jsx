import { useEffect, useState, useContext } from "react";
import { BarChart3, TrendingUp, Clock, Activity } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { getAnalytics, getSummaryStats, getApiHistory } from "../utils/localStorage";
import { apiConfigs, getCurrentAPIConfig } from "../config/apiConfig";
import Charts from "../components/analytics/Charts";
import "./Analytics.css";

const Analytics = () => {
  const { user } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    totalCalls: 0,
    successRate: 0,
    avgResponseTime: 0,
    mostUsedProcedure: "N/A"
  });
  const [selectedFramework, setSelectedFramework] = useState(() => {
    const current = getCurrentAPIConfig();
    return current?.name || apiConfigs[0]?.name || "All Frameworks";
  });

  useEffect(() => {
    loadAnalytics();
  }, [user, selectedFramework]);

  const loadAnalytics = () => {
    if (!user || !user.email) {
      setHistory([]);
      setStats({
        totalCalls: 0,
        successRate: 0,
        avgResponseTime: 0,
        mostUsedProcedure: "N/A"
      });
      return;
    }

    let historyData = [];

    if (selectedFramework === "All Frameworks") {
      // Get combined history from all frameworks
      const allFrameworks = apiConfigs.map(config => config.name);
      allFrameworks.forEach(framework => {
        const frameHistory = getApiHistory(user.email, framework) || [];
        historyData.push(...frameHistory);
      });
      // Sort by timestamp (newest first)
      historyData = historyData.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeB - timeA;
      });
    } else {
      // Get history for selected framework
      historyData = getApiHistory(user.email, selectedFramework) || [];
    }

    setHistory(historyData);

    if (historyData.length > 0) {
      calculateStats(historyData);
    } else {
      setStats({
        totalCalls: 0,
        successRate: 0,
        avgResponseTime: 0,
        mostUsedProcedure: "N/A"
      });
    }
  };

  const calculateStats = (data) => {
    const totalCalls = data.length;
    const successCount = data.filter(h => h.status === "Success").length;
    const successRate = totalCalls > 0 ? ((successCount / totalCalls) * 100).toFixed(1) : 0;
    
    const totalTime = data.reduce((sum, h) => sum + (h.responseTime || 0), 0);
    const avgResponseTime = totalCalls > 0 ? Math.round(totalTime / totalCalls) : 0;

    // Find most used procedure
    const procCount = {};
    data.forEach(item => {
      procCount[item.procedure] = (procCount[item.procedure] || 0) + 1;
    });
    const mostUsedProcedure = Object.keys(procCount).length > 0 
      ? Object.keys(procCount).reduce((a, b) => procCount[a] > procCount[b] ? a : b)
      : "N/A";

    setStats({ totalCalls, successRate, avgResponseTime, mostUsedProcedure });
  };

  const frameworkOptions = [
    { name: "All Frameworks", value: "All Frameworks" },
    ...apiConfigs.map(config => ({ name: config.name, value: config.name }))
  ];

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div>
          <h1 className="analytics-title">Analytics Dashboard</h1>
          <p className="analytics-subtitle">Performance metrics and insights for {selectedFramework}</p>
        </div>
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
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <BarChart3 size={48} opacity={0.3} />
          <p>No data available. Execute some APIs to see analytics.</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-icon" style={{ background: "#667eea" }}>
                <Activity size={20} />
              </div>
              <div className="summary-content">
                <p className="summary-label">Total Calls</p>
                <h3 className="summary-value">{stats.totalCalls}</h3>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon" style={{ background: "#00d2ff" }}>
                <TrendingUp size={20} />
              </div>
              <div className="summary-content">
                <p className="summary-label">Success Rate</p>
                <h3 className="summary-value">{stats.successRate}%</h3>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon" style={{ background: "#f093fb" }}>
                <Clock size={20} />
              </div>
              <div className="summary-content">
                <p className="summary-label">Avg Response</p>
                <h3 className="summary-value">{stats.avgResponseTime}ms</h3>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon" style={{ background: "#4facfe" }}>
                <BarChart3 size={20} />
              </div>
              <div className="summary-content">
                <p className="summary-label">Most Used</p>
                <h3 className="summary-value truncate">{stats.mostUsedProcedure}</h3>
              </div>
            </div>
          </div>

          {/* Charts */}
          <Charts history={history} />
        </>
      )}
    </div>
  );
};

export default Analytics;
