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
  Sparkles,
  Award,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { dbOperations } from "../lib/firebase"
// Firebase imports нэмэх
import { onValue, ref, database } from "../lib/firebase"

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

// Enhanced loading skeleton component for food cards
function FoodCardSkeleton() {
  return (
    <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50 overflow-hidden">
      <CardContent className="p-0">
        <Skeleton className="w-full h-32 bg-gradient-to-r from-gray-700 to-gray-600" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-5 w-3/4 bg-gray-700" />
          <Skeleton className="h-3 w-full bg-gray-700" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16 bg-gray-700" />
            <Skeleton className="h-5 w-20 bg-gray-700" />
          </div>
          <Skeleton className="h-9 w-full bg-gray-700" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function FoodDeliveryApp() {
  const router = useRouter()
  const [currentView, setCurrentView] = useState<ViewType>("home")
  const [activeCategory, setActiveCategory] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<string>("cash")
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("pending")
  const [orderNumber, setOrderNumber] = useState<string>("")
  const [queuePosition, setQueuePosition] = useState<number>(0)
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null)
  const [isOrderPickedUp, setIsOrderPickedUp] = useState(false)
  const notificationIntervalRef = useRef<NodeJS.Timeout | null>(null)

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
  const [favorites, setFavorites] = useState<number[]>([])

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

  const [orderHistory, setOrderHistory] = useState<any[]>([])

  // Firebase data states
  const [categories, setCategories] = useState<any[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [promotionalBanners, setPromotionalBanners] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  // Site branding state
  const [siteBranding, setSiteBranding] = useState({
    logo: "🍽️", // This will now store base64 image data
    name: "Монгол ресторан",
    subtitle: "Уламжлалт амттай хоол",
  })

  // Load data from Firebase on component mount
  useEffect(() => {
    loadFirebaseData()
    checkAuthStatus()
    loadSiteBranding()
    loadOrderState() // Load order state from localStorage
  }, [])

  // Save order state to localStorage whenever it changes
  useEffect(() => {
    if (orderNumber) {
      const orderState = {
        orderNumber,
        orderStatus,
        selectedTable,
        cart,
        queuePosition,
        isOrderPickedUp,
        orderTime: new Date().toISOString(),
      }
      localStorage.setItem("currentOrder", JSON.stringify(orderState))
    }
  }, [orderNumber, orderStatus, selectedTable, cart, queuePosition, isOrderPickedUp])

  const loadOrderState = () => {
    const savedOrder = localStorage.getItem("currentOrder")
    if (savedOrder) {
      try {
        const orderState = JSON.parse(savedOrder)
        // Only load if order is not completed and was created within last 2 hours
        const orderTime = new Date(orderState.orderTime)
        const now = new Date()
        const timeDiff = now.getTime() - orderTime.getTime()
        const twoHours = 2 * 60 * 60 * 1000

        if (orderState.orderStatus !== "completed" && timeDiff < twoHours) {
          setOrderNumber(orderState.orderNumber)
          setOrderStatus(orderState.orderStatus)
          setSelectedTable(orderState.selectedTable)
          setCart(orderState.cart || [])
          setQueuePosition(orderState.queuePosition || 0)
          setIsOrderPickedUp(orderState.isOrderPickedUp || false)
        } else {
          // Clear expired order
          localStorage.removeItem("currentOrder")
        }
      } catch (error) {
        console.error("Error loading order state:", error)
        localStorage.removeItem("currentOrder")
      }
    }
  }

  const loadSiteBranding = async () => {
    try {
      // Load site branding from Firebase Realtime Database
      const branding = await dbOperations.getSiteBranding()
      if (branding) {
        setSiteBranding(branding)
      }
    } catch (error) {
      console.error("Error loading site branding:", error)
    }
  }

  const checkAuthStatus = () => {
    const storedUser = localStorage.getItem("currentUser")
    const isLoggedInStored = localStorage.getItem("isLoggedIn")

    if (storedUser && isLoggedInStored === "true") {
      const user = JSON.parse(storedUser)
      setCurrentUser(user)
      setIsLoggedIn(true)
      setUserProfile({
        name: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
        avatar: user.avatar || "/placeholder.svg?height=80&width=80",
        joinDate: user.createdAt || new Date().toISOString(),
      })
      // Load user-specific data
      loadUserData(user.id)
    }
  }

  const loadUserData = async (userId: string) => {
    try {
      // Load user's favorites, order history, etc. from Firebase
      // This would be implemented based on your Firebase structure
      // For now, we'll keep them empty until you implement user-specific data storage
      setFavorites([])
      setOrderHistory([])
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }

  // loadFirebaseData функцийг хурдан болгох
  const loadFirebaseData = async () => {
    try {
      setDataLoading(true)

      // Set maximum loading time to 4 seconds
      const loadingTimeout = setTimeout(() => {
        setDataLoading(false)
      }, 4000)
      
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

      // Set first category as active if categories exist
      if (firebaseCategories.length > 0) {
        setActiveCategory(firebaseCategories[0].id)
      }
    } catch (error) {
      console.error("Error loading Firebase data:", error)
    } finally {
      setDataLoading(false)
    }
  }

  // Promotional banner rotation effect
  useEffect(() => {
    if (promotionalBanners.length > 0) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % promotionalBanners.length)
      }, 4000) // Change every 4 seconds

      return () => clearInterval(interval)
    }
  }, [promotionalBanners.length])

  // Handle category change with loading хэсгийг хурдан болгох
  const handleCategoryChange = async (categoryId: string) => {
    if (categoryId === activeCategory) return

    setIsLoading(true)
    setActiveCategory(categoryId)

    // Simulate loading delay - хурдан болгох
    await new Promise((resolve) => setTimeout(resolve, 200))
    setIsLoading(false)
  }

  // Handle search with loading хэсгийг хурдан болгох
  useEffect(() => {
    if (searchQuery === "") {
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(() => {
      setIsSearching(false)
    }, 200)

    return () => clearTimeout(timer)
  }, [searchQuery])

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
    setUserProfile({
      name: "",
      phone: "",
      email: "",
      avatar: "/placeholder.svg?height=80&width=80",
      joinDate: "",
    })
    localStorage.removeItem("currentUser")
    localStorage.removeItem("isLoggedIn")
  }

  const handleProtectedNavigation = (view: "history" | "profile" | "favorites") => {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }
    setCurrentView(view)
  }

  // handlePayment функцийг Firebase-д захиалга хадгалахаар өөрчлөх
  const handlePayment = async () => {
    // Generate order number
    const orderNum = `#${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`

    try {
      // Create order data
      const orderData = {
        id: orderNum,
        customerName: currentUser?.name || "Зочин",
        customerEmail: currentUser?.email || "",
        table: selectedTable,
        items: cart,
        total: getTotal(),
        status: "pending",
        paymentMethod: selectedPayment,
        orderTime: new Date().toLocaleString("mn-MN"),
        createdAt: new Date().toISOString(),
      }

      // Save to Firebase
      await dbOperations.addOrder(orderData)

      setOrderNumber(orderNum)
      setOrderStatus("pending")
      setIsOrderPickedUp(false)

      // Get real queue position from Firebase
      const allOrders = await dbOperations.getOrders()
      const pendingOrders = allOrders.filter((order) => order.status === "pending")
      setQueuePosition(pendingOrders.length)

      setCurrentView("status")
    } catch (error) {
      console.error("Error creating order:", error)
      alert("Захиалга үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.")
    }
  }

  // Firebase-аас захиалгын статус real-time-аар сонсох listener нэмэх
  useEffect(() => {
    if (orderNumber && currentView === "status") {
      // Listen for order status changes
      const orderRef = ref(database, `orders`)
      const unsubscribe = onValue(orderRef, (snapshot) => {
        if (snapshot.exists()) {
          const orders = Object.entries(snapshot.val()).map(([key, value]) => ({
            firebaseKey: key,
            ...value,
          }))

          // Find current order
          const currentOrder = orders.find((order: any) => order.id === orderNumber)

          if (currentOrder) {
            // Update status if changed
            if (currentOrder.status !== orderStatus) {
              setOrderStatus(currentOrder.status)

              // Initialize audio if status changes to ready
              if (currentOrder.status === "ready") {
                const audio = new Audio("/sounds/notification.mp3")
                setAudioRef(audio)
                audio.play().catch(console.error)
                if ("vibrate" in navigator) {
                  navigator.vibrate([200, 100, 200, 100, 300])
                }
              }
            }

            // Update queue position for pending orders
            if (currentOrder.status === "pending") {
              const pendingOrders = orders.filter((order: any) => order.status === "pending")
              const orderIndex = pendingOrders.findIndex((order: any) => order.id === orderNumber)
              setQueuePosition(orderIndex + 1) // Position in queue (1-based)
            } else {
              setQueuePosition(0)
            }
          }
        }
      })

      return () => unsubscribe()
    }
  }, [orderNumber, currentView, orderStatus])

  const handleOrderPickup = () => {
    setIsOrderPickedUp(true)
    setOrderStatus("completed")
    // Clear any ongoing notifications
    if (notificationIntervalRef.current) {
      clearInterval(notificationIntervalRef.current)
      notificationIntervalRef.current = null
    }
    // Clear order from localStorage
    localStorage.removeItem("currentOrder")
  }

  const handleThankYou = () => {
    // Reset everything and go to home
    setCart([])
    setOrderStatus("pending")
    setIsOrderPickedUp(false)
    setOrderNumber("")
    setQueuePosition(0)
    setSelectedTable(null)
    setCurrentView("home")
    // Clear order from localStorage
    localStorage.removeItem("currentOrder")
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
            className={`text-2xl transition-all duration-200 ${
              star <= rating ? "text-yellow-400 scale-110" : "text-gray-600"
            } ${!readonly ? "hover:text-yellow-300 hover:scale-125 cursor-pointer" : "cursor-default"}`}
            disabled={readonly}
          >
            ★
          </button>
        ))}
      </div>
    )
  }

  // Enhanced loading screen хэсгийг хурдан болгох
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-900/20 via-transparent to-transparent"></div>
        <div className="text-center z-10">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-yellow-500/30 border-t-yellow-500 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Ачааллаж байна...</h3>
          <p className="text-gray-400">Та түр хүлээн үү...</p>
        </div>
      </div>
    )
  }

  // Enhanced Branches View
  if (currentView === "branches") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-r from-yellow-600 to-orange-600 p-6">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView("home")}
              className="text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <h1 className="text-xl font-bold">Манай салбарууд</h1>
              <p className="text-sm text-white/80">Хамгийн ойрын салбараа олоорой</p>
            </div>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 backdrop-blur-sm">
              <Navigation className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Enhanced Branches List */}
          {branches.length > 0 ? (
            branches.map((branch, index) => (
              <Card
                key={branch.id}
                className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                <CardContent className="p-0">
                  <div className="relative">
                    <img
                      src={branch.image || "/placeholder.svg"}
                      alt={branch.name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <Badge
                      className={`absolute top-3 right-3 ${
                        branch.status === "Нээлттэй"
                          ? "bg-green-500/90 text-white border-0"
                          : "bg-red-500/90 text-white border-0"
                      } backdrop-blur-sm`}
                    >
                      {branch.status}
                    </Badge>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-white text-lg">{branch.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-yellow-400 text-sm font-medium">{branch.distance}</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-gray-400">4.8</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{branch.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-yellow-400" />
                        <span className="text-gray-300">{branch.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-400" />
                        <span className="text-gray-300">{branch.hours}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold shadow-lg"
                        disabled={branch.status === "Хаалттай"}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Захиалах
                      </Button>
                      <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                        <Navigation className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-12 h-12 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Салбар байхгүй</h3>
              <p className="text-gray-500">Удахгүй шинэ салбарууд нээгдэх болно</p>
            </div>
          )}

          {/* Enhanced Contact Info */}
          <Card className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-yellow-500/30">
            <CardContent className="p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-yellow-400" />
                Холбоо барих
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <Phone className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-300">Ерөнхий утас: +976 7777 0000</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <Mail className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-300">И-мэйл: info@restaurant.mn</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Enhanced Profile View
  if (currentView === "profile") {
    if (!isLoggedIn) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Нэвтрэх шаардлагатай</h3>
            <p className="text-gray-400 mb-8">Профайл үзэхийн тулд нэвтэрнэ үү</p>
            <Button
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold px-8 py-3 shadow-lg"
              onClick={() => router.push("/login")}
            >
              Нэвтрэх
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView("home")}
              className="text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Миний профайл</h1>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 backdrop-blur-sm">
              <Edit className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Enhanced Profile Info */}
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-1">
                    <img
                      src={currentUser?.avatar || userProfile.avatar || "/placeholder.svg"}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover bg-gray-800"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 p-0 shadow-lg"
                  >
                    <Camera className="w-4 h-4 text-black" />
                  </Button>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">{currentUser?.name || userProfile.name}</h2>
                  <p className="text-gray-400 text-sm">{currentUser?.phone || userProfile.phone}</p>
                  <p className="text-gray-400 text-sm">{currentUser?.email || userProfile.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      className={`text-xs ${
                        currentUser?.role === "admin"
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      }`}
                    >
                      {currentUser?.role === "admin" ? "Админ" : "Хэрэглэгч"}
                    </Badge>
                    <span className="text-gray-500 text-xs">
                      Элссэн: {new Date(currentUser?.createdAt || userProfile.joinDate).toLocaleDateString("mn-MN")}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Access */}
          {currentUser?.role === "admin" && (
            <Button
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 shadow-lg"
              onClick={() => router.push("/admin")}
            >
              <User className="w-5 h-5 mr-2" />
              Админ удирдлага
            </Button>
          )}

          {/* Enhanced Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/30 border-yellow-500/30">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{orderHistory.length}</div>
                <div className="text-xs text-gray-400">Захиалга</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-900/30 to-green-800/30 border-green-500/30">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{favorites.length}</div>
                <div className="text-xs text-gray-400">Дуртай</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border-blue-500/30">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {orderHistory.filter((o) => o.rating).reduce((sum, o) => sum + (o.rating || 0), 0) /
                    orderHistory.filter((o) => o.rating).length || 0}
                </div>
                <div className="text-xs text-gray-400">Дундаж үнэлгээ</div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Menu Options */}
          <div className="space-y-3">
            <Button
              variant="ghost"
              className="w-full justify-start text-left p-4 h-auto bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border border-gray-700/50"
              onClick={() => setCurrentView("favorites")}
            >
              <Heart className="w-5 h-5 mr-3 text-red-400" />
              <div>
                <div className="font-medium">Дуртай хоол</div>
                <div className="text-sm text-gray-400">{favorites.length} хоол</div>
              </div>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-left p-4 h-auto bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border border-gray-700/50"
              onClick={() => setCurrentView("history")}
            >
              <Clock className="w-5 h-5 mr-3 text-blue-400" />
              <div>
                <div className="font-medium">Захиалгын түүх</div>
                <div className="text-sm text-gray-400">{orderHistory.length} захиалга</div>
              </div>
            </Button>
          </div>

          {/* Enhanced Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-300">Тохиргоо</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-4 border border-gray-700/50">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-yellow-400" />
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

              <div className="flex items-center justify-between bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-4 border border-gray-700/50">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-400" />
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
                className="w-full justify-start text-left p-4 h-auto bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border border-gray-700/50"
              >
                <Globe className="w-5 h-5 mr-3 text-green-400" />
                <div>
                  <div className="font-medium">Хэл</div>
                  <div className="text-sm text-gray-400">Монгол</div>
                </div>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start text-left p-4 h-auto bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border border-gray-700/50"
              >
                <Phone className="w-5 h-5 mr-3 text-purple-400" />
                <div>
                  <div className="font-medium">Тусламж</div>
                  <div className="text-sm text-gray-400">Холбоо барих</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Enhanced Logout */}
          <Button
            variant="outline"
            className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 py-3"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Гарах
          </Button>
        </div>
      </div>
    )
  }

  // Enhanced Favorites View
  if (currentView === "favorites") {
    if (!isLoggedIn) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Нэвтрэх шаардлагатай</h3>
            <p className="text-gray-400 mb-8">Дуртай хоол үзэхийн тулд нэвтэрнэ үү</p>
            <Button
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold px-8 py-3 shadow-lg"
              onClick={() => router.push("/login")}
            >
              Нэвтрэх
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-r from-red-600 to-pink-600 p-6">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView("profile")}
              className="text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <h1 className="text-xl font-bold">Дуртай хоол</h1>
              <p className="text-sm text-white/80">Таны сонгосон хоолнууд</p>
            </div>
            <div className="w-8" />
          </div>
        </div>

        <div className="p-6">
          {favoriteItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-400 mb-3">Дуртай хоол байхгүй</h3>
              <p className="text-gray-500 mb-8">Та хараахан дуртай хоол сонгоогүй байна</p>
              <Button
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold px-8 py-3 shadow-lg"
                onClick={() => setCurrentView("home")}
              >
                Хоол сонгох
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Нийт {favoriteItems.length} дуртай хоол</h2>
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  Бүгдийг сагсанд хийх
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {favoriteItems.map((item) => (
                  <Card
                    key={item.id}
                    className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                  >
                    <CardContent className="p-0">
                      <div className="relative">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 w-8 h-8 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm"
                          onClick={() => toggleFavorite(item.id)}
                        >
                          <Heart className="w-4 h-4 text-red-400 fill-red-400" />
                        </Button>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-white mb-1">{item.name}</h3>
                        <p className="text-xs text-gray-400 mb-3">{item.description}</p>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-gray-400">{item.rating}</span>
                          </div>
                          <span className="font-bold text-white">₮{item.price.toLocaleString()}</span>
                        </div>
                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold"
                          onClick={() => addToCart(item)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Нэмэх
                        </Button>
                      </div>
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

  // Order Status View (keeping existing functionality but with enhanced design)
  if (currentView === "status") {
    // Thank you screen after order is picked up
    if (orderStatus === "completed" && isOrderPickedUp) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-900/20 via-transparent to-transparent"></div>
          <div className="text-center space-y-8 p-8 z-10">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto animate-pulse shadow-2xl">
                <Heart className="w-16 h-16 text-white fill-white" />
              </div>
              <div className="absolute -inset-4 bg-green-400/20 rounded-full animate-ping"></div>
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                Баярлалаа!
              </h1>
              <p className="text-xl text-gray-300">Манайхаар үйлчлүүлсэнд баярлалаа</p>
              <p className="text-lg text-yellow-400">Амтрхан хоолоорой! 🍽️</p>
            </div>
            <div className="space-y-2 p-4 bg-white/5 rounded-lg backdrop-blur-sm">
              <p className="text-sm text-gray-400">
                Захиалгын дугаар: <span className="text-white font-bold">{orderNumber}</span>
              </p>
              <p className="text-sm text-gray-400">
                Ширээ: <span className="text-white font-bold">#{selectedTable}</span>
              </p>
            </div>
            <Button
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold py-4 px-8 text-lg shadow-lg"
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
        description: queuePosition > 0 ? `Дараалалд ${queuePosition}-р байрт байна` : "Таны захиалгыг хүлээн авч байна",
        icon: Clock,
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/20",
        borderColor: "border-yellow-500",
      },
      {
        id: "confirmed",
        title: "Захиалга баталгаажуулла",
        description: "Таны захиалгыг баталгаажуулж, бэлтгэж эхэллээ",
        icon: CheckCircle,
        color: "text-blue-400",
        bgColor: "bg-blue-500/20",
        borderColor: "border-blue-500",
      },
      {
        id: "ready",
        title: "Бэлэн болло",
        description: "Таны захиалга бэлэн боллоо! Авч болно",
        icon: ChefHat,
        color: "text-green-400",
        bgColor: "bg-green-500/20",
        borderColor: "border-green-500",
      },
    ]

    const currentStepIndex = statusSteps.findIndex((step) => step.id === orderStatus)

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView("home")}
              className="text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <h1 className="text-xl font-bold">Захиалгын статус</h1>
              <p className="text-sm text-white/80">Таны захиалгын явц</p>
            </div>
            <div className="w-8" />
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Enhanced Order Info */}
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50">
            <CardContent className="p-6 text-center">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">
                {orderNumber}
              </h2>
              <p className="text-gray-400">Ширээ #{selectedTable}</p>
              <p className="text-sm text-gray-500 mt-2">
                {new Date().toLocaleString("mn-MN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </CardContent>
          </Card>

          {/* Enhanced Progress Steps */}
          <div className="space-y-6">
            {statusSteps.map((step, index) => {
              const isActive = index <= currentStepIndex
              const isCurrent = index === currentStepIndex
              const IconComponent = step.icon

              return (
                <div key={step.id} className="flex items-start gap-4">
                  {/* Enhanced Icon with real-time animation */}
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isActive
                        ? `${step.color} ${step.bgColor} ${step.borderColor} shadow-lg ${isCurrent ? "animate-pulse" : ""}`
                        : "text-gray-500 bg-gray-800 border-gray-700"
                    }`}
                  >
                    <IconComponent className={`w-8 h-8 ${isCurrent ? "animate-pulse" : ""}`} />
                    {isCurrent && (
                      <div className="absolute -inset-2 bg-current opacity-20 rounded-full animate-ping"></div>
                    )}
                  </div>

                  {/* Enhanced Content with real-time updates */}
                  <div className="flex-1 space-y-2">
                    <h3
                      className={`font-bold text-lg ${isActive ? step.color : "text-gray-500"} ${isCurrent ? "animate-pulse" : ""}`}
                    >
                      {step.title}
                      {isCurrent && <span className="ml-2 text-xs">●</span>}
                    </h3>
                    <p className={`text-sm ${isActive ? "text-gray-300" : "text-gray-600"}`}>{step.description}</p>
                    {isCurrent && orderStatus !== "ready" && (
                      <div className="flex items-center gap-2 mt-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        <span className="text-xs text-gray-400 animate-pulse">Боловсруулж байна...</span>
                      </div>
                    )}
                    {isCurrent && orderStatus === "ready" && (
                      <div className="flex items-center gap-2 mt-3">
                        <div className="w-4 h-4 bg-green-400 rounded-full animate-bounce"></div>
                        <span className="text-xs text-green-400 font-bold animate-pulse">Бэлэн боллоо!</span>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Check mark for completed steps */}
                  {isActive && !isCurrent && (
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg animate-pulse">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Enhanced Queue Information */}
          {orderStatus === "pending" && queuePosition > 0 && (
            <Card className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/30 border-yellow-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-black font-bold text-xl">{queuePosition}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-yellow-400">Дараалалд байна</h3>
                    <p className="text-sm text-yellow-200">
                      Таны өмнө {queuePosition - 1} захиалга байна. Тэвчээртэй хүлээнэ үү.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Order Items */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-300">Захиалгын дэлгэрэнгүй</h3>
            {cart.map((item) => (
              <Card key={item.id} className="bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-white">{item.name}</h4>
                      <p className="text-sm text-gray-400">₮{item.price.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">× {item.quantity}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Enhanced Total */}
          <Card className="bg-gradient-to-br from-green-900/30 to-green-800/30 border-green-500/30">
            <CardContent className="p-4">
              <div className="flex justify-between font-bold text-xl">
                <span>Нийт дүн</span>
                <span className="text-green-400">₮{getTotal().toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Ready State */}
          {/* Order status view хэсэгт real-time мэдэгдэл нэмэх */}
          {orderStatus === "ready" && (
            <>
              <Card
                className="bg-gradient-to-br from-green-900/30 to-green-800/30 border-green-500/30 cursor-pointer hover:from-green-800/40 hover:to-green-700/40 transition-all duration-300 animate-pulse"
                onClick={triggerNotification}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                      <span className="text-white text-2xl">🔔</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-green-400 text-lg animate-pulse">Захиалга бэлэн!</h3>
                      <p className="text-sm text-green-200">Таны захиалга бэлэн боллоо. Тек дээр очиж авна уу.</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                        <span className="text-xs text-green-300">Шинэ мэдэгдэл</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Order Pickup Question */}
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50">
                <CardContent className="p-6 space-y-6">
                  <h3 className="text-xl font-bold text-center text-white">Та захиалгаа авсан уу?</h3>
                  <div className="flex gap-4">
                    <Button
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 text-lg shadow-lg"
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
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    )
  }

  if (currentView === "checkout") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-r from-green-600 to-blue-600 p-6">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView("home")}
              className="text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <h1 className="text-xl font-bold">Захиалга баталгаажуулах</h1>
              <p className="text-sm text-white/80">Захиалгаа шалгаад баталгаажуулна уу</p>
            </div>
            <div className="w-8" />
          </div>
        </div>

        {/* Enhanced Table Number */}
        <div className="p-6 space-y-4">
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-white mb-4">Ширээний тоо</h2>
              <Input
                type="number"
                placeholder="Ширээний дугаарыг оруулна уу"
                value={selectedTable || ""}
                onChange={(e) => setSelectedTable(e.target.value ? Number.parseInt(e.target.value) : null)}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 text-lg p-4"
                min="1"
                max="100"
              />
              {selectedTable && (
                <div className="mt-3 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 font-medium">Ширээ #{selectedTable} сонгогдлоо</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Order Summary */}
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-white mb-4">Захиалгын дэлгэрэнгүй</h2>
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-white">{item.name}</h3>
                      <p className="text-sm text-gray-400">₮{item.price.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">× {item.quantity}</p>
                      <p className="font-bold text-white">₮{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Price Breakdown */}
          <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border-blue-500/30">
            <CardContent className="p-6 space-y-3">
              <div className="flex justify-between text-gray-300">
                <span>Дэд дүн</span>
                <span>₮{getSubtotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Татвар (10%)</span>
                <span>₮{getTax().toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-600 pt-3">
                <div className="flex justify-between font-bold text-xl">
                  <span className="text-white">Нийт дүн</span>
                  <span className="text-blue-400">₮{getTotal().toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Payment Method */}
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-white mb-4">Төлбөрийн арга</h2>

              {/* Cash Payment */}
              <div
                className={`flex items-center justify-between rounded-lg p-4 cursor-pointer border-2 transition-all duration-300 mb-4 ${
                  selectedPayment === "cash"
                    ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500"
                    : "bg-gray-800 border-gray-700 hover:border-gray-600"
                }`}
                onClick={() => setSelectedPayment("cash")}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-black font-bold">₮</span>
                  </div>
                  <div>
                    <span className="font-bold text-white">Бэлэн мөнгө</span>
                    <p className="text-sm text-gray-400">Тек дээр төлөх</p>
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                    selectedPayment === "cash" ? "border-yellow-500 bg-yellow-500" : "border-gray-400"
                  }`}
                />
              </div>

              {selectedPayment === "cash" && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
                  <p className="text-yellow-200 text-sm">Тек дээр очиж мөнгө тушааж баталгаажуулан уу</p>
                </div>
              )}

              {/* Bank Apps */}
              <div className="space-y-3">
                <p className="text-sm text-gray-400 font-medium">Банкны апп</p>

                {[
                  {
                    id: "khan",
                    name: "Хаан банк",
                    image: "/images/khan-bank-logo.png",
                    color: "from-blue-600 to-blue-700",
                  },
                  {
                    id: "state",
                    name: "Төрийн банк",
                    image: "/images/state-bank-logo.png",
                    color: "from-green-600 to-green-700",
                  },
                  {
                    id: "tdb",
                    name: "Худалдаа хөгжлийн банк",
                    image: "/images/tdb-logo.png",
                    color: "from-red-600 to-red-700",
                  },
                ].map((bank) => (
                  <div
                    key={bank.id}
                    className={`flex items-center justify-between rounded-lg p-4 cursor-pointer border-2 transition-all duration-300 ${
                      selectedPayment === bank.id
                        ? `bg-gradient-to-r ${bank.color}/20 border-yellow-500`
                        : "bg-gray-800 border-gray-700 hover:border-gray-600"
                    }`}
                    onClick={() => setSelectedPayment(bank.id)}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={bank.image || "/placeholder.svg"}
                        alt={bank.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <span className="font-medium text-white">{bank.name}</span>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                        selectedPayment === bank.id ? "border-yellow-500 bg-yellow-500" : "border-gray-400"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Pay Button */}
          <Button
            className={`w-full py-4 text-lg font-bold shadow-lg transition-all duration-300 ${
              selectedTable && selectedTable > 0
                ? "bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 p-6">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView("home")}
              className="text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <h1 className="text-xl font-bold">Захиалгын түүх</h1>
              <p className="text-sm text-white/80">Таны өмнөх захиалгууд</p>
            </div>
            <div className="w-8" />
          </div>
        </div>

        <div className="p-6 space-y-6">
          {orderHistory.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-12 h-12 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-400 mb-3">Захиалгын түүх хоосон</h3>
              <p className="text-gray-500 mb-8">Та хараахан захиалга хийгээгүй байна</p>
              <Button
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold px-8 py-3 shadow-lg"
                onClick={() => setCurrentView("home")}
              >
                Захиалга хийх
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Нийт {orderHistory.length} захиалга</h2>
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  Шүүх
                </Button>
              </div>

              {orderHistory.map((order) => (
                <Card
                  key={order.id}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <CardContent className="p-6">
                    {/* Order Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg">{order.id}</h3>
                          <p className="text-sm text-gray-400">
                            {order.date} • {order.time} • Ширээ #{order.table}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Дууссан</Badge>
                    </div>

                    {/* Rating Display */}
                    {order.rating && (
                      <div className="mb-4 p-4 bg-gradient-to-r from-yellow-900/30 to-yellow-800/30 rounded-lg border border-yellow-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <StarRating rating={order.rating} readonly />
                          <span className="text-yellow-400 font-bold">{order.rating}/5</span>
                        </div>
                        {order.review && <p className="text-sm text-yellow-200 italic">"{order.review}"</p>}
                      </div>
                    )}

                    {/* Order Items */}
                    <div className="space-y-2 mb-4">
                      {order.items.map((item: any, index: number) =>
                        index < 2 ? (
                          <div key={index} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                            <img
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                            <span className="text-sm text-gray-300 flex-1">{item.name}</span>
                            <span className="text-sm text-gray-400">× {item.quantity}</span>
                          </div>
                        ) : null,
                      )}
                      {order.items.length > 2 && (
                        <p className="text-sm text-gray-400 text-center">+{order.items.length - 2} бусад хоол</p>
                      )}
                    </div>

                    {/* Order Total */}
                    <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-blue-900/30 to-blue-800/30 rounded-lg border border-blue-500/30">
                      <span className="text-gray-300">Нийт дүн</span>
                      <span className="font-bold text-blue-400 text-lg">₮{order.total.toLocaleString()}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Дахин захиалах
                      </Button>
                      {!order.rating && (
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold"
                          onClick={() => openRatingModal(order)}
                        >
                          Үнэлэх
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>

        {/* Enhanced Rating Modal */}
        {showRatingModal && selectedOrderForRating && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50 w-full max-w-md">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-6 text-center">Захиалгаа үнэлнэ үү</h3>

                <div className="space-y-6">
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <p className="text-gray-400 mb-2">
                      Таны захиалга: <span className="text-white font-bold">{selectedOrderForRating.id}</span>
                    </p>
                    <div className="flex justify-center mb-3">
                      <StarRating rating={currentRating} onRatingChange={setCurrentRating} />
                    </div>
                    <p className="text-sm text-gray-400">
                      {currentRating === 0 && "Од сонгоно уу"}
                      {currentRating === 1 && "Маш муу"}
                      {currentRating === 2 && "Муу"}
                      {currentRating === 3 && "Дундаж"}
                      {currentRating === 4 && "Сайн"}
                      {currentRating === 5 && "Маш сайн"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Сэтгэгдэл (заавал биш)</label>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Таны сэтгэгдэлийг бичнэ үү..."
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 resize-none focus:border-yellow-500 transition-colors"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                      onClick={() => {
                        setShowRatingModal(false)
                        setSelectedOrderForRating(null)
                        setCurrentRating(0)
                        setReviewText("")
                      }}
                    >
                      Цуцлах
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold"
                      onClick={handleRatingSubmit}
                      disabled={currentRating === 0}
                    >
                      Үнэлэх
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

  // Enhanced Main Home View with exact design from image
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header matching the exact design from image */}
      <div className="relative bg-gradient-to-r from-slate-800 to-slate-900 p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
              {siteBranding.logo.startsWith("data:") ? (
                <img src={siteBranding.logo || "/placeholder.svg"} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl">{siteBranding.logo}</span>
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{siteBranding.name}</h1>
              <p className="text-sm text-gray-300">{siteBranding.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 rounded-full w-10 h-10 p-0"
              onClick={() => setCurrentView("branches")}
            >
              <MapPin className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 rounded-full w-10 h-10 p-0 relative"
              onClick={() => {
                // If there's an active order, go to status view
                if (orderNumber && orderStatus !== "completed") {
                  setCurrentView("status")
                } else {
                  setCurrentView("checkout")
                }
              }}
            >
              <ShoppingBag className="w-5 h-5" />
              {cart.length > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Promotional Banner matching the exact design from image */}
      {promotionalBanners.length > 0 && (
        <div className="relative h-44 overflow-hidden">
          {/* Background food image */}
          <div className="absolute inset-0">
            <img
              src={promotionalBanners[currentBannerIndex]?.image || "/placeholder.svg"}
              alt="Promotional Banner"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/50"></div>

          {/* Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="px-6 text-center w-full">
              <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Багц хоол</h2>
              <p className="text-lg text-white/90 drop-shadow-lg mb-4">Амттай хоолны онцгой санал</p>
            </div>
          </div>

          {/* Navigation dots at bottom */}
          {promotionalBanners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {promotionalBanners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBannerIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentBannerIndex ? "bg-yellow-400" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Enhanced Search */}
      <div className="p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Хоол хайх..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-4 bg-gray-800 border-gray-700 text-white placeholder-gray-400 rounded-xl text-lg focus:border-yellow-500 transition-colors"
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500"></div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Categories */}
      <div className="px-6 pb-6">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              size="sm"
              className={`whitespace-nowrap transition-all duration-300 ${
                activeCategory === category.id
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-600 hover:to-orange-600 shadow-lg scale-105"
                  : "border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500"
              }`}
              onClick={() => handleCategoryChange(category.id)}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Enhanced Food Grid */}
      <div className="px-6 pb-24">
        {isLoading || isSearching ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <FoodCardSkeleton key={index} />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-400 mb-3">Хоол олдсонгүй</h3>
            <p className="text-gray-500">
              {searchQuery ? `"${searchQuery}" хайлтад тохирох хоол олдсонгүй` : "Энэ ангилалд хоол байхгүй"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const itemId = typeof item.id === "string" ? Number.parseInt(item.id) : item.id
              const isFavorite = favorites.includes(itemId)

              return (
                <Card
                  key={item.id}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group"
                >
                  <CardContent className="p-0">
                    <div className="relative">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 w-8 h-8 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-all duration-300"
                        onClick={() => toggleFavorite(item.id)}
                      >
                        <Heart
                          className={`w-4 h-4 transition-all duration-300 ${isFavorite ? "text-red-400 fill-red-400 scale-110" : "text-white hover:text-red-400"}`}
                        />
                      </Button>
                      {item.rating >= 4.5 && (
                        <Badge className="absolute top-2 left-2 bg-yellow-500/90 text-black border-0 font-bold">
                          <Award className="w-3 h-3 mr-1" />
                          Шилдэг
                        </Badge>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-white mb-1 group-hover:text-yellow-400 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-400 mb-3 line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-gray-400 font-medium">{item.rating}</span>
                        </div>
                        <span className="font-bold text-white text-lg">₮{item.price.toLocaleString()}</span>
                      </div>
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold transition-all duration-300 hover:shadow-lg"
                        onClick={() => addToCart(item)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Нэмэх
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Enhanced Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-gray-800 to-gray-900 border-t border-gray-700/50 backdrop-blur-lg">
        <div className="flex items-center justify-around py-3">
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 text-xs transition-all duration-300 ${
              currentView === "home" ? "text-yellow-400 scale-110" : "text-gray-400 hover:text-white"
            }`}
            onClick={() => setCurrentView("home")}
          >
            <Home className="w-5 h-5" />
            Нүүр
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 text-xs transition-all duration-300 ${
              currentView === "history" ? "text-yellow-400 scale-110" : "text-gray-400 hover:text-white"
            }`}
            onClick={() => handleProtectedNavigation("history")}
          >
            <Clock className="w-5 h-5" />
            Түүх
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 text-xs transition-all duration-300 ${
              currentView === "favorites" ? "text-yellow-400 scale-110" : "text-gray-400 hover:text-white"
            }`}
            onClick={() => handleProtectedNavigation("favorites")}
          >
            <Heart className="w-5 h-5" />
            Дуртай
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 text-xs transition-all duration-300 ${
              currentView === "profile" ? "text-yellow-400 scale-110" : "text-gray-400 hover:text-white"
            }`}
            onClick={() => {
              if (!isLoggedIn) {
                router.push("/login")
              } else {
                setCurrentView("profile")
              }
            }}
          >
            <User className="w-5 h-5" />
            {isLoggedIn ? "Профайл" : "Нэвтрэх"}
          </Button>
        </div>
      </div>
    </div>
  )
}
