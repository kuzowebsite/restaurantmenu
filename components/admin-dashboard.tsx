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
  Filter,
  Download,
  CheckCircle,
  Clock,
  Lock,
  Palette,
  Camera,
  ChefHat,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

// Firebase imports нэмэх
import { onValue, ref, database } from "../lib/firebase"

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

  // Add a new state for showing notification status
  const [notificationStatus, setNotificationStatus] = useState<{ [key: string]: boolean }>({})

  // Add this after the existing state definitions and before the helper functions
  const completedOrders =
    adminOrders
      ?.filter((order) => order?.status === "completed")
      ?.sort((a, b) => new Date(b?.completedTime || 0).getTime() - new Date(a?.completedTime || 0).getTime()) || []

  const sortedOrders =
    adminOrders
      ?.filter((order) => order?.status !== "completed")
      ?.sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()) || []

  // Helper functions for order status - updated to match user side exactly
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-400" />
      case "confirmed":
        return <CheckCircle className="w-5 h-5 text-blue-400" />
      case "ready":
        return <ChefHat className="w-5 h-5 text-green-400" />
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
        return "Захиалга баталгаажуулла"
      case "ready":
        return "Бэлэн болло"
      case "completed":
        return "Дууссан"
      default:
        return "Тодорхойгүй"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "confirmed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "ready":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getStatusDescription = (status: string, queuePosition?: number) => {
    switch (status) {
      case "pending":
        return queuePosition && queuePosition > 0
          ? `Дараалалд ${queuePosition}-р байрт байна`
          : "Таны захиалгыг хүлээн авч байна"
      case "confirmed":
        return "Таны захиалгыг баталгаажуулж, бэлтгэж эхэллээ"
      case "ready":
        return "Таны захиалга бэлэн боллоо! Авч болно"
      case "completed":
        return "Захиалга амжилттай дууссан"
      default:
        return "Статус тодорхойгүй"
    }
  }

  // Calculate queue position for pending orders
  const getQueuePosition = (orderId: string) => {
    const pendingOrders = sortedOrders.filter((order) => order.status === "pending")
    const orderIndex = pendingOrders.findIndex((order) => order.id === orderId)
    return orderIndex >= 0 ? orderIndex + 1 : 0
  }

  // handleUpdateOrderStatus функцийг real-time update хийхээр сайжруулах - COMPLETELY FIXED
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      console.log(`🔥 ADMIN: Updating order ${orderId} to status ${newStatus}`)

      // Show notification status for "ready" orders - АРИЛАХГҮЙ БАЙХ
      if (newStatus === "ready") {
        setNotificationStatus((prev) => ({ ...prev, [orderId]: true }))
      }

      // Find the order by order number (id field)
      const order = adminOrders.find((o) => o.id === orderId)
      if (!order) {
        console.error("🔥 ADMIN: ❌ Order not found:", orderId)
        console.log(
          "🔥 ADMIN: Available orders:",
          adminOrders.map((o) => ({ id: o.id, firebaseKey: o.firebaseKey })),
        )
        return
      }

      console.log("🔥 ADMIN: ✅ Found order:", order)

      // Create complete order update object with EXACT same structure
      const orderUpdate = {
        id: order.id, // Keep original ID format exactly
        customerName: order.customerName || "Зочин",
        customerEmail: order.customerEmail || "",
        table: order.table,
        items: order.items || [],
        total: order.total || 0,
        status: newStatus, // Update status
        paymentMethod: order.paymentMethod || "cash",
        orderTime: order.orderTime || new Date().toLocaleString("mn-MN"),
        createdAt: order.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Add completedTime if status is completed
      if (newStatus === "completed") {
        orderUpdate.completedTime = new Date().toISOString()
      }

      console.log("🔥 ADMIN: Order update object:", orderUpdate)

      // Get Firebase key - use firebaseKey if available, otherwise use id
      const firebaseKey = order.firebaseKey || order.id
      console.log("🔥 ADMIN: Using Firebase key:", firebaseKey)

      // Update in Firebase using the exact structure - FORCE COMPLETE REPLACEMENT
      await dbOperations.updateOrder(firebaseKey, orderUpdate)

      console.log(`🔥 ADMIN: ✅ Order ${orderId} updated successfully to ${newStatus}`)

      // Update local state immediately with exact same structure
      setAdminOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.id === orderId
            ? {
                ...orderUpdate,
                firebaseKey: o.firebaseKey || firebaseKey, // Preserve firebaseKey
              }
            : o,
        ),
      )

      // Force a longer delay to ensure Firebase propagation to all listeners
      await new Promise((resolve) => setTimeout(resolve, 500))

      console.log(`🔥 ADMIN: 🚀 Status change complete: ${orderId} -> ${newStatus}`)

      // Log the final state for debugging
      console.log("🔥 ADMIN: Final order state in Firebase should be:", orderUpdate)
    } catch (error) {
      console.error("🔥 ADMIN: ❌ Error updating order status:", error)
      alert("Захиалгын статус өөрчлөхөд алдаа гарлаа. Дахин оролдоно уу.")
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

          // Clear notification status for completed orders
          setNotificationStatus((prev) => {
            const updated = { ...prev }
            orders.forEach((order) => {
              if (order.status === "completed" && updated[order.id]) {
                updated[order.id] = false
              }
            })
            return updated
          })
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
                <div className="text-2xl font-bold text-yellow-400">
                  {sortedOrders?.filter((o) => o?.status === "pending")?.length || 0}
                </div>
                <div className="text-sm text-gray-400">Хүлээгдэж байна</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {sortedOrders?.filter((o) => o?.status === "confirmed")?.length || 0}
                </div>
                <div className="text-sm text-gray-400">Баталгаажуулла</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-400">
                  {sortedOrders?.filter((o) => o?.status === "ready")?.length || 0}
                </div>
                <div className="text-sm text-gray-400">Бэлэн болло</div>
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

            {/* Simplified Orders List - Only Ready Button */}
            <div className="space-y-4">
              {sortedOrders && sortedOrders.length > 0 ? (
                sortedOrders.map((order) => (
                  <Card key={order?.id} className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50">
                    <CardContent className="p-6">
                      {/* Order Header with Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-yellow-400 mb-2">Ширээ #{order?.table || "N/A"}</h3>
                          <p className="text-sm text-gray-400">Захиалгын дугаар: {order?.id || "N/A"}</p>
                          <p className="text-sm text-gray-400">Хэрэглэгч: {order?.customerName || "Зочин"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">
                            Огноо: {new Date(order?.createdAt || new Date()).toLocaleDateString("mn-MN")}
                          </p>
                          <p className="text-sm text-gray-400">
                            Цаг:{" "}
                            {order?.orderTime ||
                              new Date(order?.createdAt || new Date()).toLocaleTimeString("mn-MN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-400">₮{safeToLocaleString(order?.total)}</p>
                        </div>
                      </div>

                      {/* Order Items with Images */}
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-gray-300 mb-2">Захиалгын дэлгэрэнгүй:</h4>
                        <div className="space-y-2">
                          {order?.items && order.items.length > 0 ? (
                            order.items.map((item: any, index: number) => (
                              <div key={index} className="flex items-center gap-3 bg-gray-700/30 p-3 rounded-lg">
                                <img
                                  src={item?.image || "/placeholder.svg"}
                                  alt={item?.name || "Хоол"}
                                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                />
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="text-white font-medium">{item?.name || "N/A"}</span>
                                      <p className="text-xs text-gray-400">₮{safeToLocaleString(item?.price || 0)}</p>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-gray-300">× {item?.quantity || 0}</span>
                                      <p className="text-white font-bold">
                                        ₮{safeToLocaleString((item?.price || 0) * (item?.quantity || 0))}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-gray-500 text-center py-2">Захиалгын мэдээлэл байхгүй</div>
                          )}
                        </div>
                      </div>

                      {/* Enhanced Ready Button with Notification Status */}
                      <div className="text-center">
                        {notificationStatus[order.id] ? (
                          <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-center gap-3">
                              <div className="w-6 h-6 bg-green-400 rounded-full animate-pulse"></div>
                              <span className="text-green-400 font-medium">🔔 Дуут дохио дуугарч байна...</span>
                            </div>
                            <p className="text-green-200 text-sm mt-2">Хэрэглэгчид мэдэгдэл илгээгдлээ</p>
                          </div>
                        ) : (
                          <Button
                            size="lg"
                            className="bg-green-500 hover:bg-green-600 text-white font-bold px-12 py-3 text-lg shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                            onClick={() => {
                              console.log("🔥 ADMIN: Ready button clicked for order:", order.id)
                              handleUpdateOrderStatus(order.id, "ready")
                            }}
                          >
                            <ChefHat className="w-5 h-5 mr-2" />
                            Бэлэн болло
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-12 h-12 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-400 mb-3">Захиалга байхгүй</h3>
                  <p className="text-gray-500 mb-8">Одоогоор идэвхтэй захиалга байхгүй байна</p>
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ангиллын зураг</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center overflow-hidden">
                        {newCategory.icon ? (
                          <img
                            src={newCategory.icon || "/placeholder.svg"}
                            alt="Category"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-gray-400" />
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
                                setNewCategory({ ...newCategory, icon: base64Image })
                              } catch (error) {
                                console.error("Error uploading image:", error)
                              }
                            }
                          }}
                          className="hidden"
                          id="category-image-upload"
                        />
                        <label
                          htmlFor="category-image-upload"
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
                        <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center overflow-hidden">
                          {category.icon ? (
                            <img
                              src={category.icon || "/placeholder.svg"}
                              alt={category.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
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
                    <label className="block text-sm font-medium text-gray-300 mb-2">Ангиллын зураг</label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center overflow-hidden">
                          {editingCategory.icon ? (
                            <img
                              src={editingCategory.icon || "/placeholder.svg"}
                              alt="Category"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-gray-400" />
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
                                  setEditingCategory({ ...editingCategory, icon: base64Image })
                                } catch (error) {
                                  console.error("Error uploading image:", error)
                                }
                              }
                            }}
                            className="hidden"
                            id="edit-category-image-upload"
                          />
                          <label
                            htmlFor="edit-category-image-upload"
                            className="flex items-center justify-center w-full h-10 bg-gray-700 border border-gray-600 rounded-md cursor-pointer hover:bg-gray-600 text-white"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Зураг солих
                          </label>
                        </div>
                      </div>
                    </div>
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Бүтээгдэхүүний зураг</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center overflow-hidden">
                        {newProduct.image ? (
                          <img
                            src={newProduct.image || "/placeholder.svg"}
                            alt="Product"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-gray-400" />
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
                                setNewProduct({ ...newProduct, image: base64Image })
                              } catch (error) {
                                console.error("Error uploading image:", error)
                              }
                            }
                          }}
                          className="hidden"
                          id="product-image-upload"
                        />
                        <label
                          htmlFor="product-image-upload"
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
                      <label className="block text-sm font-medium text-gray-300 mb-2">Бүтээгдэхүүний зураг</label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center overflow-hidden">
                            {editingProduct.image ? (
                              <img
                                src={editingProduct.image || "/placeholder.svg"}
                                alt="Product"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-8 h-8 text-gray-400" />
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
                                    setEditingProduct({ ...editingProduct, image: base64Image })
                                  } catch (error) {
                                    console.error("Error uploading image:", error)
                                  }
                                }
                              }}
                              className="hidden"
                              id="edit-product-image-upload"
                            />
                            <label
                              htmlFor="edit-product-image-upload"
                              className="flex items-center justify-center w-full h-10 bg-gray-700 border border-gray-600 rounded-md cursor-pointer hover:bg-gray-600 text-white"
                            >
                              <Camera className="w-4 h-4 mr-2" />
                              Зураг солих
                            </label>
                          </div>
                        </div>
                      </div>
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

  // Continue with other management sections...
  return null
}
