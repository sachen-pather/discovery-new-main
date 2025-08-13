import React from "react";

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
      <div className="flex justify-between items-center px-6 py-2 bg-black text-white text-sm">
        <div className="flex items-center space-x-1">
          <span className="font-medium">9:41</span>
        </div>
        <div className="flex items-center space-x-1">
          <span>📶</span>
          <span>📶</span>
          <span>🔋</span>
        </div>
      </div>

      {/* Full Screen Login Content */}
      <div className="flex-1 bg-gradient-to-br from-discovery-gold/10 to-discovery-blue/10 px-6 py-8">
        <div className="w-full h-full flex flex-col justify-center">
          {/* Welcome Header */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-discovery-gold to-discovery-blue text-white p-8 rounded-3xl shadow-xl">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <img
                    src="/images/DiscoveryLogo.png"
                    alt="Discovery Health"
                    className="h-10"
                  />
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-2">Welcome to</h1>
              <h2 className="text-xl font-semibold mb-3">
                Discovery Financial AI
              </h2>
              <p className="text-white/90 text-sm leading-relaxed">
                Your AI-powered financial wellness companion
              </p>
            </div>
          </div>

          {/* Login Form Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Sign In</h3>
              <p className="text-sm text-gray-600 mt-2">
                Access your financial dashboard
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label
                  htmlFor="id"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  User ID
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                    👤
                  </span>
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
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-discovery-gold focus:border-transparent transition-all text-lg"
                    placeholder="Enter your ID"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                    🔒
                  </span>
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
                    className="w-full pl-12 pr-14 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-discovery-gold focus:border-transparent transition-all text-lg"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm text-center">
                    {loginError}
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-discovery-gold to-discovery-blue text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-discovery-gold/90 hover:to-discovery-blue/90 transition-all transform hover:scale-[1.02] shadow-lg"
              >
                Sign In
              </button>
            </form>

            {/* Create Account - Right below Sign In */}
            <button className="w-full bg-white border-2 border-discovery-blue text-discovery-blue py-4 px-6 rounded-xl font-semibold text-lg hover:bg-discovery-blue/5 transition-all mt-4">
              Create Account
            </button>

            {/* Additional Options */}
            <div className="mt-8 space-y-6">
              {/* Forgot Password */}
              <div className="text-center">
                <button className="text-discovery-blue text-sm font-medium hover:text-discovery-blue/80 transition-colors">
                  Forgot password?
                </button>
              </div>

              {/* Biometric Login */}
              <div className="text-center">
                <button className="w-20 h-20 bg-discovery-blue/10 rounded-full flex items-center justify-center mx-auto mb-3 hover:bg-discovery-blue/20 transition-colors">
                  <span className="text-discovery-blue text-4xl">🔐</span>
                </button>
                <p className="text-sm text-gray-600">Login with Fingerprint</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-xs text-gray-500">
              Powered by Discovery • Secure & Encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;