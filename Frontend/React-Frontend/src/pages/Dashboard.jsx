import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TestTube, History, BarChart3, Activity, CheckCircle, XCircle, Clock } from "lucide-react";
import { healthCheck } from "../Services/dynamicApi";
import "./Dashboard.css";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCalls: 0,
    successRate: 0,
    avgResponseTime: 0,
    recentCalls: 0
  });
  const [apiStatus, setApiStatus] = useState({ status: "checking", message: "Checking..." });

  useEffect(() => {
    // Load stats from history
    const history = JSON.parse(localStorage.getItem("api_history")) || [];
    
    const totalCalls = history.length;
    const successCount = history.filter(h => h.status === "Success").length;
    const successRate = totalCalls > 0 ? ((successCount / totalCalls) * 100).toFixed(1) : 0;
    
    const totalTime = history.reduce((sum, h) => sum + (h.time || 0), 0);
    const avgResponseTime = totalCalls > 0 ? Math.round(totalTime / totalCalls) : 0;
    
    // Recent calls (last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentCalls = history.filter(h => {
      const timestamp = new Date(h.timestamp).getTime();
      return timestamp > oneDayAgo;
    }).length;

    setStats({ totalCalls, successRate, avgResponseTime, recentCalls });

    // Check API health
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const response = await healthCheck();
      setApiStatus({
        status: "online",
        message: response.message || "API is operational"
      });
    } catch (error) {
      setApiStatus({
        status: "offline",
        message: error.message || "API is offline"
      });
    }
  };

  const quickActions = [
    {
      title: "Test API",
      description: "Execute stored procedures",
      icon: TestTube,
      link: "/tester",
      color: "#667eea"
    },
    {
      title: "View History",
      description: "See past API calls",
      icon: History,
      link: "/history",
      color: "#f093fb"
    },
    {
      title: "Analytics",
      description: "View performance metrics",
      icon: BarChart3,
      link: "/analytics",
      color: "#4facfe"
    }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dynamic API Dashboard</h1>
          <p className="dashboard-subtitle">Monitor and test your stored procedures</p>
        </div>
        
        <div className={`api-status ${apiStatus.status}`}>
          <Activity size={16} />
          <span>{apiStatus.message}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#667eea" }}>
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total API Calls</p>
            <h2 className="stat-value">{stats.totalCalls}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#00d2ff" }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Success Rate</p>
            <h2 className="stat-value">{stats.successRate}%</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#f093fb" }}>
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Avg Response Time</p>
            <h2 className="stat-value">{stats.avgResponseTime}ms</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#4facfe" }}>
            <BarChart3 size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Recent Calls (24h)</p>
            <h2 className="stat-value">{stats.recentCalls}</h2>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-grid">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.link} to={action.link} className="action-card">
                <div className="action-icon" style={{ background: action.color }}>
                  <Icon size={28} />
                </div>
                <h3 className="action-title">{action.title}</h3>
                <p className="action-description">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="section">
        <h2 className="section-title">Recent Activity</h2>
        <RecentActivity />
      </div>
    </div>
  );
};

const RecentActivity = () => {
  const [recentCalls, setRecentCalls] = useState([]);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem("api_history")) || [];
    setRecentCalls(history.slice(0, 5));
  }, []);

  if (recentCalls.length === 0) {
    return (
      <div className="empty-state">
        <TestTube size={48} opacity={0.3} />
        <p>No API calls yet. Start testing!</p>
      </div>
    );
  }

  return (
    <div className="activity-list">
      {recentCalls.map((call, index) => (
        <div key={index} className="activity-item">
          <div className="activity-icon">
            {call.status === "Success" ? (
              <CheckCircle size={20} color="#00d2ff" />
            ) : (
              <XCircle size={20} color="#ff4757" />
            )}
          </div>
          <div className="activity-content">
            <p className="activity-procedure">{call.procedure}</p>
            <p className="activity-time">{call.timestamp}</p>
          </div>
          <div className="activity-meta">
            <span className={`activity-status ${call.status.toLowerCase()}`}>
              {call.status}
            </span>
            <span className="activity-duration">{call.time}ms</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
