import React from "react";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Fingerprint,
  Wifi,
  Battery,
  Signal,
} from "lucide-react";

const LoginScreen = ({
  loginCredentials,
  setLoginCredentials,
  loginError,
  showPassword,
  setShowPassword,
  handleLogin,
  validCredentials,
}) => {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Status Bar */}
      <div className="flex justify-between items-center px-5 py-1 bg-black text-white text-xs">
        <div className="flex items-center space-x-1">
          <span className="font-medium">9:41</span>
        </div>
        <div className="flex items-center space-x-1">
          <Signal className="w-4 h-4" />
          <Wifi className="w-4 h-4" />
          <Battery className="w-4 h-4" />
        </div>
      </div>

      {/* Full Screen Login Content */}
      <div className="flex-1 bg-gradient-to-br from-discovery-gold/10 to-discovery-blue/10 px-5 py-5">
        <div className="w-full h-full flex flex-col justify-center">
          {/* Welcome Header */}
          <div className="text-center mb-5">
            <div className="bg-gradient-to-r from-discovery-gold to-discovery-blue text-white p-5 rounded-2xl shadow-lg">
              <div className="flex items-center justify-center mb-5">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <img
                    src="/images/DiscoveryLogo.png"
                    alt="Discovery Health"
                    className="h-9"
                  />
                </div>
              </div>
              <h1 className="text-xl font-bold mb-2">Welcome to</h1>
              <h2 className="text-lg font-semibold mb-2">
                Discovery Financial AI
              </h2>
              <p className="text-white/90 text-sm leading-relaxed">
                Your AI-powered financial wellness companion
              </p>
            </div>
          </div>

          {/* Login Form Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <div className="text-center mb-5">
              <h3 className="text-xl font-semibold text-gray-800">Sign In</h3>
              <p className="text-base text-gray-600 mt-2">
                Access your financial dashboard
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="id"
                  className="block text-base font-medium text-gray-700 mb-2"
                >
                  User ID
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="id"
                    value={loginCredentials.id}
                    onChange={(e) =>
                      setLoginCredentials({
                        ...loginCredentials,
                        id: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-discovery-gold focus:border-transparent transition-all text-base"
                    placeholder="Enter your ID"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-base font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={loginCredentials.password}
                    onChange={(e) =>
                      setLoginCredentials({
                        ...loginCredentials,
                        password: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-discovery-gold focus:border-transparent transition-all text-base"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm text-center">
                    {loginError}
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-discovery-gold to-discovery-blue text-white py-3 px-5 rounded-lg font-semibold text-base hover:from-discovery-gold/90 hover:to-discovery-blue/90 transition-all transform hover:scale-[1.02] shadow-md"
              >
                Sign In
              </button>
            </form>

            {/* Create Account */}
            <button className="w-full bg-white border-2 border-discovery-blue text-discovery-blue py-3 px-5 rounded-lg font-semibold text-base hover:bg-discovery-blue/5 transition-all mt-4">
              Create Account
            </button>

            {/* Additional Options */}
            <div className="mt-6 space-y-4">
              {/* Forgot Password */}
              <div className="text-center">
                <button className="text-discovery-blue text-base font-medium hover:text-discovery-blue/80 transition-colors">
                  Forgot password?
                </button>
              </div>

              {/* Biometric Login */}
              <div className="text-center">
                <button className="w-18 h-18 bg-discovery-blue/10 rounded-full flex items-center justify-center mx-auto mb-2 hover:bg-discovery-blue/20 transition-colors">
                  <Fingerprint className="w-9 h-9 text-discovery-blue" />
                </button>
                <p className="text-base text-gray-600">
                  Login with Fingerprint
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-5">
            <p className="text-sm text-gray-500">
              Powered by Discovery • Secure & Encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
