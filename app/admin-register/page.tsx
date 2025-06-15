"use client"

import { useState } from "react"
import { ArrowLeft, Shield, Eye, EyeOff, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { authOperations } from "../../lib/firebase"

export default function AdminRegisterPage() {
  const router = useRouter()
  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    secretKey: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Аюулгүй байдлын түлхүүр - энэ нь production-д байх ёсгүй!
  const ADMIN_SECRET_KEY = "RESTAURANT_ADMIN_2024_SECRET"

  const handleAdminRegister = async () => {
    setError("")
    setIsLoading(true)

    // Validation
    if (!adminForm.name || !adminForm.email || !adminForm.phone || !adminForm.password || !adminForm.secretKey) {
      setError("Бүх талбарыг бөглөнө үү")
      setIsLoading(false)
      return
    }

    if (adminForm.password !== adminForm.confirmPassword) {
      setError("Нууц үг таарахгүй байна")
      setIsLoading(false)
      return
    }

    if (adminForm.password.length < 6) {
      setError("Нууц үг дор хаяж 6 тэмдэгт байх ёстой")
      setIsLoading(false)
      return
    }

    if (adminForm.secretKey !== ADMIN_SECRET_KEY) {
      setError("Админы нууц түлхүүр буруу байна")
      setIsLoading(false)
      return
    }

    try {
      const result = await authOperations.registerUser(adminForm.email, adminForm.password, {
        name: adminForm.name,
        phone: adminForm.phone,
        role: "admin", // Админы эрх өгөх
      })

      if (result.success && result.user) {
        setSuccess(true)
        setAdminForm({
          name: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
          secretKey: "",
        })
      } else {
        setError(result.error || "Админ бүртгэлд алдаа гарлаа")
      }
    } catch (error) {
      setError("Админ бүртгэлд алдаа гарлаа")
    }

    setIsLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-green-500 mb-2">Амжилттай бүртгэгдлээ!</h1>
              <p className="text-gray-400 mb-6">Админы бүртгэл амжилттай үүсгэгдлээ</p>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-yellow-500 font-medium text-sm">Анхааруулга!</p>
                    <p className="text-yellow-200 text-sm mt-1">
                      Аюулгүй байдлын үүднээс энэ хуудсыг одоо устгана уу. Админ бүртгэл үүсгэсний дараа энэ хуудас
                      хэрэггүй болно.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold"
                  onClick={() => router.push("/login")}
                >
                  Нэвтрэх хуудас руу очих
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                  onClick={() => router.push("/")}
                >
                  Нүүр хуудас руу буцах
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Админ бүртгүүлэх</h1>
              <p className="text-gray-400">Шинэ админ хэрэглэгч үүсгэх</p>
            </div>

            {/* Warning */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-400 font-medium text-sm">Анхааруулга!</p>
                  <p className="text-red-300 text-sm mt-1">
                    Энэ хуудас зөвхөн админ бүртгэх зорилгоор үүсгэгдсэн. Бүртгэлийн дараа аюулгүй байдлын үүднээс
                    устгана уу.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Admin Registration Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Админы нэр</label>
                <Input
                  type="text"
                  placeholder="Админы нэрээ оруулна уу"
                  value={adminForm.name}
                  onChange={(e) => setAdminForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">И-мэйл</label>
                <Input
                  type="email"
                  placeholder="admin@restaurant.mn"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Утасны дугаар</label>
                <Input
                  type="tel"
                  placeholder="+976 9999 9999"
                  value={adminForm.phone}
                  onChange={(e) => setAdminForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Нууц үг</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Нууц үгээ оруулна уу"
                    value={adminForm.password}
                    onChange={(e) => setAdminForm((prev) => ({ ...prev, password: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-10"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Нууц үг баталгаажуулах</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Нууц үгээ дахин оруулна уу"
                    value={adminForm.confirmPassword}
                    onChange={(e) => setAdminForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-10"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Админы нууц түлхүүр</label>
                <Input
                  type="password"
                  placeholder="Админы нууц түлхүүрээ оруулна уу"
                  value={adminForm.secretKey}
                  onChange={(e) => setAdminForm((prev) => ({ ...prev, secretKey: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">Админы эрх авахын тулд тусгай нууц түлхүүр шаардлагатай</p>
              </div>

              <Button
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 disabled:opacity-50"
                onClick={handleAdminRegister}
                disabled={isLoading}
              >
                {isLoading ? "Бүртгүүлж байна..." : "Админаар бүртгүүлэх"}
              </Button>
            </div>

            {/* Secret Key Info */}
            <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-xs font-medium mb-1">Туршилтын нууц түлхүүр:</p>
              <p className="text-blue-300 text-xs font-mono">RESTAURANT_ADMIN_2024_SECRET</p>
              <p className="text-blue-200 text-xs mt-1">⚠️ Энэ мэдээллийг production-д ашиглахгүй!</p>
            </div>

            {/* Back to Home */}
            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white"
                onClick={() => router.push("/")}
                disabled={isLoading}
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
