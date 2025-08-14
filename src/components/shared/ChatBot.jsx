import React, { useState, useEffect } from "react";
import { Bot } from "lucide-react";

const ChatBot = ({
  showChatbot,
  setShowChatbot,
  chatMessages,
  setChatMessages,
  chatInput,
  setChatInput,
  handleSendMessage,
  realAnalysisResults,
  userProfile,
  debtAnalysis, // Add debt analysis prop
  investmentAnalysis, // Add investment analysis prop
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [conversationContext, setConversationContext] = useState([]);

  // Gemini API configuration
  const GEMINI_API_KEY =
    import.meta.env.VITE_GEMINI_API_KEY || "YOUR_GEMINI_API_KEY_HERE";
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

  // Check if we have real financial data
  const hasFinancialData =
    realAnalysisResults && realAnalysisResults.total_income;
  const hasDebtData =
    debtAnalysis && (debtAnalysis.avalanche || debtAnalysis.snowball);
  const hasInvestmentData = investmentAnalysis && investmentAnalysis.profiles;

  // Check if user has debt payments detected but no debt analysis
  const hasDetectedDebtPayments =
    realAnalysisResults?.transactions?.some((t) => t.IsDebtPayment) || false;
  const needsDebtStatement = hasDetectedDebtPayments && !hasDebtData;

  // Update conversation context when new messages are added
  useEffect(() => {
    if (chatMessages.length > 0) {
      const context = chatMessages.slice(-6).map((msg) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));
      setConversationContext(context);
    }
  }, [chatMessages]);

  // Prepare comprehensive financial context for AI
  const getComprehensiveFinancialContext = () => {
    let context = {};

    // Budget/Spending Analysis
    if (hasFinancialData) {
      const savingsRate = (
        (realAnalysisResults.available_income /
          realAnalysisResults.total_income) *
        100
      ).toFixed(1);

      // Enhanced category breakdown with detailed insights
      const categoryDetails = Object.entries(
        realAnalysisResults.category_breakdown
      )
        .filter(([_, data]) => data.amount > 0)
        .map(
          ([name, data]) =>
            `${name}: R${data.amount.toLocaleString()} (${data.percentage.toFixed(
              1
            )}%, ${data.count} transactions)`
        )
        .join(", ");

      const potentialSavings = Object.values(
        realAnalysisResults.suggestions
      ).reduce((sum, s) => sum + (s.potential_savings || 0), 0);

      // Detailed suggestions breakdown
      const suggestionDetails = Object.entries(realAnalysisResults.suggestions)
        .filter(([_, data]) => data.potential_savings > 50) // Only significant savings
        .map(
          ([category, data]) =>
            `${category}: Could save R${data.potential_savings.toFixed(
              0
            )}/month - ${data.suggestions[0]}`
        )
        .join("; ");

      // Detected debt payments
      const debtPayments =
        realAnalysisResults.transactions
          ?.filter((t) => t.IsDebtPayment)
          ?.map(
            (t) =>
              `${t.DebtName}: R${Math.abs(t["Amount (ZAR)"])} (${t.DebtKind})`
          )
          .join(", ") || "None detected";

      context.budget = {
        monthlyIncome: realAnalysisResults.total_income,
        monthlyExpenses: realAnalysisResults.total_expenses,
        availableIncome: realAnalysisResults.available_income,
        optimizedAvailableIncome:
          realAnalysisResults.optimized_available_income,
        savingsRate: savingsRate,
        categoryBreakdown: categoryDetails,
        potentialMonthlySavings: potentialSavings,
        detailedSuggestions: suggestionDetails,
        transactionCount: Object.values(
          realAnalysisResults.category_breakdown
        ).reduce((sum, cat) => sum + cat.count, 0),
        enhancedMode: realAnalysisResults.enhanced_mode,
        detectedDebtPayments: debtPayments,
        hasDetectedDebtPayments: hasDetectedDebtPayments,
        needsDebtStatement: needsDebtStatement,
        largestExpenseCategories: Object.entries(
          realAnalysisResults.category_breakdown
        )
          .filter(([_, data]) => data.amount > 0)
          .sort((a, b) => b[1].amount - a[1].amount)
          .slice(0, 3)
          .map(([name, data]) => `${name} (R${data.amount.toLocaleString()})`)
          .join(", "),
      };
    }

    // Enhanced Debt Analysis
    if (hasDebtData) {
      const recommendedStrategy = debtAnalysis.recommendation || "avalanche";
      const strategy = debtAnalysis[recommendedStrategy];
      const alternativeStrategy =
        recommendedStrategy === "avalanche" ? "snowball" : "avalanche";
      const altStrategy = debtAnalysis[alternativeStrategy];

      // Calculate minimum payment scenario for comparison
      const totalBalance =
        debtAnalysis.debts_uploaded?.reduce(
          (sum, debt) => sum + debt.balance,
          0
        ) || 0;
      const totalMinPayments =
        debtAnalysis.debts_uploaded?.reduce(
          (sum, debt) => sum + debt.min_payment,
          0
        ) || 0;

      context.debt = {
        recommendedStrategy: recommendedStrategy,
        monthsToDebtFree: strategy?.months_to_debt_free,
        totalInterestPaid: strategy?.total_interest_paid,
        interestSaved: strategy?.interest_saved_vs_min_only,
        totalDebts: debtAnalysis.debts_uploaded?.length || 0,
        payoffOrder: strategy?.payoff_order || [],
        totalDebtAmount: totalBalance,
        monthlyPayments: totalMinPayments,
        additionalBudget: strategy?.additional_budget || 0,
        debtDetails:
          debtAnalysis.debts_uploaded
            ?.map(
              (debt) =>
                `${debt.name}: R${debt.balance.toLocaleString()} at ${(
                  debt.apr * 100
                ).toFixed(1)}% (min: R${debt.min_payment})`
            )
            .join("; ") || "",
        avalancheVsSnowball: {
          avalanche: {
            months: debtAnalysis.avalanche?.months_to_debt_free,
            interestSaved: debtAnalysis.avalanche?.interest_saved_vs_min_only,
            totalInterest: debtAnalysis.avalanche?.total_interest_paid,
          },
          snowball: {
            months: debtAnalysis.snowball?.months_to_debt_free,
            interestSaved: debtAnalysis.snowball?.interest_saved_vs_min_only,
            totalInterest: debtAnalysis.snowball?.total_interest_paid,
          },
        },
        strategyComparison: `${recommendedStrategy} method: ${
          strategy?.months_to_debt_free
        } months, R${strategy?.total_interest_paid?.toLocaleString()} interest vs ${alternativeStrategy} method: ${
          altStrategy?.months_to_debt_free
        } months, R${altStrategy?.total_interest_paid?.toLocaleString()} interest`,
      };
    }

    // Enhanced Investment Analysis
    if (hasInvestmentData) {
      const monthlySavings = investmentAnalysis.monthly_savings;

      // Extract detailed projections for each strategy
      const strategyProjections = Object.entries(investmentAnalysis.profiles)
        .map(([strategy, data]) => {
          const projection10 = data.projections?.find((p) => p.years === 10);
          const projection20 = data.projections?.find((p) => p.years === 20);
          return `${strategy}: 10yr=R${
            projection10?.effective_future_value?.toLocaleString() || "N/A"
          }, 20yr=R${
            projection20?.effective_future_value?.toLocaleString() || "N/A"
          }`;
        })
        .join("; ");

      context.investment = {
        monthlySavings: monthlySavings,
        strategies: Object.keys(investmentAnalysis.profiles).join(", "),
        recommendations: investmentAnalysis.recommendations || [],
        strategyProjections: strategyProjections,
        projections: {
          conservative:
            investmentAnalysis.profiles.conservative?.projections?.find(
              (p) => p.years === 10
            ),
          moderate: investmentAnalysis.profiles.moderate?.projections?.find(
            (p) => p.years === 10
          ),
          aggressive: investmentAnalysis.profiles.aggressive?.projections?.find(
            (p) => p.years === 10
          ),
        },
        detailedRecommendations:
          investmentAnalysis.recommendations?.join("; ") || "",
      };
    }

    return context;
  };

  const generateSystemPrompt = (context) => {
    let prompt = `You are a professional South African financial advisor AI assistant for Discovery Health's Financial AI app. You provide personalized, actionable financial advice based on the user's comprehensive real financial data analysis.

USER PROFILE:
- Name: ${userProfile.name}
- Vitality Status: ${userProfile.vitalityStatus}
- Age: ${userProfile.age}
- Risk Tolerance: ${userProfile.riskTolerance}`;

    // Add budget context if available
    if (context.budget) {
      prompt += `

COMPREHENSIVE BUDGET ANALYSIS FROM USER'S BANK STATEMENT:
- Monthly Income: R${context.budget.monthlyIncome.toLocaleString()}
- Monthly Expenses: R${context.budget.monthlyExpenses.toLocaleString()}
- Available Income: R${context.budget.availableIncome.toLocaleString()}
- Optimized Available Income: R${
        context.budget.optimizedAvailableIncome?.toLocaleString() || "N/A"
      }
- Savings Rate: ${context.budget.savingsRate}%
- Enhanced Mode: ${context.budget.enhancedMode ? "Yes" : "No"}
- Transactions Analyzed: ${context.budget.transactionCount}
- Largest Expense Categories: ${context.budget.largestExpenseCategories}
- Detailed Spending: ${context.budget.categoryBreakdown}
- Potential Monthly Savings: R${context.budget.potentialMonthlySavings.toLocaleString()}
- Optimization Suggestions: ${context.budget.detailedSuggestions}
- Detected Debt Payments: ${context.budget.detectedDebtPayments}
- Needs Debt Statement Upload: ${
        context.budget.needsDebtStatement
          ? "YES - User has debt payments but no detailed debt analysis"
          : "No"
      }`;
    }

    // Add debt context if available
    if (context.debt) {
      prompt += `

COMPREHENSIVE DEBT OPTIMIZATION ANALYSIS:
- Recommended Strategy: ${context.debt.recommendedStrategy} method
- Time to Debt-Free: ${context.debt.monthsToDebtFree} months
- Total Debt Amount: R${context.debt.totalDebtAmount.toLocaleString()} across ${
        context.debt.totalDebts
      } debts
- Monthly Debt Payments: R${context.debt.monthlyPayments.toLocaleString()}
- Additional Budget Available: R${context.debt.additionalBudget.toLocaleString()}
- Interest Saved vs Minimum Payments: R${
        context.debt.interestSaved?.toLocaleString() || "N/A"
      }
- Optimal Payoff Order: ${context.debt.payoffOrder.join(" → ")}
- Debt Details: ${context.debt.debtDetails}
- Strategy Comparison: ${context.debt.strategyComparison}`;
    }

    // Add investment context if available
    if (context.investment) {
      prompt += `

COMPREHENSIVE INVESTMENT ANALYSIS:
- Available for Investment: R${context.investment.monthlySavings.toLocaleString()}/month
- Investment Strategies Analyzed: ${context.investment.strategies}
- Strategy Projections: ${context.investment.strategyProjections}
- AI Recommendations: ${context.investment.detailedRecommendations}`;
    }

    // Add guidance for missing data
    if (context.budget?.needsDebtStatement) {
      prompt += `

IMPORTANT NOTE: User has detected debt payments in their bank statement but hasn't uploaded a detailed debt statement yet. Strongly encourage them to upload their debt statement (CSV format with columns: name, balance, apr, min_payment, kind) for comprehensive debt optimization analysis.`;
    }

    prompt += `

SOUTH AFRICAN CONTEXT:
- Currency: South African Rand (ZAR)
- Local banks: Discovery Bank, Standard Bank, FNB, ABSA, Nedbank, Capitec
- Local stores: Shoprite, Pick n Pay, Checkers, Woolworths, Spar, Makro
- Local transport: Taxi, Uber, Bolt, Gautrain, public buses
- Local services: DSTV/MultiChoice, Vodacom, MTN, Cell C, Rain, Eskom (electricity), municipal services
- Discovery Vitality benefits: Earn points for healthy financial behaviors, medical aid discounts
- Tax-Free Savings Account (TFSA) limit: R36,000/year
- Retirement Annuity tax benefits: Up to 27.5% of income
- Local investment options: Satrix ETFs, Allan Gray, Coronation, Old Mutual

RESPONSE GUIDELINES:
1. Be conversational, friendly, and encouraging - use a warm South African tone
2. Provide specific, actionable advice based on their actual analyzed data
3. Reference their real spending patterns, debt situation, and investment capacity with specific amounts
4. Quote exact figures from their analysis (e.g., "Your groceries of R5,300 could be reduced by R356 monthly")
5. Suggest realistic South African solutions with local brands and services
6. Keep responses comprehensive but readable (4-6 sentences max)
7. Use South African Rand (R) for all amounts with proper formatting
8. Consider Discovery Vitality integration opportunities
9. Focus on practical South African financial products and services
10. Maintain conversation context and refer to previous discussions
11. Prioritize advice based on their most pressing financial needs (debt vs investment vs savings)
12. If they need to upload debt statement, mention it prominently with clear instructions
13. Reference specific categories and amounts from their analysis
14. Provide context on why certain strategies are recommended based on their data

Remember: You have access to their complete financial picture including exact spending patterns, debt payments, and optimization opportunities. Use this data to provide highly personalized advice that's specifically relevant to their situation.`;

    return prompt;
  };

  const generateGeneralSystemPrompt = () => {
    return `You are a professional South African financial advisor AI assistant for Discovery Health's Financial AI app. The user hasn't uploaded their bank statement yet, so provide general financial advice and guidance.

USER PROFILE:
- Name: ${userProfile.name}
- Vitality Status: ${userProfile.vitalityStatus}
- Age: ${userProfile.age}
- Risk Tolerance: ${userProfile.riskTolerance}

SOUTH AFRICAN CONTEXT:
- Currency: South African Rand (ZAR)
- Local banks: Discovery Bank, Standard Bank, FNB, ABSA, Nedbank, Capitec
- Local stores: Shoprite, Pick n Pay, Checkers, Woolworths, Spar
- Local transport: Taxi, Uber, Bolt, Gautrain
- Local services: DSTV, Vodacom, MTN, Cell C, Eskom (electricity)
- Discovery Vitality benefits and points system
- Tax-Free Savings Account (TFSA) limit: R36,000/year
- Retirement Annuity tax benefits

RESPONSE GUIDELINES:
1. Be conversational, friendly, and encouraging
2. Provide general financial advice suitable for South Africans
3. Keep responses concise (3-4 sentences max)
4. Use South African Rand (R) for examples
5. Encourage them to upload their bank statement for personalized advice
6. Focus on practical South African financial products and services
7. Consider Discovery Vitality integration opportunities
8. Maintain conversation context and refer to previous discussions

Remember: You're helping South Africans with general financial wellness. Encourage them to upload their bank statement for personalized advice based on their real spending patterns.`;
  };

  const callGeminiAPI = async (userMessage, financialContext) => {
    try {
      // Check if API key is available
      if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
        return "API key not configured. Please set your VITE_GEMINI_API_KEY environment variable.";
      }

      const systemPrompt = financialContext
        ? generateSystemPrompt(financialContext)
        : generateGeneralSystemPrompt();

      // Build conversation with proper format for Gemini API
      const contents = [];

      // Add system prompt as first user message
      contents.push({
        role: "user",
        parts: [{ text: systemPrompt }],
      });

      // Add a brief model response to acknowledge the system prompt
      contents.push({
        role: "model",
        parts: [
          {
            text: "I understand. I'm ready to help with financial advice based on the provided context.",
          },
        ],
      });

      // Add conversation history (exclude system messages)
      if (conversationContext.length > 0) {
        conversationContext.forEach((msg) => {
          if (msg.role === "user" || msg.role === "model") {
            contents.push({
              role: msg.role,
              parts: msg.parts,
            });
          }
        });
      }

      // Add current user message
      contents.push({
        role: "user",
        parts: [{ text: userMessage }],
      });

      console.log("Sending to Gemini API:", {
        contentsLength: contents.length,
        lastUserMessage: userMessage,
      });

      const requestBody = {
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 400, // Increased for more detailed responses
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      };

      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Error Response:", errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Gemini API Response:", data);

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else if (data.error) {
        console.error("Gemini API returned error:", data.error);
        return "I'm having trouble processing your request. Please try again with a different question.";
      } else {
        console.error("Invalid response format:", data);
        return "I received an unexpected response. Please try again.";
      }
    } catch (error) {
      console.error("Gemini API Error:", error);

      if (error.message.includes("401")) {
        return "API authentication failed. Please check your Gemini API key.";
      } else if (error.message.includes("403")) {
        return "API access forbidden. Please verify your Gemini API key permissions.";
      } else if (error.message.includes("400")) {
        return "Request format error. The message might be too long or contain unsupported content.";
      } else {
        return "I'm having trouble connecting right now. Please try again or contact support if the issue persists.";
      }
    }
  };

  const handleAIMessage = async () => {
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setIsLoading(true);

    // Add user message
    const userChatMessage = { sender: "user", text: userMessage };
    setChatMessages((prevMessages) => [...prevMessages, userChatMessage]);

    try {
      const financialContext =
        hasFinancialData || hasDebtData || hasInvestmentData
          ? getComprehensiveFinancialContext()
          : null;

      const aiResponse = await callGeminiAPI(userMessage, financialContext);

      // Add AI response
      const aiMessage = { sender: "ai", text: aiResponse };
      setChatMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        sender: "ai",
        text: "I'm having trouble connecting right now. Please try again or contact support if the issue persists.",
      };
      setChatMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isLoading) {
      e.preventDefault();
      handleAIMessage();
    }
  };

  // Enhanced suggested questions based on available data
  const getSuggestedQuestions = () => {
    const questions = [];

    if (hasFinancialData) {
      const context = getComprehensiveFinancialContext();

      // High-priority questions based on their data
      if (needsDebtStatement) {
        questions.push(
          "I see debt payments in my transactions - how do I upload my debt details?"
        );
      }

      if (context.budget?.savingsRate < 10) {
        questions.push("My savings rate is low - what should I do first?");
      }

      if (context.budget?.potentialMonthlySavings > 1000) {
        questions.push(
          `How can I save the R${Math.round(
            context.budget.potentialMonthlySavings
          )} you identified?`
        );
      }

      if (hasDebtData && hasInvestmentData) {
        questions.push(
          "Should I focus on debt or investing with my available money?"
        );
      } else if (hasDebtData) {
        questions.push(
          `Why do you recommend the ${context.debt?.recommendedStrategy} method for my debts?`
        );
      } else if (hasInvestmentData) {
        questions.push(
          "Which investment strategy suits my financial situation?"
        );
      }

      questions.push("What's my biggest financial priority right now?");
      questions.push("How can I optimize my largest spending categories?");

      if (context.budget?.largestExpenseCategories) {
        questions.push(
          `How can I reduce my spending on ${
            context.budget.largestExpenseCategories.split(",")[0]
          }?`
        );
      }
    } else {
      questions.push("How much should I be saving each month?");
      questions.push("What's the best way to start budgeting?");
      questions.push("Should I pay off debt or save first?");
      questions.push("What are good investment options in South Africa?");
      questions.push("How do I upload my bank statement for analysis?");
    }

    return questions.slice(0, 3);
  };

  // Enhanced data status indicator
  const getDataStatus = () => {
    const statuses = [];
    if (hasFinancialData) statuses.push("Budget");
    if (hasDebtData) statuses.push("Debt");
    if (hasInvestmentData) statuses.push("Investment");

    if (statuses.length === 0)
      return "💡 Upload bank statement for personalized advice";

    const transactionCount = hasFinancialData
      ? Object.values(realAnalysisResults?.category_breakdown || {}).reduce(
          (sum, cat) => sum + cat.count,
          0
        )
      : 0;

    let status = `✓ Using your real ${statuses.join(" + ")} data${
      transactionCount ? ` (${transactionCount} transactions)` : ""
    }`;

    if (needsDebtStatement) {
      status += " ⚠️ Missing debt details";
    }

    return status;
  };

  // Always show the full chatbot interface
  return (
    <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-80 bg-white rounded-xl shadow-lg border border-discovery-gold/20 z-50 max-h-96 flex flex-col">
      <div className="p-4 border-b border-discovery-gold/20 bg-gradient-to-r from-discovery-gold to-discovery-blue text-white rounded-t-xl">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold">Financial AI Assistant</h3>
            <p className="text-xs text-white/90">
              {hasFinancialData || hasDebtData || hasInvestmentData
                ? "Powered by your comprehensive data"
                : "Ready to help with general advice"}
            </p>
          </div>
          <button
            onClick={() => setShowChatbot(false)}
            className="text-white hover:text-white/80"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto max-h-64">
        {chatMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            <div className="mb-4">
              <div className="w-12 h-12 bg-discovery-gold/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Bot className="w-6 h-6 text-discovery-gold" />
              </div>
            </div>
            <p className="text-sm">
              Hi {userProfile.name}! I'm your AI financial assistant.
            </p>
            <p className="text-xs mt-1">
              {hasFinancialData || hasDebtData || hasInvestmentData
                ? "I can provide personalized advice based on your comprehensive financial analysis!"
                : "I can help with general financial advice. Upload your bank statement for personalized insights!"}
            </p>

            {/* Special message for debt statement upload */}
            {needsDebtStatement && (
              <div className="mt-3 p-2 bg-discovery-gold/10 rounded-lg border border-discovery-gold/20">
                <p className="text-xs text-discovery-gold font-medium">
                  💡 I noticed debt payments in your transactions! Upload your
                  debt statement for detailed payoff strategies.
                </p>
              </div>
            )}

            {/* Suggested Questions */}
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-400">Try asking:</p>
              {getSuggestedQuestions().map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => setChatInput(question)}
                  className="block w-full text-left text-xs p-2 bg-discovery-gold/10 rounded hover:bg-discovery-gold/20 transition-colors"
                >
                  "{question}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {chatMessages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs p-3 rounded-lg text-sm ${
                    message.sender === "user"
                      ? "bg-discovery-blue text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 max-w-xs p-3 rounded-lg text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-discovery-gold rounded-full animate-pulse"></div>
                    <div
                      className="w-2 h-2 bg-discovery-gold rounded-full animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-discovery-gold rounded-full animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="p-4 border-t border-discovery-gold/20">
        <div className="flex space-x-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              hasFinancialData || hasDebtData || hasInvestmentData
                ? "Ask about your finances..."
                : "Ask me about financial planning..."
            }
            disabled={isLoading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-discovery-gold focus:border-transparent disabled:bg-gray-100"
          />
          <button
            onClick={handleAIMessage}
            disabled={isLoading || !chatInput.trim()}
            className="px-4 py-2 bg-discovery-gold text-white rounded-lg hover:bg-discovery-gold/90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>

        {/* Enhanced Data Status Indicator */}
        <div className="mt-2 text-center">
          <span
            className={`text-xs px-1 py-1 rounded-full ${
              hasFinancialData || hasDebtData || hasInvestmentData
                ? "bg-white text-discovery-gold"
                : "bg-discovery-blue/20 text-discovery-blue"
            }`}
          >
            {getDataStatus()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
