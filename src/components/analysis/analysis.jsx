import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const Analysis = ({ financialData = {}, analysisResults = {}, realAnalysisResults = null }) => {
  const getIconForCategory = (categoryName) => {
    const iconMap = {
      "Rent/Mortgage": "🏠",
      Groceries: "🛒",
      "Dining Out": "☕",
      Transport: "🚗",
      Subscriptions: "📱",
      Shopping: "🛍️",
      Other: "💰",
      Administrative: "📋",
      "Debt Payments": "💳",
    };
    return iconMap[categoryName] || "💰";
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
        transactionCount: Object.values(realAnalysisResults.category_breakdown || {}).reduce(
          (sum, cat) => sum + (cat.count || 0),
          0
        ),
        transactions: realAnalysisResults.transactions || [],
        actionPlan: realAnalysisResults.action_plan || {},
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
      };
    }
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
        suggestion:
          "Using South African household spending patterns for optimization",
        impact: "More accurate recommendations",
      });
    }

    if (backendData.suggestions) {
      Object.entries(backendData.suggestions)
        .filter(([_, s]) => s.potential_savings > 0)
        .sort((a, b) => (b[1].priority || 1) - (a[1].priority || 1))
        .slice(0, 3)
        .forEach(([category, suggestion]) => {
          insights.push({
            type:
              suggestion.potential_savings > 500 ? "opportunity" : "warning",
            title: `${category} Optimization`,
            description: Array.isArray(suggestion.suggestions)
              ? suggestion.suggestions[0]
              : "Review expenses in this category",
            suggestion: `Potential savings: R${suggestion.potential_savings.toFixed(
              0
            )}`,
            impact: `R${(suggestion.potential_savings * 12).toFixed(0)} annual savings`,
            confidence: suggestion.confidence_level || "Medium",
          });
        });
    }

    const savingsRate =
      backendData.total_income > 0
        ? (backendData.available_income / backendData.total_income) * 100
        : 0;

    const optimizedSavingsRate =
      backendData.total_income > 0
        ? ((backendData.optimized_available_income || backendData.available_income) /
            backendData.total_income) *
          100
        : 0;

    let healthStatus = "";
    if (savingsRate >= 20) {
      healthStatus = "Excellent: You're saving over 20% of your income!";
    } else if (savingsRate >= 10) {
      healthStatus =
        "Good: You're saving 10-20% of your income. Room for improvement.";
    } else if (savingsRate >= 0) {
      healthStatus = "Caution: Low savings rate. Focus on expense reduction.";
    } else {
      healthStatus =
        "Alert: Spending more than you earn. Immediate action required.";
    }

    insights.push({
      type: savingsRate >= 10 ? "positive" : "warning",
      title: "Financial Health Status",
      description: healthStatus,
      suggestion:
        savingsRate < 10 ? "Focus on expense reduction" : "Maintain good habits",
      impact: `${savingsRate.toFixed(1)}% → ${optimizedSavingsRate.toFixed(1)}%`,
    });

    return insights.slice(0, 5);
  };

  const buildDebtBreakdownFromTransactions = (txs = []) => {
    const labelMap = {
      mortgage: "Mortgage",
      credit_card: "Credit Card",
      personal_loan: "Personal Loan",
      store_card: "Store Card",
      auto_loan: "Vehicle Finance",
      student_loan: "Student Loan",
    };
    const sums = {};
    txs.forEach((t) => {
      const isDebt =
        String(t?.Category || "").toLowerCase() === "debt payments" ||
        String(t?.Category || "").toLowerCase() === "debt payment" ||
        t?.IsDebtPayment;
      if (!isDebt) return;

      const kind = String(t?.DebtKind || "").toLowerCase();
      const rawAmt =
        Number(t?.["Amount (ZAR)"]) ?? Number(t?.Amount) ?? Number(t?.amount) ?? 0;
      const amt = Math.abs(rawAmt) || 0;
      const baseLabel = labelMap[kind] || (t?.DebtName ? String(t.DebtName) : "Other Debt");
      const label = `${baseLabel} (Debt)`;
      sums[label] = (sums[label] || 0) + amt;
    });

    return Object.entries(sums).map(([name, amount]) => ({ name, amount }));
  };

  const displayData = getDisplayData();

  const getChartData = () => {
    const sortedCategories = [...displayData.categories].sort((a, b) => b.amount - a.amount);
    // top 6 only (no "Remaining" slice)
    const topCategories = sortedCategories.slice(0, 6);

    return {
      labels: topCategories.map((c) => `${c.name} (${(c.percentage || 0).toFixed(1)}%)`),
      datasets: [
        {
          data: topCategories.map((c) => c.amount),
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"],
          borderWidth: 1,
        },
      ],
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-6 rounded-xl border border-discovery-gold/20">
        <h2 className="text-xl font-bold mb-2 text-discovery-blue">Financial Analysis Complete</h2>
        <p className="text-gray-600">
          AI analyzed {displayData.transactionCount} transactions across {displayData.categories.length} categories
        </p>
        {displayData.enhancedMode && (
          <div className="mt-2 text-sm text-discovery-gold">✨ Enhanced statistical analysis active</div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-discovery-gold/20 text-center">
          <p className="text-xs text-gray-600 mb-1">Income</p>
          <p className="text-lg font-bold text-green-600">R{displayData.totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-discovery-gold/20 text-center">
          <p className="text-xs text-gray-600 mb-1">Expenses</p>
          <p className="text-lg font-bold text-red-600">R{displayData.totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-discovery-gold/20 text-center">
          <p className="text-xs text-gray-600 mb-1">Available</p>
          <p className="text-lg font-bold text-discovery-blue">R{displayData.disposableIncome.toLocaleString()}</p>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="bg-white p-6 rounded-xl border border-discovery-gold/20 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center text-discovery-blue">
          <span className="mr-2 text-discovery-gold text-xl">📊</span> Expense Distribution
        </h3>
        <div className="h-64">
          <Pie
            data={getChartData()}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: "60%",
              plugins: {
                legend: {
                  position: "right",
                  align: "center",
                  labels: {
                    boxWidth: 10,
                    padding: 8,
                    font: { size: 11 },
                    generateLabels: (chart) => {
                      const original = ChartJS.overrides?.pie?.plugins?.legend?.labels?.generateLabels;
                      if (!original) return [];
                      return original(chart).map((label) => {
                        if (label.text && label.text.length > 22) {
                          label.text = label.text.slice(0, 22) + "...";
                        }
                        return label;
                      });
                    },
                  },
                },
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      const label = context.label || "";
                      const value = context.raw || 0;
                      const total = context.dataset.data.reduce((a, b) => a + b, 0) || 1;
                      const percentage = ((value / total) * 100).toFixed(1);
                      return `${label}: R${value.toLocaleString()} (${percentage}%)`;
                    },
                  },
                },
              },
            }}
            plugins={[
              {
                id: "centerText",
                beforeDraw: (chart) => {
                  const {
                    ctx,
                    chartArea: { width, height, top, left },
                  } = chart;
                  ctx.save();
                  const centerX = left + width / 2;
                  const centerY = top + height / 2;
                  const amount = `R${displayData.totalExpenses.toLocaleString()}`;
                  const label = "Total expenses";
                  const amountFontSize = Math.min(Math.max(width / 8, 12), 28);
                  const labelFontSize = Math.min(Math.max(width / 20, 10), 14);

                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";

                  // Draw label slightly above the number, but keep overall centered
                  ctx.font = `600 ${labelFontSize}px sans-serif`;
                  ctx.fillStyle = "#6b7280";
                  ctx.fillText(label, centerX, centerY - amountFontSize * 0.6);

                  ctx.font = `700 ${amountFontSize}px sans-serif`;
                  ctx.fillStyle = "#dc2626";
                  ctx.fillText(amount, centerX, centerY + labelFontSize * 0.35);

                  ctx.restore();
                },
              },
              {
                id: "responsiveLegend",
                beforeUpdate: (chart) => {
                  try {
                    const width = chart.width || chart.chartArea?.width || 0;
                    const legendOpts = chart.options.plugins.legend;
                    if (width < 480) {
                      legendOpts.position = "bottom";
                      legendOpts.align = "center";
                    } else {
                      legendOpts.position = "right";
                      legendOpts.align = "center";
                    }
                  } catch (e) {
                    // ignore
                  }
                },
              },
            ]}
          />
        </div>
      </div>

      {/* AI Recommendations */}
      {displayData.insights && displayData.insights.length > 0 && (
        <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-6 rounded-xl border border-discovery-gold/20">
          <h3 className="text-lg font-semibold mb-4 text-discovery-blue">AI-Powered Recommendations</h3>
          <div className="grid grid-cols-1 gap-3">
            {displayData.insights.map((insight, idx) => (
              <div key={idx} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-discovery-gold/20">
                <div className="mt-1">
                  {insight.type === "warning" && <span className="text-red-500 text-lg">⚠️</span>}
                  {insight.type === "opportunity" && <span className="text-discovery-gold text-lg">🎯</span>}
                  {insight.type === "positive" && <span className="text-discovery-blue text-lg">✅</span>}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-discovery-blue">{insight.title}</p>
                  <p className="text-xs text-gray-600">{insight.suggestion || insight.description}</p>
                  <p className="text-xs text-discovery-gold font-medium">{insight.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analysis;
