"use client"

import { useState } from "react"
import { ArrowLeft, Eye, EyeOff, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type ViewType =
  | "home"
  | "checkout"
  | "status"
  | "history"
  | "profile"
  | "favorites"
  | "login"
  | "branches"
  | "admin"
  | "admin-categories"
  | "admin-products"
  | "admin-branches"
  | "admin-banners"
  | "admin-users"
  | "admin-orders"

interface AdminLoginProps {
  setCurrentView: (view: ViewType) => void
  adminLoginForm: { username: string; password: string }
  setAdminLoginForm: (form: { username: string; password: string }) => void
  adminLoginError: string
  handleAdminLogin: () => void
}

export default function AdminLogin({
  setCurrentView,
  adminLoginForm,
  setAdminLoginForm,
  adminLoginError,
  handleAdminLogin,
}: AdminLoginProps) {
  const [showPassword, setShowPassword] = useState(false)

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
              <h1 className="text-2xl font-bold text-white mb-2">Админ нэвтрэх</h1>
              <p className="text-gray-400">Админы эрхээр нэвтэрнэ үү</p>
            </div>

            {/* Error Message */}
            {adminLoginError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm">{adminLoginError}</p>
              </div>
            )}

            {/* Login Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Админы нэр</label>
                <Input
                  type="text"
                  placeholder="Админы нэрээ оруулна уу"
                  value={adminLoginForm.username}
                  onChange={(e) => setAdminLoginForm({ ...adminLoginForm, username: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Нууц үг</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Нууц үгээ оруулна уу"
                    value={adminLoginForm.password}
                    onChange={(e) => setAdminLoginForm({ ...adminLoginForm, password: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Button
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3"
                onClick={handleAdminLogin}
              >
                Админаар нэвтрэх
              </Button>
            </div>

            {/* Demo credentials */}
            <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-xs font-medium mb-1">Туршилтын админ бүртгэл:</p>
              <p className="text-red-300 text-xs">Нэр: admin</p>
              <p className="text-red-300 text-xs">Нууц үг: admin123</p>
            </div>

            {/* Back to Home */}
            <div className="mt-6 text-center">
              <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => setCurrentView("home")}>
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
