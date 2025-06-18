"use client"

import type React from "react"

import { useState } from "react"
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Users,
  Package,
  MapPin,
  ImageIcon,
  LogOut,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Phone,
  Mail,
  Calendar,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

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

interface AdminDashboardProps {
  currentView: ViewType
  setCurrentView: (view: ViewType) => void
  isAdmin: boolean
  handleAdminLogout: () => void
  adminCategories: any[]
  setAdminCategories: (categories: any[]) => void
  adminMenuItems: any[]
  setAdminMenuItems: (items: any[]) => void
  adminBranches: any[]
  setAdminBranches: (branches: any[]) => void
  adminBanners: any[]
  setAdminBanners: (banners: any[]) => void
  adminUsers: any[]
  setAdminUsers: (users: any[]) => void
  adminOrders: any[]
  setAdminOrders: (orders: any[]) => void
  dbOperations: any // Add this line
}

export default function AdminDashboard({
  currentView,
  setCurrentView,
  isAdmin,
  handleAdminLogout,
  adminCategories,
  setAdminCategories,
  adminMenuItems,
  setAdminMenuItems,
  adminBranches,
  setAdminBranches,
  adminBanners,
  setAdminBanners,
  adminUsers,
  setAdminUsers,
  adminOrders,
  setAdminOrders,
  dbOperations, // Add this line
}: AdminDashboardProps) {
  // State-үүдийн хэсэгт нэмэх
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [editingBranch, setEditingBranch] = useState<any>(null)
  const [editingBanner, setEditingBanner] = useState<any>(null)

  const [newCategory, setNewCategory] = useState({ name: "", icon: "" })
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image: "",
  })
  const [newBranch, setNewBranch] = useState({
    name: "",
    address: "",
    phone: "",
    hours: "",
    image: "",
  })
  // newBanner state-ийг шинэчлэх
  const [newBanner, setNewBanner] = useState({
    title: "",
    subtitle: "",
    buttonText: "",
    bgColor: "",
    image: "",
  })

  const [showManagerModal, setShowManagerModal] = useState(false)
  const [managerCode, setManagerCode] = useState("")
  const [isManager, setIsManager] = useState(false)
  const [codeError, setCodeError] = useState("")

  const [showManagerCodeModal, setShowManagerCodeModal] = useState(false)
  const [newManagerCode, setNewManagerCode] = useState("")
  const [confirmManagerCode, setConfirmManagerCode] = useState("")
  const [codeChangeError, setCodeChangeError] = useState("")
  const [codeChangeSuccess, setCodeChangeSuccess] = useState(false)
  const [currentManagerCode, setCurrentManagerCode] = useState("")

  // Helper functions for order status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />
      case "confirmed":
        return <CheckCircle className="w-5 h-5 text-blue-500" />
      case "ready":
        return <AlertCircle className="w-5 h-5 text-orange-500" />
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Хүлээгдэж байна"
      case "confirmed":
        return "Баталгаажсан"
      case "ready":
        return "Бэлэн"
      case "completed":
        return "Дууссан"
      default:
        return "Тодорхойгүй"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "confirmed":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "ready":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const orderUpdate = {
        status: newStatus,
        completedTime: newStatus === "completed" ? new Date().toISOString() : null,
      }
      await dbOperations.updateOrder(orderId, orderUpdate)
      setAdminOrders(
        adminOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
                completedTime: newStatus === "completed" ? new Date().toISOString() : order.completedTime,
              }
            : order,
        ),
      )
    } catch (error) {
      console.error("Error updating order status:", error)
    }
  }

  // Helper function to safely format numbers
  const safeToLocaleString = (value: any): string => {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return "0"
    }
    return Number(value).toLocaleString()
  }

  // 6 оронтой менежирийн код
  // Change this line from const to let
  let MANAGER_CODE = "123456"

  const handleManagerAccess = () => {
    setCodeError("")
    if (managerCode === MANAGER_CODE) {
      setIsManager(true)
      setShowManagerModal(false)
      setManagerCode("")
    } else {
      setCodeError("Код буруу байна")
    }
  }

  const handleManagerCodeChange = () => {
    setCodeChangeError("")

    if (currentManagerCode !== MANAGER_CODE) {
      setCodeChangeError("Одоогийн код буруу байна")
      return
    }

    if (!newManagerCode || newManagerCode.length < 4) {
      setCodeChangeError("Шинэ код дор хаяж 4 тэмдэгт байх ёстой")
      return
    }

    if (newManagerCode !== confirmManagerCode) {
      setCodeChangeError("Шинэ кодууд таарахгүй байна")
      return
    }

    // Update the manager code
    MANAGER_CODE = newManagerCode
    setCodeChangeSuccess(true)

    setTimeout(() => {
      setShowManagerCodeModal(false)
      setCurrentManagerCode("")
      setNewManagerCode("")
      setConfirmManagerCode("")
      setCodeChangeSuccess(false)
    }, 3000)
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-400 mb-2">Админы эрх шаардлагатай</h3>
          <p className="text-gray-500 mb-6">Та админы эрхээр нэвтрэх шаардлагатай</p>
          <Button
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
            onClick={() => setCurrentView("home")}
          >
            Нүүр хуудас руу буцах
          </Button>
        </div>
      </div>
    )
  }

  // Manager Dashboard хэсэг
  if (isManager && currentView === "admin") {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsManager(false)
              setCurrentView("admin")
            }}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Менежирийн удирдлага</h1>
          <Button variant="ghost" size="sm" onClick={handleAdminLogout} className="text-red-400 hover:bg-red-500/10">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-500">{adminOrders?.length || 0}</div>
                <div className="text-sm text-gray-400">Нийт захиалга</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-500">{adminUsers?.length || 0}</div>
                <div className="text-sm text-gray-400">Хэрэглэгчид</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-500">{adminMenuItems?.length || 0}</div>
                <div className="text-sm text-gray-400">Бүтээгдэхүүн</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-500">{adminBranches?.length || 0}</div>
                <div className="text-sm text-gray-400">Салбарууд</div>
              </CardContent>
            </Card>
          </div>

          {/* Management Menu */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Менежирийн удирдлагын цэс</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-20 border-gray-700 text-gray-300 hover:bg-gray-800 justify-start"
                onClick={() => setCurrentView("admin-categories")}
              >
                <Package className="w-6 h-6 mr-3 text-blue-500" />
                <div className="text-left">
                  <div className="font-medium">Ангилал удирдах</div>
                  <div className="text-sm text-gray-400">{adminCategories?.length || 0} ангилал</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-20 border-gray-700 text-gray-300 hover:bg-gray-800 justify-start"
                onClick={() => setCurrentView("admin-products")}
              >
                <Package className="w-6 h-6 mr-3 text-green-500" />
                <div className="text-left">
                  <div className="font-medium">Бүтээгдэхүүн удирдах</div>
                  <div className="text-sm text-gray-400">{adminMenuItems?.length || 0} бүтээгдэхүүн</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-20 border-gray-700 text-gray-300 hover:bg-gray-800 justify-start"
                onClick={() => setCurrentView("admin-branches")}
              >
                <MapPin className="w-6 h-6 mr-3 text-purple-500" />
                <div className="text-left">
                  <div className="font-medium">Салбар удирдах</div>
                  <div className="text-sm text-gray-400">{adminBranches?.length || 0} салбар</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-20 border-gray-700 text-gray-300 hover:bg-gray-800 justify-start"
                onClick={() => setCurrentView("admin-banners")}
              >
                <ImageIcon className="w-6 h-6 mr-3 text-orange-500" />
                <div className="text-left">
                  <div className="font-medium">Сурчилгаа удирдах</div>
                  <div className="text-sm text-gray-400">{adminBanners?.length || 0} баннер</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-20 border-gray-700 text-gray-300 hover:bg-gray-800 justify-start"
                onClick={() => setCurrentView("admin-users")}
              >
                <Users className="w-6 h-6 mr-3 text-cyan-500" />
                <div className="text-left">
                  <div className="font-medium">Хэрэглэгч удирдах</div>
                  <div className="text-sm text-gray-400">{adminUsers?.length || 0} хэрэглэгч</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-20 border-gray-700 text-gray-300 hover:bg-gray-800 justify-start"
                onClick={() => setShowManagerCodeModal(true)}
              >
                <Lock className="w-6 h-6 mr-3 text-red-500" />
                <div className="text-left">
                  <div className="font-medium">Менежирийн код засах</div>
                  <div className="text-sm text-gray-400">Аюулгүй байдлын код солих</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Back to Orders */}
          <div className="text-center">
            <Button
              variant="outline"
              className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
              onClick={() => setIsManager(false)}
            >
              Захиалга удирдах руу буцах
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Admin Dashboard Main хэсгийг "admin-orders" болгож өөрчлөх
  if (currentView === "admin" && !isManager) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView("home")}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Захиалга удирдах</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
              onClick={() => setShowManagerModal(true)}
            >
              Тусгай
            </Button>
            <Button variant="ghost" size="sm" onClick={handleAdminLogout} className="text-red-400 hover:bg-red-500/10">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Orders Management Content */}
        <div className="p-4 space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-500">
                  {adminOrders?.filter((o) => o?.status === "pending")?.length || 0}
                </div>
                <div className="text-sm text-gray-400">Хүлээгдэж байна</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {adminOrders?.filter((o) => o?.status === "confirmed")?.length || 0}
                </div>
                <div className="text-sm text-gray-400">Баталгаажсан</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {adminOrders?.filter((o) => o?.status === "ready")?.length || 0}
                </div>
                <div className="text-sm text-gray-400">Бэлэн</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-500">
                  {adminOrders?.filter((o) => o?.status === "completed")?.length || 0}
                </div>
                <div className="text-sm text-gray-400">Дууссан</div>
              </CardContent>
            </Card>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Захиалгууд ({adminOrders?.length || 0})</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300">
                  <Filter className="w-4 h-4 mr-2" />
                  Шүүх
                </Button>
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300">
                  <Download className="w-4 h-4 mr-2" />
                  Экспорт
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {adminOrders && adminOrders.length > 0 ? (
                adminOrders.map((order) => (
                  <Card key={order?.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(order?.status)}
                          <div>
                            <h3 className="font-semibold text-white text-lg">{order?.id || "N/A"}</h3>
                            <p className="text-sm text-gray-400">
                              {order?.customerName || "Зочин"} • Ширээ #{order?.table || "N/A"} •{" "}
                              {order?.orderTime || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(order?.status)}>{getStatusText(order?.status)}</Badge>
                          <span className="font-semibold text-yellow-500 text-lg">
                            ₮{safeToLocaleString(order?.total)}
                          </span>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Захиалгын дэлгэрэнгүй:</h4>
                        <div className="space-y-1">
                          {order?.items && order.items.length > 0 ? (
                            order.items.map((item: any, index: number) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span className="text-gray-300">
                                  {item?.name || "N/A"} × {item?.quantity || 0}
                                </span>
                                <span className="text-gray-400">
                                  ₮{safeToLocaleString((item?.price || 0) * (item?.quantity || 0))}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-gray-500">Захиалгын мэдээлэл байхгүй</div>
                          )}
                        </div>
                      </div>

                      {/* Status Actions */}
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-400">
                          {order?.completedTime && (
                            <span>Дууссан: {new Date(order.completedTime).toLocaleString("mn-MN")}</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {order?.status === "pending" && (
                            <Button
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                              onClick={() => handleUpdateOrderStatus(order.id, "confirmed")}
                            >
                              Баталгаажуулах
                            </Button>
                          )}
                          {order?.status === "confirmed" && (
                            <Button
                              size="sm"
                              className="bg-orange-500 hover:bg-orange-600 text-white"
                              onClick={() => handleUpdateOrderStatus(order.id, "ready")}
                            >
                              Бэлэн болгох
                            </Button>
                          )}
                          {order?.status === "ready" && (
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600 text-white"
                              onClick={() => handleUpdateOrderStatus(order.id, "completed")}
                            >
                              Дуусгах
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="text-blue-400 hover:bg-blue-500/10">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">Захиалга байхгүй</h3>
                  <p className="text-gray-500">Одоогоор захиалга байхгүй байна</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Manager Access Modal */}
        {showManagerModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Менежирийн эрх</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowManagerModal(false)
                    setManagerCode("")
                    setCodeError("")
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <p className="text-yellow-400 text-sm">
                    Менежирийн удирдлагын хэсэгт нэвтрэхийн тулд 6 оронтой кодоо оруулна уу
                  </p>
                </div>

                {codeError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{codeError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Менежирийн код</label>
                  <Input
                    type="password"
                    placeholder="6 оронтой код"
                    value={managerCode}
                    onChange={(e) => setManagerCode(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={() => {
                      setShowManagerModal(false)
                      setManagerCode("")
                      setCodeError("")
                    }}
                  >
                    Цуцлах
                  </Button>
                  <Button
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                    onClick={handleManagerAccess}
                    disabled={managerCode.length !== 6}
                  >
                    Нэвтрэх
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-500">Туршилтын код: 123456</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manager Code Change Modal */}
        {showManagerCodeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Менежирийн код засах</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowManagerCodeModal(false)
                    setNewManagerCode("")
                    setConfirmManagerCode("")
                    setCodeChangeError("")
                    setCodeChangeSuccess(false)
                    setCurrentManagerCode("")
                  }}
                  className="text-gray-400 hover:text-white"
                  disabled={codeChangeSuccess}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <p className="text-yellow-400 text-sm">
                    Шинэ менежирийн код оруулна уу. Код нь текст, тоо, тэмдэгт агуулж болно.
                  </p>
                </div>

                {codeChangeError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{codeChangeError}</p>
                  </div>
                )}

                {codeChangeSuccess && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <p className="text-green-400 text-sm">Код амжилттай солигдлоо!</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Одоогийн код</label>
                  <Input
                    type="password"
                    placeholder="Одоогийн кодоо оруулна уу"
                    value={currentManagerCode}
                    onChange={(e) => setCurrentManagerCode(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                    disabled={codeChangeSuccess}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Шинэ код</label>
                  <Input
                    type="password"
                    placeholder="Шинэ кодоо оруулна уу"
                    value={newManagerCode}
                    onChange={(e) => setNewManagerCode(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                    disabled={codeChangeSuccess}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Код баталгаажуулах</label>
                  <Input
                    type="password"
                    placeholder="Кодоо дахин оруулна уу"
                    value={confirmManagerCode}
                    onChange={(e) => setConfirmManagerCode(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                    disabled={codeChangeSuccess}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => {
                      setShowManagerCodeModal(false)
                      setNewManagerCode("")
                      setConfirmManagerCode("")
                      setCodeChangeError("")
                      setCodeChangeSuccess(false)
                      setCurrentManagerCode("")
                    }}
                    disabled={codeChangeSuccess}
                  >
                    Цуцлах
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600"
                    onClick={handleManagerCodeChange}
                    disabled={!newManagerCode || !confirmManagerCode || codeChangeSuccess}
                  >
                    {codeChangeSuccess ? "Солигдлоо!" : "Код солих"}
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-500">Одоогийн код: {MANAGER_CODE}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Categories Management
  if (currentView === "admin-categories") {
    const handleEditCategory = (category: any) => {
      setEditingCategory(category)
      setNewCategory({ name: category.name, icon: category.icon })
    }

    const handleUpdateCategory = async () => {
      if (editingCategory && newCategory.name && newCategory.icon) {
        try {
          await dbOperations.updateCategory(editingCategory.id, newCategory)
          setAdminCategories(
            adminCategories.map((cat) => (cat.id === editingCategory.id ? { ...cat, ...newCategory } : cat)),
          )
          setEditingCategory(null)
          setNewCategory({ name: "", icon: "" })
        } catch (error) {
          console.error("Error updating category:", error)
        }
      }
    }

    const cancelEdit = () => {
      setEditingCategory(null)
      setNewCategory({ name: "", icon: "" })
    }

    const handleAddCategory = async () => {
      if (newCategory.name && newCategory.icon) {
        try {
          const newCat = {
            name: newCategory.name,
            icon: newCategory.icon,
          }
          const id = await dbOperations.addCategory(newCat)
          setAdminCategories([...adminCategories, { ...newCat, id }])
          setNewCategory({ name: "", icon: "" })
        } catch (error) {
          console.error("Error adding category:", error)
        }
      }
    }

    const handleDeleteCategory = async (categoryId: string) => {
      try {
        await dbOperations.deleteCategory(categoryId)
        setAdminCategories(adminCategories.filter((cat) => cat.id !== categoryId))
      } catch (error) {
        console.error("Error deleting category:", error)
      }
    }

    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView("admin")}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Ангилал удирдах</h1>
          <div className="w-8" />
        </div>

        <div className="p-4 space-y-6">
          {/* Add New Category */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Шинэ ангилал нэмэх</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Ангиллын нэр"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Input
                  placeholder="Emoji (🍵)"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Button
                  onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {editingCategory ? "Засах" : "Нэмэх"}
                </Button>
                {editingCategory && (
                  <Button
                    onClick={cancelEdit}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Цуцлах
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Categories List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Одоо байгаа ангиллууд ({adminCategories?.length || 0})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminCategories && adminCategories.length > 0 ? (
                adminCategories.map((category) => (
                  <Card key={category.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{category.icon}</span>
                          <div>
                            <h3 className="font-semibold text-white">{category.name}</h3>
                            <p className="text-sm text-gray-400">ID: {category.id}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-400 hover:bg-blue-500/10"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:bg-red-500/10"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">Ангилал байхгүй</h3>
                  <p className="text-gray-500">Одоогоор ангилал байхгүй байна</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Products Management
  if (currentView === "admin-products") {
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        try {
          const base64Image = await dbOperations.uploadImage(file)
          setNewProduct({ ...newProduct, image: base64Image })
        } catch (error) {
          console.error("Error uploading image:", error)
        }
      }
    }

    const handleEditProduct = (product: any) => {
      setEditingProduct(product)
      setNewProduct({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        category: product.category,
        image: product.image,
      })
    }

    const handleUpdateProduct = async () => {
      if (editingProduct && newProduct.name && newProduct.description && newProduct.price && newProduct.category) {
        try {
          const updatedProduct = {
            name: newProduct.name,
            description: newProduct.description,
            price: Number.parseInt(newProduct.price),
            category: newProduct.category,
            image: newProduct.image || "/placeholder.svg?height=100&width=100",
          }
          await dbOperations.updateMenuItem(editingProduct.id, updatedProduct)
          setAdminMenuItems(
            adminMenuItems.map((item) => (item.id === editingProduct.id ? { ...item, ...updatedProduct } : item)),
          )
          setEditingProduct(null)
          setNewProduct({ name: "", description: "", price: "", category: "", image: "" })
        } catch (error) {
          console.error("Error updating product:", error)
        }
      }
    }

    const cancelProductEdit = () => {
      setEditingProduct(null)
      setNewProduct({ name: "", description: "", price: "", category: "", image: "" })
    }

    const handleAddProduct = async () => {
      if (newProduct.name && newProduct.description && newProduct.price && newProduct.category) {
        try {
          const product = {
            name: newProduct.name,
            description: newProduct.description,
            price: Number.parseInt(newProduct.price),
            category: newProduct.category,
            rating: 4.5,
            image: newProduct.image || "/placeholder.svg?height=100&width=100",
          }
          const id = await dbOperations.addMenuItem(product)
          setAdminMenuItems([...adminMenuItems, { ...product, id }])
          setNewProduct({ name: "", description: "", price: "", category: "", image: "" })
        } catch (error) {
          console.error("Error adding product:", error)
        }
      }
    }

    const handleDeleteProduct = async (productId: number | string) => {
      try {
        await dbOperations.deleteMenuItem(productId.toString())
        setAdminMenuItems(adminMenuItems.filter((item) => item.id !== productId))
      } catch (error) {
        console.error("Error deleting product:", error)
      }
    }

    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView("admin")}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Бүтээгдэхүүн удирдах</h1>
          <div className="w-8" />
        </div>

        <div className="p-4 space-y-6">
          {/* Add New Product */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Шинэ бүтээгдэхүүн нэмэх</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Бүтээгдэхүүний нэр"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  <option value="">Ангилал сонгох</option>
                  {adminCategories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                placeholder="Тайлбар"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Үнэ (₮)"
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="product-image-upload"
                  />
                  <label
                    htmlFor="product-image-upload"
                    className="flex items-center justify-center w-full h-10 bg-gray-700 border border-gray-600 rounded-md cursor-pointer hover:bg-gray-600 text-white"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Зураг сонгох
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {editingProduct ? "Засах" : "Бүтээгдэхүүн нэмэх"}
                </Button>
                {editingProduct && (
                  <Button
                    onClick={cancelProductEdit}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Цуцлах
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Products List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Бүтээгдэхүүнүүд ({adminMenuItems?.length || 0})</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300">
                  <Filter className="w-4 h-4 mr-2" />
                  Шүүх
                </Button>
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300">
                  <Download className="w-4 h-4 mr-2" />
                  Экспорт
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminMenuItems && adminMenuItems.length > 0 ? (
                adminMenuItems.map((item) => (
                  <Card key={item.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{item.name}</h3>
                          <p className="text-sm text-gray-400 mb-2">{item.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-yellow-500">₮{safeToLocaleString(item.price)}</span>
                            <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                              {adminCategories?.find((cat) => cat.id === item.category)?.name || "N/A"}
                            </Badge>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-400 hover:bg-blue-500/10"
                              onClick={() => handleEditProduct(item)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:bg-red-500/10"
                              onClick={() => handleDeleteProduct(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">Бүтээгдэхүүн байхгүй</h3>
                  <p className="text-gray-500">Одоогоор бүтээгдэхүүн байхгүй байна</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Branches Management
  if (currentView === "admin-branches") {
    const handleBranchImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        try {
          const base64Image = await dbOperations.uploadImage(file)
          setNewBranch({ ...newBranch, image: base64Image })
        } catch (error) {
          console.error("Error uploading branch image:", error)
        }
      }
    }

    const handleEditBranch = (branch: any) => {
      setEditingBranch(branch)
      setNewBranch({
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        hours: branch.hours,
        image: branch.image,
      })
    }

    const handleUpdateBranch = async () => {
      if (editingBranch && newBranch.name && newBranch.address && newBranch.phone && newBranch.hours) {
        try {
          const updatedBranch = {
            ...newBranch,
            image: newBranch.image || "/placeholder.svg?height=120&width=200",
          }
          await dbOperations.updateBranch(editingBranch.id, updatedBranch)
          setAdminBranches(
            adminBranches.map((branch) => (branch.id === editingBranch.id ? { ...branch, ...updatedBranch } : branch)),
          )
          setEditingBranch(null)
          setNewBranch({ name: "", address: "", phone: "", hours: "", image: "" })
        } catch (error) {
          console.error("Error updating branch:", error)
        }
      }
    }

    const cancelBranchEdit = () => {
      setEditingBranch(null)
      setNewBranch({ name: "", address: "", phone: "", hours: "", image: "" })
    }

    const handleAddBranch = async () => {
      if (newBranch.name && newBranch.address && newBranch.phone && newBranch.hours) {
        try {
          const branch = {
            name: newBranch.name,
            address: newBranch.address,
            phone: newBranch.phone,
            hours: newBranch.hours,
            status: "Нээлттэй",
            distance: "0 км",
            image: newBranch.image || "/placeholder.svg?height=120&width=200",
          }
          const id = await dbOperations.addBranch(branch)
          setAdminBranches([...adminBranches, { ...branch, id }])
          setNewBranch({ name: "", address: "", phone: "", hours: "", image: "" })
        } catch (error) {
          console.error("Error adding branch:", error)
        }
      }
    }

    const handleDeleteBranch = async (branchId: number | string) => {
      try {
        await dbOperations.deleteBranch(branchId.toString())
        setAdminBranches(adminBranches.filter((branch) => branch.id !== branchId))
      } catch (error) {
        console.error("Error deleting branch:", error)
      }
    }

    const toggleBranchStatus = async (branchId: number | string) => {
      try {
        const branch = adminBranches.find((b) => b.id === branchId)
        if (branch) {
          const newStatus = branch.status === "Нээлттэй" ? "Хаалттай" : "Нээлттэй"
          await dbOperations.updateBranch(branchId.toString(), { status: newStatus })
          setAdminBranches(
            adminBranches.map((branch) => (branch.id === branchId ? { ...branch, status: newStatus } : branch)),
          )
        }
      } catch (error) {
        console.error("Error updating branch status:", error)
      }
    }

    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView("admin")}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Салбар удирдах</h1>
          <div className="w-8" />
        </div>

        <div className="p-4 space-y-6">
          {/* Add New Branch */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Шинэ салбар нэмэх</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Салбарын нэр"
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Input
                  placeholder="Утасны дугаар"
                  value={newBranch.phone}
                  onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <Input
                placeholder="Хаяг"
                value={newBranch.address}
                onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
              <Input
                placeholder="Ажиллах цаг (08:00 - 22:00)"
                value={newBranch.hours}
                onChange={(e) => setNewBranch({ ...newBranch, hours: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBranchImageUpload}
                  className="hidden"
                  id="branch-image-upload"
                />
                <label
                  htmlFor="branch-image-upload"
                  className="flex items-center justify-center w-full h-10 bg-gray-700 border border-gray-600 rounded-md cursor-pointer hover:bg-gray-600 text-white"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Зураг сонгох
                </label>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={editingBranch ? handleUpdateBranch : handleAddBranch}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {editingBranch ? "Засах" : "Салбар нэмэх"}
                </Button>
                {editingBranch && (
                  <Button
                    onClick={cancelBranchEdit}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 ml-2"
                  >
                    Цуцлах
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Branches List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Салбарууд ({adminBranches?.length || 0})</h2>
            <div className="space-y-4">
              {adminBranches && adminBranches.length > 0 ? (
                adminBranches.map((branch) => (
                  <Card key={branch.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <img
                            src={branch.image || "/placeholder.svg"}
                            alt={branch.name}
                            className="w-20 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-white text-lg">{branch.name}</h3>
                              <Badge
                                className={`${
                                  branch.status === "Нээлттэй"
                                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                                    : "bg-red-500/10 text-red-500 border-red-500/20"
                                }`}
                              >
                                {branch.status}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-300">{branch.address}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-300">{branch.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-300">{branch.hours}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">Статус:</span>
                            <Switch
                              checked={branch.status === "Нээлттэй"}
                              onCheckedChange={() => toggleBranchStatus(branch.id)}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-400 hover:bg-blue-500/10"
                              onClick={() => handleEditBranch(branch)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:bg-red-500/10"
                              onClick={() => handleDeleteBranch(branch.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">Салбар байхгүй</h3>
                  <p className="text-gray-500">Одоогоор салбар байхгүй байна</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Banners Management
  if (currentView === "admin-banners") {
    const handleBannerImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        try {
          const base64Image = await dbOperations.uploadImage(file)
          setNewBanner({ ...newBanner, image: base64Image })
        } catch (error) {
          console.error("Error uploading banner image:", error)
        }
      }
    }

    const handleEditBanner = (banner: any) => {
      setEditingBanner(banner)
      setNewBanner({
        title: banner.title,
        subtitle: banner.subtitle,
        buttonText: banner.buttonText,
        bgColor: banner.bgColor,
        image: banner.image,
      })
    }

    const handleUpdateBanner = async () => {
      if (editingBanner && newBanner.title && newBanner.subtitle && newBanner.buttonText && newBanner.bgColor) {
        try {
          const updatedBanner = {
            title: newBanner.title,
            subtitle: newBanner.subtitle,
            buttonText: newBanner.buttonText,
            bgColor: newBanner.bgColor,
            image: newBanner.image || "/placeholder.svg?height=80&width=80",
          }
          await dbOperations.updateBanner(editingBanner.id, updatedBanner)
          setAdminBanners(
            adminBanners.map((banner) => (banner.id === editingBanner.id ? { ...banner, ...updatedBanner } : banner)),
          )
          setEditingBanner(null)
          setNewBanner({ title: "", subtitle: "", buttonText: "", bgColor: "", image: "" })
        } catch (error) {
          console.error("Error updating banner:", error)
        }
      }
    }

    const cancelBannerEdit = () => {
      setEditingBanner(null)
      setNewBanner({ title: "", subtitle: "", buttonText: "", bgColor: "", image: "" })
    }

    const handleAddBanner = async () => {
      if (newBanner.title && newBanner.subtitle && newBanner.buttonText && newBanner.bgColor) {
        try {
          const banner = {
            title: newBanner.title,
            subtitle: newBanner.subtitle,
            buttonText: newBanner.buttonText,
            bgColor: newBanner.bgColor,
            image: "/placeholder.svg?height=80&width=80",
          }
          const id = await dbOperations.addBanner(banner)
          setAdminBanners([...adminBanners, { ...banner, id }])
          setNewBanner({ title: "", subtitle: "", buttonText: "", bgColor: "" })
        } catch (error) {
          console.error("Error adding banner:", error)
        }
      }
    }

    const handleDeleteBanner = async (bannerId: number | string) => {
      try {
        await dbOperations.deleteBanner(bannerId.toString())
        setAdminBanners(adminBanners.filter((banner) => banner.id !== bannerId))
      } catch (error) {
        console.error("Error deleting banner:", error)
      }
    }

    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView("admin")}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Сурчилгаа удирдах</h1>
          <div className="w-8" />
        </div>

        <div className="p-4 space-y-6">
          {/* Add New Banner */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Шинэ сурчилгаа нэмэх</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Гарчиг"
                  value={newBanner.title}
                  onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Input
                  placeholder="Дэд гарчиг"
                  value={newBanner.subtitle}
                  onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Товчлуурын текст"
                  value={newBanner.buttonText}
                  onChange={(e) => setNewBanner({ ...newBanner, buttonText: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <select
                  value={newBanner.bgColor}
                  onChange={(e) => setNewBanner({ ...newBanner, bgColor: e.target.value })}
                  className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  <option value="">Өнгө сонгох</option>
                  <option value="from-green-600 to-green-500">Ногоон</option>
                  <option value="from-blue-600 to-blue-500">Цэнхэр</option>
                  <option value="from-purple-600 to-purple-500">Ягаан</option>
                  <option value="from-orange-600 to-orange-500">Улбар шар</option>
                  <option value="from-red-600 to-red-500">Улаан</option>
                </select>
              </div>

              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerImageUpload}
                  className="hidden"
                  id="banner-image-upload"
                />
                <label
                  htmlFor="banner-image-upload"
                  className="flex items-center justify-center w-full h-10 bg-gray-700 border border-gray-600 rounded-md cursor-pointer hover:bg-gray-600 text-white"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Зураг сонгох
                </label>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={editingBanner ? handleUpdateBanner : handleAddBanner}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {editingBanner ? "Засах" : "Сурчилгаа нэмэх"}
                </Button>
                {editingBanner && (
                  <Button
                    onClick={cancelBannerEdit}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Цуцлах
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Banners List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Сурчилгаанууд ({adminBanners?.length || 0})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adminBanners && adminBanners.length > 0 ? (
                adminBanners.map((banner) => (
                  <Card key={banner.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      {/* Banner Preview */}
                      <div className={`bg-gradient-to-r ${banner.bgColor} rounded-lg p-4 mb-4`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-semibold text-lg">{banner.title}</p>
                            <p className="text-white/90 text-sm">{banner.subtitle}</p>
                            <Button size="sm" className="mt-2 bg-white text-gray-800 hover:bg-gray-100">
                              {banner.buttonText}
                            </Button>
                          </div>
                          <img
                            src={banner.image || "/placeholder.svg?height=60&width=60"}
                            alt="Banner"
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-white">{banner.title}</h3>
                          <p className="text-sm text-gray-400">ID: {banner.id}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-400 hover:bg-blue-500/10"
                            onClick={() => handleEditBanner(banner)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:bg-red-500/10"
                            onClick={() => handleDeleteBanner(banner.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">Сурчилгаа байхгүй</h3>
                  <p className="text-gray-500">Одоогоор сурчилгаа байхгүй байна</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Users Management
  if (currentView === "admin-users") {
    const handleToggleUserStatus = async (userId: number | string) => {
      try {
        const user = adminUsers.find((u) => u.id === userId)
        if (user) {
          const newStatus = user.status === "active" ? "inactive" : "active"
          await dbOperations.updateUser(userId.toString(), { status: newStatus })
          setAdminUsers(adminUsers.map((user) => (user.id === userId ? { ...user, status: newStatus } : user)))
        }
      } catch (error) {
        console.error("Error updating user status:", error)
      }
    }

    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView("admin")}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Хэрэглэгч удирдах</h1>
          <div className="w-8" />
        </div>

        <div className="p-4 space-y-6">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Хэрэглэгч хайх..." className="pl-10 bg-gray-800 border-gray-700 text-white" />
            </div>
            <Button variant="outline" className="border-gray-600 text-gray-300">
              <Filter className="w-4 h-4 mr-2" />
              Шүүх
            </Button>
          </div>

          {/* Users List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Хэрэглэгчид ({adminUsers?.length || 0})</h2>
              <Button variant="outline" size="sm" className="border-gray-600 text-gray-300">
                <Download className="w-4 h-4 mr-2" />
                Экспорт
              </Button>
            </div>
            <div className="space-y-4">
              {adminUsers && adminUsers.length > 0 ? (
                adminUsers.map((user) => (
                  <Card key={user.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-blue-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{user.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                {user.email}
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                {user.phone}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(user.joinDate).toLocaleDateString("mn-MN")}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm text-gray-400">Захиалга: {user.totalOrders || 0}</div>
                            <div className="text-sm text-yellow-500">₮{safeToLocaleString(user.totalSpent)}</div>
                          </div>
                          <Badge
                            className={`${
                              user.status === "active"
                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                : "bg-red-500/10 text-red-500 border-red-500/20"
                            }`}
                          >
                            {user.status === "active" ? "Идэвхтэй" : "Идэвхгүй"}
                          </Badge>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="text-blue-400 hover:bg-blue-500/10">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`${
                                user.status === "active"
                                  ? "text-red-400 hover:bg-red-500/10"
                                  : "text-green-400 hover:bg-green-500/10"
                              }`}
                              onClick={() => handleToggleUserStatus(user.id)}
                            >
                              {user.status === "active" ? "Хаах" : "Нээх"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">Хэрэглэгч байхгүй</h3>
                  <p className="text-gray-500">Одоогоор хэрэглэгч байхгүй байна</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Orders Management
  if (currentView === "admin-orders") {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView("admin")}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Захиалга удирдах</h1>
          <div className="w-8" />
        </div>

        <div className="p-4 space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-500">
                  {adminOrders?.filter((o) => o?.status === "pending")?.length || 0}
                </div>
                <div className="text-sm text-gray-400">Хүлээгдэж байна</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {adminOrders?.filter((o) => o?.status === "confirmed")?.length || 0}
                </div>
                <div className="text-sm text-gray-400">Баталгаажсан</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {adminOrders?.filter((o) => o?.status === "ready")?.length || 0}
                </div>
                <div className="text-sm text-gray-400">Бэлэн</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-500">
                  {adminOrders?.filter((o) => o?.status === "completed")?.length || 0}
                </div>
                <div className="text-sm text-gray-400">Дууссан</div>
              </CardContent>
            </Card>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Захиалгууд ({adminOrders?.length || 0})</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300">
                  <Filter className="w-4 h-4 mr-2" />
                  Шүүх
                </Button>
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300">
                  <Download className="w-4 h-4 mr-2" />
                  Экспорт
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {adminOrders && adminOrders.length > 0 ? (
                adminOrders.map((order) => (
                  <Card key={order?.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(order?.status)}
                          <div>
                            <h3 className="font-semibold text-white text-lg">{order?.id || "N/A"}</h3>
                            <p className="text-sm text-gray-400">
                              {order?.customerName || "Зочин"} • Ширээ #{order?.table || "N/A"} •{" "}
                              {order?.orderTime || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(order?.status)}>{getStatusText(order?.status)}</Badge>
                          <span className="font-semibold text-yellow-500 text-lg">
                            ₮{safeToLocaleString(order?.total)}
                          </span>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Захиалгын дэлгэрэнгүй:</h4>
                        <div className="space-y-1">
                          {order?.items && order.items.length > 0 ? (
                            order.items.map((item: any, index: number) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span className="text-gray-300">
                                  {item?.name || "N/A"} × {item?.quantity || 0}
                                </span>
                                <span className="text-gray-400">
                                  ₮{safeToLocaleString((item?.price || 0) * (item?.quantity || 0))}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-gray-500">Захиалгын мэдээлэл байхгүй</div>
                          )}
                        </div>
                      </div>

                      {/* Status Actions */}
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-400">
                          {order?.completedTime && (
                            <span>Дууссан: {new Date(order.completedTime).toLocaleString("mn-MN")}</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {order?.status === "pending" && (
                            <Button
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                              onClick={() => handleUpdateOrderStatus(order.id, "confirmed")}
                            >
                              Баталгаажуулах
                            </Button>
                          )}
                          {order?.status === "confirmed" && (
                            <Button
                              size="sm"
                              className="bg-orange-500 hover:bg-orange-600 text-white"
                              onClick={() => handleUpdateOrderStatus(order.id, "ready")}
                            >
                              Бэлэн болгох
                            </Button>
                          )}
                          {order?.status === "ready" && (
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600 text-white"
                              onClick={() => handleUpdateOrderStatus(order.id, "completed")}
                            >
                              Дуусгах
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="text-blue-400 hover:bg-blue-500/10">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">Захиалга байхгүй</h3>
                  <p className="text-gray-500">Одоогоор захиалга байхгүй байна</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
