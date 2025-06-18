"use client"

import { useState, useEffect, useRef } from "react"
import {
  Search,
  Star,
  Plus,
  ArrowLeft,
  Home,
  User,
  ShoppingBag,
  Clock,
  CheckCircle,
  ChefHat,
  Heart,
  Phone,
  Mail,
  Bell,
  Globe,
  LogOut,
  Edit,
  Camera,
  Lock,
  MapPin,
  Navigation,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { dbOperations } from "../lib/firebase"

interface MenuItem {
  id: number | string
  name: string
  description: string
  price: number
  rating: number
  image: string
  category: string
}

interface CartItem extends MenuItem {
  quantity: number
}

type OrderStatus = "pending" | "confirmed" | "ready" | "completed"

type ViewType = "home" | "checkout" | "status" | "history" | "profile" | "favorites" | "branches"

const FoodCardSkeleton = () => {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-3">
        <Skeleton className="w-full h-24 rounded-lg mb-3 bg-gray-700" />
        <Skeleton className="h-4 w-3/4 mb-2 bg-gray-700" />
        <Skeleton className="h-3 w-full mb-2 bg-gray-700" />
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-3 w-12 bg-gray-700" />
          <Skeleton className="h-4 w-16 bg-gray-700" />
        </div>
        <Skeleton className="h-8 w-full bg-gray-700" />
      </CardContent>
    </Card>
  )
}

export default function FoodDeliveryApp() {
  const router = useRouter()
  const [currentView, setCurrentView] = useState<ViewType>("home")
  const [activeCategory, setActiveCategory] = useState("цай")
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<string>("cash")
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("pending")
  const [orderNumber, setOrderNumber] = useState<string>("")
  const [queuePosition, setQueuePosition] = useState<number>(5)
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null)
  const [isOrderPickedUp, setIsOrderPickedUp] = useState(false)
  const notificationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const statusProgressionRef = useRef<{
    timer1?: NodeJS.Timeout
    timer2?: NodeJS.Timeout
    queueTimer?: NodeJS.Timeout
  }>({})

  const [showRatingModal, setShowRatingModal] = useState(false)
  const [selectedOrderForRating, setSelectedOrderForRating] = useState<any>(null)
  const [currentRating, setCurrentRating] = useState(0)
  const [reviewText, setReviewText] = useState("")

  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Promotional banner state
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)

  // Favorites state
  const [favorites, setFavorites] = useState([])

  // Profile settings
  const [profileSettings, setProfileSettings] = useState({
    notifications: true,
    emailNotifications: false,
    language: "mn",
    darkMode: true,
  })

  const [userProfile, setUserProfile] = useState({
    name: "",
    phone: "",
    email: "",
    avatar: "/placeholder.svg?height=80&width=80",
    joinDate: "",
  })

  const [orderHistory, setOrderHistory] = useState([])

  // Firebase data states
  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [branches, setBranches] = useState([])
  const [promotionalBanners, setPromotionalBanners] = useState([])
  const [isDataLoading, setIsDataLoading] = useState(true)

  // Load data from Firebase on component mount
  useEffect(() => {
    loadFirebaseData()
  }, [])

  const loadFirebaseData = async () => {
    setIsDataLoading(true)
    try {
      const [firebaseCategories, firebaseMenuItems, firebaseBranches, firebaseBanners] = await Promise.all([
        dbOperations.getCategories(),
        dbOperations.getMenuItems(),
        dbOperations.getBranches(),
        dbOperations.getBanners(),
      ])

      setCategories(firebaseCategories)
      setMenuItems(firebaseMenuItems)
      setBranches(firebaseBranches)
      setPromotionalBanners(firebaseBanners)
    } catch (error) {
      console.error("Error loading Firebase data:", error)
    } finally {
      setIsDataLoading(false)
    }
  }

  // Promotional banner rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % promotionalBanners.length)
    }, 3000) // Change every 3 seconds

    return () => clearInterval(interval)
  }, [promotionalBanners.length])

  // Handle category change with loading
  const handleCategoryChange = async (categoryId: string) => {
    if (categoryId === activeCategory) return

    setIsLoading(true)
    setActiveCategory(categoryId)

    // Simulate loading delay
    await new Promise((resolve) => setTimeout(resolve, 800))
    setIsLoading(false)
  }

  // Handle search with loading
  useEffect(() => {
    if (searchQuery === "") {
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(() => {
      setIsSearching(false)
    }, 600)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Handle order status progression
  useEffect(() => {
    if (currentView === "status" && orderStatus !== "ready" && orderStatus !== "completed") {
      // Initialize audio
      const audio = new Audio("/sounds/notification.mp3")
      setAudioRef(audio)

      // Clear any existing timers
      if (statusProgressionRef.current.timer1) clearTimeout(statusProgressionRef.current.timer1)
      if (statusProgressionRef.current.timer2) clearTimeout(statusProgressionRef.current.timer2)
      if (statusProgressionRef.current.queueTimer) clearInterval(statusProgressionRef.current.queueTimer)

      // Update queue position every 2 seconds during pending
      if (orderStatus === "pending") {
        statusProgressionRef.current.queueTimer = setInterval(() => {
          setQueuePosition((prev) => Math.max(1, prev - 1))
        }, 2000)
      }

      // Move to confirmed after 3 seconds (only if currently pending)
      if (orderStatus === "pending") {
        statusProgressionRef.current.timer1 = setTimeout(() => {
          setOrderStatus("confirmed")
          setQueuePosition(0)
        }, 3000)
      }

      // Move to ready after 8 seconds (only if currently pending or confirmed)
      if (orderStatus === "pending" || orderStatus === "confirmed") {
        statusProgressionRef.current.timer2 = setTimeout(() => {
          setOrderStatus("ready")
          // Play notification sound when ready
          if (audio) {
            audio.play().catch(console.error)
          }
          // Add vibration for mobile devices
          if ("vibrate" in navigator) {
            navigator.vibrate([200, 100, 200, 100, 300])
          }

          // Start repeating notification every 4 seconds if not picked up
          notificationIntervalRef.current = setInterval(() => {
            if (!isOrderPickedUp && audio) {
              audio.play().catch(console.error)
              if ("vibrate" in navigator) {
                navigator.vibrate([200, 100, 200, 100, 300])
              }
            }
          }, 4000) // Repeat every 4 seconds
        }, 8000)
      }

      return () => {
        if (statusProgressionRef.current.queueTimer) clearInterval(statusProgressionRef.current.queueTimer)
        if (statusProgressionRef.current.timer1) clearTimeout(statusProgressionRef.current.timer1)
        if (statusProgressionRef.current.timer2) clearTimeout(statusProgressionRef.current.timer2)
      }
    }
  }, [currentView, orderStatus, isOrderPickedUp])

  // Handle ready status notification
  useEffect(() => {
    if (orderStatus === "ready" && !isOrderPickedUp) {
      // Initialize audio if not already done
      if (!audioRef) {
        const audio = new Audio("/sounds/notification.mp3")
        setAudioRef(audio)
      }

      // Start repeating notification every 4 seconds if not already started
      if (!notificationIntervalRef.current) {
        notificationIntervalRef.current = setInterval(() => {
          if (!isOrderPickedUp && audioRef) {
            audioRef.play().catch(console.error)
            if ("vibrate" in navigator) {
              navigator.vibrate([200, 100, 200, 100, 300])
            }
          }
        }, 4000)
      }
    }

    // Clean up notification interval when order is picked up
    if (isOrderPickedUp && notificationIntervalRef.current) {
      clearInterval(notificationIntervalRef.current)
      notificationIntervalRef.current = null
    }

    return () => {
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current)
        notificationIntervalRef.current = null
      }
    }
  }, [orderStatus, isOrderPickedUp, audioRef])

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((cartItem) => cartItem.id === item.id)
      if (existing) {
        return prev.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const toggleFavorite = (itemId: number | string) => {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }
    setFavorites((prev) => {
      const numId = typeof itemId === "string" ? Number.parseInt(itemId) : itemId
      if (prev.includes(numId)) {
        return prev.filter((id) => id !== numId)
      } else {
        return [...prev, numId]
      }
    })
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setCurrentUser(null)
    setCurrentView("home")
    setFavorites([])
    setOrderHistory([])
  }

  const handleProtectedNavigation = (view: "history" | "profile" | "favorites") => {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }
    setCurrentView(view)
  }

  const handlePayment = () => {
    // Generate order number
    const orderNum = `#${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`
    setOrderNumber(orderNum)
    setOrderStatus("pending")
    setIsOrderPickedUp(false)
    setQueuePosition(5)
    setCurrentView("status")
  }

  const handleOrderPickup = () => {
    setIsOrderPickedUp(true)
    setOrderStatus("completed")
    // Clear any ongoing notifications
    if (notificationIntervalRef.current) {
      clearInterval(notificationIntervalRef.current)
      notificationIntervalRef.current = null
    }
  }

  const handleThankYou = () => {
    // Reset everything and go to home
    setCart([])
    setOrderStatus("pending")
    setIsOrderPickedUp(false)
    setOrderNumber("")
    setQueuePosition(5)
    setSelectedTable(null)
    setCurrentView("home")
  }

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const getDeliveryFee = () => 0
  const getTax = () => Math.round(getSubtotal() * 0.1)
  const getTotal = () => getSubtotal() + getTax()

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = item.category === activeCategory
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const favoriteItems = menuItems.filter((item) => {
    const itemId = typeof item.id === "string" ? Number.parseInt(item.id) : item.id
    return favorites.includes(itemId)
  })

  const triggerNotification = () => {
    // Play sound
    if (audioRef) {
      audioRef.play().catch(console.error)
    }
    // Trigger vibration
    if ("vibrate" in navigator) {
      navigator.vibrate([200, 100, 200, 100, 300])
    }
  }

  const handleRatingSubmit = () => {
    if (selectedOrderForRating && currentRating > 0) {
      setOrderHistory((prev) =>
        prev.map((order) =>
          order.id === selectedOrderForRating.id ? { ...order, rating: currentRating, review: reviewText } : order,
        ),
      )
      setShowRatingModal(false)
      setSelectedOrderForRating(null)
      setCurrentRating(0)
      setReviewText("")
    }
  }

  const openRatingModal = (order: any) => {
    setSelectedOrderForRating(order)
    setCurrentRating(order.rating || 0)
    setReviewText(order.review || "")
    setShowRatingModal(true)
  }

  const StarRating = ({
    rating,
    onRatingChange,
    readonly = false,
  }: { rating: number; onRatingChange?: (rating: number) => void; readonly?: boolean }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !readonly && onRatingChange?.(star)}
            className={`text-2xl transition-colors ${
              star <= rating ? "text-yellow-500" : "text-gray-600"
            } ${!readonly ? "hover:text-yellow-400 cursor-pointer" : "cursor-default"}`}
            disabled={readonly}
          >
            ★
          </button>
        ))}
      </div>
    )
  }

  if (isDataLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Өгөгдөл ачааллаж байна...</p>
        </div>
      </div>
    )
  }

  // Branches View
  if (currentView === "branches") {
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
          <h1 className="text-lg font-semibold">Салбарууд</h1>
          <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800">
            <Navigation className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Header Info */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Манай салбарууд</h2>
            <p className="text-gray-400 text-sm">Та хамгийн ойр салбараа сонгоод захиалга өгнө үү</p>
          </div>

          {/* Branches List */}
          {branches.map((branch) => (
            <Card key={branch.id} className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <img
                    src={branch.image || "/placeholder.svg"}
                    alt={branch.name}
                    className="w-20 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-white text-lg">{branch.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            className={`text-xs ${
                              branch.status === "Нээлттэй"
                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                : "bg-red-500/10 text-red-500 border-red-500/20"
                            }`}
                          >
                            {branch.status}
                          </Badge>
                          <span className="text-gray-400 text-sm">{branch.distance}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
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

                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                        disabled={branch.status === "Хаалттай"}
                      >
                        Захиалах
                      </Button>
                      <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                        <Navigation className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Contact Info */}
          <Card className="bg-gray-800 border-gray-700 mt-6">
            <CardContent className="p-4">
              <h3 className="font-semibold text-white mb-3">Холбоо барих</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-300">Ерөнхий утас: +976 7777 0000</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-300">И-мэйл: info@restaurant.mn</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Profile View
  if (currentView === "profile") {
    if (!isLoggedIn) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
          <div className="text-center">
            <Lock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">Нэвтрэх шаардлагатай</h3>
            <p className="text-gray-500 mb-6">Профайл үзэхийн тулд нэвтэрнэ үү</p>
            <Button
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              onClick={() => router.push("/login")}
            >
              Нэвтрэх
            </Button>
          </div>
        </div>
      )
    }

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
          <h1 className="text-lg font-semibold">Профайл</h1>
          <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800">
            <Edit className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-6">
          {/* Profile Info */}
          <div className="flex items-center gap-4 bg-gray-800 rounded-lg p-4">
            <div className="relative">
              <img
                src={currentUser?.avatar || userProfile.avatar || "/placeholder.svg"}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border-2 border-yellow-500"
              />
              <Button
                size="sm"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-yellow-500 hover:bg-yellow-600 p-0"
              >
                <Camera className="w-3 h-3 text-black" />
              </Button>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white">{currentUser?.name || userProfile.name}</h2>
              <p className="text-gray-400 text-sm">{currentUser?.phone || userProfile.phone}</p>
              <p className="text-gray-400 text-sm">{currentUser?.email || userProfile.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  className={`text-xs ${
                    currentUser?.role === "admin"
                      ? "bg-red-500/10 text-red-500 border-red-500/20"
                      : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                  }`}
                >
                  {currentUser?.role === "admin" ? "Админ" : "Хэрэглэгч"}
                </Badge>
                <p className="text-gray-500 text-xs">
                  Элссэн: {new Date(currentUser?.createdAt || userProfile.joinDate).toLocaleDateString("mn-MN")}
                </p>
              </div>
            </div>
          </div>

          {/* Admin Access */}
          {currentUser?.role === "admin" && (
            <Button
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-4"
              onClick={() => router.push("/admin")}
            >
              <User className="w-5 h-5 mr-2" />
              Админ удирдлага
            </Button>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-500">{orderHistory.length}</div>
                <div className="text-sm text-gray-400">Захиалга</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-500">{favorites.length}</div>
                <div className="text-sm text-gray-400">Дуртай</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {orderHistory.filter((o) => o.rating).reduce((sum, o) => sum + (o.rating || 0), 0) /
                    orderHistory.filter((o) => o.rating).length || 0}
                </div>
                <div className="text-sm text-gray-400">Дундаж үнэлгээ</div>
              </CardContent>
            </Card>
          </div>

          {/* Menu Options */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-left p-4 h-auto bg-gray-800 hover:bg-gray-700"
              onClick={() => setCurrentView("favorites")}
            >
              <Heart className="w-5 h-5 mr-3 text-red-500" />
              <div>
                <div className="font-medium">Дуртай хоол</div>
                <div className="text-sm text-gray-400">{favorites.length} хоол</div>
              </div>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-left p-4 h-auto bg-gray-800 hover:bg-gray-700"
              onClick={() => setCurrentView("history")}
            >
              <Clock className="w-5 h-5 mr-3 text-blue-500" />
              <div>
                <div className="font-medium">Захиалгын түүх</div>
                <div className="text-sm text-gray-400">{orderHistory.length} захиалга</div>
              </div>
            </Button>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-300">Тохиргоо</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium">Мэдэгдэл</div>
                    <div className="text-sm text-gray-400">Push мэдэгдэл авах</div>
                  </div>
                </div>
                <Switch
                  checked={profileSettings.notifications}
                  onCheckedChange={(checked) => setProfileSettings((prev) => ({ ...prev, notifications: checked }))}
                />
              </div>

              <div className="flex items-center justify-between bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium">И-мэйл мэдэгдэл</div>
                    <div className="text-sm text-gray-400">И-мэйлээр мэдэгдэл авах</div>
                  </div>
                </div>
                <Switch
                  checked={profileSettings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setProfileSettings((prev) => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>

              <Button
                variant="ghost"
                className="w-full justify-start text-left p-4 h-auto bg-gray-800 hover:bg-gray-700"
              >
                <Globe className="w-5 h-5 mr-3 text-gray-400" />
                <div>
                  <div className="font-medium">Хэл</div>
                  <div className="text-sm text-gray-400">Монгол</div>
                </div>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start text-left p-4 h-auto bg-gray-800 hover:bg-gray-700"
              >
                <Phone className="w-5 h-5 mr-3 text-gray-400" />
                <div>
                  <div className="font-medium">Тусламж</div>
                  <div className="text-sm text-gray-400">Холбоо барих</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Logout */}
          <Button
            variant="outline"
            className="w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Гарах
          </Button>
        </div>
      </div>
    )
  }

  // Favorites View
  if (currentView === "favorites") {
    if (!isLoggedIn) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
          <div className="text-center">
            <Lock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">Нэвтрэх шаардлагатай</h3>
            <p className="text-gray-500 mb-6">Дуртай хоол үзэхийн тулд нэвтэрнэ үү</p>
            <Button
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              onClick={() => router.push("/login")}
            >
              Нэвтрэх
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView("profile")}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Дуртай хоол</h1>
          <div className="w-8" />
        </div>

        <div className="p-4">
          {favoriteItems.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Дуртай хоол байхгүй</h3>
              <p className="text-gray-500 mb-4">Та хараахан дуртай хоол сонгоогүй байна</p>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black" onClick={() => setCurrentView("home")}>
                Хоол сонгох
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Нийт {favoriteItems.length} дуртай хоол</h2>
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  Бүгдийг сагсанд хийх
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {favoriteItems.map((item) => (
                  <Card key={item.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-3">
                      <div className="relative">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="w-full h-24 object-cover rounded-lg mb-3"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-1 right-1 w-8 h-8 p-0 bg-black/50 hover:bg-black/70"
                          onClick={() => toggleFavorite(item.id)}
                        >
                          <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                        </Button>
                      </div>
                      <h3 className="font-medium text-white mb-1">{item.name}</h3>
                      <p className="text-xs text-gray-400 mb-2">{item.description}</p>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                          <span className="text-xs text-gray-400">{item.rating}</span>
                        </div>
                        <span className="font-semibold text-white">₮{item.price.toLocaleString()}</span>
                      </div>
                      <Button
                        size="sm"
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                        onClick={() => addToCart(item)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Нэмэх
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // Order Status View
  if (currentView === "status") {
    // Thank you screen after order is picked up
    if (orderStatus === "completed" && isOrderPickedUp) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center space-y-6 p-8">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Heart className="w-12 h-12 text-white fill-white" />
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-green-500">Баярлалаа!</h1>
              <p className="text-xl text-gray-300">Манайхаар үйлчлүүлсэнд баярлалаа</p>
              <p className="text-lg text-yellow-500">Амтрхан хоолоорой! 🍽️</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Захиалгын дугаар: {orderNumber}</p>
              <p className="text-sm text-gray-400">Ширээ #{selectedTable}</p>
            </div>
            <Button
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-4 px-8 text-lg"
              onClick={handleThankYou}
            >
              Баярлалаа
            </Button>
          </div>
        </div>
      )
    }

    const statusSteps = [
      {
        id: "pending",
        title: "Хүлээгдэж байна",
        description:
          queuePosition > 0 ? `Таны өмнө ${queuePosition} үйлчлүүлэгч байна` : "Таны захиалгыг хүлээн авч байна",
        icon: Clock,
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500",
      },
      {
        id: "confirmed",
        title: "Захиалга баталгаажуулла",
        description: "Таны захиалгыг баталгаажуулж, бэлтгэж эхэллээ",
        icon: CheckCircle,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500",
      },
      {
        id: "ready",
        title: "Бэлэн болло",
        description: "Таны захиалга бэлэн боллоо! Авч болно",
        icon: ChefHat,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500",
      },
    ]

    const currentStepIndex = statusSteps.findIndex((step) => step.id === orderStatus)

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
          <h1 className="text-lg font-semibold">Захиалгын статус</h1>
          <div className="w-8" />
        </div>

        <div className="p-4 space-y-6">
          {/* Order Info */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-yellow-500">{orderNumber}</h2>
            <p className="text-gray-400">Ширээ #{selectedTable}</p>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleString("mn-MN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="space-y-4">
            {statusSteps.map((step, index) => {
              const isActive = index <= currentStepIndex
              const isCurrent = index === currentStepIndex
              const IconComponent = step.icon

              return (
                <div key={step.id} className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                      isActive
                        ? `${step.color} ${step.bgColor} ${step.borderColor}`
                        : "text-gray-500 bg-gray-800 border-gray-700"
                    }`}
                  >
                    <IconComponent className={`w-6 h-6 ${isCurrent ? "animate-pulse" : ""}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    <h3 className={`font-semibold ${isActive ? step.color : "text-gray-500"}`}>{step.title}</h3>
                    <p className={`text-sm ${isActive ? "text-gray-300" : "text-gray-600"}`}>{step.description}</p>
                    {isCurrent && orderStatus !== "ready" && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                        <span className="text-xs text-gray-400">Боловсруулж байна...</span>
                      </div>
                    )}
                  </div>

                  {/* Check mark for completed steps */}
                  {isActive && !isCurrent && (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Queue Information - only show during pending */}
          {orderStatus === "pending" && queuePosition > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-lg">{queuePosition}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-500">Дараалалд байна</h3>
                  <p className="text-sm text-yellow-200">
                    Таны өмнө {queuePosition} үйлчлүүлэгч байна. Тэвчээртэй хүлээнэ үү.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-400">Захиалгын дэлгэрэнгүй</h3>
            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-sm text-gray-400">₮{item.price.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">× {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between font-semibold text-lg">
              <span>Нийт дүн</span>
              <span>₮{getTotal().toLocaleString()}</span>
            </div>
          </div>

          {/* Ready State - Order Pickup Confirmation */}
          {orderStatus === "ready" && (
            <>
              <div
                className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4 cursor-pointer hover:bg-green-500/20 transition-colors"
                onClick={triggerNotification}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-white text-2xl">🔔</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-500">Захиалга бэлэн!</h3>
                    <p className="text-sm text-green-200">Таны захиалга бэлэн боллоо. Тек дээр очиж авна уу.</p>
                  </div>
                </div>
              </div>

              {/* Order Pickup Question */}
              <div className="bg-gray-800 rounded-lg p-6 space-y-4">
                <h3 className="text-xl font-semibold text-center text-white">Та захиалгаа авсан уу?</h3>
                <div className="flex gap-4">
                  <Button
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-4 text-lg"
                    onClick={handleOrderPickup}
                  >
                    Авсан
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 py-4 text-lg"
                    onClick={triggerNotification}
                  >
                    Хараахан авсангүй
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  if (currentView === "checkout") {
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
          <h1 className="text-lg font-semibold">Захиалга баталгаажуулах</h1>
          <div className="w-8" />
        </div>

        {/* Table Number */}
        <div className="p-4 space-y-3">
          <h2 className="text-sm font-medium text-gray-400">Ширээний тоо</h2>
          <div className="relative">
            <Input
              type="number"
              placeholder="Ширээний дугаарыг оруулна уу"
              value={selectedTable || ""}
              onChange={(e) => setSelectedTable(e.target.value ? Number.parseInt(e.target.value) : null)}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              min="1"
              max="100"
            />
          </div>
          {selectedTable && <div className="text-sm text-green-400">Ширээ #{selectedTable} сонгогдлоо</div>}
        </div>

        <div className="p-4 space-y-6">
          {/* Order Summary */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-gray-400">Захиалгын дэлгэрэнгүй</h2>

            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-gray-400">₮{item.price.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">× {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Price Breakdown */}
          <div className="space-y-3 bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Дэд дүн</span>
              <span>₮{getSubtotal().toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Татвар</span>
              <span>₮{getTax().toLocaleString()}</span>
            </div>
            <div className="border-t border-gray-700 pt-3">
              <div className="flex justify-between font-semibold text-lg">
                <span>Нийт дүн</span>
                <span>₮{getTotal().toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-gray-400">Төлбөрийн арга</h2>

            {/* Cash Payment */}
            <div
              className={`flex items-center justify-between rounded-lg p-4 cursor-pointer border ${
                selectedPayment === "cash" ? "bg-yellow-500/10 border-yellow-500" : "bg-gray-800 border-gray-700"
              }`}
              onClick={() => setSelectedPayment("cash")}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-sm">₮</span>
                </div>
                <span>Бэлэн мөнгө</span>
              </div>
              <div
                className={`w-4 h-4 rounded-full border-2 ${
                  selectedPayment === "cash" ? "border-yellow-500 bg-yellow-500" : "border-gray-400"
                }`}
              />
            </div>

            {selectedPayment === "cash" && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-sm text-yellow-200">Тек дээр очиж мөнгө тушааж баталгаажуулан уу</p>
              </div>
            )}

            {/* Bank Apps */}
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Банкны апп</p>

              {[
                { id: "khan", name: "Хаан банк", image: "/images/khan-bank-logo.png" },
                { id: "state", name: "Төрийн банк", image: "/images/state-bank-logo.png" },
                { id: "tdb", name: "Худалдаа хөгжлийн банк", image: "/images/tdb-logo.png" },
                { id: "golomt", name: "Голомт банк", image: "/images/golomt-logo.png" },
              ].map((bank) => (
                <div
                  key={bank.id}
                  className={`flex items-center justify-between rounded-lg p-4 cursor-pointer border ${
                    selectedPayment === bank.id ? "bg-yellow-500/10 border-yellow-500" : "bg-gray-800 border-gray-700"
                  }`}
                  onClick={() => setSelectedPayment(bank.id)}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={bank.image || "/placeholder.svg"}
                      alt={bank.name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <span>{bank.name}</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      selectedPayment === bank.id ? "border-yellow-500 bg-yellow-500" : "border-gray-400"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Pay Button */}
          <Button
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-4 text-lg disabled:opacity-50"
            disabled={!selectedTable || selectedTable <= 0}
            onClick={handlePayment}
          >
            {selectedTable && selectedTable > 0 ? "Төлөх" : "Ширээний тоо оруулна уу"}
          </Button>
        </div>
      </div>
    )
  }

  if (currentView === "history") {
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
          <h1 className="text-lg font-semibold">Захиалгын түүх</h1>
          <div className="w-8" />
        </div>

        <div className="p-4 space-y-4">
          {orderHistory.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Захиалгын түүх хоосон</h3>
              <p className="text-gray-500">Та хараахан захиалга хийгээгүй байна</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Нийт {orderHistory.length} захиалга</h2>
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  Шүүх
                </Button>
              </div>

              {orderHistory.map((order) => (
                <Card key={order.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    {/* Order Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{order.id}</h3>
                          <p className="text-sm text-gray-400">
                            {order.date} • {order.time} • Ширээ #{order.table}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Дууссан</Badge>
                    </div>

                    {/* Rating Display */}
                    {order.rating && (
                      <div className="mb-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <StarRating rating={order.rating} readonly />
                          <span className="text-yellow-500 font-semibold">{order.rating}/5</span>
                        </div>
                        {order.review && <p className="text-sm text-yellow-200 italic">"{order.review}"</p>}
                      </div>
                    )}

                    {/* Order Items */}
                    <div className="space-y-2 mb-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">
                            {item.name} × {item.quantity}
                          </span>
                          <span className="text-gray-400">₮{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="border-t border-gray-700 pt-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">Нийт дүн</span>
                        <span className="font-semibold text-yellow-500 text-lg">₮{order.total.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Дахин захиалах
                      </Button>
                      {!order.rating ? (
                        <Button
                          size="sm"
                          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                          onClick={() => openRatingModal(order)}
                        >
                          Үнэлгээ өгөх
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                          onClick={() => openRatingModal(order)}
                        >
                          Үнэлгээ засах
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          {/* Rating Modal */}
          {showRatingModal && selectedOrderForRating && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">
                    {selectedOrderForRating.rating ? "Үнэлгээ засах" : "Үнэлгээ өгөх"}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRatingModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Order Info */}
                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-sm text-gray-400">Захиалга: {selectedOrderForRating.id}</p>
                    <p className="text-sm text-gray-400">
                      {selectedOrderForRating.date} • Ширээ #{selectedOrderForRating.table}
                    </p>
                  </div>

                  {/* Star Rating */}
                  <div className="text-center">
                    <p className="text-gray-300 mb-3">Та хэдэн од өгөх вэ?</p>
                    <StarRating rating={currentRating} onRatingChange={setCurrentRating} />
                    <p className="text-sm text-gray-400 mt-2">
                      {currentRating === 0 && "Од сонгоно уу"}
                      {currentRating === 1 && "Маш муу"}
                      {currentRating === 2 && "Муу"}
                      {currentRating === 3 && "Дундаж"}
                      {currentRating === 4 && "Сайн"}
                      {currentRating === 5 && "Маш сайн"}
                    </p>
                  </div>

                  {/* Review Text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Сэтгэгдэл (заавал биш)</label>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Үйлчилгээ, хоолны чанарын талаар сэтгэгдэл үлдээнэ үү..."
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 resize-none"
                      rows={3}
                      maxLength={200}
                    />
                    <p className="text-xs text-gray-500 mt-1">{reviewText.length}/200 тэмдэгт</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                      onClick={() => setShowRatingModal(false)}
                    >
                      Цуцлах
                    </Button>
                    <Button
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold disabled:opacity-50"
                      onClick={handleRatingSubmit}
                      disabled={currentRating === 0}
                    >
                      {selectedOrderForRating.rating ? "Засах" : "Илгээх"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Сайн байна уу</p>
            <p className="font-semibold">{isLoggedIn ? currentUser?.name || userProfile.name : "Зочин"}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-gray-400 relative" onClick={() => setCurrentView("checkout")}>
          <ShoppingBag className="w-6 h-6" />
          {cart.length > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-xs flex items-center justify-center">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </Badge>
          )}
        </Button>
      </div>

      {/* Search Bar */}
      <div className="px-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Өнөөдөр юу хоол идэх вэ?"
            className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
            </div>
          )}
        </div>
      </div>

      {/* Promotion Banner - Rotating */}
      <div className="px-4 mb-6">
        <Card
          className={`bg-gradient-to-r ${promotionalBanners[currentBannerIndex]?.bgColor || "from-green-600 to-green-500"} border-0 transition-all duration-500`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-white font-semibold text-lg">
                {promotionalBanners[currentBannerIndex]?.title || "Урамшуулал"}
              </p>
              <p className="text-white/90 text-sm">
                {promotionalBanners[currentBannerIndex]?.subtitle || "Танд зориулсан"}
              </p>
              <Button size="sm" className="mt-2 bg-white text-gray-800 hover:bg-gray-100">
                {promotionalBanners[currentBannerIndex]?.buttonText || "Үзэх"}
              </Button>
            </div>
            <img
              src={promotionalBanners[currentBannerIndex]?.image || "/placeholder.svg?height=80&width=80"}
              alt="Promotion"
              className="w-20 h-20 rounded-lg object-cover"
            />
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      <div className="px-4 mb-6">
        <div
          className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              onClick={() => handleCategoryChange(category.id)}
              disabled={isLoading}
              className={`flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
                activeCategory === category.id
                  ? "bg-yellow-500 text-black hover:bg-yellow-600"
                  : "border-gray-700 text-gray-300 hover:bg-gray-800"
              } ${isLoading ? "opacity-50" : ""}`}
            >
              <span>{category.icon}</span>
              {category.name}
              {isLoading && activeCategory === category.id && (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current ml-1"></div>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Search Results */}
      {searchQuery && !isSearching && (
        <div className="px-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            Хайлтын үр дүн "{searchQuery}" ({filteredItems.length})
          </h2>
          {filteredItems.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400">Хайлтын үр дүн олдсонгүй</p>
              <p className="text-sm text-gray-500 mt-1">Өөр түлхүүр үг ашиглан хайж үзнэ үү</p>
            </div>
          )}
        </div>
      )}

      {/* Loading State for Search */}
      {isSearching && (
        <div className="px-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
            <h2 className="text-lg font-semibold">Хайж байна...</h2>
          </div>
        </div>
      )}

      {/* Food Items */}
      <div className="px-4 mb-6">
        {!searchQuery && !isSearching && (
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold">{categories.find((cat) => cat.id === activeCategory)?.name}</h2>
            {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>}
            {!isLoading && <span className="text-sm text-gray-400">({filteredItems.length})</span>}
          </div>
        )}

        {searchQuery && filteredItems.length > 0 && !isSearching && (
          <h2 className="text-lg font-semibold mb-4">Хайлтын үр дүн</h2>
        )}

        <div className="grid grid-cols-2 gap-4">
          {isLoading || isSearching
            ? // Show skeleton loading cards
              Array.from({ length: 6 }).map((_, index) => <FoodCardSkeleton key={index} />)
            : // Show actual food items
              filteredItems.map((item) => (
                <Card key={item.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-3">
                    <div className="relative">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-full h-24 object-cover rounded-lg mb-3"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-1 right-1 w-8 h-8 p-0 bg-black/50 hover:bg-black/70"
                        onClick={() => toggleFavorite(item.id)}
                      >
                        <Heart
                          className={`w-4 h-4 transition-colors ${
                            favorites.includes(typeof item.id === "string" ? Number.parseInt(item.id) : item.id) &&
                            isLoggedIn
                              ? "text-red-500 fill-red-500"
                              : "text-white hover:text-red-500"
                          }`}
                        />
                      </Button>
                    </div>
                    <h3 className="font-medium text-white mb-1">{item.name}</h3>
                    <p className="text-xs text-gray-400 mb-2">{item.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        <span className="text-xs text-gray-400">{item.rating}</span>
                      </div>
                      <span className="font-semibold text-white">₮{item.price.toLocaleString()}</span>
                    </div>
                    <Button
                      size="sm"
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                      onClick={() => addToCart(item)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Нэмэх
                    </Button>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center justify-around py-3">
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 text-yellow-500">
            <Home className="w-5 h-5" />
            <span className="text-xs">Нүүр</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center gap-1 text-gray-400"
            onClick={() => handleProtectedNavigation("history")}
          >
            <Clock className="w-5 h-5" />
            <span className="text-xs">Түүх</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center gap-1 text-gray-400"
            onClick={() => setCurrentView("branches")}
          >
            <MapPin className="w-5 h-5" />
            <span className="text-xs">Салбар</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center gap-1 text-gray-400"
            onClick={() => (isLoggedIn ? setCurrentView("profile") : router.push("/login"))}
          >
            <User className="w-5 h-5" />
            <span className="text-xs">{isLoggedIn ? "Профайл" : "Нэвтрэх"}</span>
          </Button>
        </div>
      </div>

      <div className="h-20" />
    </div>
  )
}
