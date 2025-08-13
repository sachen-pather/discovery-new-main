import React, { useState, useEffect, useMemo, useRef } from "react";
import { getDebtAnalysis, getApiHealth } from "../../utils/api";

const Debt = ({
  financialData,
  userProfile,
  realAnalysisResults,
  debtAnalysisResults,
  setDebtAnalysisResults,
}) => {
  // UI state
  const [selectedStrategy, setSelectedStrategy] = useState("avalanche");
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [newDebt, setNewDebt] = useState({
    name: "",
    type: "credit_card",
    balance: "",
    interestRate: "",
    minimumPayment: "",
  });

  // Debt upload state
  const [isUploadingDebt, setIsUploadingDebt] = useState(false);
  const [debtUploadError, setDebtUploadError] = useState(null);

  // Backend analysis
  const [backendAnalysis, setBackendAnalysis] = useState(debtAnalysisResults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [features, setFeatures] = useState(null);
  const abortRef = useRef(null);

  // Budget inputs with enhanced mode support
  const monthlyIncome =
    Number(realAnalysisResults?.total_income) ||
    Number(financialData?.totalIncome) ||
    0;

  const availableMonthly = Number(realAnalysisResults?.available_income) || 0;

  const optimizedAvailable =
    Number(realAnalysisResults?.optimized_available_income) ||
    Number(availableMonthly);

  const enhancedMode = !!realAnalysisResults?.enhanced_mode;

  // Extract debt information from transactions
  const debtPayments = useMemo(() => {
    if (!realAnalysisResults?.transactions) return [];

    return realAnalysisResults.transactions
      .filter((t) => t.IsDebtPayment && t.DebtName && t.DebtKind)
      .map((t) => ({
        name: t.DebtName,
        kind: t.DebtKind,
        payment: Math.abs(t["Amount (ZAR)"] || 0),
        description: t.Description,
      }));
  }, [realAnalysisResults]);

  // Update local state when prop changes
  useEffect(() => {
    if (debtAnalysisResults) {
      setBackendAnalysis(debtAnalysisResults);
      if (debtAnalysisResults.recommendation) {
        setSelectedStrategy(debtAnalysisResults.recommendation);
      }
    }
  }, [debtAnalysisResults]);

  // Initial feature health check
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const apiHealth = await getApiHealth();
        if (!alive) return;
        setFeatures(apiHealth?.features || null);
      } catch (e) {
        // non-fatal
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Handle debt CSV upload
  const handleDebtUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setDebtUploadError("Please upload a CSV file");
      return;
    }

    setIsUploadingDebt(true);
    setDebtUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "available_monthly",
        optimizedAvailable || availableMonthly
      );

      const response = await fetch("http://localhost:5000/upload-debt-csv", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Debt analysis failed");
      }

      // Update both local state and App state for persistence
      setBackendAnalysis(result);
      setDebtAnalysisResults(result);

      // Auto-select recommendation if present
      if (result?.recommendation && (result.avalanche || result.snowball)) {
        setSelectedStrategy(
          result.recommendation === "snowball" ? "snowball" : "avalanche"
        );
      }

      console.log("✅ Debt upload and analysis completed:", result);
    } catch (err) {
      console.error("❌ Debt upload error:", err);
      setDebtUploadError(err.message || "Failed to analyze debt file");
    } finally {
      setIsUploadingDebt(false);
    }
  };

  // Calculate minimum payment scenario for comparison
  const calculateMinPaymentScenario = () => {
    if (!backendAnalysis?.debts_uploaded) return null;

    const debts = backendAnalysis.debts_uploaded;
    const totalMinPayments = debts.reduce(
      (sum, debt) => sum + debt.min_payment,
      0
    );

    // Estimate debt-free timeline with minimum payments only
    const avgBalance =
      debts.reduce((sum, debt) => sum + debt.balance, 0) / debts.length;
    const avgRate =
      debts.reduce((sum, debt) => sum + debt.apr, 0) / debts.length;
    const avgMinPayment = totalMinPayments / debts.length;

    // Simplified calculation for minimum payments scenario
    const monthlyRate = avgRate / 12;
    const estimatedMonths =
      Math.log(1 + (avgBalance * monthlyRate) / avgMinPayment) /
      Math.log(1 + monthlyRate);
    const estimatedInterest = avgMinPayment * estimatedMonths - avgBalance;

    return {
      strategy: "minimum_payments",
      months_to_debt_free: Math.ceil((estimatedMonths * debts.length) / 2),
      total_interest_paid: estimatedInterest * debts.length,
      monthly_payment: totalMinPayments,
      description: "Minimum payments only",
    };
  };

  // Helper functions
  const getDebtEmoji = (type) => {
    const emojiMap = {
      credit_card: "💳",
      personal_loan: "💰",
      home_loan: "🏠",
      car_loan: "🚗",
      student_loan: "🎓",
      store_card: "🛍️",
      overdraft: "🏦",
      mortgage: "🏠",
    };
    return emojiMap[type] || "💳";
  };

  const getDebtColor = (index) => {
    const colors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-purple-500",
      "bg-blue-500",
      "bg-yellow-500",
    ];
    return colors[index % colors.length];
  };

  // Simple payoff calculator
  const calculatePayoffMonths = (balance, rate, payment) => {
    const b = Number(balance) || 0;
    const r = (Number(rate) || 0) / 100 / 12;
    const p = Number(payment) || 0;
    if (p <= 0 || b <= 0) return 0;
    if (r === 0) return Math.ceil(b / p);
    const denom = p - b * r;
    if (denom <= 0) return Infinity;
    const months = Math.log(p / denom) / Math.log(1 + r);
    return Math.max(0, Math.ceil(months));
  };

  const handleAddDebt = () => {
    const { name, type, balance, interestRate, minimumPayment } = newDebt;
    if (!name || !balance || !interestRate || !minimumPayment) return;

    // For manual entry, we'll create a mock result structure
    const mockDebt = {
      name: String(name),
      balance: Number(balance),
      apr: Number(interestRate) / 100,
      min_payment: Number(minimumPayment),
      kind: type,
    };

    // Add to analysis if it exists, or create a new one
    if (backendAnalysis) {
      const updatedAnalysis = {
        ...backendAnalysis,
        debts_uploaded: [...(backendAnalysis.debts_uploaded || []), mockDebt],
        debt_summary: {
          ...backendAnalysis.debt_summary,
          total_debts: (backendAnalysis.debt_summary?.total_debts || 0) + 1,
          total_balance:
            (backendAnalysis.debt_summary?.total_balance || 0) +
            Number(balance),
          total_min_payments:
            (backendAnalysis.debt_summary?.total_min_payments || 0) +
            Number(minimumPayment),
        },
      };
      setBackendAnalysis(updatedAnalysis);
      setDebtAnalysisResults(updatedAnalysis);
    }

    setNewDebt({
      name: "",
      type: "credit_card",
      balance: "",
      interestRate: "",
      minimumPayment: "",
    });
    setShowAddDebt(false);
  };

  const currentStrategy =
    backendAnalysis?.[selectedStrategy] ||
    backendAnalysis?.avalanche ||
    backendAnalysis?.snowball ||
    null;

  const minPaymentScenario = calculateMinPaymentScenario();

  const hasRealData =
    realAnalysisResults && realAnalysisResults.total_income !== undefined;
  const hasDebtData = backendAnalysis;

  // Get debt strategies for comparison
  const getDebtStrategies = () => {
    const strategies = {};

    // Add minimum payment scenario
    if (minPaymentScenario) {
      strategies.minimum = {
        name: "Minimum Payments",
        emoji: "😴",
        description: "Pay only minimum amounts",
        ...minPaymentScenario,
      };
    }

    // Add optimized strategies
    if (backendAnalysis?.avalanche) {
      strategies.avalanche = {
        name: "Avalanche Method",
        emoji: "📉",
        description: "Highest interest rate first",
        ...backendAnalysis.avalanche,
      };
    }

    if (backendAnalysis?.snowball) {
      strategies.snowball = {
        name: "Snowball Method",
        emoji: "🎯",
        description: "Smallest balance first",
        ...backendAnalysis.snowball,
      };
    }

    return strategies;
  };

  const debtStrategies = getDebtStrategies();

  return (
    <div className="space-y-4">
      {/* Loading State */}
      {(loading || isUploadingDebt) && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-600">
              {isUploadingDebt
                ? "Analyzing debt statement with AI..."
                : enhancedMode
                ? "Loading enhanced debt analysis with AI optimization..."
                : "Loading debt analysis..."}
            </span>
          </div>
        </div>
      )}

      {/* Error State */}
      {(error || debtUploadError) && (
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-start space-x-2">
            <span className="text-red-600">⚠️</span>
            <div>
              <p className="text-sm font-medium text-red-800">Analysis Error</p>
              <p className="text-xs text-red-600 mt-1">
                {error || debtUploadError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Debt Upload Section */}
      <div className="bg-white p-6 rounded-xl border-2 border-dashed border-discovery-gold/30">
        <div className="text-center">
          {isUploadingDebt ? (
            <div className="py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-discovery-gold mb-4"></div>
              <h3 className="text-lg font-semibold mb-2 text-discovery-blue">
                Analyzing Debt Statement...
              </h3>
              <p className="text-gray-600">
                Processing debt information and calculating optimal payoff
                strategies
              </p>
              <p className="text-sm text-discovery-gold mt-2">
                Using R
                {(optimizedAvailable || availableMonthly).toLocaleString()}{" "}
                available monthly
              </p>
            </div>
          ) : (
            <>
              <div className="mx-auto mb-4 text-discovery-gold text-5xl">
                💳
              </div>
              <h3 className="text-lg font-semibold mb-2 text-discovery-blue">
                {hasDebtData
                  ? "Upload New Debt Statement"
                  : "Upload Debt Statement"}
              </h3>
              <p className="text-gray-600 mb-4">
                {hasDebtData
                  ? "Analyze different debt information (CSV format)"
                  : debtPayments.length > 0
                  ? "Complete your debt analysis with detailed information"
                  : "Get AI-powered debt optimization strategies"}
              </p>

              <label className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-discovery-gold to-discovery-blue text-white rounded-lg cursor-pointer hover:from-discovery-gold/90 hover:to-discovery-blue/90 transition-colors">
                <span className="mr-2 text-xl">📊</span>
                Choose Debt CSV File
                <input
                  type="file"
                  className="hidden"
                  accept=".csv"
                  onChange={handleDebtUpload}
                  disabled={isUploadingDebt}
                />
              </label>

              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-500">
                  CSV format only • Your data is encrypted and secure
                </p>
                {(optimizedAvailable || availableMonthly) > 0 && (
                  <p className="text-xs text-discovery-blue font-medium">
                    Available for debt payments: R
                    {(optimizedAvailable || availableMonthly).toLocaleString()}
                    /month
                  </p>
                )}
                <div className="flex justify-center space-x-4 text-xs text-gray-400">
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                    CSV: Direct processing
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Enhanced Detected Debt Payments Section */}
      {debtPayments.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-blue-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-start space-x-3">
            <span className="text-xl">🤖</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                AI Detected Debt Payments
                {enhancedMode && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    Enhanced Detection
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                I've analyzed your transactions and found {debtPayments.length}{" "}
                debt payments. Upload your debt statement for complete
                optimization analysis.
              </p>
              <div className="grid grid-cols-1 gap-2">
                {debtPayments.map((debt, idx) => (
                  <div
                    key={idx}
                    className="bg-white/80 rounded p-2 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <span>{getDebtEmoji(debt.kind)}</span>
                      <span className="text-xs font-medium text-gray-700">
                        {debt.name}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-blue-600">
                      R{debt.payment.toLocaleString()}/month
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debt Analysis Results */}
      {hasDebtData && (
        <>
          {/* Before/After Comparison */}
          {minPaymentScenario && currentStrategy && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Before vs After Optimization
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {/* Before - Minimum Payments */}
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">😴</span>
                    <h4 className="text-sm font-medium text-red-700">Before</h4>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600">
                      Minimum payments only
                    </p>
                    <p className="text-sm font-bold text-red-600">
                      {minPaymentScenario.months_to_debt_free} months
                    </p>
                    <p className="text-xs text-red-500">
                      R
                      {Math.abs(
                        minPaymentScenario.total_interest_paid
                      ).toLocaleString()}{" "}
                      interest
                    </p>
                  </div>
                </div>

                {/* After - Optimized */}
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">
                      {selectedStrategy === "avalanche" ? "📉" : "🎯"}
                    </span>
                    <h4 className="text-sm font-medium text-green-700">
                      After
                    </h4>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600">
                      {selectedStrategy} method
                    </p>
                    <p className="text-sm font-bold text-green-600">
                      {currentStrategy.months_to_debt_free} months
                    </p>
                    <p className="text-xs text-green-500">
                      R{currentStrategy.total_interest_paid.toLocaleString()}{" "}
                      interest
                    </p>
                  </div>
                </div>
              </div>

              {/* Savings Summary */}
              <div className="mt-3 p-3 bg-discovery-gold/10 rounded-lg border border-discovery-gold/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-discovery-blue">
                    Optimization Savings:
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-discovery-gold">
                      {Math.abs(
                        minPaymentScenario.months_to_debt_free -
                          currentStrategy.months_to_debt_free
                      )}{" "}
                      months faster
                    </p>
                    <p className="text-xs text-green-600">
                      R
                      {Math.abs(
                        minPaymentScenario.total_interest_paid -
                          currentStrategy.total_interest_paid
                      ).toLocaleString()}{" "}
                      saved
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Debt Summary */}
          {backendAnalysis?.debt_summary && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Debt Summary
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">Total Balance</p>
                  <p className="text-sm font-bold text-red-600">
                    R
                    {backendAnalysis.debt_summary.total_balance.toLocaleString()}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">Monthly Payments</p>
                  <p className="text-sm font-bold text-blue-600">
                    R
                    {backendAnalysis.debt_summary.total_min_payments.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Strategy Comparison Table */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Strategy Comparison
            </h3>

            <div className="space-y-2">
              {Object.entries(debtStrategies).map(([key, strategy]) => {
                const isSelected = key === selectedStrategy;
                const isRecommended = key === backendAnalysis?.recommendation;

                return (
                  <div
                    key={key}
                    className={`rounded-lg p-3 border cursor-pointer transition-all ${
                      isSelected
                        ? "border-discovery-blue bg-discovery-blue/10"
                        : "border-gray-200 hover:border-discovery-blue/50"
                    }`}
                    onClick={() => setSelectedStrategy(key)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{strategy.emoji}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-xs font-medium ${
                                isSelected
                                  ? "text-discovery-blue"
                                  : "text-gray-700"
                              }`}
                            >
                              {strategy.name}
                            </p>
                            {isRecommended && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {strategy.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-bold ${
                            isSelected ? "text-discovery-blue" : "text-gray-700"
                          }`}
                        >
                          {strategy.months_to_debt_free} months
                        </p>
                        <p className="text-xs text-gray-500">
                          R
                          {Math.abs(
                            strategy.total_interest_paid
                          ).toLocaleString()}{" "}
                          interest
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Recommendation */}
          {backendAnalysis?.recommendation && (
            <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-4 rounded-lg border border-discovery-gold/20">
              <h4 className="text-sm font-medium text-discovery-blue mb-2 flex items-center">
                🤖 AI Recommendation
                {enhancedMode && (
                  <span className="ml-2 text-xs bg-discovery-blue/10 text-discovery-blue px-2 py-1 rounded-full">
                    Enhanced Analysis
                  </span>
                )}
              </h4>
              <p className="text-xs text-gray-700 mb-2">
                Based on your financial situation, the{" "}
                <strong>{backendAnalysis.recommendation}</strong> method is
                optimal. You'll be debt-free in{" "}
                <strong>{currentStrategy?.months_to_debt_free} months</strong>
                with total interest of{" "}
                <strong>
                  R{currentStrategy?.total_interest_paid?.toLocaleString()}
                </strong>
                .
              </p>

              {/* Payoff Order */}
              {currentStrategy?.payoff_order && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Optimal payoff order:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentStrategy.payoff_order.map((debt, index) => (
                      <span
                        key={`${debt}-${index}`}
                        className="text-xs bg-discovery-blue/10 text-discovery-blue px-2 py-1 rounded-full"
                      >
                        {index + 1}. {debt}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Your Debts List */}
          {backendAnalysis?.debts_uploaded && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  Your Debts
                </h3>
                <button
                  onClick={() => setShowAddDebt(!showAddDebt)}
                  className="text-blue-600 text-sm font-medium"
                >
                  + Add Debt
                </button>
              </div>

              {/* Add Debt Form */}
              {showAddDebt && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
                  <input
                    type="text"
                    placeholder="Debt name"
                    value={newDebt.name}
                    onChange={(e) =>
                      setNewDebt({ ...newDebt, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  <select
                    value={newDebt.type}
                    onChange={(e) =>
                      setNewDebt({ ...newDebt, type: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="credit_card">Credit Card</option>
                    <option value="personal_loan">Personal Loan</option>
                    <option value="home_loan">Home Loan</option>
                    <option value="car_loan">Car Loan</option>
                    <option value="student_loan">Student Loan</option>
                    <option value="store_card">Store Card</option>
                    <option value="overdraft">Overdraft</option>
                  </select>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      placeholder="Balance"
                      value={newDebt.balance}
                      onChange={(e) =>
                        setNewDebt({ ...newDebt, balance: e.target.value })
                      }
                      className="px-2 py-2 border rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Rate %"
                      value={newDebt.interestRate}
                      onChange={(e) =>
                        setNewDebt({ ...newDebt, interestRate: e.target.value })
                      }
                      className="px-2 py-2 border rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Min payment"
                      value={newDebt.minimumPayment}
                      onChange={(e) =>
                        setNewDebt({
                          ...newDebt,
                          minimumPayment: e.target.value,
                        })
                      }
                      className="px-2 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddDebt}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowAddDebt(false)}
                      className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {backendAnalysis.debts_uploaded.map((debt, index) => {
                  const months = calculatePayoffMonths(
                    debt.balance,
                    debt.apr * 100,
                    debt.min_payment
                  );
                  const years = Math.floor((months || 0) / 12);
                  const remainingMonths = (months || 0) % 12;

                  return (
                    <div
                      key={index}
                      className="border rounded-lg p-3 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div
                            className={`${getDebtColor(
                              index
                            )} p-2 rounded-lg flex items-center justify-center`}
                          >
                            <span className="text-white text-lg">
                              {getDebtEmoji(debt.kind)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm text-gray-800">
                                {debt.name}
                              </p>
                              {currentStrategy?.payoff_order?.includes(
                                debt.name
                              ) && (
                                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                                  #
                                  {currentStrategy.payoff_order.indexOf(
                                    debt.name
                                  ) + 1}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              R{Number(debt.balance).toLocaleString()} at{" "}
                              {(debt.apr * 100).toFixed(1)}%
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <div>
                                <p className="text-xs text-gray-400">Monthly</p>
                                <p className="text-xs font-medium">
                                  R{Number(debt.min_payment).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">
                                  Payoff in
                                </p>
                                <p className="text-xs font-medium">
                                  {months === Infinity
                                    ? "∞"
                                    : years > 0
                                    ? `${years}y ${remainingMonths}m`
                                    : `${months || 0}m`}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Budget Integration Section */}
      {Number.isFinite(availableMonthly) && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-700 mb-2 flex items-center">
            💰 Budget Integration
            {enhancedMode && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                Enhanced
              </span>
            )}
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white/80 rounded p-2">
              <p className="text-gray-600">Available for Debt Payment</p>
              <p className="text-lg font-bold text-blue-600">
                R{Number(availableMonthly).toLocaleString()}
              </p>
            </div>
            <div className="bg-white/80 rounded p-2">
              <p className="text-gray-600">With Optimizations</p>
              <p className="text-lg font-bold text-green-600">
                R{Number(optimizedAvailable).toLocaleString()}
              </p>
            </div>
          </div>
          {enhancedMode && (
            <p className="text-xs text-blue-600 mt-2">
              Enhanced analysis preserves essential expenses while maximizing
              debt payment capacity
            </p>
          )}
        </div>
      )}

      {/* Enhanced Tips Section */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <span className="mr-2">💡</span>
          Smart Debt Tips
          {enhancedMode && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              Enhanced
            </span>
          )}
        </h3>
        <div className="space-y-2">
          <div className="flex items-start space-x-2">
            <span className="text-xs text-gray-400 mt-0.5">▸</span>
            <p className="text-xs text-gray-600">
              Always pay more than minimum on high-interest debts
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-xs text-gray-400 mt-0.5">▸</span>
            <p className="text-xs text-gray-600">
              Consider consolidating multiple high-interest debts
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-xs text-gray-400 mt-0.5">▸</span>
            <p className="text-xs text-gray-600">
              Build emergency fund while paying off debt (3-month minimum)
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-xs text-gray-400 mt-0.5">▸</span>
            <p className="text-xs text-gray-600">
              Use the avalanche method for maximum interest savings
            </p>
          </div>
          {enhancedMode && (
            <div className="flex items-start space-x-2 bg-blue-50 p-2 rounded mt-2">
              <span className="text-xs text-blue-600 mt-0.5">✨</span>
              <p className="text-xs text-blue-700">
                <strong>Enhanced Analysis:</strong> Statistical modeling
                considers your specific financial patterns for optimal debt
                management strategies.
              </p>
            </div>
          )}
          {backendAnalysis?.recommendation && (
            <div className="flex items-start space-x-2 bg-green-50 p-2 rounded mt-2">
              <span className="text-xs text-green-600 mt-0.5">🤖</span>
              <p className="text-xs text-green-700">
                <strong>AI Recommendation:</strong> Use the{" "}
                {backendAnalysis.recommendation} method to save R
                {Number(
                  backendAnalysis[backendAnalysis.recommendation]
                    ?.interest_saved_vs_min_only || 0
                ).toLocaleString()}{" "}
                in interest compared to minimum payments only.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CSV Format Guide - Collapsible */}
      <div className="bg-gray-50 rounded-lg border border-gray-200">
        <details className="p-3">
          <summary className="text-xs font-medium text-gray-700 cursor-pointer">
            📋 CSV Format Guide
          </summary>
          <div className="mt-2 space-y-2">
            <p className="text-xs text-gray-600">Required columns:</p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>• name, balance, apr, min_payment, kind</p>
            </div>
            <div className="bg-white p-2 rounded border text-xs">
              <pre className="text-gray-600 overflow-x-auto">
                {`name,balance,apr,min_payment,kind
Credit Card,8500.00,0.22,200.00,credit_card
Personal Loan,15000.00,0.16,450.00,personal_loan`}
              </pre>
            </div>
          </div>
        </details>
      </div>

      {/* No Data State */}
      {!hasRealData && !hasDebtData && debtPayments.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <span className="text-4xl opacity-50">💳</span>
          <p className="text-sm mt-2">
            {debtPayments.length > 0
              ? "Debt payments detected - upload debt statement above"
              : backendAnalysis
              ? "Sample debt analysis available"
              : "No debts added yet"}
          </p>
          <p className="text-xs mt-1">
            {availableMonthly <= 0
              ? "Upload your financial data first to see debt analysis"
              : enhancedMode
              ? "Enhanced analysis will provide optimal debt strategies when you upload debts"
              : "Upload your debt statement to see personalized payoff strategies"}
          </p>
        </div>
      )}
    </div>
  );
};

export default Debt;
