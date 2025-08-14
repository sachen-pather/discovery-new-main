import React from "react";
import {
  Heart,
  Award,
  Trophy,
  Star,
  Activity,
  DollarSign,
  ShoppingCart,
  Pill,
  TrendingUp,
  Target,
  Info,
  Lightbulb,
  Sparkles,
  Coffee,
  Smartphone,
  ArrowRight,
} from "lucide-react";

const Vitality = ({
  userProfile = {},
  realAnalysisResults,
  financialData = {},
}) => {
  // Discovery Vitality System Configuration
  const VITALITY_POINTS_ACTIVITIES = {
    health_check: 5000,
    vitality_age_assessment: 2500,
    biometric_screening: 2500,
    dental_checkup: 1000,
    eye_test: 1000,
    blood_pressure_check: 500,
    cholesterol_test: 1000,
    glucose_test: 1000,
    fitness_assessment: 2000,
    nutritional_assessment: 1500,
  };

  const FITNESS_POINTS = {
    gym_session: 100,
    steps_daily: 100,
    heart_rate_exercise: 200,
  };

  const STATUS_TIERS = [
    {
      name: "Blue",
      threshold: 0,
      color: "text-discovery-blue",
      bgColor: "bg-discovery-blue/10",
    },
    {
      name: "Bronze",
      threshold: 2500,
      color: "text-discovery-gold",
      bgColor: "bg-discovery-gold/10",
    },
    {
      name: "Silver",
      threshold: 7500,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
    {
      name: "Gold",
      threshold: 15000,
      color: "text-discovery-gold",
      bgColor: "bg-discovery-gold/20",
    },
    {
      name: "Diamond",
      threshold: 25000,
      color: "text-discovery-blue",
      bgColor: "bg-discovery-blue/20",
    },
  ];

  const HEALTHYFOOD_CASHBACK = {
    Blue: 0.05,
    Bronze: 0.1,
    Silver: 0.15,
    Gold: 0.2,
    Diamond: 0.25,
  };

  const HEALTHYCARE_CASHBACK = {
    Blue: 0.1,
    Bronze: 0.15,
    Silver: 0.2,
    Gold: 0.25,
    Diamond: 0.25,
  };

  // Get real spending data from uploaded analysis
  const getSpendingData = () => {
    if (realAnalysisResults && realAnalysisResults.category_breakdown) {
      return Object.entries(realAnalysisResults.category_breakdown)
        .filter(([_, data]) => data.amount > 0)
        .map(([name, data]) => ({
          name,
          amount: data.amount,
          percentage: data.percentage,
          count: data.count,
          suggestions:
            realAnalysisResults.suggestions?.[name]?.suggestions || [],
          potential_savings:
            realAnalysisResults.suggestions?.[name]?.potential_savings || 0,
        }))
        .sort((a, b) => b.amount - a.amount);
    } else if (financialData.categories) {
      return financialData.categories;
    }
    return [];
  };

  // Use actual user profile for Vitality status
  const getCurrentVitalityStatus = () => {
    // If user profile has vitality status, use it
    if (userProfile.vitalityStatus) {
      return (
        STATUS_TIERS.find(
          (tier) =>
            tier.name.toLowerCase() === userProfile.vitalityStatus.toLowerCase()
        ) || STATUS_TIERS[1]
      ); // Default to Bronze if not found
    }

    // Otherwise estimate based on user profile data
    let estimatedPoints = 0;

    // Basic activities (most people do these)
    estimatedPoints += VITALITY_POINTS_ACTIVITIES.health_check;
    estimatedPoints += VITALITY_POINTS_ACTIVITIES.vitality_age_assessment;

    // Age-based assumptions
    if (userProfile.age && userProfile.age > 35) {
      estimatedPoints += VITALITY_POINTS_ACTIVITIES.blood_pressure_check;
      estimatedPoints += VITALITY_POINTS_ACTIVITIES.cholesterol_test;
    }

    // Risk tolerance suggests health consciousness
    if (userProfile.riskTolerance === "conservative") {
      estimatedPoints += VITALITY_POINTS_ACTIVITIES.biometric_screening;
      estimatedPoints += 2 * FITNESS_POINTS.gym_session * 52; // 2x/week gym
    } else if (userProfile.riskTolerance === "moderate") {
      estimatedPoints += 3 * FITNESS_POINTS.gym_session * 52; // 3x/week gym
    } else {
      estimatedPoints += 4 * FITNESS_POINTS.gym_session * 52; // 4x/week gym
    }

    return determineStatus(estimatedPoints);
  };

  // Determine status based on points
  const determineStatus = (points) => {
    let currentStatus = STATUS_TIERS[0];
    for (const tier of STATUS_TIERS) {
      if (points >= tier.threshold) {
        currentStatus = tier;
      }
    }
    return currentStatus;
  };

  // Calculate Discovery Miles from real spending data
  const calculateDiscoveryMiles = (spendingData, status) => {
    const milesBreakdown = {};
    let totalMiles = 0;

    if (!spendingData || spendingData.length === 0)
      return { totalMiles, milesBreakdown };

    // Process groceries for HealthyFood cashback
    const groceryCategory = spendingData.find(
      (cat) => cat.name === "Groceries"
    );
    if (groceryCategory && groceryCategory.amount > 0) {
      // Estimate 25-35% of grocery spending is on healthy items
      const healthyEstimate = 0.3;
      const qualifyingSpend = Math.min(
        groceryCategory.amount * healthyEstimate,
        2500
      ); // R2500 monthly limit
      const cashbackRate = HEALTHYFOOD_CASHBACK[status.name];
      const miles = qualifyingSpend * cashbackRate;

      milesBreakdown["Groceries"] = {
        totalSpend: groceryCategory.amount,
        qualifyingSpend: qualifyingSpend,
        milesEarned: miles,
        transactionCount: groceryCategory.count,
        description: `${(cashbackRate * 100).toFixed(
          0
        )}% back on healthy groceries`,
        suggestions: groceryCategory.suggestions || [],
      };
      totalMiles += miles;
    }

    // Process medical/pharmacy spending for HealthyCare cashback
    const healthCategories = [
      "Medical",
      "Healthcare",
      "Pharmacy",
      "Subscriptions",
    ];
    healthCategories.forEach((categoryName) => {
      const category = spendingData.find((cat) => cat.name === categoryName);
      if (category && category.amount > 0) {
        // For subscriptions, only count medical aid/health insurance
        let qualifyingSpend = category.amount;
        if (categoryName === "Subscriptions") {
          qualifyingSpend = category.amount * 0.3; // Estimate 30% is health-related
        }

        const cashbackRate = HEALTHYCARE_CASHBACK[status.name];
        const miles = qualifyingSpend * cashbackRate;

        milesBreakdown[categoryName] = {
          totalSpend: category.amount,
          qualifyingSpend: qualifyingSpend,
          milesEarned: miles,
          transactionCount: category.count,
          description: `${(cashbackRate * 100).toFixed(
            0
          )}% back on health products`,
          suggestions: category.suggestions || [],
        };
        totalMiles += miles;
      }
    });

    return { totalMiles, milesBreakdown };
  };

  // Generate spending optimizations based on real data
  const generateSpendingOptimizations = (spendingData, currentStatus) => {
    const suggestions = [];

    if (!spendingData || spendingData.length === 0) return suggestions;

    // Find dining out and entertainment spending
    const diningOut = spendingData.find((cat) => cat.name === "Dining Out");
    const groceries = spendingData.find((cat) => cat.name === "Groceries");

    if (diningOut && groceries && diningOut.amount > 500) {
      const shiftAmount = Math.min(diningOut.amount * 0.25, 750); // Shift 25% or max R750
      const currentGroceryMiles =
        groceries.amount * 0.3 * HEALTHYFOOD_CASHBACK[currentStatus.name];
      const newGroceryMiles =
        (groceries.amount + shiftAmount) *
        0.3 *
        HEALTHYFOOD_CASHBACK[currentStatus.name];
      const milesGain = newGroceryMiles - currentGroceryMiles;

      suggestions.push({
        action: `Reduce dining out by R${shiftAmount.toFixed(
          0
        )}, cook more at home`,
        benefit: `Earn extra R${milesGain.toFixed(
          0
        )} Discovery Miles + save on potential costs`,
        explanation: `You spend R${diningOut.amount.toLocaleString()} on dining out. Cooking healthy meals earns cashback.`,
        category: "Spending Optimization",
        currentSpend: diningOut.amount,
        potentialSavings: shiftAmount * 0.7, // Cooking costs ~30% of dining out
      });
    }

    // Subscription optimization for health benefits
    const subscriptions = spendingData.find(
      (cat) => cat.name === "Subscriptions"
    );
    if (subscriptions && subscriptions.amount > 1000) {
      suggestions.push({
        action: "Review subscriptions, prioritize health & fitness apps",
        benefit: `Keep R${(
          subscriptions.amount *
          0.3 *
          HEALTHYCARE_CASHBACK[currentStatus.name]
        ).toFixed(0)} monthly cashback on health subscriptions`,
        explanation: `You spend R${subscriptions.amount.toLocaleString()} on subscriptions. Health-related ones earn Discovery Miles.`,
        category: "Partner Benefits",
        currentSpend: subscriptions.amount,
        potentialSavings: subscriptions.potential_savings || 0,
      });
    }

    // Suggest using Discovery partners based on real spending
    const totalHealthSpend = spendingData
      .filter((cat) =>
        ["Groceries", "Medical", "Healthcare", "Pharmacy"].includes(cat.name)
      )
      .reduce((sum, cat) => sum + cat.amount, 0);

    if (totalHealthSpend > 0) {
      suggestions.push({
        action: "Shop at Discovery partners (Clicks, Dis-Chem, Pick n Pay)",
        benefit: `Maximize your R${totalHealthSpend.toLocaleString()} monthly health spending for ${(
          HEALTHYCARE_CASHBACK[currentStatus.name] * 100
        ).toFixed(0)}% cashback`,
        explanation:
          "Use Discovery partners for vitamins, supplements, and groceries to earn maximum Miles",
        category: "Partner Benefits",
        currentSpend: totalHealthSpend,
        potentialSavings: 0,
      });
    }

    return suggestions;
  };

  // Calculate potential status improvement
  const calculateStatusImprovement = (currentStatus) => {
    const nextTierIndex =
      STATUS_TIERS.findIndex((tier) => tier.name === currentStatus.name) + 1;
    if (nextTierIndex >= STATUS_TIERS.length) return null;

    const nextTier = STATUS_TIERS[nextTierIndex];
    const pointsNeeded = nextTier.threshold - (currentStatus.threshold || 0);

    const improvements = [
      {
        action: "Complete annual health screening",
        points: VITALITY_POINTS_ACTIVITIES.health_check,
        category: "Health Activities",
        description: "Essential annual check-up",
      },
      {
        action: "Complete dental checkup",
        points: VITALITY_POINTS_ACTIVITIES.dental_checkup,
        category: "Health Activities",
        description: "Six-monthly dental visit",
      },
      {
        action: "Get eye test",
        points: VITALITY_POINTS_ACTIVITIES.eye_test,
        category: "Health Activities",
        description: "Annual eye examination",
      },
      {
        action: "Increase gym visits to 4x per week",
        points: FITNESS_POINTS.gym_session * 52, // +1 session per week
        category: "Fitness",
        description: "Additional weekly gym session",
      },
      {
        action: "Complete biometric screening",
        points: VITALITY_POINTS_ACTIVITIES.biometric_screening,
        category: "Health Activities",
        description: "Blood pressure, cholesterol, glucose tests",
      },
    ];

    return {
      nextTier,
      pointsNeeded,
      improvements: improvements.slice(0, 4), // Show top 4 realistic improvements
    };
  };

  // Calculate everything with real data
  const spendingData = getSpendingData();
  const currentStatus = getCurrentVitalityStatus();
  const { totalMiles, milesBreakdown } = calculateDiscoveryMiles(
    spendingData,
    currentStatus
  );
  const spendingOptimizations = generateSpendingOptimizations(
    spendingData,
    currentStatus
  );
  const statusImprovement = calculateStatusImprovement(currentStatus);

  // Calculate total spending for context
  const totalMonthlySpending = spendingData.reduce(
    (sum, cat) => sum + cat.amount,
    0
  );
  const totalQualifyingSpend = Object.values(milesBreakdown).reduce(
    (sum, breakdown) => sum + breakdown.qualifyingSpend,
    0
  );

  // Enhanced mode indicator
  const enhancedMode = realAnalysisResults?.enhanced_mode;

  return (
    <div className="space-y-4">
      {/* Vitality Status Overview */}
      <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-4 rounded-lg border border-discovery-gold/20">
        <h2 className="text-sm font-bold mb-2 text-discovery-blue">
          Discovery Vitality Status
        </h2>
        <p className="text-xs text-gray-600 mb-2">
          Earn points through health activities & fitness to unlock rewards
        </p>
        {enhancedMode && (
          <div className="text-xs text-discovery-gold mb-2 flex items-center">
            <Sparkles className="w-3 h-3 mr-1" />
            Based on your real financial data analysis
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white p-2 rounded-lg border border-discovery-gold/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Current Status</span>
              <span
                className={`px-1 py-1 rounded-full text-[10px] font-semibold ${currentStatus.bgColor} ${currentStatus.color}`}
              >
                {currentStatus.name}
              </span>
            </div>
            <p className="text-sm font-bold text-discovery-blue">
              {userProfile.vitalityStatus || "Estimated"}
            </p>
            <p className="text-[10px] text-gray-500">
              {userProfile.vitalityStatus
                ? "Your current tier"
                : "Based on profile"}
            </p>
          </div>

          <div className="bg-white p-2 rounded-lg border border-discovery-gold/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Discovery Miles</span>
              <span className="text-[10px] bg-discovery-gold/20 text-discovery-gold px-1 py-1 rounded">
                Monthly
              </span>
            </div>
            <p className="text-sm font-bold text-discovery-gold">
              R{totalMiles.toFixed(0)}
            </p>
            <p className="text-[10px] text-gray-500">
              From your actual spending
            </p>
          </div>
        </div>
      </div>

      {/* Discovery Miles from Real Spending */}
      <div className="bg-white p-2 rounded-lg border border-discovery-gold/20 shadow-sm">
        <h3 className="text-xs font-semibold mb-2 text-discovery-blue flex items-center">
          <DollarSign className="w-3 h-3 mr-1 text-discovery-gold" />
          Discovery Miles from Your Spending
        </h3>

        <div className="mb-2 p-2 bg-discovery-gold/10 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-discovery-gold text-xs">
                Monthly Discovery Miles: R{totalMiles.toFixed(0)}
              </p>
              <p className="text-[10px] text-gray-600">
                From R{totalQualifyingSpend.toFixed(0)} qualifying spend of R
                {totalMonthlySpending.toLocaleString()} total
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-discovery-blue">
                {totalQualifyingSpend > 0
                  ? ((totalMiles / totalQualifyingSpend) * 100).toFixed(1)
                  : 0}
                %
              </p>
              <p className="text-[10px] text-gray-500">cashback rate</p>
            </div>
          </div>
        </div>

        {Object.keys(milesBreakdown).length > 0 ? (
          <div className="space-y-1">
            {Object.entries(milesBreakdown).map(([category, details]) => (
              <div
                key={category}
                className="p-1 border border-discovery-gold/20 rounded-lg"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-discovery-blue flex items-center text-[10px]">
                    {category === "Groceries" ? (
                      <ShoppingCart className="w-2 h-2 mr-1" />
                    ) : (
                      <Pill className="w-2 h-2 mr-1" />
                    )}
                    {category}
                    <span className="ml-1 text-gray-500">
                      ({details.transactionCount} transactions)
                    </span>
                  </span>
                  <span className="text-discovery-gold font-bold text-[10px]">
                    R{details.milesEarned.toFixed(0)}
                  </span>
                </div>
                <div className="text-[10px] text-gray-600 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Total spent: R{details.totalSpend.toFixed(0)}</span>
                    <span>
                      Qualifying: R{details.qualifyingSpend.toFixed(0)}
                    </span>
                  </div>
                  <p className="text-discovery-gold">{details.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-2 text-gray-500 text-xs">
            <p>No qualifying health-related spending detected</p>
            <p className="text-[10px]">
              Shop at Discovery partners for cashback rewards
            </p>
          </div>
        )}
      </div>

      {/* Real Spending Breakdown with Discovery Benefits */}
      <div className="bg-white p-2 rounded-lg border border-discovery-gold/20 shadow-sm">
        <h3 className="text-xs font-semibold mb-2 text-discovery-blue flex items-center">
          <Target className="w-3 h-3 mr-1 text-discovery-gold" />
          Your Spending & Discovery Benefits
        </h3>

        <div className="space-y-1">
          {spendingData.length > 0 ? (
            spendingData.slice(0, 8).map((category, idx) => {
              const hasDiscoveryBenefit = [
                "Groceries",
                "Medical",
                "Healthcare",
                "Pharmacy",
              ].includes(category.name);

              const isPartialBenefit = category.name === "Subscriptions";

              return (
                <div
                  key={idx}
                  className={`p-1 rounded-lg border ${
                    hasDiscoveryBenefit
                      ? "border-discovery-gold/30 bg-discovery-gold/5"
                      : isPartialBenefit
                      ? "border-discovery-blue/30 bg-discovery-blue/5"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-discovery-blue flex items-center text-[10px]">
                          {category.name === "Groceries" ? (
                            <ShoppingCart className="w-2 h-2 mr-1" />
                          ) : category.name === "Dining Out" ? (
                            <Coffee className="w-2 h-2 mr-1" />
                          ) : category.name === "Subscriptions" ? (
                            <Smartphone className="w-2 h-2 mr-1" />
                          ) : hasDiscoveryBenefit ? (
                            <Pill className="w-2 h-2 mr-1" />
                          ) : (
                            <DollarSign className="w-2 h-2 mr-1" />
                          )}
                          {category.name}
                          <span className="ml-1 text-gray-500">
                            ({category.count})
                          </span>
                        </span>
                        <span className="font-bold text-discovery-blue text-[10px]">
                          R{category.amount.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-600 mt-0.5">
                        {hasDiscoveryBenefit
                          ? category.name === "Groceries"
                            ? `Healthy items: ~R${(
                                category.amount * 0.3
                              ).toFixed(0)} (${(
                                HEALTHYFOOD_CASHBACK[currentStatus.name] * 100
                              ).toFixed(0)}% cashback)`
                            : `Health products: ${(
                                HEALTHYCARE_CASHBACK[currentStatus.name] * 100
                              ).toFixed(0)}% cashback available`
                          : isPartialBenefit
                          ? `Health subscriptions: ~R${(
                              category.amount * 0.3
                            ).toFixed(0)} eligible for cashback`
                          : category.potential_savings > 0
                          ? `Optimization potential: R${category.potential_savings.toFixed(
                              0
                            )}/month`
                          : "No specific Discovery benefit"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-2 text-gray-500 text-xs">
              <p>Upload your bank statement to see spending breakdown</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Improvement Opportunities */}
      {statusImprovement && (
        <div className="bg-white p-2 rounded-lg border border-discovery-gold/20 shadow-sm">
          <h3 className="text-xs font-semibold mb-2 text-discovery-blue flex items-center">
            <TrendingUp className="w-3 h-3 mr-1 text-discovery-gold" />
            Path to {statusImprovement.nextTier.name} Status
          </h3>

          <div className="mb-2 p-1 bg-discovery-gold/10 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-discovery-gold text-[10px]">
                  Next Status: {statusImprovement.nextTier.name}
                </p>
                <p className="text-[10px] text-gray-600">
                  Unlocks{" "}
                  {(
                    HEALTHYFOOD_CASHBACK[statusImprovement.nextTier.name] * 100
                  ).toFixed(0)}
                  % grocery cashback &{" "}
                  {(
                    HEALTHYCARE_CASHBACK[statusImprovement.nextTier.name] * 100
                  ).toFixed(0)}
                  % health cashback
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-discovery-gold">
                  {statusImprovement.pointsNeeded.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-500">points needed</p>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            {statusImprovement.improvements.map((improvement, idx) => (
              <div
                key={idx}
                className="p-1 border border-discovery-gold/20 rounded-lg"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-medium text-discovery-blue flex items-center">
                    {improvement.category === "Health Activities" ? (
                      <Heart className="w-2 h-2 mr-1" />
                    ) : (
                      <Activity className="w-2 h-2 mr-1" />
                    )}
                    {improvement.action}
                  </span>
                  <span className="bg-discovery-gold text-white text-[10px] px-1 py-0.5 rounded-full">
                    +{improvement.points.toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-gray-600 ml-3">
                  {improvement.description}
                </p>
              </div>
            ))}
          </div>

          {totalMiles > 0 && (
            <div className="mt-2 p-1 bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 border border-discovery-gold/20 rounded-lg">
              <p className="text-[10px] text-discovery-blue">
                <strong>Impact:</strong> Higher status could earn you an extra R
                {(
                  (HEALTHYFOOD_CASHBACK[statusImprovement.nextTier.name] -
                    HEALTHYFOOD_CASHBACK[currentStatus.name]) *
                  totalQualifyingSpend
                ).toFixed(0)}
                /month from your current spending!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Real Data-Based Spending Optimization */}
      {spendingOptimizations.length > 0 && (
        <div className="bg-white p-2 rounded-lg border border-discovery-gold/20 shadow-sm">
          <h3 className="text-xs font-semibold mb-2 text-discovery-blue flex items-center">
            <Lightbulb className="w-3 h-3 mr-1 text-discovery-gold" />
            Personalized Optimization Tips
          </h3>

          <div className="space-y-2">
            {spendingOptimizations.map((suggestion, idx) => (
              <div
                key={idx}
                className="p-2 border border-discovery-gold/20 rounded-lg"
              >
                <div className="flex items-start space-x-1">
                  <ArrowRight className="w-2 h-2 text-discovery-gold mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-discovery-blue text-[10px] mb-0.5">
                      {suggestion.action}
                    </h4>
                    <p className="text-[10px] text-discovery-gold mb-0.5">
                      <strong>Benefit:</strong> {suggestion.benefit}
                    </p>
                    <p className="text-[10px] text-gray-600">
                      {suggestion.explanation}
                    </p>
                    {suggestion.potentialSavings > 0 && (
                      <p className="text-[10px] text-green-600 mt-0.5">
                        Additional savings: R
                        {suggestion.potentialSavings.toFixed(0)}/month
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Important Notes */}
      <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-2 rounded-lg border border-discovery-gold/20">
        <h3 className="text-xs font-semibold mb-2 text-discovery-blue flex items-center">
          <Info className="w-3 h-3 mr-1" />
          Key Insights
        </h3>
        <div className="space-y-1 text-[10px] text-gray-700">
          <p className="flex items-start">
            <span className="mr-1">•</span>
            Analysis based on your{" "}
            {spendingData.reduce((sum, cat) => sum + cat.count, 0)} actual
            transactions
          </p>
          <p className="flex items-start">
            <span className="mr-1">•</span>R{totalQualifyingSpend.toFixed(0)} of
            your R{totalMonthlySpending.toLocaleString()} spending earns
            Discovery Miles
          </p>
          <p className="flex items-start">
            <span className="mr-1">•</span>
            HealthyFood cashback applies only to qualifying healthy items
            (fruits, vegetables, etc.)
          </p>
          <p className="flex items-start">
            <span className="mr-1">•</span>
            Monthly limits: R2,500 HealthyFood cashback for individuals
          </p>
          {enhancedMode && (
            <p className="flex items-start">
              <span className="mr-1">•</span>
              Enhanced AI analysis provides personalized recommendations based
              on your patterns
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Vitality;
