"use client"

import { useState, useEffect } from "react"
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
  Palette,
  Camera,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

// Firebase imports нэмэх
import { onValue, ref, database } from "../lib/firebase"

// Import хэсэгт нэмэх
import AdminHistory from "./admin-history"

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
  | "admin-branding"
  | "admin-history"

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
  dbOperations: any
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
  dbOperations,
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
  const [codeChangeError, setCodeChangeError] = useState(false)
  const [codeChangeSuccess, setCodeChangeSuccess] = useState(false)
  const [currentManagerCode, setCurrentManagerCode] = useState("")

  // Site branding state
  const [siteBranding, setSiteBranding] = useState({
    logo: "🍽️",
    name: "Монгол ресторан",
    subtitle: "Уламжлалт амттай хоол",
  })

  // Add this after the existing state definitions and before the helper functions
  const completedOrders =
    adminOrders
      ?.filter((order) => order?.status === "completed")
      ?.sort((a, b) => new Date(b?.completedTime || 0).getTime() - new Date(a?.completedTime || 0).getTime()) || []

  const sortedOrders =
    adminOrders
      ?.filter((order) => order?.status !== "completed")
      ?.sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()) || []

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

  // handleUpdateOrderStatus функцийг real-time update хийхээр өөрчлөх
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Find the order by order number (id field)
      const order = adminOrders.find((o) => o.id === orderId)
      if (!order) return

      const orderUpdate = {
        status: newStatus,
        completedTime: newStatus === "completed" ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      }

      // Update in Firebase using the Firebase key
      await dbOperations.updateOrder(order.firebaseKey || order.id, orderUpdate)

      // Update local state
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

  const handleSiteBrandingUpdate = async () => {
    try {
      // Save to Firebase Realtime Database
      await dbOperations.updateSiteBranding(siteBranding)
      // Also save to localStorage as backup
      localStorage.setItem("siteBranding", JSON.stringify(siteBranding))
      alert("Сайтын дизайн амжилттай хадгалагдлаа!")
    } catch (error) {
      console.error("Error updating site branding:", error)
      alert("Алдаа гарлаа. Дахин оролдоно уу.")
    }
  }

  // Admin хэсэгт real-time orders listener нэмэх
  useEffect(() => {
    if (currentView === "admin" || (isManager && currentView === "admin")) {
      // Listen for real-time order updates
      const ordersRef = ref(database, "orders")
      const unsubscribe = onValue(ordersRef, (snapshot) => {
        if (snapshot.exists()) {
          const orders = Object.entries(snapshot.val()).map(([key, value]) => ({
            firebaseKey: key,
            ...value,
          }))
          setAdminOrders(orders)
        } else {
          setAdminOrders([])
        }
      })

      return () => unsubscribe()
    }
  }, [currentView, isManager, setAdminOrders])

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

  // Site Branding Management
  if (currentView === "admin-branding") {
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
          <h1 className="text-lg font-semibold">Сайтын дизайн удирдах</h1>
          <div className="w-8" />
        </div>

        <div className="p-4 space-y-6">
          {/* Site Branding Settings */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Сайтын лого болон нэр
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Лого</label>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center overflow-hidden">
                      {siteBranding.logo.startsWith("data:") ? (
                        <img
                          src={siteBranding.logo || "/placeholder.svg"}
                          alt="Logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">{siteBranding.logo}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            try {
                              const base64Image = await dbOperations.uploadImage(file)
                              setSiteBranding({ ...siteBranding, logo: base64Image })
                            } catch (error) {
                              console.error("Error uploading logo:", error)
                            }
                          }
                        }}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="flex items-center justify-center w-full h-10 bg-gray-700 border border-gray-600 rounded-md cursor-pointer hover:bg-gray-600 text-white"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Зураг сонгох
                      </label>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">Зөвхөн зураг файл (.jpg, .png, .gif) оруулах боломжтой</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Сайтын нэр</label>
                <Input
                  placeholder="Монгол ресторан"
                  value={siteBranding.name}
                  onChange={(e) => setSiteBranding({ ...siteBranding, name: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Дэд гарчиг</label>
                <Input
                  placeholder="Уламжлалт амттай хоол"
                  value={siteBranding.subtitle}
                  onChange={(e) => setSiteBranding({ ...siteBranding, subtitle: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              {/* Preview */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Урьдчилан үзэх:</h3>
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center overflow-hidden">
                      {siteBranding.logo.startsWith("data:") ? (
                        <img
                          src={siteBranding.logo || "/placeholder.svg"}
                          alt="Logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl">{siteBranding.logo}</span>
                      )}
                    </div>
                    <div>
                      <h1 className="text-lg font-bold text-white">{siteBranding.name}</h1>
                      <p className="text-sm text-gray-300">{siteBranding.subtitle}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSiteBrandingUpdate}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              >
                Хадгалах
              </Button>
            </CardContent>
          </Card>
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
                onClick={() => setCurrentView("admin-branding")}
              >
                <Palette className="w-6 h-6 mr-3 text-pink-500" />
                <div className="text-left">
                  <div className="font-medium">Сайтын дизайн</div>
                  <div className="text-sm text-gray-400">Лого, нэр солих</div>
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
    // Admin Dashboard Main хэсэгт orders-ийг sort хийх

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
          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={currentView === "admin" ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentView("admin")}
              className={currentView === "admin" ? "bg-yellow-500 text-black" : "border-gray-600 text-gray-300"}
            >
              Идэвхтэй захиалгууд ({sortedOrders?.length || 0})
            </Button>
            <Button
              variant={currentView === "admin-history" ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentView("admin-history")}
              className={currentView === "admin-history" ? "bg-yellow-500 text-black" : "border-gray-600 text-gray-300"}
            >
              Түүх ({completedOrders?.length || 0})
            </Button>
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-500">
                  {sortedOrders?.filter((o) => o?.status === "pending")?.length || 0}
                </div>
                <div className="text-sm text-gray-400">Хүлээгдэж байна</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {sortedOrders?.filter((o) => o?.status === "confirmed")?.length || 0}
                </div>
                <div className="text-sm text-gray-400">Баталгаажсан</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {sortedOrders?.filter((o) => o?.status === "ready")?.length || 0}
                </div>
                <div className="text-sm text-gray-400">Бэлэн</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-500">{completedOrders?.length || 0}</div>
                <div className="text-sm text-gray-400">Дууссан</div>
              </CardContent>
            </Card>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Идэвхтэй захиалгууд ({sortedOrders?.length || 0})</h2>
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

            {/* Admin orders хэсэгт real-time мэдэгдэл нэмэх */}
            <div className="space-y-4">
              {sortedOrders && sortedOrders.length > 0 ? (
                sortedOrders.map((order) => (
                  <Card
                    key={order?.id}
                    className={`bg-gray-800 border-gray-700 ${order?.status === "pending" ? "ring-2 ring-yellow-500/50 animate-pulse" : ""}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(order?.status)}
                          <div>
                            <h3 className="font-semibold text-white text-lg flex items-center gap-2">
                              Захиалга: {order?.id || "N/A"}
                              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                Ширээ #{order?.table || "N/A"}
                              </Badge>
                              {order?.status === "pending" && (
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {order?.customerName || "Зочин"} • {order?.orderTime || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            className={`${getStatusColor(order?.status)} ${order?.status === "pending" ? "animate-pulse" : ""}`}
                          >
                            {getStatusText(order?.status)}
                          </Badge>
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

                      {/* Status Actions with enhanced styling */}
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
                              className="bg-blue-500 hover:bg-blue-600 text-white animate-pulse"
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
                              className="bg-green-500 hover:bg-green-600 text-white animate-pulse"
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
                  <div className="text-gray-500 mb-4">Захиалга байхгүй</div>
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300"
                    onClick={() => setCurrentView("home")}
                  >
                    Нүүр хуудас руу буцах
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Manager Access Modal */}
        {showManagerModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-gray-800 border-gray-700 w-full max-w-md">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4 text-center">Менежирийн код</h3>
                <div className="space-y-4">
                  <div>
                    <Input
                      type="password"
                      placeholder="6 оронтой код оруулна уу"
                      value={managerCode}
                      onChange={(e) => setManagerCode(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white text-center text-lg tracking-widest"
                      maxLength={6}
                    />
                    {codeError && <p className="text-red-400 text-sm mt-2 text-center">{codeError}</p>}
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 border-gray-600 text-gray-300"
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
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Manager Code Change Modal */}
        {showManagerCodeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-gray-800 border-gray-700 w-full max-w-md">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4 text-center">Менежирийн код солих</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Одоогийн код</label>
                    <Input
                      type="password"
                      placeholder="Одоогийн кодыг оруулна уу"
                      value={currentManagerCode}
                      onChange={(e) => setCurrentManagerCode(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white text-center tracking-widest"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Шинэ код</label>
                    <Input
                      type="password"
                      placeholder="Шинэ кодыг оруулна уу"
                      value={newManagerCode}
                      onChange={(e) => setNewManagerCode(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white text-center tracking-widest"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Шинэ код баталгаажуулах</label>
                    <Input
                      type="password"
                      placeholder="Шинэ кодыг дахин оруулна уу"
                      value={confirmManagerCode}
                      onChange={(e) => setConfirmManagerCode(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white text-center tracking-widest"
                    />
                  </div>
                  {codeChangeError && <p className="text-red-400 text-sm text-center">{codeChangeError}</p>}
                  {codeChangeSuccess && <p className="text-green-400 text-sm text-center">Код амжилттай солигдлоо!</p>}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 border-gray-600 text-gray-300"
                      onClick={() => {
                        setShowManagerCodeModal(false)
                        setCurrentManagerCode("")
                        setNewManagerCode("")
                        setConfirmManagerCode("")
                        setCodeChangeError("")
                        setCodeChangeSuccess(false)
                      }}
                    >
                      Цуцлах
                    </Button>
                    <Button
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                      onClick={handleManagerCodeChange}
                      disabled={!currentManagerCode || !newManagerCode || !confirmManagerCode}
                    >
                      Солих
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  // Categories Management
  if (currentView === "admin-categories") {
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ангиллын нэр</label>
                  <Input
                    placeholder="Жишээ: Үндсэн хоол"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Эможи</label>
                  <Input
                    placeholder="🍽️"
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white text-center"
                    maxLength={2}
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (newCategory.name && newCategory.icon) {
                    try {
                      const categoryData = {
                        name: newCategory.name,
                        icon: newCategory.icon,
                        createdAt: new Date().toISOString(),
                      }
                      const newCategoryId = await dbOperations.addCategory(categoryData)
                      setAdminCategories([...adminCategories, { id: newCategoryId, ...categoryData }])
                      setNewCategory({ name: "", icon: "" })
                    } catch (error) {
                      console.error("Error adding category:", error)
                    }
                  }
                }}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
                disabled={!newCategory.name || !newCategory.icon}
              >
                <Plus className="w-4 h-4 mr-2" />
                Ангилал нэмэх
              </Button>
            </CardContent>
          </Card>

          {/* Categories List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Одоогийн ангиллууд ({adminCategories?.length || 0})</h2>
            {adminCategories && adminCategories.length > 0 ? (
              adminCategories.map((category) => (
                <Card key={category.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category.icon}</span>
                        <div>
                          <h3 className="font-semibold text-white">{category.name}</h3>
                          <p className="text-sm text-gray-400">
                            Үүсгэсэн: {new Date(category.createdAt).toLocaleDateString("mn-MN")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:bg-blue-500/10"
                          onClick={() => setEditingCategory(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:bg-red-500/10"
                          onClick={async () => {
                            try {
                              await dbOperations.deleteCategory(category.id)
                              setAdminCategories(adminCategories.filter((c) => c.id !== category.id))
                            } catch (error) {
                              console.error("Error deleting category:", error)
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">Ангилал байхгүй</div>
              </div>
            )}
          </div>
        </div>

        {/* Edit Category Modal */}
        {editingCategory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-gray-800 border-gray-700 w-full max-w-md">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Ангилал засах</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Ангиллын нэр</label>
                    <Input
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Эможи</label>
                    <Input
                      value={editingCategory.icon}
                      onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white text-center"
                      maxLength={2}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 border-gray-600 text-gray-300"
                      onClick={() => setEditingCategory(null)}
                    >
                      Цуцлах
                    </Button>
                    <Button
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                      onClick={async () => {
                        try {
                          await dbOperations.updateCategory(editingCategory.id, {
                            name: editingCategory.name,
                            icon: editingCategory.icon,
                          })
                          setAdminCategories(
                            adminCategories.map((c) => (c.id === editingCategory.id ? editingCategory : c)),
                          )
                          setEditingCategory(null)
                        } catch (error) {
                          console.error("Error updating category:", error)
                        }
                      }}
                    >
                      Хадгалах
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  // Products Management
  if (currentView === "admin-products") {
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
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Бүтээгдэхүүний нэр</label>
                  <Input
                    placeholder="Жишээ: Буузны багц"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Үнэ (₮)</label>
                  <Input
                    type="number"
                    placeholder="15000"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Тайлбар</label>
                <Input
                  placeholder="Амттай уламжлалт буузны багц"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ангилал</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2"
                  >
                    <option value="">Ангилал сонгох</option>
                    {adminCategories?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Зургийн URL</label>
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={newProduct.image}
                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (newProduct.name && newProduct.price && newProduct.category) {
                    try {
                      const productData = {
                        name: newProduct.name,
                        description: newProduct.description,
                        price: Number.parseFloat(newProduct.price),
                        category: newProduct.category,
                        image: newProduct.image || "/placeholder.svg",
                        rating: 4.5,
                        createdAt: new Date().toISOString(),
                      }
                      const newProductId = await dbOperations.addMenuItem(productData)
                      setAdminMenuItems([...adminMenuItems, { id: newProductId, ...productData }])
                      setNewProduct({ name: "", description: "", price: "", category: "", image: "" })
                    } catch (error) {
                      console.error("Error adding product:", error)
                    }
                  }
                }}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
                disabled={!newProduct.name || !newProduct.price || !newProduct.category}
              >
                <Plus className="w-4 h-4 mr-2" />
                Бүтээгдэхүүн нэмэх
              </Button>
            </CardContent>
          </Card>

          {/* Products List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Одоогийн бүтээгдэхүүнүүд ({adminMenuItems?.length || 0})</h2>
            {adminMenuItems && adminMenuItems.length > 0 ? (
              adminMenuItems.map((product) => (
                <Card key={product.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-white text-lg">{product.name}</h3>
                            <p className="text-sm text-gray-400 mb-2">{product.description}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-yellow-500 font-semibold">
                                ₮{safeToLocaleString(product.price)}
                              </span>
                              <span className="text-gray-400">
                                Ангилал:{" "}
                                {adminCategories?.find((c) => c.id === product.category)?.name || "Тодорхойгүй"}
                              </span>
                              <span className="text-gray-400">⭐ {product.rating || 4.5}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-400 hover:bg-blue-500/10"
                              onClick={() => setEditingProduct(product)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:bg-red-500/10"
                              onClick={async () => {
                                try {
                                  await dbOperations.deleteMenuItem(product.id)
                                  setAdminMenuItems(adminMenuItems.filter((p) => p.id !== product.id))
                                } catch (error) {
                                  console.error("Error deleting product:", error)
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">Бүтээгдэхүүн байхгүй</div>
              </div>
            )}
          </div>
        </div>

        {/* Edit Product Modal */}
        {editingProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Бүтээгдэхүүн засах</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Бүтээгдэхүүний нэр</label>
                      <Input
                        value={editingProduct.name}
                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Үнэ (₮)</label>
                      <Input
                        type="number"
                        value={editingProduct.price}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, price: Number.parseFloat(e.target.value) })
                        }
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Тайлбар</label>
                    <Input
                      value={editingProduct.description}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Ангилал</label>
                      <select
                        value={editingProduct.category}
                        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2"
                      >
                        {adminCategories?.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.icon} {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Зургийн URL</label>
                      <Input
                        value={editingProduct.image}
                        onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 border-gray-600 text-gray-300"
                      onClick={() => setEditingProduct(null)}
                    >
                      Цуцлах
                    </Button>
                    <Button
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                      onClick={async () => {
                        try {
                          await dbOperations.updateMenuItem(editingProduct.id, {
                            name: editingProduct.name,
                            description: editingProduct.description,
                            price: editingProduct.price,
                            category: editingProduct.category,
                            image: editingProduct.image,
                          })
                          setAdminMenuItems(
                            adminMenuItems.map((p) => (p.id === editingProduct.id ? editingProduct : p)),
                          )
                          setEditingProduct(null)
                        } catch (error) {
                          console.error("Error updating product:", error)
                        }
                      }}
                    >
                      Хадгалах
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  // Branches Management
  if (currentView === "admin-branches") {
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
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Салбарын нэр</label>
                  <Input
                    placeholder="Жишээ: Төв салбар"
                    value={newBranch.name}
                    onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Утасны дугаар</label>
                  <Input
                    placeholder="+976 7777 0000"
                    value={newBranch.phone}
                    onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Хаяг</label>
                <Input
                  placeholder="Улаанбаатар хот, Сүхбаатар дүүрэг"
                  value={newBranch.address}
                  onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ажиллах цаг</label>
                  <Input
                    placeholder="09:00 - 22:00"
                    value={newBranch.hours}
                    onChange={(e) => setNewBranch({ ...newBranch, hours: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Зургийн URL</label>
                  <Input
                    placeholder="https://example.com/branch.jpg"
                    value={newBranch.image}
                    onChange={(e) => setNewBranch({ ...newBranch, image: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (newBranch.name && newBranch.address && newBranch.phone) {
                    try {
                      const branchData = {
                        name: newBranch.name,
                        address: newBranch.address,
                        phone: newBranch.phone,
                        hours: newBranch.hours || "09:00 - 22:00",
                        image: newBranch.image || "/placeholder.svg",
                        status: "Нээлттэй",
                        distance: "0.5 км",
                        createdAt: new Date().toISOString(),
                      }
                      const newBranchId = await dbOperations.addBranch(branchData)
                      setAdminBranches([...adminBranches, { id: newBranchId, ...branchData }])
                      setNewBranch({ name: "", address: "", phone: "", hours: "", image: "" })
                    } catch (error) {
                      console.error("Error adding branch:", error)
                    }
                  }
                }}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
                disabled={!newBranch.name || !newBranch.address || !newBranch.phone}
              >
                <Plus className="w-4 h-4 mr-2" />
                Салбар нэмэх
              </Button>
            </CardContent>
          </Card>

          {/* Branches List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Одоогийн салбарууд ({adminBranches?.length || 0})</h2>
            {adminBranches && adminBranches.length > 0 ? (
              adminBranches.map((branch) => (
                <Card key={branch.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={branch.image || "/placeholder.svg"}
                        alt={branch.name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-white text-lg">{branch.name}</h3>
                            <p className="text-sm text-gray-400 mb-1">{branch.address}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-400">📞 {branch.phone}</span>
                              <span className="text-gray-400">🕒 {branch.hours}</span>
                              <Badge
                                className={
                                  branch.status === "Нээлттэй"
                                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                                    : "bg-red-500/20 text-red-400 border-red-500/30"
                                }
                              >
                                {branch.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-400 hover:bg-blue-500/10"
                              onClick={() => setEditingBranch(branch)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:bg-red-500/10"
                              onClick={async () => {
                                try {
                                  await dbOperations.deleteBranch(branch.id)
                                  setAdminBranches(adminBranches.filter((b) => b.id !== branch.id))
                                } catch (error) {
                                  console.error("Error deleting branch:", error)
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">Салбар байхгүй</div>
              </div>
            )}
          </div>
        </div>

        {/* Edit Branch Modal */}
        {editingBranch && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Салбар засах</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Салбарын нэр</label>
                      <Input
                        value={editingBranch.name}
                        onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Утасны дугаар</label>
                      <Input
                        value={editingBranch.phone}
                        onChange={(e) => setEditingBranch({ ...editingBranch, phone: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Хаяг</label>
                    <Input
                      value={editingBranch.address}
                      onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Ажиллах цаг</label>
                      <Input
                        value={editingBranch.hours}
                        onChange={(e) => setEditingBranch({ ...editingBranch, hours: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Статус</label>
                      <select
                        value={editingBranch.status}
                        onChange={(e) => setEditingBranch({ ...editingBranch, status: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2"
                      >
                        <option value="Нээлттэй">Нээлттэй</option>
                        <option value="Хаалттай">Хаалттай</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Зургийн URL</label>
                    <Input
                      value={editingBranch.image}
                      onChange={(e) => setEditingBranch({ ...editingBranch, image: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 border-gray-600 text-gray-300"
                      onClick={() => setEditingBranch(null)}
                    >
                      Цуцлах
                    </Button>
                    <Button
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                      onClick={async () => {
                        try {
                          await dbOperations.updateBranch(editingBranch.id, {
                            name: editingBranch.name,
                            address: editingBranch.address,
                            phone: editingBranch.phone,
                            hours: editingBranch.hours,
                            status: editingBranch.status,
                            image: editingBranch.image,
                          })
                          setAdminBranches(adminBranches.map((b) => (b.id === editingBranch.id ? editingBranch : b)))
                          setEditingBranch(null)
                        } catch (error) {
                          console.error("Error updating branch:", error)
                        }
                      }}
                    >
                      Хадгалах
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  // Banners Management
  if (currentView === "admin-banners") {
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
              <CardTitle className="text-white">Шинэ баннер нэмэх</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Гарчиг</label>
                  <Input
                    placeholder="Жишээ: Багц хоол"
                    value={newBanner.title}
                    onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Дэд гарчиг</label>
                  <Input
                    placeholder="Амттай хоолны онцгой санал"
                    value={newBanner.subtitle}
                    onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Товчны текст</label>
                  <Input
                    placeholder="Үзэх"
                    value={newBanner.buttonText}
                    onChange={(e) => setNewBanner({ ...newBanner, buttonText: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Арын өнгө</label>
                  <Input
                    placeholder="#FF5722"
                    value={newBanner.bgColor}
                    onChange={(e) => setNewBanner({ ...newBanner, bgColor: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Зургийн URL</label>
                <Input
                  placeholder="https://example.com/banner.jpg"
                  value={newBanner.image}
                  onChange={(e) => setNewBanner({ ...newBanner, image: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <Button
                onClick={async () => {
                  if (newBanner.title && newBanner.subtitle) {
                    try {
                      const bannerData = {
                        title: newBanner.title,
                        subtitle: newBanner.subtitle,
                        buttonText: newBanner.buttonText || "Үзэх",
                        bgColor: newBanner.bgColor || "#FF5722",
                        image: newBanner.image || "/placeholder.svg",
                        isActive: true,
                        createdAt: new Date().toISOString(),
                      }
                      const newBannerId = await dbOperations.addBanner(bannerData)
                      setAdminBanners([...adminBanners, { id: newBannerId, ...bannerData }])
                      setNewBanner({ title: "", subtitle: "", buttonText: "", bgColor: "", image: "" })
                    } catch (error) {
                      console.error("Error adding banner:", error)
                    }
                  }
                }}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
                disabled={!newBanner.title || !newBanner.subtitle}
              >
                <Plus className="w-4 h-4 mr-2" />
                Баннер нэмэх
              </Button>
            </CardContent>
          </Card>

          {/* Banners List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Одоогийн баннерууд ({adminBanners?.length || 0})</h2>
            {adminBanners && adminBanners.length > 0 ? (
              adminBanners.map((banner) => (
                <Card key={banner.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-32 h-20 rounded-lg flex items-center justify-center text-white font-bold relative overflow-hidden"
                        style={{ backgroundColor: banner.bgColor || "#FF5722" }}
                      >
                        {banner.image && banner.image !== "/placeholder.svg" ? (
                          <img
                            src={banner.image || "/placeholder.svg"}
                            alt={banner.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm text-center">{banner.title}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-white text-lg">{banner.title}</h3>
                            <p className="text-sm text-gray-400 mb-2">{banner.subtitle}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-400">Товч: {banner.buttonText}</span>
                              <span className="text-gray-400">Өнгө: {banner.bgColor}</span>
                              <Badge
                                className={
                                  banner.isActive
                                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                                    : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                                }
                              >
                                {banner.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-yellow-400 hover:bg-yellow-500/10"
                              onClick={async () => {
                                try {
                                  await dbOperations.updateBanner(banner.id, { isActive: !banner.isActive })
                                  setAdminBanners(
                                    adminBanners.map((b) => (b.id === banner.id ? { ...b, isActive: !b.isActive } : b)),
                                  )
                                } catch (error) {
                                  console.error("Error toggling banner:", error)
                                }
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-400 hover:bg-blue-500/10"
                              onClick={() => setEditingBanner(banner)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:bg-red-500/10"
                              onClick={async () => {
                                try {
                                  await dbOperations.deleteBanner(banner.id)
                                  setAdminBanners(adminBanners.filter((b) => b.id !== banner.id))
                                } catch (error) {
                                  console.error("Error deleting banner:", error)
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">Баннер байхгүй</div>
              </div>
            )}
          </div>
        </div>

        {/* Edit Banner Modal */}
        {editingBanner && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Баннер засах</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Гарчиг</label>
                      <Input
                        value={editingBanner.title}
                        onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Дэд гарчиг</label>
                      <Input
                        value={editingBanner.subtitle}
                        onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Товчны текст</label>
                      <Input
                        value={editingBanner.buttonText}
                        onChange={(e) => setEditingBanner({ ...editingBanner, buttonText: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Арын өнгө</label>
                      <Input
                        value={editingBanner.bgColor}
                        onChange={(e) => setEditingBanner({ ...editingBanner, bgColor: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Зургийн URL</label>
                    <Input
                      value={editingBanner.image}
                      onChange={(e) => setEditingBanner({ ...editingBanner, image: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={editingBanner.isActive}
                      onCheckedChange={(checked) => setEditingBanner({ ...editingBanner, isActive: checked })}
                    />
                    <label className="text-sm text-gray-300">Идэвхжүүлэх</label>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 border-gray-600 text-gray-300"
                      onClick={() => setEditingBanner(null)}
                    >
                      Цуцлах
                    </Button>
                    <Button
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                      onClick={async () => {
                        try {
                          await dbOperations.updateBanner(editingBanner.id, {
                            title: editingBanner.title,
                            subtitle: editingBanner.subtitle,
                            buttonText: editingBanner.buttonText,
                            bgColor: editingBanner.bgColor,
                            image: editingBanner.image,
                            isActive: editingBanner.isActive,
                          })
                          setAdminBanners(adminBanners.map((b) => (b.id === editingBanner.id ? editingBanner : b)))
                          setEditingBanner(null)
                        } catch (error) {
                          console.error("Error updating banner:", error)
                        }
                      }}
                    >
                      Хадгалах
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  // Users Management
  if (currentView === "admin-users") {
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
          {/* Users Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-500">{adminUsers?.length || 0}</div>
                <div className="text-sm text-gray-400">Нийт хэрэглэгч</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-500">
                  {adminUsers?.filter((u) => u?.role === "user")?.length || 0}
                </div>
                <div className="text-sm text-gray-400">Энгийн хэрэглэгч</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-500">
                  {adminUsers?.filter((u) => u?.role === "admin")?.length || 0}
                </div>
                <div className="text-sm text-gray-400">Админ</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-500">
                  {adminUsers?.filter((u) => u?.isActive !== false)?.length || 0}
                </div>
                <div className="text-sm text-gray-400">Идэвхтэй</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Хэрэглэгч хайх..." className="pl-10 bg-gray-800 border-gray-700 text-white" />
            </div>
            <Button variant="outline" className="border-gray-600 text-gray-300">
              <Filter className="w-4 h-4 mr-2" />
              Шүүх
            </Button>
          </div>

          {/* Users List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Хэрэглэгчдийн жагсаалт</h2>
            {adminUsers && adminUsers.length > 0 ? (
              adminUsers.map((user) => (
                <Card key={user.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-lg">{user.name || "Нэргүй"}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {user.phone || "Утас байхгүй"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email || "И-мэйл байхгүй"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString("mn-MN") : "Огноо байхгүй"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          className={
                            user.role === "admin"
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          }
                        >
                          {user.role === "admin" ? "Админ" : "Хэрэглэгч"}
                        </Badge>
                        <Badge
                          className={
                            user.isActive !== false
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                          }
                        >
                          {user.isActive !== false ? "Идэвхтэй" : "Идэвхгүй"}
                        </Badge>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-yellow-400 hover:bg-yellow-500/10"
                            onClick={async () => {
                              try {
                                await dbOperations.updateUser(user.id, { isActive: user.isActive === false })
                                setAdminUsers(
                                  adminUsers.map((u) =>
                                    u.id === user.id ? { ...u, isActive: u.isActive === false } : u,
                                  ),
                                )
                              } catch (error) {
                                console.error("Error toggling user status:", error)
                              }
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-400 hover:bg-blue-500/10"
                            onClick={() => {
                              // Edit user functionality can be added here
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:bg-red-500/10"
                            onClick={async () => {
                              if (confirm("Энэ хэрэглэгчийг устгахдаа итгэлтэй байна уу?")) {
                                try {
                                  await dbOperations.deleteUser(user.id)
                                  setAdminUsers(adminUsers.filter((u) => u.id !== user.id))
                                } catch (error) {
                                  console.error("Error deleting user:", error)
                                }
                              }
                            }}
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
                <div className="text-gray-500 mb-4">Хэрэглэгч байхгүй</div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (currentView === "admin-history") {
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
          <div className="flex gap-2">
            <Button
              variant={currentView === "admin" ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentView("admin")}
              className={currentView === "admin" ? "bg-yellow-500 text-black" : "border-gray-600 text-gray-300"}
            >
              Захиалгууд
            </Button>
            <Button
              variant={currentView === "admin-history" ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentView("admin-history")}
              className={currentView === "admin-history" ? "bg-yellow-500 text-black" : "border-gray-600 text-gray-300"}
            >
              Түүх
            </Button>
          </div>
          <h1 className="text-lg font-semibold">
            {currentView === "admin-history" ? "Захиалгын түүх" : "Захиалга удирдах"}
          </h1>
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

            {/* Admin orders хэсэгт real-time мэдэгдэл нэмэх */}
            <div className="space-y-4">
              {completedOrders && completedOrders.length > 0 ? (
                completedOrders.map((order) => (
                  <Card
                    key={order?.id}
                    className={`bg-gray-800 border-gray-700 ${order?.status === "pending" ? "ring-2 ring-yellow-500/50 animate-pulse" : ""}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(order?.status)}
                          <div>
                            <h3 className="font-semibold text-white text-lg flex items-center gap-2">
                              {order?.id || "N/A"}
                              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                Ширээ #{order?.table || "N/A"}
                              </Badge>
                              {order?.status === "pending" && (
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {order?.customerName || "Зочин"} • {order?.orderTime || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            className={`${getStatusColor(order?.status)} ${order?.status === "pending" ? "animate-pulse" : ""}`}
                          >
                            {getStatusText(order?.status)}
                          </Badge>
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

                      {/* Status Actions with enhanced styling */}
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-400">
                          {order?.completedTime && (
                            <span>Дууссан: {new Date(order.completedTime).toLocaleString("mn-MN")}</span>
                          )}
                        </div>
                        <div className="flex gap-2">
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
                  <div className="text-gray-500 mb-4">Захиалга байхгүй</div>
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300"
                    onClick={() => setCurrentView("home")}
                  >
                    Нүүр хуудас руу буцах
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Manager Access Modal */}
        {showManagerModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-gray-800 border-gray-700 w-full max-w-md">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4 text-center">Менежирийн код</h3>
                <div className="space-y-4">
                  <div>
                    <Input
                      type="password"
                      placeholder="6 оронтой код оруулна уу"
                      value={managerCode}
                      onChange={(e) => setManagerCode(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white text-center text-lg tracking-widest"
                      maxLength={6}
                    />
                    {codeError && <p className="text-red-400 text-sm mt-2 text-center">{codeError}</p>}
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 border-gray-600 text-gray-300"
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
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Manager Code Change Modal */}
        {showManagerCodeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-gray-800 border-gray-700 w-full max-w-md">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4 text-center">Менежирийн код солих</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Одоогийн код</label>
                    <Input
                      type="password"
                      placeholder="Одоогийн кодыг оруулна уу"
                      value={currentManagerCode}
                      onChange={(e) => setCurrentManagerCode(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white text-center tracking-widest"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Шинэ код</label>
                    <Input
                      type="password"
                      placeholder="Шинэ кодыг оруулна уу"
                      value={newManagerCode}
                      onChange={(e) => setNewManagerCode(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white text-center tracking-widest"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Шинэ код баталгаажуулах</label>
                    <Input
                      type="password"
                      placeholder="Шинэ кодыг дахин оруулна уу"
                      value={confirmManagerCode}
                      onChange={(e) => setConfirmManagerCode(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white text-center tracking-widest"
                    />
                  </div>
                  {codeChangeError && <p className="text-red-400 text-sm text-center">{codeChangeError}</p>}
                  {codeChangeSuccess && <p className="text-green-400 text-sm text-center">Код амжилттай солигдлоо!</p>}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 border-gray-600 text-gray-300"
                      onClick={() => {
                        setShowManagerCodeModal(false)
                        setCurrentManagerCode("")
                        setNewManagerCode("")
                        setConfirmManagerCode("")
                        setCodeChangeError("")
                        setCodeChangeSuccess(false)
                      }}
                    >
                      Цуцлах
                    </Button>
                    <Button
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                      onClick={handleManagerCodeChange}
                      disabled={!currentManagerCode || !newManagerCode || !confirmManagerCode}
                    >
                      Солих
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  // Admin History Management хэсэг нэмэх
  if (currentView === "admin-history") {
    return (
      <AdminHistory
        completedOrders={completedOrders}
        setCurrentView={setCurrentView}
        safeToLocaleString={safeToLocaleString}
      />
    )
  }

  return null
}
