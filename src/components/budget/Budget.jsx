import React from "react";
import {
  Wallet,
  Target,
  BarChart3,
  TrendingUp,
  DollarSign,
  Calculator,
  Sparkles,
  Trophy,
  Info,
} from "lucide-react";

const Budget = ({
  financialData,
  userProfile,
  realAnalysisResults,
  debtInvestmentSplit = null, // NEW PROP - shows investment values when split is active
}) => {
  const potentialMonthlySavings = realAnalysisResults
    ? Object.values(realAnalysisResults.suggestions).reduce(
        (sum, s) => sum + (s.potential_savings || 0),
        0
      )
    : 3500;

  const currentAvailable = realAnalysisResults
    ? realAnalysisResults.available_income
    : financialData.disposableIncome;

  const optimizedAvailable = currentAvailable + potentialMonthlySavings;

  const totalIncome = realAnalysisResults
    ? realAnalysisResults.total_income
    : financialData.totalIncome;

  // SPLIT LOGIC - Use investment budget when split is active, otherwise use normal values
  const hasActiveSplit = debtInvestmentSplit?.has_split;
  const displayAvailable = hasActiveSplit
    ? debtInvestmentSplit.investment_budget // SHOW INVESTMENT BUDGET
    : currentAvailable;
  const displayOptimized = hasActiveSplit
    ? debtInvestmentSplit.investment_budget // SHOW INVESTMENT BUDGET
    : optimizedAvailable;

  // Use backend annuity data if available
  const annuityData = realAnalysisResults?.annuity_projection;

  const scenarioData = [
    { years: 1 },
    { years: 5 },
    { years: 10 },
    { years: 15 },
    { years: 20 },
    { years: 25 },
  ];

  const formatCompactNumber = (number) => {
    if (number >= 1000000) {
      return `R${(number / 1000000).toFixed(2)}M`;
    } else if (number >= 1000) {
      return `R${(number / 1000).toFixed(0)}K`;
    }
    return `R${number.toLocaleString()}`;
  };

  const calculateCompoundGrowth = (monthlySaving, years) => {
    // Check if we have backend annuity data for current available income
    if (
      annuityData &&
      annuityData[years] &&
      monthlySaving === currentAvailable
    ) {
      const backendResult = annuityData[years];
      return {
        totalSaved: Math.round(backendResult.total_contributions),
        finalValue: Math.round(backendResult.final_value),
        interest: Math.round(backendResult.interest_earned),
      };
    }

    // Fallback to frontend calculation for optimized scenarios
    const monthlyRate = 0.08 / 12;
    const totalMonths = years * 12;
    const totalSaved = monthlySaving * totalMonths;

    if (monthlyRate === 0) {
      return { totalSaved, finalValue: totalSaved, interest: 0 };
    }

    const finalValue =
      monthlySaving * (((1 + monthlyRate) ** totalMonths - 1) / monthlyRate);
    const interest = finalValue - totalSaved;

    return {
      totalSaved: Math.round(totalSaved),
      finalValue: Math.round(finalValue),
      interest: Math.round(interest),
    };
  };

  return (
    <div className="space-y-4">
      {/* Budget Overview */}
      <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-4 rounded-lg border border-discovery-gold/20">
        <h2 className="text-sm font-bold mb-2 text-black">
          {hasActiveSplit ? "Investment Budget" : "Budget Management"}
        </h2>
        <p className="text-xs text-black mb-2">
          {hasActiveSplit
            ? "Track your allocated investment budget and growth potential"
            : "Track your spending and optimize your budget"}
        </p>
        {realAnalysisResults && (
          <div className="text-xs text-discovery-gold mb-2 flex items-center">
            <Sparkles className="w-3 h-3 mr-1" />
            Based on your real financial data analysis
          </div>
        )}

        {/* SPLIT INDICATOR */}
        {hasActiveSplit && (
          <div className="bg-discovery-gold/10 p-2 rounded-lg border border-discovery-gold/20 mb-2">
            <p className="text-xs font-medium text-discovery-gold">
              Investment Allocation:{" "}
              {(debtInvestmentSplit.investment_ratio * 100).toFixed(0)}% of
              available income
            </p>
            <p className="text-[10px] text-gray-600 mt-1">
              R{debtInvestmentSplit.investment_budget.toLocaleString()} of R
              {debtInvestmentSplit.total_available.toLocaleString()} total
              allocated to investments
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white p-2 rounded-lg border border-discovery-gold/20">
            <p className="text-xs text-black">Monthly Income</p>
            <p className="text-sm font-bold text-black">
              R{totalIncome.toLocaleString()}
            </p>
            <p className="text-[10px] text-black">Total available</p>
          </div>
          <div className="bg-white p-2 rounded-lg border border-discovery-gold/20">
            <p className="text-xs text-black">
              {hasActiveSplit ? "Investment Budget" : "Available to Save"}
            </p>
            <p className="text-sm font-bold text-black">
              R{displayAvailable.toLocaleString()}
            </p>
            <p className="text-[10px] text-black">
              {hasActiveSplit
                ? "Allocated for investments"
                : "Current savings potential"}
            </p>
          </div>
        </div>
      </div>

      {/* Optimization Summary - Only show when no split is active */}
      {potentialMonthlySavings > 0 && !hasActiveSplit && (
        <div className="bg-white p-4 rounded-lg border border-discovery-gold/20 shadow-sm">
          <h3 className="text-sm font-semibold mb-2 text-discovery-blue flex items-center">
            <Target className="w-4 h-4 mr-1 text-discovery-gold" />
            Optimization Opportunity
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 bg-discovery-blue/10 rounded-lg">
              <p className="text-xs text-gray-600">
                Potential Additional Savings
              </p>
              <p className="text-sm font-bold text-discovery-gold">
                R{potentialMonthlySavings.toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-500">per month</p>
            </div>
            <div className="text-center p-2 bg-discovery-gold/10 rounded-lg">
              <p className="text-xs text-gray-600">Optimized Monthly Savings</p>
              <p className="text-sm font-bold text-discovery-blue">
                R{optimizedAvailable.toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-500">with improvements</p>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Analysis */}
      <div className="bg-white p-4 rounded-lg border border-discovery-gold/20 shadow-sm">
        <h3 className="text-sm font-semibold mb-2 text-discovery-blue">
          {hasActiveSplit
            ? "Investment Growth Projections"
            : "Scenario Analysis"}
        </h3>
        <p className="text-xs text-gray-600 mb-2">
          See how your {hasActiveSplit ? "investment allocation" : "savings"}{" "}
          could grow over time with compound interest
        </p>
        {annuityData && !hasActiveSplit && (
          <div className="text-xs text-discovery-gold mb-2 flex items-center">
            <BarChart3 className="w-3 h-3 mr-1" />
            Calculations without using the AI optimizations
          </div>
        )}

        {/* Scenario A: Current/Investment Budget */}
        {displayAvailable > 0 && (
          <div className="mb-4">
            <div className="bg-discovery-blue/10 p-2 rounded-lg mb-2">
              <h4 className="font-semibold text-discovery-blue mb-1 text-xs">
                {hasActiveSplit
                  ? `Investment Growth: R${displayAvailable.toLocaleString()}/month`
                  : `Scenario A: Current Available Income (R${displayAvailable.toLocaleString()}/month)`}
              </h4>
              <p className="text-xs text-gray-600">
                {hasActiveSplit
                  ? "Growth potential of your strategic investment allocation"
                  : "Based on your current spending patterns"}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-discovery-gold/20">
                    <th className="text-left py-2 text-discovery-blue">
                      Years
                    </th>
                    <th className="text-right py-2 text-discovery-blue">
                      Total {hasActiveSplit ? "Invested" : "Saved"}
                    </th>
                    <th className="text-right py-2 text-discovery-blue">
                      Final Value
                    </th>
                    <th className="text-right py-2 text-discovery-blue">
                      {hasActiveSplit
                        ? "Investment Returns"
                        : "Interest Earned"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scenarioData.map((row, idx) => {
                    const { totalSaved, finalValue, interest } =
                      calculateCompoundGrowth(displayAvailable, row.years);

                    return (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-2 font-medium">{row.years}</td>
                        <td className="py-2 text-right">
                          {formatCompactNumber(totalSaved)}
                        </td>
                        <td className="py-2 text-right font-semibold text-discovery-blue">
                          {formatCompactNumber(finalValue)}
                        </td>
                        <td className="py-2 text-right text-discovery-gold">
                          {formatCompactNumber(interest)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Scenario B: Optimized Savings - only show if no split is active */}
        {potentialMonthlySavings > 0 && !hasActiveSplit && (
          <div className="mb-4">
            <div className="bg-discovery-gold/10 p-2 rounded-lg mb-2">
              <h4 className="font-semibold text-discovery-gold mb-1 text-xs">
                Scenario B: With Cost Optimizations (R
                {optimizedAvailable.toLocaleString()}/month)
              </h4>
              <p className="text-xs text-gray-600">
                If you implement the AI-suggested budget optimizations
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-discovery-gold/20">
                    <th className="text-left py-2 text-discovery-blue">
                      Years
                    </th>
                    <th className="text-right py-2 text-discovery-blue">
                      Total Saved
                    </th>
                    <th className="text-right py-2 text-discovery-blue">
                      Final Value
                    </th>
                    <th className="text-right py-2 text-discovery-blue">
                      Interest Earned
                    </th>
                    <th className="text-right py-2 text-discovery-gold">
                      Extra vs Current
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scenarioData.map((row, idx) => {
                    const optimizedResult = calculateCompoundGrowth(
                      optimizedAvailable,
                      row.years
                    );
                    const currentResult = calculateCompoundGrowth(
                      currentAvailable,
                      row.years
                    );
                    const extraValue =
                      optimizedResult.finalValue - currentResult.finalValue;

                    return (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-2 font-medium">{row.years}</td>
                        <td className="py-2 text-right">
                          R{optimizedResult.totalSaved.toLocaleString()}
                        </td>
                        <td className="py-2 text-right font-semibold text-discovery-blue">
                          R{optimizedResult.finalValue.toLocaleString()}
                        </td>
                        <td className="py-2 text-right text-discovery-gold">
                          R{optimizedResult.interest.toLocaleString()}
                        </td>
                        <td className="py-2 text-right font-semibold text-green-600">
                          +R{extraValue.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Key Insights */}
        <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-2 rounded-lg mb-2">
          <h4 className="font-semibold text-discovery-blue mb-2 flex items-center text-xs">
            <TrendingUp className="w-3 h-3 mr-1" />
            Key {hasActiveSplit ? "Investment" : ""} Insights:
          </h4>
          <div className="space-y-2 text-xs">
            {displayAvailable > 0 && (
              <>
                <div className="flex items-start px-2">
                  <div className="w-1.5 h-1.5 bg-discovery-gold rounded-full mt-1 mr-2"></div>
                  <p className="text-xs">
                    After 10 years: You'll have R
                    {calculateCompoundGrowth(
                      displayAvailable,
                      10
                    ).finalValue.toLocaleString()}{" "}
                    (R
                    {calculateCompoundGrowth(
                      displayAvailable,
                      10
                    ).interest.toLocaleString()}{" "}
                    in {hasActiveSplit ? "investment returns" : "interest"})
                  </p>
                </div>
                <div className="flex items-start px-2">
                  <div className="w-1.5 h-1.5 bg-discovery-blue rounded-full mt-1 mr-2"></div>
                  <p className="text-xs">
                    After 20 years: You'll have R
                    {calculateCompoundGrowth(
                      displayAvailable,
                      20
                    ).finalValue.toLocaleString()}{" "}
                    (R
                    {calculateCompoundGrowth(
                      displayAvailable,
                      20
                    ).interest.toLocaleString()}{" "}
                    in {hasActiveSplit ? "investment returns" : "interest"})
                  </p>
                </div>
                <div className="flex items-start px-2">
                  <div className="w-1.5 h-1.5 bg-discovery-gold rounded-full mt-1 mr-2"></div>
                  <p className="text-xs">
                    Your money grows 2.4x from year 10 to year 20 due to
                    compound {hasActiveSplit ? "returns" : "interest"}!
                  </p>
                </div>
              </>
            )}
            {hasActiveSplit && (
              <div className="flex items-start px-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1 mr-2"></div>
                <p className="text-xs">
                  <strong>Strategic Investment Allocation:</strong> This shows
                  your dedicated investment budget growth, while your debt
                  allocation is handled separately for optimal financial
                  balance.
                </p>
              </div>
            )}
            {potentialMonthlySavings > 0 && !hasActiveSplit && (
              <div className="flex items-start px-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1 mr-2"></div>
                <p className="text-xs">
                  With optimizations: Extra R
                  {(
                    calculateCompoundGrowth(optimizedAvailable, 20).finalValue -
                    calculateCompoundGrowth(currentAvailable, 20).finalValue
                  ).toLocaleString()}{" "}
                  after 20 years!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Calculation Assumptions */}
        <div className="bg-gray-50 p-2 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-1 flex items-center text-xs">
            <Calculator className="w-3 h-3 mr-1" />
            Calculation Assumptions:
          </h4>
          <div className="text-[10px] text-gray-600 space-y-1">
            <p>• 8% annual return (compounded monthly)</p>
            <p>• Fixed monthly contributions at month-end</p>
            <p>
              • No taxes considered (use TFSA or retirement annuity for tax
              benefits)
            </p>
            <p>• Returns are estimates based on historical averages</p>
            <p>
              • Inflation not factored in - consider 6% inflation for real
              returns
            </p>
            {hasActiveSplit && (
              <p>
                • Shows investment allocation growth - debt allocations handled
                separately
              </p>
            )}
            {annuityData && (
              <p>• Backend calculations ensure accuracy and consistency</p>
            )}
          </div>
        </div>
      </div>

      {/* Discovery Integration */}
      <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-4 rounded-lg border border-discovery-gold/20">
        <h3 className="text-sm font-semibold mb-2 text-discovery-blue flex items-center">
          <Trophy className="w-4 h-4 mr-1" />
          Discovery Vitality Integration
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-discovery-gold/20">
            <div>
              <p className="font-medium text-discovery-blue text-xs">
                Current Status: {userProfile.vitalityStatus}
              </p>
              <p className="text-[10px] text-gray-600">
                {hasActiveSplit ? "Investment planning" : "Budget management"}{" "}
                contributes to Vitality points
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
              {hasActiveSplit
                ? "Strategic investment planning earns Vitality points, reducing your medical aid costs by up to 25%. Your balanced debt/investment approach maximizes both financial and health benefits!"
                : "Maintaining a healthy budget earns Vitality points, reducing your medical aid costs by up to 25%"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Budget;
