import React, { useState, useEffect } from "react";
// Remove Chart.js imports, keep Recharts
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import {
  Home,
  ShoppingCart,
  Coffee,
  Car,
  Smartphone,
  Store,
  DollarSign,
  FileText,
  CreditCard,
  AlertTriangle,
  Target,
  CheckCircle,
  BarChart3,
  Sparkles,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { applySplit } from "../../utils/api";
import SplitSlider from "../ui/SplitSlider";

const Analysis = ({
  financialData = {},
  analysisResults = {},
  realAnalysisResults = null,
  onSplitApplied = null, // NEW PROP
}) => {
  // Split-related state
  const [showSplitSelector, setShowSplitSelector] = useState(false);
  const [showCustomSplit, setShowCustomSplit] = useState(false);
  const [splitRecommendation, setSplitRecommendation] = useState(null);

  // Detect split recommendation from backend data
  useEffect(() => {
    if (realAnalysisResults?.recommended_debt_ratio !== undefined) {
      setSplitRecommendation({
        debt_ratio: realAnalysisResults.recommended_debt_ratio,
        investment_ratio: realAnalysisResults.recommended_investment_ratio,
        rationale: realAnalysisResults.split_rationale,
        total_available:
          realAnalysisResults.optimized_available_income ||
          realAnalysisResults.available_income,
      });
      setShowSplitSelector(true);
    }
  }, [realAnalysisResults]);

  // Split handler functions
  const handleApplyRecommendedSplit = async () => {
    try {
      const result = await applySplit(
        splitRecommendation.total_available,
        splitRecommendation.debt_ratio,
        splitRecommendation.investment_ratio
      );

      // Call parent component's handler to update global state
      if (onSplitApplied) {
        onSplitApplied({
          has_split: true,
          debt_ratio: splitRecommendation.debt_ratio,
          investment_ratio: splitRecommendation.investment_ratio,
          debt_budget: result.debt_budget,
          investment_budget: result.investment_budget,
          total_available: splitRecommendation.total_available,
        });
      }

      setShowSplitSelector(false);
    } catch (error) {
      console.error("Failed to apply split:", error);
    }
  };

  const handleApplyCustomSplit = async (debtRatio, investmentRatio) => {
    try {
      const result = await applySplit(
        splitRecommendation.total_available,
        debtRatio,
        investmentRatio
      );

      // Call parent component's handler to update global state
      if (onSplitApplied) {
        onSplitApplied({
          has_split: true,
          debt_ratio: debtRatio,
          investment_ratio: investmentRatio,
          debt_budget: result.debt_budget,
          investment_budget: result.investment_budget,
          total_available: splitRecommendation.total_available,
        });
      }

      setShowSplitSelector(false);
      setShowCustomSplit(false);
    } catch (error) {
      console.error("Failed to apply custom split:", error);
    }
  };

  const getIconForCategory = (categoryName) => {
    const iconMap = {
      "Rent/Mortgage": <Home className="w-3 h-3 text-blue-600" />,
      Groceries: <ShoppingCart className="w-3 h-3 text-green-600" />,
      "Dining Out": <Coffee className="w-3 h-3 text-orange-600" />,
      Transport: <Car className="w-3 h-3 text-purple-600" />,
      Subscriptions: <Smartphone className="w-3 h-3 text-blue-500" />,
      Shopping: <Store className="w-3 h-3 text-pink-600" />,
      Other: <DollarSign className="w-3 h-3 text-gray-600" />,
      Administrative: <FileText className="w-3 h-3 text-indigo-600" />,
      "Debt Payments": <CreditCard className="w-3 h-3 text-red-600" />,
    };
    return (
      iconMap[categoryName] || <DollarSign className="w-3 h-3 text-gray-600" />
    );
  };

  const getDisplayData = () => {
    if (realAnalysisResults) {
      return {
        totalIncome: realAnalysisResults.total_income || 0,
        totalExpenses: realAnalysisResults.total_expenses || 0,
        disposableIncome: realAnalysisResults.available_income || 0,
        optimizedIncome:
          realAnalysisResults.optimized_available_income ||
          realAnalysisResults.available_income ||
          0,
        totalPotentialSavings: realAnalysisResults.total_potential_savings || 0,
        enhancedMode: realAnalysisResults.enhanced_mode || false,
        protectedCategories: realAnalysisResults.protected_categories || [],
        categories: Object.entries(realAnalysisResults.category_breakdown || {})
          .filter(([_, data]) => data.amount > 0)
          .map(([name, data]) => ({
            name,
            amount: data.amount,
            percentage: data.percentage,
            count: data.count,
            savings:
              realAnalysisResults.suggestions?.[name]?.potential_savings || 0,
            priority: realAnalysisResults.suggestions?.[name]?.priority || 1,
            confidenceLevel:
              realAnalysisResults.suggestions?.[name]?.confidence_level ||
              "Low",
            suggestions:
              realAnalysisResults.suggestions?.[name]?.suggestions || [],
          })),
        insights: generateInsightsFromBackend(realAnalysisResults),
        transactionCount: Object.values(
          realAnalysisResults.category_breakdown || {}
        ).reduce((sum, cat) => sum + (cat.count || 0), 0),
        transactions: realAnalysisResults.transactions || [],
        actionPlan: realAnalysisResults.action_plan || {},
        debtPayments: getDebtPayments(realAnalysisResults.transactions || []),
      };
    } else {
      return {
        totalIncome: financialData.totalIncome || 0,
        totalExpenses: financialData.totalExpenses || 0,
        disposableIncome: financialData.disposableIncome || 0,
        categories: financialData.categories || [],
        insights: financialData.insights || [],
        transactionCount: analysisResults?.transactionsFound || 0,
        enhancedMode: false,
        transactions: [],
        debtPayments: [],
      };
    }
  };

  const getDebtPayments = (transactions) => {
    return transactions
      .filter((t) => t.IsDebtPayment && t.DebtName && t.DebtKind)
      .map((t) => ({
        name: t.DebtName,
        amount: Math.abs(t["Amount (ZAR)"] || 0),
        type: t.DebtKind,
        description: t.Description,
      }));
  };

  // First, create a custom legend component (add this before your Analysis component)
  const CustomLegend = ({ payload }) => {
    return (
      <div className="w-full">
        <div className="text-xs font-medium text-gray-700 mb-2 border-b border-gray-200 pb-1">
          Category Breakdown
        </div>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-gray-700 truncate">
                  {entry.value}
                </span>
              </div>
              <div className="flex flex-col items-end ml-2">
                <span className="text-xs font-medium text-gray-900">
                  R{entry.payload.value.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500">
                  {entry.payload.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const generateInsightsFromBackend = (backendData = {}) => {
    const insights = [];
    if (!backendData || Object.keys(backendData).length === 0) return insights;

    if (backendData.enhanced_mode) {
      insights.push({
        type: "positive",
        title: "Enhanced AI Analysis Active",
        description:
          "Advanced statistical modeling and protected category detection enabled",
        actionableSteps: [
          "Using South African household spending patterns",
          "Protected categories automatically detected",
          "More accurate optimization recommendations",
        ],
        impact: "Improved recommendation accuracy",
      });
    }

    // Enhanced suggestions with actionable steps
    if (backendData.suggestions) {
      Object.entries(backendData.suggestions)
        .filter(([_, s]) => s.potential_savings > 100) // Only show significant savings
        .sort(
          (a, b) =>
            (b[1].potential_savings || 0) - (a[1].potential_savings || 0)
        )
        .slice(0, 4) // Show top 4 opportunities
        .forEach(([category, suggestion]) => {
          const actionableSteps = Array.isArray(suggestion.suggestions)
            ? suggestion.suggestions.slice(0, 3) // Take top 3 specific actions
            : ["Review and optimize spending in this category"];

          insights.push({
            type:
              suggestion.potential_savings > 500 ? "opportunity" : "warning",
            title: `Optimize ${category} Spending`,
            description: `Save R${suggestion.potential_savings.toFixed(
              0
            )}/month with these actions:`,
            actionableSteps: actionableSteps,
            impact: `R${(suggestion.potential_savings * 12).toFixed(
              0
            )} annual savings`,
            confidence: suggestion.confidence_level || "Medium",
            currentAmount: suggestion.current_amount || 0,
            savings: suggestion.potential_savings || 0,
          });
        });
    }

    const savingsRate =
      backendData.total_income > 0
        ? (backendData.available_income / backendData.total_income) * 100
        : 0;

    const optimizedSavingsRate =
      backendData.total_income > 0
        ? ((backendData.optimized_available_income ||
            backendData.available_income) /
            backendData.total_income) *
          100
        : 0;

    let healthStatus = "";
    let healthActions = [];

    if (savingsRate >= 20) {
      healthStatus = "Excellent financial health - saving over 20%!";
      healthActions = [
        "Continue current saving habits",
        "Consider increasing investment allocation",
        "Review for tax-efficient savings options",
      ];
    } else if (savingsRate >= 10) {
      healthStatus = "Good savings rate, but room for improvement";
      healthActions = [
        "Aim to increase savings rate to 20%",
        "Review largest expense categories",
        "Consider automated savings transfers",
      ];
    } else if (savingsRate >= 0) {
      healthStatus = "Low savings rate - immediate action needed";
      healthActions = [
        "Focus on reducing discretionary spending",
        "Review and cancel unused subscriptions",
        "Shop at more affordable stores",
      ];
    } else {
      healthStatus = "Critical: Spending exceeds income";
      healthActions = [
        "Immediately cut non-essential expenses",
        "Consider additional income sources",
        "Seek financial counseling if needed",
      ];
    }

    insights.push({
      type: savingsRate >= 10 ? "positive" : "warning",
      title: "Financial Health Assessment",
      description: healthStatus,
      actionableSteps: healthActions,
      impact: `Current: ${savingsRate.toFixed(
        1
      )}% → Potential: ${optimizedSavingsRate.toFixed(1)}%`,
    });

    return insights.slice(0, 5);
  };

  const displayData = getDisplayData();

  // NEW: Recharts data preparation with professional colors
  const getChartData = () => {
    const sortedCategories = [...displayData.categories].sort(
      (a, b) => b.amount - a.amount
    );
    const topCategories = sortedCategories.slice(0, 6);

    return topCategories.map((category, index) => ({
      name: category.name,
      value: category.amount,
      percentage: (category.percentage || 0).toFixed(1),
      color: ["#1e40af", "#d97706", "#059669", "#7c3aed", "#dc2626", "#0891b2"][
        index
      ],
    }));
  };

  // NEW: Custom Recharts components
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-xs">{data.payload.name}</p>
          <p className="text-discovery-blue text-xs">
            R{data.value.toLocaleString()} ({data.payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percentage,
  }) => {
    if (parseFloat(percentage) < 5) return null; // Don't show labels for small slices

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize="10"
        fontWeight="600"
      >
        {`${percentage}%`}
      </text>
    );
  };

  const chartData = getChartData();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-4 rounded-lg border border-discovery-gold/20">
        <h2 className="text-sm font-bold mb-2 text-discovery-blue">
          Financial Analysis Complete
        </h2>
        <p className="text-gray-600 text-xs">
          AI analyzed {displayData.transactionCount} transactions across{" "}
          {displayData.categories.length} categories
        </p>
        {displayData.enhancedMode && (
          <div className="mt-1 text-xs text-discovery-gold flex items-center">
            <Sparkles className="w-3 h-3 mr-1" />
            Enhanced statistical analysis active
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white p-2 rounded-lg border border-discovery-gold/20 text-center">
          <p className="text-xs text-gray-600 mb-1">Income</p>
          <p className="text-sm font-bold text-green-600">
            R{displayData.totalIncome.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-500">Monthly total</p>
        </div>
        <div className="bg-white p-2 rounded-lg border border-discovery-gold/20 text-center">
          <p className="text-xs text-gray-600 mb-1">Expenses</p>
          <p className="text-sm font-bold text-red-600">
            R{displayData.totalExpenses.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-500">Total spending</p>
        </div>
        <div className="bg-white p-2 rounded-lg border border-discovery-gold/20 text-center">
          <p className="text-xs text-gray-600 mb-1">Available</p>
          <p className="text-sm font-bold text-discovery-blue">
            R{displayData.disposableIncome.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-500">To save/invest</p>
        </div>
      </div>

      {/* UPDATED: Recharts Pie Chart with Professional Colors and Better Legend */}
      <div className="bg-white p-4 rounded-lg border border-discovery-gold/20 shadow-sm">
        <h3 className="text-sm font-semibold mb-2 flex items-center text-discovery-blue">
          <BarChart3 className="w-4 h-4 mr-1 text-discovery-gold" />
          Expense Distribution
        </h3>

        <div className="relative h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={80}
                innerRadius={50}
                fill="#8884d8"
                dataKey="value"
                stroke="none"
                strokeWidth={0}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                content={<CustomLegend />}
                verticalAlign="middle"
                align="right"
                layout="vertical"
                wrapperStyle={{
                  paddingLeft: "20px",
                  width: "45%",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center text */}
          <div
            className="absolute inset-0 flex items-center pointer-events-none"
            style={{
              justifyContent: "flex-start",
              paddingLeft: "calc(45% - 92px)",
            }}
          >
            <div className="text-center">
              <div className="text-xs text-gray-500 font-medium mb-0.5 leading-tight">
                Total expenses
              </div>
              <div className="text-xs font-bold text-red-600 leading-tight">
                R{displayData.totalExpenses.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detected Debt Payments with Split Recommendation */}
      {displayData.debtPayments && displayData.debtPayments.length > 0 && (
        <div className="bg-white p-2 rounded-lg border border-discovery-gold/20 shadow-sm">
          <h3 className="text-xs font-semibold mb-2 flex items-center text-discovery-blue">
            <CreditCard className="w-3 h-3 mr-1 text-discovery-gold" />
            Detected Debt Payments
            {showSplitSelector && splitRecommendation && (
              <span className="ml-1 text-[10px] bg-discovery-gold/20 text-discovery-gold px-1 py-0.5 rounded-full">
                Strategy Available
              </span>
            )}
          </h3>

          {/* Debt Metrics Summary */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-discovery-gold/10 p-1.5 rounded border border-discovery-gold/20">
              <p className="text-[10px] text-gray-600">
                Total Monthly Payments
              </p>
              <p className="text-xs font-bold text-discovery-blue">
                R
                {displayData.debtPayments
                  .reduce((sum, debt) => sum + debt.amount, 0)
                  .toLocaleString()}
              </p>
              <p className="text-[10px] text-discovery-gold">
                {displayData.totalIncome > 0
                  ? `${(
                      (displayData.debtPayments.reduce(
                        (sum, debt) => sum + debt.amount,
                        0
                      ) /
                        displayData.totalIncome) *
                      100
                    ).toFixed(1)}% of income`
                  : "N/A"}
              </p>
            </div>
            <div className="bg-discovery-blue/10 p-1.5 rounded border border-discovery-blue/20">
              <p className="text-[10px] text-gray-600">Debt Service Ratio</p>
              <p className="text-xs font-bold text-discovery-blue">
                {displayData.totalIncome > 0
                  ? `${(
                      (displayData.debtPayments.reduce(
                        (sum, debt) => sum + debt.amount,
                        0
                      ) /
                        displayData.totalIncome) *
                      100
                    ).toFixed(1)}%`
                  : "N/A"}
              </p>
              <p className="text-[10px] text-discovery-gold">
                {(() => {
                  const ratio =
                    displayData.totalIncome > 0
                      ? (displayData.debtPayments.reduce(
                          (sum, debt) => sum + debt.amount,
                          0
                        ) /
                          displayData.totalIncome) *
                        100
                      : 0;
                  if (ratio > 40) return "High Risk";
                  if (ratio > 28) return "Moderate Risk";
                  if (ratio > 20) return "Manageable";
                  return "Healthy";
                })()}
              </p>
            </div>
          </div>

          {/* Individual Debt Payments */}
          <div className="space-y-1 mb-2">
            {displayData.debtPayments.map((debt, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-1 bg-gray-50 rounded border"
              >
                <div className="flex items-center space-x-1">
                  <CreditCard className="w-3 h-3 text-discovery-blue" />
                  <span className="text-[10px] font-medium text-gray-700">
                    {debt.name}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    ({debt.type})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-discovery-blue">
                    R{debt.amount.toLocaleString()}
                  </span>
                  <p className="text-[10px] text-discovery-gold">
                    {displayData.totalIncome > 0
                      ? `${(
                          (debt.amount / displayData.totalIncome) *
                          100
                        ).toFixed(1)}%`
                      : "N/A"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* AI Recommended Financial Strategy */}
          {showSplitSelector && splitRecommendation && (
            <div className="mb-2">
              <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-2 rounded border border-discovery-gold/30">
                <h4 className="text-[10px] font-semibold mb-1 flex items-center text-discovery-blue">
                  <Target className="w-2 h-2 mr-1 text-discovery-gold" />
                  AI Recommended Financial Strategy
                </h4>

                <p className="text-[10px] text-gray-600 mb-2">
                  {splitRecommendation.rationale}
                </p>

                {/* Strategy Allocation Display */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="bg-discovery-gold/10 p-1.5 rounded border border-discovery-gold/20">
                    <p className="text-[10px] text-gray-600">
                      Investment Focus
                    </p>
                    <p className="text-xs font-bold text-discovery-blue-600">
                      {(splitRecommendation.investment_ratio * 100).toFixed(0)}%
                    </p>
                    <p className="text-[10px] font-bold text-discovery-blue-600">
                      R
                      {(
                        splitRecommendation.total_available *
                        splitRecommendation.investment_ratio
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-discovery-blue/10 p-1.5 rounded border border-discovery-gold/20">
                    <p className="text-[10px] text-gray-600">Debt Focus</p>
                    <p className="text-xs font-bold text-discovery-blue-600">
                      {(splitRecommendation.debt_ratio * 100).toFixed(0)}%
                    </p>
                    <p className="text-[10px] font-bold text-discovery-blue">
                      R
                      {(
                        splitRecommendation.total_available *
                        splitRecommendation.debt_ratio
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Total Available Display */}
                <div className="mb-2">
                  <div className="bg-discovery-blue/10 p-1 rounded border border-discovery-blue/20">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-gray-700">
                        Total Available for Allocation
                      </span>
                      <span className="text-[10px] font-bold text-discovery-blue">
                        R{splitRecommendation.total_available.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Custom Split Slider */}
                {showCustomSplit && (
                  <div className="mb-2">
                    <div className="bg-gray-50 p-2 rounded border border-gray-200">
                      <SplitSlider
                        totalAvailable={splitRecommendation.total_available}
                        onApply={handleApplyCustomSplit}
                        onCancel={() => setShowCustomSplit(false)}
                      />
                    </div>
                  </div>
                )}

                {/* Strategy Action Buttons */}
                {!showCustomSplit && (
                  <div className="space-y-1">
                    <button
                      onClick={handleApplyRecommendedSplit}
                      className="w-full bg-discovery-blue text-white py-1 px-2 rounded text-[10px] hover:bg-discovery-blue/90"
                    >
                      Apply Recommended Strategy
                    </button>

                    <button
                      onClick={() => setShowCustomSplit(true)}
                      className="w-full bg-gray-200 text-gray-700 py-1 px-2 rounded text-[10px] hover:bg-gray-300"
                    >
                      Customize Split Ratio
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Debt Analysis & Recommendations */}
          <div className="mt-2 space-y-1">
            {(() => {
              const totalDebtPayments = displayData.debtPayments.reduce(
                (sum, debt) => sum + debt.amount,
                0
              );
              const debtToIncomeRatio =
                displayData.totalIncome > 0
                  ? (totalDebtPayments / displayData.totalIncome) * 100
                  : 0;

              if (debtToIncomeRatio > 40) {
                return (
                  <div className="p-1 bg-discovery-gold/10 rounded border border-discovery-gold/20">
                    <p className="text-[10px] text-discovery-blue font-medium flex items-center">
                      <AlertTriangle className="w-2 h-2 mr-1" />
                      High debt burden detected
                    </p>
                    <p className="text-[10px] text-gray-600">
                      Consider debt consolidation or aggressive payoff strategy
                    </p>
                  </div>
                );
              } else if (debtToIncomeRatio > 28) {
                return (
                  <div className="p-1 bg-discovery-blue/10 rounded border border-discovery-blue/20">
                    <p className="text-[10px] text-discovery-blue font-medium flex items-center">
                      <Target className="w-2 h-2 mr-1" />
                      Moderate debt levels
                    </p>
                    <p className="text-[10px] text-gray-600">
                      Focus on high-interest debt first
                    </p>
                  </div>
                );
              } else if (debtToIncomeRatio > 0) {
                return (
                  <div className="p-1 bg-discovery-gold/10 rounded border border-discovery-gold/20">
                    <p className="text-[10px] text-discovery-blue font-medium flex items-center">
                      <CheckCircle className="w-2 h-2 mr-1" />
                      Manageable debt levels
                    </p>
                    <p className="text-[10px] text-gray-600">
                      Optimize payment strategy for faster payoff
                    </p>
                  </div>
                );
              }
              return null;
            })()}

            {/* Show upload prompt only if no split recommendation */}
            {!showSplitSelector && (
              <div className="p-1 bg-discovery-gold/10 rounded border border-discovery-gold/20">
                <p className="text-[10px] text-discovery-blue font-medium flex items-center">
                  <Sparkles className="w-2 h-2 mr-1" />
                  Upload debt statement for detailed optimization strategies
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced AI Recommendations */}
      {displayData.insights && displayData.insights.length > 0 && (
        <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-2 rounded-lg border border-discovery-gold/20">
          <h3 className="text-xs font-semibold mb-2 text-discovery-blue">
            AI-Powered Action Plan
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {displayData.insights.map((insight, idx) => (
              <div
                key={idx}
                className="p-2 bg-white rounded-lg border border-discovery-gold/20"
              >
                <div className="flex items-start space-x-2">
                  <div className="mt-0.5">
                    {insight.type === "warning" && (
                      <AlertTriangle className="w-3 h-3 text-discovery-gold" />
                    )}
                    {insight.type === "opportunity" && (
                      <Target className="w-3 h-3 text-discovery-blue" />
                    )}
                    {insight.type === "positive" && (
                      <CheckCircle className="w-3 h-3 text-discovery-gold" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-[10px] text-discovery-blue">
                        {insight.title}
                      </p>
                      {insight.savings > 0 && (
                        <span className="text-[10px] bg-discovery-gold/20 text-discovery-gold px-1 py-0.5 rounded">
                          Save R{insight.savings.toFixed(0)}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-600 mb-1">
                      {insight.description}
                    </p>

                    {/* Actionable Steps */}
                    {insight.actionableSteps &&
                      insight.actionableSteps.length > 0 && (
                        <div className="space-y-0.5 mb-1">
                          {insight.actionableSteps.map((step, stepIdx) => (
                            <div
                              key={stepIdx}
                              className="flex items-start space-x-1"
                            >
                              <ArrowRight className="w-2 h-2 text-discovery-gold mt-0.5 flex-shrink-0" />
                              <span className="text-[10px] text-gray-700">
                                {step}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                    {insight.impact && (
                      <p className="text-[10px] text-discovery-gold font-medium">
                        Impact: {insight.impact}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimization Summary */}
      {displayData.totalPotentialSavings > 0 && (
        <div className="bg-white p-2 rounded-lg border border-discovery-gold/20 shadow-sm">
          <h3 className="text-xs font-semibold mb-2 flex items-center text-discovery-blue">
            <TrendingUp className="w-3 h-3 mr-1 text-discovery-gold" />
            Optimization Potential
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 bg-gray-50 rounded">
              <p className="text-[10px] text-gray-600">Current Available</p>
              <p className="text-xs font-bold text-discovery-blue">
                R{displayData.disposableIncome.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-2 bg-discovery-gold/10 rounded">
              <p className="text-[10px] text-gray-600">With Optimizations</p>
              <p className="text-xs font-bold text-discovery-gold">
                R{displayData.optimizedIncome.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="mt-2 text-center">
            <p className="text-[10px] text-discovery-gold font-medium">
              Potential increase: R
              {(
                displayData.optimizedIncome - displayData.disposableIncome
              ).toLocaleString()}
              /month
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analysis;
