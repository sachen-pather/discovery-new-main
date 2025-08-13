import React from "react";
import {
  MagnifyGraphIcon,
  DeclineGraphIcon,
  CheckmarkIcon,
  IncreaseGraphIcon,
  VitalityIcon,
} from "./icons";

const TabNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: MagnifyGraphIcon },
    { id: "analysis", label: "Analysis", icon: DeclineGraphIcon },
    { id: "budget", label: "Budget", icon: CheckmarkIcon },
    { id: "debt", label: "Debt", icon: IncreaseGraphIcon },
    { id: "investment", label: "Invest", icon: IncreaseGraphIcon },
    { id: "vitality", label: "Vitality", icon: VitalityIcon },
  ];

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex justify-around px-1">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-1 text-center transition-all ${
                activeTab === tab.id
                  ? "border-b-2 border-discovery-gold text-discovery-gold"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <IconComponent className="w-5 h-5 mx-auto mb-1" />
              <p className="text-[10px] font-medium">{tab.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabNavigation;
