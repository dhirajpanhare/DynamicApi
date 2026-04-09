import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import "./ParamsInput.css";

const ParamsInput = ({ value = {}, onChange }) => {
  const [params, setParams] = useState([{ key: "", value: "" }]);

  // Initialize from value prop
  useEffect(() => {
    if (Object.keys(value).length > 0) {
      const paramArray = Object.entries(value).map(([key, val]) => ({
        key,
        value: val
      }));
      setParams(paramArray.length > 0 ? paramArray : [{ key: "", value: "" }]);
    }
  }, [value]);

  const handleChange = (index, field, newValue) => {
    const updated = [...params];
    updated[index][field] = newValue;
    setParams(updated);

    const obj = {};
    updated.forEach((p) => {
      if (p.key) obj[p.key] = p.value;
    });

    onChange(obj);
  };

  const addRow = () => {
    setParams([...params, { key: "", value: "" }]);
  };

  const removeRow = (index) => {
    if (params.length === 1) {
      // Keep at least one row
      setParams([{ key: "", value: "" }]);
      onChange({});
      return;
    }

    const updated = params.filter((_, i) => i !== index);
    setParams(updated);

    const obj = {};
    updated.forEach((p) => {
      if (p.key) obj[p.key] = p.value;
    });

    onChange(obj);
  };

  return (
    <div className="params-input">
      <label className="form-label">Parameters</label>
      
      <div className="params-list">
        {params.map((param, index) => (
          <div key={index} className="param-row">
            <input
              className="param-input"
              placeholder="Parameter name (e.g., p_ProductId)"
              value={param.key}
              onChange={(e) => handleChange(index, "key", e.target.value)}
            />
            <input
              className="param-input"
              placeholder="Value"
              value={param.value}
              onChange={(e) => handleChange(index, "value", e.target.value)}
            />
            <button
              className="btn-remove"
              onClick={() => removeRow(index)}
              title="Remove parameter"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <button className="btn-add" onClick={addRow}>
        <Plus size={16} />
        Add Parameter
      </button>
    </div>
  );
};

export default ParamsInput;
