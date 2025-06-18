"use client"

import { useState } from "react"
import { ArrowLeft, Eye, EyeOff, User } from "lucide-react"
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
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-black" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">{isRegistering ? "Бүртгүүлэх" : "Нэвтрэх"}</h1>
              <p className="text-gray-400">
                {isRegistering ? "Шинэ хэрэглэгчийн бүртгэл үүсгэх" : "Өөрийн бүртгэлд нэвтэрнэ үү"}
              </p>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm">{loginError}</p>
              </div>
            )}

            {/* Login Form */}
            {!isRegistering ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">И-мэйл</label>
                  <Input
                    type="email"
                    placeholder="И-мэйлээ оруулна уу"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    disabled={isLoginLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Нууц үг</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Нууц үгээ оруулна уу"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-10"
                      disabled={isLoginLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoginLoading}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 disabled:opacity-50"
                  onClick={handleLogin}
                  disabled={isLoginLoading}
                >
                  {isLoginLoading ? "Нэвтэрч байна..." : "Нэвтрэх"}
                </Button>

                <div className="text-center">
                  <p className="text-gray-400 text-sm">
                    Бүртгэл байхгүй юу?{" "}
                    <button
                      className="text-yellow-500 hover:text-yellow-400 font-medium"
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
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Нэр</label>
                  <Input
                    type="text"
                    placeholder="Нэрээ оруулна уу"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    disabled={isLoginLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Утасны дугаар</label>
                  <Input
                    type="tel"
                    placeholder="+976 9999 9999"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    disabled={isLoginLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">И-мэйл</label>
                  <Input
                    type="email"
                    placeholder="example@email.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    disabled={isLoginLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Нууц үг</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Нууц үгээ оруулна уу"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-10"
                      disabled={isLoginLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoginLoading}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Нууц үг баталгаажуулах</label>
                  <Input
                    type="password"
                    placeholder="Нууц үгээ дахин оруулна уу"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    disabled={isLoginLoading}
                  />
                </div>

                <Button
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 disabled:opacity-50"
                  onClick={handleRegister}
                  disabled={isLoginLoading}
                >
                  {isLoginLoading ? "Бүртгүүлж байна..." : "Бүртгүүлэх"}
                </Button>

                <div className="text-center">
                  <p className="text-gray-400 text-sm">
                    Аль хэдийн бүртгэлтэй юу?{" "}
                    <button
                      className="text-yellow-500 hover:text-yellow-400 font-medium"
                      onClick={() => setIsRegistering(false)}
                      disabled={isLoginLoading}
                    >
                      Нэвтрэх
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* Demo credentials */}
            <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-xs font-medium mb-1">Туршилтын бүртгэл:</p>
              <p className="text-blue-300 text-xs">Хэрэглэгч: user@test.com / password123</p>
              <p className="text-red-300 text-xs">Админ: admin@test.com / admin123</p>
            </div>

            {/* Back to Home */}
            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white"
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
    </div>
  )
}
