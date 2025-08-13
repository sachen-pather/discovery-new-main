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
    // This is a simplified calculation - actual would be more complex
    const avgBalance =
      debts.reduce((sum, debt) => sum + debt.balance, 0) / debts.length;
    const avgRate =
      debts.reduce((sum, debt) => sum + debt.apr, 0) / debts.length;
    const avgMinPayment = totalMinPayments / debts.length;

    // Simplified calculation: if paying only minimums
    const monthlyRate = avgRate / 12;
    const estimatedMonths =
      Math.log(1 + (avgBalance * monthlyRate) / avgMinPayment) /
      Math.log(1 + monthlyRate);
    const estimatedInterest = avgMinPayment * estimatedMonths - avgBalance;

    return {
      strategy: "minimum_payments",
      months_to_debt_free: Math.ceil((estimatedMonths * debts.length) / 2), // Rough estimate
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
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* Header - Mobile Optimized */}
      <div className="bg-white p-4 border-b border-gray-200">
        <h1 className="text-lg font-bold text-discovery-blue">
          Debt Optimizer
        </h1>
        {hasRealData && (
          <p className="text-xs text-discovery-gold mt-1">
            ✨ Enhanced AI Analysis Active
          </p>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* AI Detected Debt Payments - Compact */}
        {debtPayments.length > 0 && (
          <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-4 rounded-lg border border-discovery-gold/20">
            <div className="flex items-start space-x-2">
              <span className="text-lg">🤖</span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-discovery-blue mb-1">
                  AI Detected Debt Payments
                </h3>
                <p className="text-xs text-gray-600 mb-3">
                  Found {debtPayments.length} debt payments. Upload your debt
                  statement for optimization.
                </p>

                {/* Compact Detected Debts */}
                <div className="space-y-2">
                  {debtPayments.map((debt, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-white/80 rounded p-2"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">
                          {getDebtEmoji(debt.kind)}
                        </span>
                        <span className="text-xs font-medium text-discovery-blue">
                          {debt.name}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-discovery-gold">
                        R{debt.payment.toLocaleString()}/mo
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Debt Upload Section - Mobile Optimized */}
        <div className="bg-white p-4 rounded-lg border-2 border-dashed border-discovery-gold/30">
          {isUploadingDebt ? (
            <div className="text-center py-6">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-discovery-gold mb-3"></div>
              <h3 className="text-sm font-semibold text-discovery-blue mb-1">
                Analyzing Debt...
              </h3>
              <p className="text-xs text-gray-600">
                Using R
                {(optimizedAvailable || availableMonthly).toLocaleString()}
                /month
              </p>
            </div>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-3 text-discovery-gold text-3xl">
                💳
              </div>
              <h3 className="text-sm font-semibold mb-2 text-discovery-blue">
                {hasDebtData ? "Upload New Debt CSV" : "Upload Debt Statement"}
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Get personalized payoff strategies
              </p>

              <label className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-discovery-gold to-discovery-blue text-white rounded-lg cursor-pointer text-sm">
                <span className="mr-2">📎</span>
                Choose CSV File
                <input
                  type="file"
                  className="hidden"
                  accept=".csv"
                  onChange={handleDebtUpload}
                  disabled={isUploadingDebt}
                />
              </label>

              {(optimizedAvailable || availableMonthly) > 0 && (
                <p className="text-xs text-discovery-blue font-medium mt-2">
                  Available: R
                  {(optimizedAvailable || availableMonthly).toLocaleString()}
                  /month
                </p>
              )}
            </div>
          )}

          {/* Upload Error */}
          {debtUploadError && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded p-2">
              <p className="text-xs text-red-600">{debtUploadError}</p>
            </div>
          )}
        </div>

        {/* Debt Analysis Results - Mobile Optimized */}
        {hasDebtData && (
          <>
            {/* Before/After Comparison */}
            {minPaymentScenario && currentStrategy && (
              <div className="bg-white rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Before vs After Optimization
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {/* Before - Minimum Payments */}
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <div className="flex items-center mb-2">
                      <span className="text-lg mr-2">😴</span>
                      <h4 className="text-sm font-medium text-red-700">
                        Before
                      </h4>
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
                        {minPaymentScenario.total_interest_paid.toLocaleString()}{" "}
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
                        {minPaymentScenario.months_to_debt_free -
                          currentStrategy.months_to_debt_free}{" "}
                        months faster
                      </p>
                      <p className="text-xs text-green-600">
                        R
                        {(
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

            {/* Debt Summary - Compact Grid */}
            {backendAnalysis?.debt_summary && (
              <div className="bg-white rounded-lg p-4">
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

            {/* Strategy Comparison Table - Like Investment Component */}
            <div className="bg-white rounded-lg p-4">
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
                              isSelected
                                ? "text-discovery-blue"
                                : "text-gray-700"
                            }`}
                          >
                            {strategy.months_to_debt_free} months
                          </p>
                          <p className="text-xs text-gray-500">
                            R{strategy.total_interest_paid.toLocaleString()}{" "}
                            interest
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Recommendation - Compact */}
            {backendAnalysis?.recommendation && (
              <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-4 rounded-lg border border-discovery-gold/20">
                <h4 className="text-sm font-medium text-discovery-blue mb-2 flex items-center">
                  🤖 AI Recommendation
                </h4>
                <p className="text-xs text-gray-700 mb-2">
                  Use the <strong>{backendAnalysis.recommendation}</strong>{" "}
                  method. Debt-free in{" "}
                  <strong>{currentStrategy?.months_to_debt_free} months</strong>
                  .
                </p>

                {/* Payoff Order - Horizontal Scroll */}
                {currentStrategy?.payoff_order && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">
                      Payoff order:
                    </p>
                    <div className="flex space-x-1 overflow-x-auto pb-1">
                      {currentStrategy.payoff_order.map((debt, index) => (
                        <span
                          key={`${debt}-${index}`}
                          className="text-xs bg-discovery-blue/10 text-discovery-blue px-2 py-1 rounded-full whitespace-nowrap"
                        >
                          {index + 1}.{" "}
                          {debt.length > 10
                            ? debt.substring(0, 10) + "..."
                            : debt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Your Debts List - Compact */}
            {backendAnalysis?.debts_uploaded && (
              <div className="bg-white rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Your Debts
                </h4>
                <div className="space-y-2">
                  {backendAnalysis.debts_uploaded.map((debt, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">
                          {getDebtEmoji(debt.kind)}
                        </span>
                        <div>
                          <p className="text-xs font-medium text-gray-800">
                            {debt.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(debt.apr * 100).toFixed(1)}% • R
                            {debt.min_payment.toLocaleString()}/mo
                          </p>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-gray-800">
                        R{debt.balance.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

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
        {!hasRealData && !hasDebtData && (
          <div className="text-center py-8 text-gray-400">
            <span className="text-4xl opacity-50">💳</span>
            <h3 className="text-sm font-medium mt-3 mb-2">No Financial Data</h3>
            <p className="text-xs px-4">
              Upload your bank statement first to detect debt payments, then
              upload your debt statement.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Debt;
