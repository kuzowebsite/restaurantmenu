"use client"

import { useState } from "react"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { authOperations } from "../../lib/firebase"

export default function LoginPage() {
  const router = useRouter()
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [registerForm, setRegisterForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [loginError, setLoginError] = useState("")
  const [isLoginLoading, setIsLoginLoading] = useState(false)

  const handleLogin = async () => {
    setLoginError("")
    setIsLoginLoading(true)

    // Simple validation
    if (!loginForm.email || !loginForm.password) {
      setLoginError("И-мэйл болон нууц үгээ оруулна уу")
      setIsLoginLoading(false)
      return
    }

    try {
      const result = await authOperations.loginUser(loginForm.email, loginForm.password)

      if (result.success && result.user) {
        // Store user data in localStorage for persistence
        localStorage.setItem("currentUser", JSON.stringify(result.user))
        localStorage.setItem("isLoggedIn", "true")

        // Check if user is admin and redirect accordingly
        if (result.user.role === "admin") {
          router.push("/admin")
        } else {
          router.push("/")
        }

        setLoginForm({ email: "", password: "" })
      } else {
        setLoginError(result.error || "И-мэйл эсвэл нууц үг буруу байна")
      }
    } catch (error) {
      setLoginError("Нэвтрэхэд алдаа гарлаа")
    }

    setIsLoginLoading(false)
  }

  const handleRegister = async () => {
    setLoginError("")
    setIsLoginLoading(true)

    // Simple validation
    if (!registerForm.name || !registerForm.phone || !registerForm.email || !registerForm.password) {
      setLoginError("Бүх талбарыг бөглөнө үү")
      setIsLoginLoading(false)
      return
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setLoginError("Нууц үг таарахгүй байна")
      setIsLoginLoading(false)
      return
    }

    if (registerForm.password.length < 6) {
      setLoginError("Нууц үг дор хаяж 6 тэмдэгт байх ёстой")
      setIsLoginLoading(false)
      return
    }

    try {
      const result = await authOperations.registerUser(registerForm.email, registerForm.password, {
        name: registerForm.name,
        phone: registerForm.phone,
        role: "user",
      })

      if (result.success && result.user) {
        // Store user data in localStorage for persistence
        localStorage.setItem("currentUser", JSON.stringify(result.user))
        localStorage.setItem("isLoggedIn", "true")

        router.push("/")
        setRegisterForm({
          name: "",
          phone: "",
          email: "",
          password: "",
          confirmPassword: "",
        })
        setIsRegistering(false)
      } else {
        setLoginError(result.error || "Бүртгэлд алдаа гарлаа")
      }
    } catch (error) {
      setLoginError("Бүртгэлд алдаа гарлаа")
    }

    setIsLoginLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl">🍽️</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {isRegistering ? "Бүртгүүлэх" : "Тавтай морилно уу"}
              </h1>
              <p className="text-gray-300">
                {isRegistering ? "Шинэ хэрэглэгчийн бүртгэл үүсгэх" : "Өөрийн бүртгэлд нэвтэрнэ үү"}
              </p>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="bg-red-500/20 backdrop-blur border border-red-500/30 rounded-lg p-4 mb-6 animate-shake">
                <p className="text-red-300 text-sm text-center">{loginError}</p>
              </div>
            )}

            {/* Social Login Buttons */}
            {!isRegistering && (
              <div className="space-y-3 mb-6">
                <Button
                  className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                  disabled={isLoginLoading}
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google-ээр нэвтрэх
                </Button>

                <Button
                  className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                  disabled={isLoginLoading}
                >
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook-ээр нэвтрэх
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-transparent text-gray-400">эсвэл</span>
                  </div>
                </div>
              </div>
            )}

            {/* Login/Register Form */}
            {!isRegistering ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">И-мэйл хаяг</label>
                  <Input
                    type="email"
                    placeholder="example@email.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="bg-white/10 backdrop-blur border border-white/20 text-white placeholder-gray-400 rounded-lg py-3 px-4 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                    disabled={isLoginLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Нууц үг</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                      className="bg-white/10 backdrop-blur border border-white/20 text-white placeholder-gray-400 rounded-lg py-3 px-4 pr-12 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                      disabled={isLoginLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoginLoading}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none"
                  onClick={handleLogin}
                  disabled={isLoginLoading}
                >
                  {isLoginLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                      Нэвтэрч байна...
                    </div>
                  ) : (
                    "Нэвтрэх"
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-gray-400 text-sm">
                    Бүртгэл байхгүй юу?{" "}
                    <button
                      className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors duration-200 hover:underline"
                      onClick={() => setIsRegistering(true)}
                      disabled={isLoginLoading}
                    >
                      Бүртгүүлэх
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              /* Register Form */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Нэр</label>
                    <Input
                      type="text"
                      placeholder="Таны нэр"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="bg-white/10 backdrop-blur border border-white/20 text-white placeholder-gray-400 rounded-lg py-3 px-4 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                      disabled={isLoginLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Утас</label>
                    <Input
                      type="tel"
                      placeholder="99999999"
                      value={registerForm.phone}
                      onChange={(e) => setRegisterForm((prev) => ({ ...prev, phone: e.target.value }))}
                      className="bg-white/10 backdrop-blur border border-white/20 text-white placeholder-gray-400 rounded-lg py-3 px-4 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                      disabled={isLoginLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">И-мэйл хаяг</label>
                  <Input
                    type="email"
                    placeholder="example@email.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="bg-white/10 backdrop-blur border border-white/20 text-white placeholder-gray-400 rounded-lg py-3 px-4 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                    disabled={isLoginLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Нууц үг</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                      className="bg-white/10 backdrop-blur border border-white/20 text-white placeholder-gray-400 rounded-lg py-3 px-4 pr-12 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                      disabled={isLoginLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoginLoading}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Нууц үг баталгаажуулах</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    className="bg-white/10 backdrop-blur border border-white/20 text-white placeholder-gray-400 rounded-lg py-3 px-4 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                    disabled={isLoginLoading}
                  />
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none"
                  onClick={handleRegister}
                  disabled={isLoginLoading}
                >
                  {isLoginLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                      Бүртгүүлж байна...
                    </div>
                  ) : (
                    "Бүртгүүлэх"
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-gray-400 text-sm">
                    Аль хэдийн бүртгэлтэй юу?{" "}
                    <button
                      className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors duration-200 hover:underline"
                      onClick={() => setIsRegistering(false)}
                      disabled={isLoginLoading}
                    >
                      Нэвтрэх
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* Back to Home */}
            <div className="mt-8 text-center">
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white transition-colors duration-200"
                onClick={() => router.push("/")}
                disabled={isLoginLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Нүүр хуудас руу буцах
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
