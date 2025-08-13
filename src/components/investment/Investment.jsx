import React, { useState, useEffect } from "react";
import { getInvestmentAnalysis } from "../../utils/api"; // Fixed import path for utils

const Investment = ({ financialData, userProfile, realAnalysisResults }) => {
  const [selectedStrategy, setSelectedStrategy] = useState("moderate");

  // Backend analysis results
  const [backendAnalysis, setBackendAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate available investment capacity
  const monthlyIncome =
    realAnalysisResults?.total_income || financialData?.totalIncome || 0;
  const monthlyExpenses =
    realAnalysisResults?.total_expenses || financialData?.totalExpenses || 0;
  const availableMonthly = Math.max(0, monthlyIncome - monthlyExpenses);

  // Load backend investment analysis on component mount or when available monthly changes
  useEffect(() => {
    if (availableMonthly > 0) {
      loadInvestmentAnalysis();
    }
  }, [availableMonthly]);

  const loadInvestmentAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(
        "🔄 Loading investment analysis with available monthly:",
        availableMonthly
      );
      const analysis = await getInvestmentAnalysis(availableMonthly);
      setBackendAnalysis(analysis);
      console.log("✅ Investment analysis loaded:", analysis);
    } catch (err) {
      console.error("❌ Error loading investment analysis:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get backend investment strategies or fallback to defaults
  const getInvestmentStrategies = () => {
    if (backendAnalysis?.profiles) {
      // Convert backend profiles to frontend format
      const strategies = {};
      Object.entries(backendAnalysis.profiles).forEach(([key, profile]) => {
        strategies[key] = {
          name: profile.profile.name,
          avgReturn: profile.profile.avg_return / 100, // Convert percentage to decimal
          volatility: profile.profile.volatility / 100, // Convert percentage to decimal
          effectiveReturn: profile.profile.effective_return / 100, // Convert percentage to decimal
          description: profile.profile.description,
          emoji: key === "aggressive" ? "🚀" : key === "moderate" ? "⚖️" : "🛡️",
          color: "bg-gray-200",
          allocation: getDefaultAllocation(key),
          projections: profile.projections,
        };
      });
      return strategies;
    }

    // Fallback to default strategies
    return {
      aggressive: {
        name: "Aggressive",
        avgReturn: 0.105,
        volatility: 0.18,
        description: "High growth potential, high risk",
        emoji: "🚀",
        color: "bg-gray-200",
        allocation: { stocks: 85, bonds: 10, cash: 5 },
      },
      moderate: {
        name: "Moderate",
        avgReturn: 0.085,
        volatility: 0.12,
        description: "Balanced growth and stability",
        emoji: "⚖️",
        color: "bg-gray-200",
        allocation: { stocks: 60, bonds: 30, cash: 10 },
      },
      conservative: {
        name: "Conservative",
        avgReturn: 0.065,
        volatility: 0.06,
        description: "Capital preservation focus",
        emoji: "🛡️",
        color: "bg-gray-200",
        allocation: { stocks: 30, bonds: 60, cash: 10 },
      },
    };
  };

  const getDefaultAllocation = (strategy) => {
    const allocations = {
      aggressive: { stocks: 85, bonds: 10, cash: 5 },
      moderate: { stocks: 60, bonds: 30, cash: 10 },
      conservative: { stocks: 30, bonds: 60, cash: 10 },
    };
    return allocations[strategy] || allocations.moderate;
  };

  const investmentStrategies = getInvestmentStrategies();

  // Calculate effective return (accounting for volatility drag)
  const calculateEffectiveReturn = (avgReturn, volatility) => {
    return avgReturn - Math.pow(volatility, 2) / 2;
  };

  // Calculate future value with monthly contributions
  const calculateFutureValue = (monthlyContribution, years, effectiveRate) => {
    const months = years * 12;
    const monthlyRate = effectiveRate / 12;

    if (monthlyRate === 0) {
      return monthlyContribution * months;
    }

    const futureValue =
      (monthlyContribution * (Math.pow(1 + monthlyRate, months) - 1)) /
      monthlyRate;

    return futureValue;
  };

  // Generate projection table for a strategy
  const generateProjectionTable = (strategy, monthlyAmount) => {
    if (strategy.projections) {
      // Use backend projections if available
      return strategy.projections;
    }

    // Fallback to local calculation
    const yearsList = [1, 5, 10, 15, 20, 25, 30];
    const effectiveRate =
      strategy.effectiveReturn ||
      calculateEffectiveReturn(strategy.avgReturn, strategy.volatility);

    return yearsList.map((years) => ({
      years,
      effective_annual_return: effectiveRate * 100,
      monthly_contribution: monthlyAmount,
      effective_future_value: calculateFutureValue(
        monthlyAmount,
        years,
        effectiveRate
      ),
      total_contributions: monthlyAmount * years * 12,
    }));
  };

  const totalMonthlyContributions = 0; // Default since we removed portfolio tracking
  const additionalCapacity = Math.max(0, availableMonthly * 0.7); // Invest 70% of available

  return (
    <div className="space-y-4">
      {/* Loading State */}
      {loading && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-600">
              Loading investment analysis...
            </span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-start space-x-2">
            <span className="text-red-600">⚠️</span>
            <div>
              <p className="text-sm font-medium text-red-800">Analysis Error</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
              <button
                onClick={loadInvestmentAnalysis}
                className="mt-2 text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backend Analysis Summary */}
      {backendAnalysis && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-start space-x-3">
            <span className="text-xl">🤖</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                AI Investment Analysis
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Based on R{backendAnalysis.monthly_savings?.toLocaleString()}{" "}
                available monthly
              </p>
              {backendAnalysis.recommendations && (
                <div className="bg-white/80 rounded p-2">
                  <p className="text-xs text-gray-700 font-medium mb-1">
                    Key Recommendations:
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {backendAnalysis.recommendations
                      .slice(0, 3)
                      .map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fund Strategy Selector */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Investment Fund Selection
        </h3>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {Object.entries(investmentStrategies).map(([key, strategy]) => (
            <button
              key={key}
              onClick={() => setSelectedStrategy(key)}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedStrategy === key
                  ? "border-gray-500 bg-gray-100"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <span className="text-xl">{strategy.emoji}</span>
              <p className="text-xs font-medium mt-1">{strategy.name}</p>
              <p className="text-[10px] text-gray-500">
                {(
                  (strategy.avgReturn || strategy.effectiveReturn || 0) *
                  100
                ).toFixed(1)}
                % avg return
              </p>
            </button>
          ))}
        </div>

        {/* Selected Strategy Details */}
        <div className="rounded-lg p-3 bg-gray-50 border-l-4 border-gray-500">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-sm text-gray-800">
                {investmentStrategies[selectedStrategy].name} Fund
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                {investmentStrategies[selectedStrategy].description}
              </p>
            </div>
            <span className="text-2xl">
              {investmentStrategies[selectedStrategy].emoji}
            </span>
          </div>

          {/* Strategy Metrics */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div>
              <p className="text-[10px] text-gray-500">Avg Return</p>
              <p className="text-sm font-bold text-gray-800">
                {(
                  (investmentStrategies[selectedStrategy].avgReturn || 0) *
                  100
                ).toFixed(2)}
                %
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Volatility (σ)</p>
              <p className="text-sm font-bold text-gray-800">
                {(
                  (investmentStrategies[selectedStrategy].volatility || 0) *
                  100
                ).toFixed(2)}
                %
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Effective</p>
              <p className="text-sm font-bold text-gray-700">
                {(
                  (investmentStrategies[selectedStrategy].effectiveReturn ||
                    calculateEffectiveReturn(
                      investmentStrategies[selectedStrategy].avgReturn || 0,
                      investmentStrategies[selectedStrategy].volatility || 0
                    )) * 100
                ).toFixed(2)}
                %
              </p>
            </div>
          </div>

          {/* Asset Allocation */}
          {investmentStrategies[selectedStrategy].allocation && (
            <div className="mt-3 space-y-1">
              <p className="text-[10px] text-gray-500 mb-1">
                Asset Allocation:
              </p>
              {Object.entries(
                investmentStrategies[selectedStrategy].allocation
              ).map(([asset, percentage]) => (
                <div
                  key={asset}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="capitalize text-gray-600">{asset}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          asset === "stocks"
                            ? "bg-gray-600"
                            : asset === "bonds"
                            ? "bg-gray-500"
                            : "bg-gray-400"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="font-medium text-gray-700 w-10 text-right">
                      {percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Investment Projections */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Investment Projections
        </h3>
        <p className="text-xs text-gray-600 mb-3">
          Monthly contribution: R
          {(
            backendAnalysis?.monthly_savings ||
            (additionalCapacity > 0
              ? additionalCapacity
              : totalMonthlyContributions)
          ).toLocaleString()}
        </p>

        {/* Projection Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium text-gray-600">
                  Years
                </th>
                <th className="text-right py-2 font-medium text-gray-600">
                  Future Value
                </th>
                <th className="text-right py-2 font-medium text-gray-600">
                  Total Invested
                </th>
                <th className="text-right py-2 font-medium text-gray-600">
                  Interest Earned
                </th>
              </tr>
            </thead>
            <tbody>
              {generateProjectionTable(
                investmentStrategies[selectedStrategy],
                backendAnalysis?.monthly_savings ||
                  (additionalCapacity > 0
                    ? additionalCapacity
                    : totalMonthlyContributions)
              ).map((projection, index) => {
                const futureValue =
                  projection.effective_future_value ||
                  projection.futureValue ||
                  0;
                const totalContributions =
                  projection.total_contributions || 0;
                const interestEarned = futureValue - totalContributions;

                return (
                  <tr
                    key={projection.years}
                    className={index % 2 === 0 ? "bg-gray-50" : ""}
                  >
                    <td className="py-2 font-medium">{projection.years}</td>
                    <td className="text-right py-2 font-bold text-gray-800">
                      R
                      {futureValue.toLocaleString("en-ZA", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="text-right py-2 text-gray-600">
                      R
                      {totalContributions.toLocaleString("en-ZA", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="text-right py-2 text-green-600 font-medium">
                      R
                      {interestEarned.toLocaleString("en-ZA", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-3 p-2 bg-gray-100 rounded">
          <p className="text-[10px] text-gray-700">
            <strong>Note:</strong>{" "}
            {backendAnalysis
              ? "Projections from AI analysis. "
              : "Effective return = Average - (Volatility²/2). "}
            This accounts for volatility drag on long-term compound returns.
          </p>
        </div>
      </div>

      {/* Fund Comparison */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Fund Comparison (20 Year Horizon)
        </h3>

        <div className="space-y-2">
          {Object.entries(investmentStrategies).map(([key, strategy]) => {
            const monthlyAmount =
              backendAnalysis?.monthly_savings ||
              (additionalCapacity > 0
                ? additionalCapacity
                : totalMonthlyContributions);

            let futureValue = 0;
            if (strategy.projections) {
              // Find 20-year projection from backend
              const projection20 = strategy.projections.find(
                (p) => p.years === 20
              );
              futureValue = projection20?.effective_future_value || 0;
            } else {
              // Calculate using effective return
              const effectiveRate =
                strategy.effectiveReturn ||
                calculateEffectiveReturn(
                  strategy.avgReturn || 0,
                  strategy.volatility || 0
                );
              futureValue = calculateFutureValue(
                monthlyAmount,
                20,
                effectiveRate
              );
            }

            const isSelected = key === selectedStrategy;

            return (
              <div
                key={key}
                className={`rounded-lg p-3 border ${
                  isSelected
                    ? "border-gray-500 bg-gray-100"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{strategy.emoji}</span>
                    <div>
                      <p
                        className={`text-xs font-medium ${
                          isSelected ? "text-gray-800" : "text-gray-700"
                        }`}
                      >
                        {strategy.name} Fund
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {(
                          (strategy.effectiveReturn ||
                            calculateEffectiveReturn(
                              strategy.avgReturn || 0,
                              strategy.volatility || 0
                            )) * 100
                        ).toFixed(2)}
                        % effective
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${
                        isSelected ? "text-gray-800" : "text-gray-700"
                      }`}
                    >
                      R
                      {futureValue.toLocaleString("en-ZA", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      after 20 years
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Investment Tips */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <span className="mr-2">📚</span>
          Investment Best Practices
        </h3>
        <div className="space-y-2">
          <div className="flex items-start space-x-2">
            <span className="text-xs text-gray-400 mt-0.5">▸</span>
            <p className="text-xs text-gray-600">
              Stay disciplined with your chosen strategy through market
              cycles
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-xs text-gray-400 mt-0.5">▸</span>
            <p className="text-xs text-gray-600">
              Max out your Tax Free Savings Account (R36,000/year limit)
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-xs text-gray-400 mt-0.5">▸</span>
            <p className="text-xs text-gray-600">
              Dollar-cost averaging: Invest consistently regardless of
              market conditions
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-xs text-gray-400 mt-0.5">▸</span>
            <p className="text-xs text-gray-600">
              Keep 3-6 months expenses in emergency fund before aggressive
              investing
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-xs text-gray-400 mt-0.5">▸</span>
            <p className="text-xs text-gray-600">
              Review and rebalance your portfolio quarterly
            </p>
          </div>
          {/* Backend recommendations */}
          {backendAnalysis?.recommendations &&
            backendAnalysis.recommendations.slice(3).map((rec, index) => (
              <div
                key={index}
                className="flex items-start space-x-2 bg-blue-50 p-2 rounded"
              >
                <span className="text-xs text-blue-600 mt-0.5">🤖</span>
                <p className="text-xs text-blue-700">
                  <strong>AI Tip:</strong> {rec}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Investment;