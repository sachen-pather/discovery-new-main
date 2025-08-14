// src/components/SplitSlider.jsx
import React, { useState } from "react";

const SplitSlider = ({ totalAvailable, onApply, onCancel }) => {
  const [investmentRatio, setInvestmentRatio] = useState(0.5);
  const debtRatio = 1 - investmentRatio;

  const handleApply = () => {
    onApply(debtRatio, investmentRatio);
  };

  return (
    <div className="bg-discovery-gold/5 p-2 rounded border border-discovery-gold/20">
      <h4 className="text-[10px] font-medium mb-2 text-discovery-blue">
        Custom Allocation
      </h4>

      {/* Split Visualization */}
      <div className="mb-2">
        <div className="flex h-6 rounded overflow-hidden border border-discovery-gold/30">
          <div
            className="bg-discovery-gold flex items-center justify-center text-white text-[10px] font-medium"
            style={{ width: `${investmentRatio * 100}%` }}
          >
            {investmentRatio > 0.2 && `${(investmentRatio * 100).toFixed(0)}%`}
          </div>
          <div
            className="bg-discovery-blue flex items-center justify-center text-white text-[10px] font-medium"
            style={{ width: `${debtRatio * 100}%` }}
          >
            {debtRatio > 0.2 && `${(debtRatio * 100).toFixed(0)}%`}
          </div>
        </div>
        <div className="flex justify-between text-[10px] text-gray-600 mt-1">
          <span className="text-discovery-gold">
            Investment: R{(totalAvailable * investmentRatio).toLocaleString()}
          </span>
          <span className="text-discovery-blue">
            Debt: R{(totalAvailable * debtRatio).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Slider */}
      <div className="mb-2">
        <input
          type="range"
          min="0"
          max="100"
          value={investmentRatio * 100}
          onChange={(e) => setInvestmentRatio(e.target.value / 100)}
          className="w-full h-1.5 bg-gray-200 rounded appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #d97706 0%, #d97706 ${
              investmentRatio * 100
            }%, #1e40af ${investmentRatio * 100}%, #1e40af 100%)`,
          }}
        />
        <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
          <span>All Investment</span>
          <span>All Debt</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-1">
        <button
          onClick={handleApply}
          className="flex-1 bg-discovery-blue text-white py-1 px-2 rounded text-[10px] hover:bg-discovery-blue/90"
        >
          Apply Custom Split
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-discovery-gold/20 text-discovery-blue py-1 px-2 rounded text-[10px] hover:bg-discovery-gold/30"
        >
          Cancel
        </button>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #d97706;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #d97706;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          cursor: pointer;
          border: none;
        }

        .slider::-webkit-slider-track {
          height: 6px;
          border-radius: 3px;
        }

        .slider::-moz-range-track {
          height: 6px;
          border-radius: 3px;
          border: none;
          background: transparent;
        }
      `}</style>
    </div>
  );
};

export default SplitSlider;
