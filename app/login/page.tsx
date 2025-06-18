"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Eye, EyeOff, Phone, Mail, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { authOperations, dbOperations } from "../../lib/firebase"

export default function LoginPage() {
  const router = useRouter()
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email")
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  })
  const [phoneForm, setPhoneForm] = useState({
    phone: "",
    code: "",
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
  const [successMessage, setSuccessMessage] = useState("")
  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [siteBranding, setSiteBranding] = useState<any>(null)

  // Load site branding (logo)
  useEffect(() => {
    const loadSiteBranding = async () => {
      try {
        const branding = await dbOperations.getSiteBranding()
        setSiteBranding(branding)
      } catch (error) {
        console.error("Error loading site branding:", error)
      }
    }
    loadSiteBranding()
  }, [])

  // Countdown timer for resend code
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleEmailLogin = async () => {
    setLoginError("")
    setSuccessMessage("")
    setIsLoginLoading(true)

    if (!loginForm.email || !loginForm.password) {
      setLoginError("И-мэйл болон нууц үгээ оруулна уу")
      setIsLoginLoading(false)
      return
    }

    try {
      const result = await authOperations.loginUser(loginForm.email, loginForm.password)

      if (result.success && result.user) {
        localStorage.setItem("currentUser", JSON.stringify(result.user))
        localStorage.setItem("isLoggedIn", "true")

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

  const handleSendCode = async () => {
    setLoginError("")
    setSuccessMessage("")
    setIsLoginLoading(true)

    if (!phoneForm.phone) {
      setLoginError("Утасны дугаараа оруулна уу")
      setIsLoginLoading(false)
      return
    }

    // Validate phone number format
    const phoneRegex = /^[0-9]{8}$/
    if (!phoneRegex.test(phoneForm.phone)) {
      setLoginError("Утасны дугаар 8 оронтой байх ёстой")
      setIsLoginLoading(false)
      return
    }

    try {
      const result = await authOperations.sendVerificationCode(phoneForm.phone)

      if (result.success) {
        setIsCodeSent(true)
        setCountdown(120) // 2 minutes countdown
        setSuccessMessage(result.message || "Баталгаажуулах код илгээгдлээ")
      } else {
        setLoginError(result.error || "Код илгээхэд алдаа гарлаа")
      }
    } catch (error) {
      setLoginError("Код илгээхэд алдаа гарлаа")
    }

    setIsLoginLoading(false)
  }

  const handleVerifyCode = async () => {
    setLoginError("")
    setSuccessMessage("")
    setIsLoginLoading(true)

    if (!phoneForm.code) {
      setLoginError("Баталгаажуулах кодыг оруулна уу")
      setIsLoginLoading(false)
      return
    }

    if (phoneForm.code.length !== 6) {
      setLoginError("Код 6 оронтой байх ёстой")
      setIsLoginLoading(false)
      return
    }

    try {
      const result = await authOperations.verifyPhoneCode(phoneForm.phone, phoneForm.code)

      if (result.success && result.user) {
        localStorage.setItem("currentUser", JSON.stringify(result.user))
        localStorage.setItem("isLoggedIn", "true")

        if (result.user.role === "admin") {
          router.push("/admin")
        } else {
          router.push("/")
        }

        setPhoneForm({ phone: "", code: "" })
        setIsCodeSent(false)
      } else {
        setLoginError(result.error || "Код буруу байна")
      }
    } catch (error) {
      setLoginError("Баталгаажуулахад алдаа гарлаа")
    }

    setIsLoginLoading(false)
  }

  const handleRegister = async () => {
    setLoginError("")
    setSuccessMessage("")
    setIsLoginLoading(true)

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
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-slate-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-slate-700 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
          <CardContent className="p-8">
            {/* Header with Logo */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg overflow-hidden">
                {siteBranding?.logo ? (
                  <img
                    src={siteBranding.logo || "/placeholder.svg"}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">🍽️</span>
                )}
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

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-500/20 backdrop-blur border border-green-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-green-300" />
                  <p className="text-green-300 text-sm text-center">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Login Method Toggle */}
            {!isRegistering && (
              <div className="flex bg-white/10 backdrop-blur rounded-lg p-1 mb-6">
                <Button
                  variant={loginMethod === "email" ? "default" : "ghost"}
                  className={`flex-1 ${
                    loginMethod === "email"
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-black"
                      : "text-gray-300 hover:text-white"
                  }`}
                  onClick={() => {
                    setLoginMethod("email")
                    setIsCodeSent(false)
                    setLoginError("")
                    setSuccessMessage("")
                  }}
                  disabled={isLoginLoading}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  И-мэйл
                </Button>
                <Button
                  variant={loginMethod === "phone" ? "default" : "ghost"}
                  className={`flex-1 ${
                    loginMethod === "phone"
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-black"
                      : "text-gray-300 hover:text-white"
                  }`}
                  onClick={() => {
                    setLoginMethod("phone")
                    setIsCodeSent(false)
                    setLoginError("")
                    setSuccessMessage("")
                  }}
                  disabled={isLoginLoading}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Утас
                </Button>
              </div>
            )}

            {/* Social Login Buttons - only for email login */}
            {!isRegistering && loginMethod === "email" && (
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
                {loginMethod === "email" ? (
                  /* Email Login */
                  <>
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
                      onClick={handleEmailLogin}
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
                  </>
                ) : (
                  /* Phone Login */
                  <>
                    {!isCodeSent ? (
                      <>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-300">Утасны дугаар</label>
                          <div className="flex">
                            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-l-lg px-3 py-3 text-white border-r-0">
                              +976
                            </div>
                            <Input
                              type="tel"
                              placeholder="99999999"
                              value={phoneForm.phone}
                              onChange={(e) =>
                                setPhoneForm((prev) => ({
                                  ...prev,
                                  phone: e.target.value.replace(/\D/g, "").slice(0, 8),
                                }))
                              }
                              className="bg-white/10 backdrop-blur border border-white/20 text-white placeholder-gray-400 rounded-r-lg rounded-l-none py-3 px-4 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 border-l-0"
                              disabled={isLoginLoading}
                              maxLength={8}
                            />
                          </div>
                          <p className="text-xs text-gray-400">
                            8 оронтой дугаар оруулна уу.
                            <span className="text-yellow-400 font-medium"> 80901860</span> дугаараас код ирнэ.
                          </p>
                        </div>

                        <Button
                          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none"
                          onClick={handleSendCode}
                          disabled={isLoginLoading || phoneForm.phone.length !== 8}
                        >
                          {isLoginLoading ? (
                            <div className="flex items-center justify-center">
                              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                              SMS илгээж байна...
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              SMS код авах
                            </div>
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-300">Баталгаажуулах код</label>
                          <Input
                            type="text"
                            placeholder="123456"
                            value={phoneForm.code}
                            onChange={(e) =>
                              setPhoneForm((prev) => ({ ...prev, code: e.target.value.replace(/\D/g, "").slice(0, 6) }))
                            }
                            className="bg-white/10 backdrop-blur border border-white/20 text-white placeholder-gray-400 rounded-lg py-3 px-4 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest"
                            disabled={isLoginLoading}
                            maxLength={6}
                          />
                          <div className="text-xs text-gray-400 text-center space-y-1">
                            <p>
                              <span className="text-yellow-400 font-medium">80901860</span> дугаараас
                              <span className="text-white font-medium"> +976{phoneForm.phone}</span> руу илгээсэн
                            </p>
                            <p>6 оронтой кодыг оруулна уу</p>
                          </div>
                        </div>

                        <Button
                          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none"
                          onClick={handleVerifyCode}
                          disabled={isLoginLoading || phoneForm.code.length !== 6}
                        >
                          {isLoginLoading ? (
                            <div className="flex items-center justify-center">
                              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                              Баталгаажуулж байна...
                            </div>
                          ) : (
                            "Баталгаажуулах"
                          )}
                        </Button>

                        <div className="text-center space-y-2">
                          <Button
                            variant="ghost"
                            className="text-gray-400 hover:text-white text-sm"
                            onClick={() => {
                              setIsCodeSent(false)
                              setPhoneForm((prev) => ({ ...prev, code: "" }))
                              setSuccessMessage("")
                            }}
                            disabled={isLoginLoading}
                          >
                            Дугаар солих
                          </Button>
                          {countdown > 0 ? (
                            <p className="text-xs text-gray-400">
                              Дахин код авах: {Math.floor(countdown / 60)}:
                              {(countdown % 60).toString().padStart(2, "0")}
                            </p>
                          ) : (
                            <Button
                              variant="ghost"
                              className="text-yellow-400 hover:text-yellow-300 text-sm"
                              onClick={handleSendCode}
                              disabled={isLoginLoading}
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              SMS код дахин илгээх
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}

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
