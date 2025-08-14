import React, { useState, useEffect, useMemo, useRef } from "react";
import { getDebtAnalysis, getApiHealth } from "../../utils/api";
import {
  CreditCard,
  BarChart3,
  Bot,
  DollarSign,
  Home,
  Car,
  GraduationCap,
  Store,
  Wallet,
  TrendingDown,
  Target,
  Lightbulb,
  FileText,
  Sparkles,
  Upload,
  AlertTriangle,
  CheckCircle,
  Search,
  Calculator,
  Trophy,
  Info,
  RefreshCw,
} from "lucide-react";

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

      // Pass bank statement data if available
      if (realAnalysisResults) {
        formData.append(
          "bank_statement_data",
          JSON.stringify(realAnalysisResults)
        );
      }

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

      console.log("Debt upload and analysis completed:", result);
    } catch (err) {
      console.error("Debt upload error:", err);
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

    // Calculate total debt and weighted average rate
    const totalBalance = debts.reduce((sum, debt) => sum + debt.balance, 0);
    const weightedRate =
      debts.reduce((sum, debt) => sum + debt.apr * debt.balance, 0) /
      totalBalance;

    // FIXED: Proper debt payoff calculation for minimum payments only
    const monthlyRate = weightedRate / 12;

    // Use the standard debt payoff formula: months = -log(1 - (balance * rate / payment)) / log(1 + rate)
    let estimatedMonths;

    if (monthlyRate === 0) {
      // No interest case
      estimatedMonths = totalBalance / totalMinPayments;
    } else {
      // With interest - check if payment covers interest
      const monthlyInterest = totalBalance * monthlyRate;

      if (totalMinPayments <= monthlyInterest) {
        // Payments don't even cover interest - will never pay off
        estimatedMonths = 999; // Effectively infinite
      } else {
        // Standard formula: -ln(1 - (P * r / PMT)) / ln(1 + r)
        const ratio = (totalBalance * monthlyRate) / totalMinPayments;
        estimatedMonths = -Math.log(1 - ratio) / Math.log(1 + monthlyRate);
      }
    }

    // Calculate total interest paid
    const totalPaid = totalMinPayments * estimatedMonths;
    const totalInterest = totalPaid - totalBalance;

    return {
      strategy: "minimum_payments",
      months_to_debt_free: Math.ceil(estimatedMonths),
      total_interest_paid: totalInterest,
      monthly_payment: totalMinPayments,
      description: "Minimum payments only",
    };
  };

  // Helper functions
  const getDebtIcon = (type) => {
    const iconMap = {
      credit_card: <CreditCard className="w-4 h-4" />,
      personal_loan: <DollarSign className="w-4 h-4" />,
      home_loan: <Home className="w-4 h-4" />,
      car_loan: <Car className="w-4 h-4" />,
      student_loan: <GraduationCap className="w-4 h-4" />,
      store_card: <Store className="w-4 h-4" />,
      overdraft: <Wallet className="w-4 h-4" />,
      mortgage: <Home className="w-4 h-4" />,
    };
    return iconMap[type] || <CreditCard className="w-4 h-4" />;
  };

  const getDebtColor = (index) => {
    const colors = [
      "bg-discovery-gold",
      "bg-discovery-blue",
      "bg-gray-500",
      "bg-gray-600",
      "bg-gray-400",
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
        icon: <Calculator className="w-4 h-4" />,
        description: "Pay only minimum amounts",
        ...minPaymentScenario,
      };
    }

    // Add optimized strategies
    if (backendAnalysis?.avalanche) {
      strategies.avalanche = {
        name: "Avalanche Method",
        icon: <TrendingDown className="w-4 h-4" />,
        description: "Highest interest rate first",
        ...backendAnalysis.avalanche,
      };
    }

    if (backendAnalysis?.snowball) {
      strategies.snowball = {
        name: "Snowball Method",
        icon: <Target className="w-4 h-4" />,
        description: "Smallest balance first",
        ...backendAnalysis.snowball,
      };
    }

    return strategies;
  };

  const debtStrategies = getDebtStrategies();

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-4 rounded-lg border border-discovery-gold/20">
        <h2 className="text-sm font-bold mb-2 text-black">Debt Management</h2>
        <p className="text-xs text-black mb-2">
          Optimize your debt payoff strategy with AI-powered analysis
        </p>
        {realAnalysisResults && (
          <div className="text-xs text-discovery-gold mb-2 flex items-center">
            <Sparkles className="w-3 h-3 mr-1" />
            Based on your real financial data analysis
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white p-2 rounded-lg border border-discovery-gold/20">
            <p className="text-xs text-black">Available for Debt Payment</p>
            <p className="text-sm font-bold text-black">
              R{(optimizedAvailable || availableMonthly).toLocaleString()}
            </p>
            <p className="text-[10px] text-black">Monthly capacity</p>
          </div>
          <div className="bg-white p-2 rounded-lg border border-discovery-gold/20">
            <p className="text-xs text-black">Detected Payments</p>
            <p className="text-sm font-bold text-black">
              {debtPayments.length}
            </p>
            <p className="text-[10px] text-black">From transactions</p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {(loading || isUploadingDebt) && (
        <div className="bg-discovery-blue/10 rounded-lg p-2 border border-discovery-blue/20">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-discovery-blue"></div>
            <span className="text-xs text-discovery-blue">
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
        <div className="bg-white rounded-lg p-2 border border-gray-200 shadow-sm">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-discovery-gold" />
            <div>
              <p className="text-xs font-medium text-discovery-blue">
                Analysis Error
              </p>
              <p className="text-[10px] text-gray-600 mt-1">
                {error || debtUploadError}
              </p>
              <button
                onClick={() => {
                  setError(null);
                  setDebtUploadError(null);
                }}
                className="mt-1 text-[10px] bg-discovery-blue text-white px-2 py-1 rounded hover:bg-discovery-blue/90 flex items-center"
              >
                <RefreshCw className="w-2 h-2 mr-1" />
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debt Upload Section */}
      <div className="bg-white p-4 rounded-lg border-2 border-dashed border-discovery-gold/30">
        <div className="text-center">
          {isUploadingDebt ? (
            <div className="py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-discovery-gold mb-2"></div>
              <h3 className="text-sm font-semibold mb-1 text-discovery-blue">
                Analyzing Debt Statement...
              </h3>
              <p className="text-xs text-gray-600">
                Processing debt information and calculating optimal payoff
                strategies
              </p>
              <p className="text-[10px] text-discovery-blue mt-1">
                Using R
                {(optimizedAvailable || availableMonthly).toLocaleString()}{" "}
                available monthly
              </p>
            </div>
          ) : (
            <>
              <div className="mx-auto mb-2 text-discovery-gold">
                <CreditCard className="w-8 h-8 text-discovery-gold mx-auto" />
              </div>
              <h3 className="text-sm font-semibold mb-1 text-discovery-blue">
                {hasDebtData
                  ? "Upload New Debt Statement"
                  : "Upload Debt Statement"}
              </h3>
              <p className="text-xs text-gray-600 mb-2">
                {hasDebtData
                  ? "Analyze different debt information (CSV format)"
                  : debtPayments.length > 0
                  ? "Complete your debt analysis with detailed information"
                  : "Get AI-powered debt optimization strategies"}
              </p>

              <label className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-discovery-gold to-discovery-blue text-white text-xs rounded-lg cursor-pointer hover:from-discovery-gold/90 hover:to-discovery-blue/90 transition-colors">
                <Search className="w-3 h-3 mr-1" />
                Choose Debt CSV File
                <input
                  type="file"
                  className="hidden"
                  accept=".csv"
                  onChange={handleDebtUpload}
                  disabled={isUploadingDebt}
                />
              </label>

              <div className="mt-2 space-y-1">
                <p className="text-[10px] text-gray-500">
                  CSV format only • Your data is encrypted and secure
                </p>
                {(optimizedAvailable || availableMonthly) > 0 && (
                  <p className="text-[10px] text-discovery-blue font-medium">
                    Available for debt payments: R
                    {(optimizedAvailable || availableMonthly).toLocaleString()}
                    /month
                  </p>
                )}
                <div className="flex justify-center space-x-4 text-[10px] text-gray-400">
                  <span className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-discovery-gold rounded-full mr-1"></span>
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
        <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 rounded-lg p-2 border border-discovery-gold/20">
          <div className="flex items-start space-x-2">
            <Bot className="w-4 h-4 text-discovery-blue" />
            <div className="flex-1">
              <h3 className="text-xs font-semibold text-discovery-blue mb-1">
                AI Detected Debt Payments
                {enhancedMode && (
                  <span className="ml-1 text-[10px] bg-discovery-blue/10 text-discovery-blue px-1 py-0.5 rounded-full">
                    Enhanced Detection
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-gray-600 mb-2">
                I've analyzed your transactions and found {debtPayments.length}{" "}
                debt payments. Upload your debt statement for complete
                optimization analysis.
              </p>
              <div className="grid grid-cols-1 gap-1">
                {debtPayments.map((debt, idx) => (
                  <div
                    key={idx}
                    className="bg-white/80 rounded p-1.5 flex items-center justify-between border border-discovery-gold/20"
                  >
                    <div className="flex items-center space-x-1">
                      {getDebtIcon(debt.kind)}
                      <span className="text-[10px] font-medium text-gray-700">
                        {debt.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-discovery-blue">
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
            <div className="bg-white rounded-lg p-2 shadow-sm border border-discovery-gold/20">
              <h3 className="text-xs font-semibold text-discovery-blue mb-2">
                Before vs After Optimization
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {/* Before - Minimum Payments */}
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-1">
                    <Calculator className="w-4 h-4 mr-1 text-gray-600" />
                    <h4 className="text-xs font-medium text-gray-700">
                      Before
                    </h4>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-gray-600">
                      Minimum payments only
                    </p>
                    <p className="text-xs font-bold text-gray-700">
                      {minPaymentScenario.months_to_debt_free} months
                    </p>
                    <p className="text-[10px] text-gray-500">
                      R
                      {Math.abs(
                        minPaymentScenario.total_interest_paid
                      ).toLocaleString()}{" "}
                      interest
                    </p>
                  </div>
                </div>

                {/* After - Optimized */}
                <div className="bg-discovery-gold/10 p-2 rounded-lg border border-discovery-gold/20">
                  <div className="flex items-center mb-1">
                    {selectedStrategy === "avalanche" ? (
                      <TrendingDown className="w-4 h-4 mr-1 text-discovery-gold" />
                    ) : (
                      <Target className="w-4 h-4 mr-1 text-discovery-gold" />
                    )}
                    <h4 className="text-xs font-medium text-discovery-gold">
                      After
                    </h4>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-gray-600">
                      {selectedStrategy} method
                    </p>
                    <p className="text-xs font-bold text-discovery-gold">
                      {currentStrategy.months_to_debt_free} months
                    </p>
                    <p className="text-[10px] text-discovery-blue">
                      R{currentStrategy.total_interest_paid.toLocaleString()}{" "}
                      interest
                    </p>
                  </div>
                </div>
              </div>

              {/* Savings Summary */}
              <div className="text-center mt-2">
                {(() => {
                  const monthsDiff =
                    minPaymentScenario.months_to_debt_free -
                    currentStrategy.months_to_debt_free;
                  const interestDiff =
                    minPaymentScenario.total_interest_paid -
                    currentStrategy.total_interest_paid;

                  return (
                    <>
                      <p className="text-xs font-bold text-discovery-blue">
                        {monthsDiff > 0
                          ? `${monthsDiff} months faster`
                          : monthsDiff < 0
                          ? `${Math.abs(monthsDiff)} months slower`
                          : "Same timeline"}
                      </p>
                      <p className="text-[10px] text-discovery-gold">
                        {interestDiff > 0
                          ? `R${interestDiff.toLocaleString()} saved`
                          : `R${Math.abs(
                              interestDiff
                            ).toLocaleString()} extra cost`}
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Debt Summary */}
          {backendAnalysis?.debt_summary && (
            <div className="bg-white rounded-lg p-2 shadow-sm border border-discovery-gold/20">
              <h3 className="text-xs font-semibold text-discovery-blue mb-2">
                Debt Summary
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-discovery-gold/10 p-2 rounded-lg border border-discovery-gold/20">
                  <p className="text-[10px] text-gray-600">Total Balance</p>
                  <p className="text-xs font-bold text-discovery-blue">
                    R
                    {backendAnalysis.debt_summary.total_balance.toLocaleString()}
                  </p>
                </div>
                <div className="bg-discovery-blue/10 p-2 rounded-lg border border-discovery-blue/20">
                  <p className="text-[10px] text-gray-600">Monthly Payments</p>
                  <p className="text-xs font-bold text-discovery-gold">
                    R
                    {backendAnalysis.debt_summary.total_min_payments.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Strategy Comparison Table */}
          <div className="bg-white rounded-lg p-2 shadow-sm border border-discovery-gold/20">
            <h3 className="text-xs font-semibold text-discovery-blue mb-2">
              Strategy Comparison
            </h3>

            <div className="space-y-1">
              {Object.entries(debtStrategies).map(([key, strategy]) => {
                const isSelected = key === selectedStrategy;
                const isRecommended = key === backendAnalysis?.recommendation;

                return (
                  <div
                    key={key}
                    className={`rounded-lg p-2 border cursor-pointer transition-all ${
                      isSelected
                        ? "border-discovery-blue bg-discovery-blue/10"
                        : "border-gray-200 hover:border-discovery-gold/50"
                    }`}
                    onClick={() => setSelectedStrategy(key)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {strategy.icon}
                        <div>
                          <div className="flex items-center gap-1">
                            <p
                              className={`text-[10px] font-medium ${
                                isSelected
                                  ? "text-discovery-blue"
                                  : "text-gray-700"
                              }`}
                            >
                              {strategy.name}
                            </p>
                            {isRecommended && (
                              <span className="text-[10px] bg-discovery-gold/20 text-discovery-gold px-1 py-0.5 rounded-full">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500">
                            {strategy.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-xs font-bold ${
                            isSelected ? "text-discovery-blue" : "text-gray-700"
                          }`}
                        >
                          {strategy.months_to_debt_free} months
                        </p>
                        <p className="text-[10px] text-gray-500">
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
            <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-2 rounded-lg border border-discovery-gold/20">
              <h4 className="text-xs font-medium text-discovery-blue mb-1 flex items-center">
                <Bot className="w-3 h-3 mr-1" />
                AI Recommendation
                {enhancedMode && (
                  <span className="ml-1 text-[10px] bg-discovery-blue/10 text-discovery-blue px-1 py-0.5 rounded-full">
                    Enhanced Analysis
                  </span>
                )}
              </h4>
              <p className="text-[10px] text-gray-700 mb-1">
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
                <div className="mt-2">
                  <p className="text-[10px] font-medium text-gray-700 mb-1">
                    Optimal payoff order:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {currentStrategy.payoff_order.map((debt, index) => (
                      <span
                        key={`${debt}-${index}`}
                        className="text-[10px] bg-white/80 text-discovery-blue px-1 py-0.5 rounded-full border border-discovery-blue/20"
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
            <div className="bg-white rounded-lg p-2 shadow-sm border border-discovery-gold/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-discovery-blue">
                  Your Debts
                </h3>
                <button
                  onClick={() => setShowAddDebt(!showAddDebt)}
                  className="text-discovery-gold text-[10px] font-medium hover:text-discovery-gold/80"
                >
                  + Add Debt
                </button>
              </div>

              {/* Add Debt Form */}
              {showAddDebt && (
                <div className="bg-gray-50 rounded-lg p-2 mb-2 space-y-1 border border-gray-200">
                  <input
                    type="text"
                    placeholder="Debt name"
                    value={newDebt.name}
                    onChange={(e) =>
                      setNewDebt({ ...newDebt, name: e.target.value })
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded-lg text-[10px] focus:border-discovery-blue focus:outline-none"
                  />
                  <select
                    value={newDebt.type}
                    onChange={(e) =>
                      setNewDebt({ ...newDebt, type: e.target.value })
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded-lg text-[10px] focus:border-discovery-blue focus:outline-none"
                  >
                    <option value="credit_card">Credit Card</option>
                    <option value="personal_loan">Personal Loan</option>
                    <option value="home_loan">Home Loan</option>
                    <option value="car_loan">Car Loan</option>
                    <option value="student_loan">Student Loan</option>
                    <option value="store_card">Store Card</option>
                    <option value="overdraft">Overdraft</option>
                  </select>
                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="number"
                      placeholder="Balance"
                      value={newDebt.balance}
                      onChange={(e) =>
                        setNewDebt({ ...newDebt, balance: e.target.value })
                      }
                      className="px-1 py-1 border border-gray-300 rounded-lg text-[10px] focus:border-discovery-blue focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Rate %"
                      value={newDebt.interestRate}
                      onChange={(e) =>
                        setNewDebt({ ...newDebt, interestRate: e.target.value })
                      }
                      className="px-1 py-1 border border-gray-300 rounded-lg text-[10px] focus:border-discovery-blue focus:outline-none"
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
                      className="px-1 py-1 border border-gray-300 rounded-lg text-[10px] focus:border-discovery-blue focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={handleAddDebt}
                      className="flex-1 bg-discovery-blue text-white px-2 py-1 rounded-lg text-[10px] hover:bg-discovery-blue/90"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowAddDebt(false)}
                      className="flex-1 bg-gray-200 text-gray-700 px-2 py-1 rounded-lg text-[10px] hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1">
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
                      className="border border-gray-200 rounded-lg p-2 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2">
                          <div
                            className={`${getDebtColor(
                              index
                            )} p-1 rounded-lg flex items-center justify-center`}
                          >
                            <div className="text-white">
                              {getDebtIcon(debt.kind)}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-1">
                              <p className="font-medium text-[10px] text-discovery-blue">
                                {debt.name}
                              </p>
                              {currentStrategy?.payoff_order?.includes(
                                debt.name
                              ) && (
                                <span className="bg-discovery-gold/20 text-discovery-gold text-[10px] px-1 py-0.5 rounded-full">
                                  #
                                  {currentStrategy.payoff_order.indexOf(
                                    debt.name
                                  ) + 1}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              R{Number(debt.balance).toLocaleString()} at{" "}
                              {(debt.apr * 100).toFixed(1)}%
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <div>
                                <p className="text-[10px] text-gray-400">
                                  Monthly
                                </p>
                                <p className="text-[10px] font-medium">
                                  R{Number(debt.min_payment).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-400">
                                  Payoff in
                                </p>
                                <p className="text-[10px] font-medium">
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
        <div className="bg-gradient-to-r from-discovery-blue/10 to-discovery-gold/10 p-2 rounded-lg border border-discovery-blue/20">
          <h3 className="text-xs font-semibold text-discovery-blue mb-1 flex items-center">
            <DollarSign className="w-4 h-4 mr-1" />
            Budget Integration
            {enhancedMode && (
              <span className="ml-1 text-[10px] bg-discovery-blue/10 text-discovery-blue px-1 py-0.5 rounded-full">
                Enhanced
              </span>
            )}
          </h3>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-white/80 rounded p-1 border border-discovery-blue/20">
              <p className="text-gray-600">Available for Debt Payment</p>
              <p className="text-sm font-bold text-discovery-blue">
                R{Number(availableMonthly).toLocaleString()}
              </p>
            </div>
            <div className="bg-white/80 rounded p-1 border border-discovery-gold/20">
              <p className="text-gray-600">With Optimizations</p>
              <p className="text-sm font-bold text-discovery-gold">
                R{Number(optimizedAvailable).toLocaleString()}
              </p>
            </div>
          </div>
          {enhancedMode && (
            <p className="text-[10px] text-discovery-blue mt-1">
              Enhanced analysis preserves essential expenses while maximizing
              debt payment capacity
            </p>
          )}
        </div>
      )}

      {/* Smart Debt Tips Section */}
      <div className="bg-white rounded-lg p-2 shadow-sm border border-discovery-gold/20">
        <h3 className="text-xs font-semibold text-discovery-blue mb-2 flex items-center">
          <Lightbulb className="w-3 h-3 mr-1" />
          Smart Debt Tips
          {enhancedMode && (
            <span className="ml-1 text-[10px] bg-discovery-blue/10 text-discovery-blue px-1 py-0.5 rounded-full">
              Enhanced
            </span>
          )}
        </h3>
        <div className="space-y-1">
          <div className="flex items-start space-x-1">
            <span className="text-[10px] text-discovery-gold mt-0.5">▸</span>
            <p className="text-[10px] text-gray-600">
              Always pay more than minimum on high-interest debts
            </p>
          </div>
          <div className="flex items-start space-x-1">
            <span className="text-[10px] text-discovery-gold mt-0.5">▸</span>
            <p className="text-[10px] text-gray-600">
              Consider consolidating multiple high-interest debts
            </p>
          </div>
          <div className="flex items-start space-x-1">
            <span className="text-[10px] text-discovery-gold mt-0.5">▸</span>
            <p className="text-[10px] text-gray-600">
              Build emergency fund while paying off debt (3-month minimum)
            </p>
          </div>
          <div className="flex items-start space-x-1">
            <span className="text-[10px] text-discovery-gold mt-0.5">▸</span>
            <p className="text-[10px] text-gray-600">
              Use the avalanche method for maximum interest savings
            </p>
          </div>
          {enhancedMode && (
            <div className="flex items-start space-x-1 bg-discovery-blue/10 p-1 rounded mt-1 border border-discovery-blue/20">
              <Sparkles className="w-3 h-3 text-discovery-blue mt-0.5" />
              <p className="text-[10px] text-discovery-blue">
                <strong>Enhanced Analysis:</strong> Statistical modeling
                considers your specific financial patterns for optimal debt
                management strategies.
              </p>
            </div>
          )}
          {backendAnalysis?.recommendation && (
            <div className="flex items-start space-x-1 bg-discovery-gold/10 p-1 rounded mt-1 border border-discovery-gold/20">
              <Bot className="w-3 h-3 text-discovery-gold mt-0.5" />
              <p className="text-[10px] text-discovery-gold">
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

      {/* Discovery Vitality Integration */}
      <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-4 rounded-lg border border-discovery-gold/20">
        <h3 className="text-sm font-semibold mb-2 text-discovery-blue flex items-center">
          <Trophy className="w-4 h-4 mr-1" />
          Discovery Vitality Integration
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-discovery-gold/20">
            <div>
              <p className="font-medium text-discovery-blue text-xs">
                Current Status: {userProfile?.vitalityStatus || "Active"}
              </p>
              <p className="text-[10px] text-gray-600">
                Debt management contributes to Vitality points
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-discovery-gold">+500 points</p>
              <p className="text-[10px] text-gray-400">This month</p>
            </div>
          </div>

          <div className="p-2 bg-white rounded-lg border border-discovery-gold/20">
            <p className="font-medium text-xs text-discovery-blue flex items-center">
              <Info className="w-3 h-3 mr-1" />
              Vitality Benefit
            </p>
            <p className="text-[10px] text-gray-600">
              Effective debt management earns Vitality points, reducing your
              medical aid costs by up to 25%
            </p>
          </div>
        </div>
      </div>

      {/* CSV Format Guide - Collapsible */}
      <div className="bg-gray-50 rounded-lg border border-gray-200">
        <details className="p-2">
          <summary className="text-[10px] font-medium text-discovery-blue cursor-pointer flex items-center">
            <FileText className="w-3 h-3 mr-1" />
            CSV Format Guide
          </summary>
          <div className="mt-1 space-y-1">
            <p className="text-[10px] text-gray-600">Required columns:</p>
            <div className="text-[10px] text-gray-500 space-y-0.5">
              <p>• name, balance, apr, min_payment, kind</p>
            </div>
            <div className="bg-white p-1 rounded border text-[10px]">
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
        <div className="text-center py-6 text-gray-400">
          <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs mt-1">
            {debtPayments.length > 0
              ? "Debt payments detected - upload debt statement above"
              : backendAnalysis
              ? "Sample debt analysis available"
              : "No debts added yet"}
          </p>
          <p className="text-[10px] mt-0.5">
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
