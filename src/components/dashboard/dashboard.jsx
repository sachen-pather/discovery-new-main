import {
  TrendingUp,
  Wallet,
  Upload,
  FileText,
  AlertTriangle,
  Target,
  CheckCircle,
  Sparkles,
  FileSpreadsheet,
  FileImage,
  Search,
  Shield,
  ExternalLink,
} from "lucide-react";
import React, { useState } from "react";

const Dashboard = ({
  financialData,
  setActiveTab,
  handleFileUpload,
  realAnalysisResults,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState(null);

  const hasRealData =
    realAnalysisResults && realAnalysisResults.total_income !== undefined;
  const totalIncome = hasRealData ? realAnalysisResults.total_income : null;
  const disposableIncome = hasRealData
    ? realAnalysisResults.available_income
    : null;

  const handleFileUploadWithType = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const fileExtension = file.name.toLowerCase().split(".").pop();

    if (fileExtension === "csv") {
      setUploadType("CSV");
    } else if (fileExtension === "pdf") {
      setUploadType("PDF");
    }

    try {
      await handleFileUpload(event);
    } finally {
      setIsUploading(false);
      setUploadType(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Real Data Indicator */}
      {hasRealData && (
        <div className="bg-discovery-gold/10 p-2 rounded-lg border border-discovery-gold/20">
          <p className="text-xs text-discovery-gold font-medium flex items-center">
            <Sparkles className="w-3 h-3 text-discovery-gold mr-1" /> Showing
            your real financial analysis results
          </p>
        </div>
      )}

      {/* Financial Overview */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gradient-to-r from-discovery-gold to-discovery-gold/80 p-2 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/90 text-xs">Monthly Income</p>
              {hasRealData ? (
                <p className="text-sm font-bold">
                  R{totalIncome.toLocaleString()}
                </p>
              ) : (
                <p className="text-sm font-bold text-white/60">Upload File</p>
              )}
              <p className="text-[10px] text-white/80">Total available</p>
            </div>
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-discovery-blue to-discovery-blue/80 p-2 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/90 text-xs">Available</p>
              {hasRealData ? (
                <p className="text-sm font-bold">
                  R{disposableIncome.toLocaleString()}
                </p>
              ) : (
                <p className="text-sm font-bold text-white/60">Upload File</p>
              )}
              <p className="text-[10px] text-white/80">To save/invest</p>
            </div>
            <Wallet className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white p-4 rounded-lg border-2 border-dashed border-discovery-gold/30">
        <div className="text-center">
          {isUploading ? (
            <div className="py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-discovery-gold mb-2"></div>
              <h3 className="text-sm font-semibold mb-1 text-discovery-blue">
                Processing {uploadType} File...
              </h3>
              <p className="text-xs text-gray-600">
                {uploadType === "PDF"
                  ? "Extracting data from PDF and analyzing..."
                  : "Analyzing your bank statement with AI..."}
              </p>
            </div>
          ) : (
            <>
              <div className="mx-auto mb-2 text-discovery-gold">
                <Upload className="w-8 h-8 text-discovery-gold mx-auto" />
              </div>
              <h3 className="text-sm font-semibold mb-1 text-discovery-blue">
                {hasRealData ? "Upload New Statement" : "Upload Bank Statement"}
              </h3>
              <p className="text-xs text-gray-600 mb-2">
                {hasRealData
                  ? "Analyze a different file (CSV or PDF)"
                  : "Get AI-powered insights from your bank statement"}
              </p>

              <label className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-discovery-gold to-discovery-blue text-white text-xs rounded-lg cursor-pointer hover:from-discovery-gold/90 hover:to-discovery-blue/90 transition-colors">
                <Search className="w-3 h-3 mr-1" />
                Choose File (CSV or PDF)
                <input
                  type="file"
                  className="hidden"
                  accept=".csv,.pdf"
                  onChange={handleFileUploadWithType}
                  disabled={isUploading}
                />
              </label>

              <div className="mt-2 space-y-1">
                <p className="text-[10px] text-gray-500">
                  Supports CSV and PDF files • Your data is encrypted and secure
                </p>
                <div className="flex justify-center space-x-2 text-[10px] text-gray-400">
                  <span className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                    CSV: Direct processing
                  </span>
                  <span className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1"></span>
                    PDF: AI extraction + processing
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Financial Literacy Academy */}
      <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-4 rounded-lg border border-discovery-gold/20">
        <div className="text-center">
          <div className="mx-auto mb-2 w-12 h-12 bg-gradient-to-r from-discovery-gold to-discovery-blue rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-base font-semibold mb-1 text-discovery-blue">
            Financial Literacy Academy
          </h3>
          <p className="text-gray-600 mb-2 text-xs">
            Boost your financial knowledge and earn Vitality points through
            interactive learning modules
          </p>
          <a
            href="https://dainty-bonbon-de4898.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-discovery-gold to-discovery-blue text-white rounded-lg font-semibold hover:from-discovery-gold/90 hover:to-discovery-blue/90 transition-all transform hover:scale-[1.02] shadow-lg"
          >
            <Shield className="w-4 h-4 mr-1" />
            Access Academy
            <ExternalLink className="w-3 h-3 ml-1" />
          </a>
          <p className="text-xs text-gray-500 mt-1">
            Complete courses to improve your financial wellness and earn rewards
          </p>
        </div>
      </div>

      {/* File Format Help */}
      {!hasRealData && (
        <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-1 flex items-center text-xs">
            <FileText className="w-3 h-3 mr-1" /> Supported Formats
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
            <div className="space-y-0.5">
              <p className="font-medium text-gray-700">CSV Files:</p>
              <p className="text-gray-600">• Standard bank CSV exports</p>
              <p className="text-gray-600">
                • Columns: Date, Description, Amount, Balance
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="font-medium text-gray-700">PDF Files:</p>
              <p className="text-gray-600">• Bank statement PDFs</p>
              <p className="text-gray-600">• Text-based (not scanned images)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
