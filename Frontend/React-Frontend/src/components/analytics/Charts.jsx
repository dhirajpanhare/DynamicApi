import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid
} from "recharts";

const COLORS = ["#00C49F", "#FF4C4C"];

const chartContainer = {
  display: "flex",
  flexWrap: "wrap",
  gap: "30px",
  marginTop: "20px"
};

const boxStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
};

const Charts = ({ history }) => {
  // 📊 Calls over time
  const callsPerTime = {};
  history.forEach((item) => {
    const time = item.timestamp.split(",")[0]; // date only
    callsPerTime[time] = (callsPerTime[time] || 0) + 1;
  });

  const lineData = Object.keys(callsPerTime).map((key) => ({
    date: key,
    calls: callsPerTime[key]
  }));

  // 🟢 Success vs 🔴 Failed
  const successCount = history.filter((h) => h.status === "Success").length;
  const failCount = history.length - successCount;

  const pieData = [
    { name: "Success", value: successCount },
    { name: "Failed", value: failCount }
  ];

  // 📊 Top Procedures
  const procCount = {};
  history.forEach((item) => {
    procCount[item.procedure] =
      (procCount[item.procedure] || 0) + 1;
  });

  const barData = Object.keys(procCount).map((key) => ({
    name: key,
    count: procCount[key]
  }));

  return (
    <div style={chartContainer}>
      {/* Line Chart */}
      <div style={boxStyle}>
        <h4>API Calls Over Time</h4>
        <LineChart width={300} height={250} data={lineData}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="calls" stroke="#0984e3" />
        </LineChart>
      </div>

      {/* Pie Chart */}
      <div style={boxStyle}>
        <h4>Success vs Failure</h4>
        <PieChart width={300} height={250}>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label
          >
            {pieData.map((entry, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </div>

      {/* Bar Chart */}
      <div style={boxStyle}>
        <h4>Top Procedures</h4>
        <BarChart width={300} height={250} data={barData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#6c5ce7" />
        </BarChart>
      </div>
    </div>
  );
};

export default Charts;