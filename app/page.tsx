"use client"

import { useState, useEffect, useRef } from "react"
import {
  Search,
  Star,
  Plus,
  Minus,
  ArrowLeft,
  Home,
  User,
  ShoppingBag,
  Clock,
  CheckCircle,
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
  Zap,
  CreditCard,
  RefreshCw,
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

type ViewType = "home" | "checkout" | "status" | "history" | "profile" | "favorites" | "branches" | "payment"

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
  const notificationIntervalRef = useRef<number | null>(null)

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

  // Payment state
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)
  const [paymentVerified, setPaymentVerified] = useState(false)

  // Load data from Firebase on component mount
  useEffect(() => {
    loadFirebaseData()
    checkAuthStatus()
    loadSiteBranding()
    loadOrderState() // Load order state from localStorage

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
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
      // Start repeating notification every 4 seconds
      const playNotification = () => {
        try {
          const audio = new Audio("/sounds/notification.mp3")
          audio.volume = 0.8
          audio.play().catch(console.error)
          
          if ("vibrate" in navigator) {
            navigator.vibrate([200, 100, 200, 100, 300])
          }
        } catch (error) {
          console.error("Error playing notification:", error)
        }
      }

      // Play immediately
      playNotification()

      // Set interval for repeating
      if (!notificationIntervalRef.current) {
        notificationIntervalRef.current = setInterval(playNotification, 4000)
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
  }, [orderStatus, isOrderPickedUp])

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

  const updateCartQuantity = (itemId: number | string, newQuantity: number) => {
    setCart((prev) => {
      if (newQuantity <= 0) {
        // Remove item from cart if quantity is 0 or less
        return prev.filter((cartItem) => cartItem.id !== itemId)
      }
      return prev.map((cartItem) => (cartItem.id === itemId ? { ...cartItem, quantity: newQuantity } : cartItem))
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
    // Generate order number with consistent format
    const orderNum = `#${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`

    try {
      // Create order data with proper structure
      const orderData = {
        id: orderNum, // Use the same format consistently
        customerName: currentUser?.name || "Зочин",
        customerEmail: currentUser?.email || "",
        table: selectedTable,
        items: cart,
        total: getSubtotal(),
        status: "pending",
        paymentMethod: selectedPayment,
        orderTime: new Date().toLocaleString("mn-MN"),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Save to Firebase and get the Firebase key
      const firebaseKey = await dbOperations.addOrder(orderData)
      console.log("Order saved to Firebase with key:", firebaseKey)
      console.log("Order data saved:", orderData)

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

  // Handle bank payment
  const handleBankPayment = (bankId: string) => {
    setSelectedPayment(bankId)
    setCurrentView("payment")
  }

  // Handle payment verification
  const handlePaymentVerification = async () => {
    setIsCheckingPayment(true)

    // Simulate payment verification delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Simulate random payment success/failure for demo
    const isPaymentSuccessful = Math.random() > 0.3 // 70% success rate

    setPaymentVerified(isPaymentSuccessful)
    setIsCheckingPayment(false)

    if (isPaymentSuccessful) {
      // Auto redirect to order confirmation after 1 second
      setTimeout(() => {
        handlePayment()
      }, 1000)
    }
  }

  // Firebase-аас захиалгын статус real-time-аар сонсох listener нэмэх - FIXED with proper error handling
  useEffect(() => {
    if (orderNumber && currentView === "status") {
      console.log("🔥 USER: Setting up Firebase listener for order:", orderNumber)

      // Listen for order status changes in real-time
      const orderRef = ref(database, `orders`)
      let unsubscribe: () => void

      try {
        unsubscribe = onValue(
          orderRef,
          (snapshot) => {
            try {
              if (snapshot.exists()) {
                const ordersData = snapshot.val()
                console.log("🔥 USER: Raw Firebase data received")

                // Convert Firebase data to array
                const orders = Object.entries(ordersData || {})
                  .map(([firebaseKey, orderData]) => {
                    if (orderData && typeof orderData === "object") {
                      return {
                        firebaseKey,
                        ...orderData,
                      }
                    }
                    return null
                  })
                  .filter(Boolean)

                console.log("🔥 USER: Looking for order with ID:", orderNumber)

                // Find current order - try multiple matching strategies
                let currentOrder = null

                // Strategy 1: Exact match
                currentOrder = orders.find((order: any) => order.id === orderNumber)

                // Strategy 2: Remove # and match
                if (!currentOrder) {
                  const cleanOrderNumber = orderNumber.replace("#", "")
                  currentOrder = orders.find((order: any) => order.id?.replace("#", "") === cleanOrderNumber)
                }

                // Strategy 3: Contains match
                if (!currentOrder) {
                  currentOrder = orders.find(
                    (order: any) =>
                      order.id?.includes(orderNumber.replace("#", "")) ||
                      orderNumber.includes(order.id?.replace("#", "")),
                  )
                }

                if (currentOrder) {
                  console.log("🔥 USER: ✅ Found matching order:", currentOrder)
                  console.log("🔥 USER: Order status from Firebase:", currentOrder.status)
                  console.log("🔥 USER: Current local status:", orderStatus)

                  // Update status if different
                  if (currentOrder.status && currentOrder.status !== orderStatus) {
                    console.log(`🔥 USER: 🚀 STATUS CHANGE DETECTED: ${orderStatus} -> ${currentOrder.status}`)
                    setOrderStatus(currentOrder.status)

                    // Play notification for ready status - FIXED
                    if (currentOrder.status === "ready") {
                      console.log("🔥 USER: 🔔 Order is ready! Playing notification...")

                      // Create and play audio immediately - шинэ аудио үүсгэх
                      try {
                        const audio = new Audio("/sounds/notification.mp3")
                        audio.volume = 0.8 // Дууны хэмжээ тохируулах
                        audio.play().then(() => {
                          console.log("🔥 USER: ✅ Audio played successfully")
                        }).catch((error) => {
                          console.error("🔥 USER: ❌ Error playing audio:", error)
                        })
                        setAudioRef(audio)
                      } catch (error) {
                        console.error("🔥 USER: ❌ Error creating audio:", error)
                      }

                      // Trigger vibration
                      if ("vibrate" in navigator) {
                        navigator.vibrate([200, 100, 200, 100, 300])
                      }

                      // Show browser notification if permission granted
                      if (Notification.permission === "granted") {
                        new Notification("Захиалга бэлэн!", {
                          body: "Таны захиалга бэлэн боллоо. Тек дээр очиж авна уу.",
                          icon: "/placeholder.svg?height=64&width=64",
                        })
                      }
                    } else {
                      console.log("🔥 USER: ℹ️ Status unchanged or missing")
                    }

                  // Update queue position for pending orders
                  if (currentOrder.status === "pending") {
                    const pendingOrders = orders.filter((order: any) => order.status === "pending")
                    const orderIndex = pendingOrders.findIndex(
                      (order: any) =>
                        order.id === orderNumber ||
                        order.id?.replace("#", "") === orderNumber.replace("#", "") ||
                        order.id?.includes(orderNumber.replace("#", "")) ||
                        orderNumber.includes(order.id?.replace("#", "")),
                    )
                    const newQueuePosition = orderIndex >= 0 ? orderIndex + 1 : 0
                    console.log("🔥 USER: Queue position:", newQueuePosition)
                    setQueuePosition(newQueuePosition)
                  } else {
                    setQueuePosition(0)
                  }
                } else {
                  console.log("🔥 USER: ❌ No matching order found!")
                  console.log(
                    "🔥 USER: Available order IDs:",
                    orders.map((o: any) => o?.id),
                  )
                  console.log("🔥 USER: Searching for:", orderNumber)
                }
              } else {
                console.log("🔥 USER: ❌ No orders data in Firebase")
              }
            } catch (error) 
              console.error("🔥 USER: ❌ Error processing Firebase data:", error)
          },
          (error) => 
            console.error("🔥 USER: ❌ Firebase listener error:", error),
        )
      } catch (error) {
        console.error("🔥 USER: ❌ Error setting up Firebase listener:", error)
        return
      }\
\
      return () => {
        console.log("🔥 USER: 🧹 Cleaning up Firebase listener")
        if (unsubscribe) {
          unsubscribe()
        }
      }
    }
  }, [orderNumber, currentView])

  // Handle order confirmation - NEW FUNCTION
  const handleOrderConfirmation = async () => {
    try {
      // Update order status to completed and add to history
      const completedOrder = {
        id: orderNumber,
        table: selectedTable,
        items: cart,
        total: getSubtotal(),
        status: "completed",
        orderTime: new Date().toLocaleString("mn-MN"),
        completedTime: new Date().toISOString(),
      }

      // Add to order history
      setOrderHistory((prev) => [completedOrder, ...prev])

      // Clear current order state
      setCart([])
      setOrderStatus("completed")
      setIsOrderPickedUp(true)
      setOrderNumber("")
      setQueuePosition(0)
      setSelectedTable(null)

      // Clear order from localStorage
      localStorage.removeItem("currentOrder")

      // Clear any ongoing notifications
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current)
        notificationIntervalRef.current = null
      }

      // Navigate to history
      setCurrentView("history")
    } catch (error) {
      console.error("Error confirming order:", error)
    }
  }

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
          <p className="text-gray-400">Амттай хоолны мэдээлэл</p>
        </div>
      </div>
    )
  }

  // Payment View
  if (currentView === "payment") {
    const selectedBank = [
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
    ].find((bank) => bank.id === selectedPayment)

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 p-6">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView("checkout")}
              className="text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <h1 className="text-xl font-bold">Төлбөр төлөх</h1>
              <p className="text-sm text-white/80">{selectedBank?.name}</p>
            </div>
            <div className="w-8" />
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Bank Info */}
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={selectedBank?.image || "/placeholder.svg"}
                  alt={selectedBank?.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedBank?.name}</h2>
                  <p className="text-gray-400">Мобайл банк апп</p>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                <p className="text-yellow-200 text-sm">
                  {selectedBank?.name} апп руу шилжиж төлбөрөө хийнэ үү. Төлбөр хийсний дараа "Шалгах" товчийг дарна уу.
                </p>
              </div>

              {/* Order Summary */}
              <div className="space-y-3 mb-6">
                <h3 className="font-bold text-white">Төлөх дүн</h3>
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-300">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="text-white">₮{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t border-gray-600 pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span className="text-white">Нийт дүн</span>
                    <span className="text-green-400">₮{getSubtotal().toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Status */}
          {!paymentVerified && !isCheckingPayment && (
            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50">
              <CardContent className="p-6 text-center">
                <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Төлбөр хүлээгдэж байна</h3>
                <p className="text-gray-400 mb-6">
                  {selectedBank?.name} апп дээр төлбөрөө хийсний дараа доорх товчийг дарна уу
                </p>
                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-4 text-lg shadow-lg"
                  onClick={handlePaymentVerification}
                >
                  Шалгах
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Checking Payment */}
          {isCheckingPayment && (
            <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border-blue-500/30">
              <CardContent className="p-6 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500/30 border-t-blue-500 mx-auto mb-4"></div>
                <h3 className="text-lg font-bold text-blue-400 mb-2">Төлбөр шалгаж байна...</h3>
                <p className="text-blue-200">Түр хүлээнэ үү</p>
              </CardContent>
            </Card>
          )}

          {/* Payment Success */}
          {paymentVerified && (
            <Card className="bg-gradient-to-br from-green-900/30 to-green-800/30 border-green-500/30">
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-green-400 mb-2">Төлбөр амжилттай!</h3>
                <p className="text-green-200 mb-4">Захиалга баталгаажуулагдаж байна...</p>
                <div className="animate-pulse text-sm text-green-300">Автоматаар шилжих болно</div>
              </CardContent>
            </Card>
          )}

          {/* Payment Failed */}
          {!paymentVerified && !isCheckingPayment && paymentVerified === false && (
            <Card className="bg-gradient-to-br from-red-900/30 to-red-800/30 border-red-500/30">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-400 text-2xl">❌</span>
                </div>
                <h3 className="text-lg font-bold text-red-400 mb-2">Төлбөр төлөгдөөгүй байна</h3>
                <p className="text-red-200 mb-6">
                  Төлбөр амжилтгүй байна. {selectedBank?.name} апп дээр төлбөрөө дахин хийнэ үү.
                </p>
                <Button
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 text-lg shadow-lg"
                  onClick={() => {
                    setPaymentVerified(null)
                    setIsCheckingPayment(false)
                  }}
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Дахин шалгах
                </Button>
              </CardContent>
            </Card>
          )}
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
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 p-0"
                          onClick={() => toggleFavorite(item.id)}
                        >
                          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        </Button>
                      </div>

                      <div className="p-3">
                        <h3 className="font-bold text-white text-sm mb-1">{item.name}</h3>
                        <p className="text-gray-400 text-xs mb-2 line-clamp-2">{item.description}</p>

                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-gray-400">{item.rating}</span>
                          </div>
                          <span className="font-bold text-green-400 text-sm">₮{item.price.toLocaleString()}</span>
                        </div>

                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold text-xs shadow-lg"
                          onClick={() => addToCart(item)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Сагсанд хийх
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

  // Enhanced History View
  if (currentView === "history") {
    if (!isLoggedIn) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Нэвтрэх шаардлагатай</h3>
            <p className="text-gray-400 mb-8">Захиалгын түүх үзэхийн тулд нэвтэрнэ үү</p>
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
        <div className="relative bg-gradient-to-r from-green-600 to-teal-600 p-6">
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
              <h1 className="text-xl font-bold">Захиалгын түүх</h1>
              <p className="text-sm text-white/80">Таны өмнөх захиалгууд</p>
            </div>
            <div className="w-8" />
          </div>
        </div>

        <div className="p-6">
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
            <div className="space-y-4">
              {orderHistory.map((order, index) => (
                <Card
                  key={order.id}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50 overflow-hidden"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-white">{order.id}</h3>
                        <p className="text-sm text-gray-400">{order.orderTime}</p>
                        <p className="text-xs text-gray-500">Ширээ: {order.table}</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={`mb-2 ${
                            order.status === "completed"
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : order.status === "ready"
                                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          }`}
                        >
                          {order.status === "completed"
                            ? "Дууссан"
                            : order.status === "ready"
                              ? "Бэлэн"
                              : "Хүлээгдэж байна"}
                        </Badge>
                        <div className="font-bold text-green-400">₮{order.total.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {order.items.map((item: any, itemIndex: number) => (
                        <div key={itemIndex} className="flex justify-between text-sm">
                          <span className="text-gray-300">
                            {item.name} × {item.quantity}
                          </span>
                          <span className="text-gray-400">₮{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                        onClick={() => {
                          // Add all items from this order to cart
                          order.items.forEach((item: any) => {
                            for (let i = 0; i < item.quantity; i++) {
                              addToCart(item)
                            }
                          })
                          setCurrentView("home")
                        }}
                      >
                        Дахин захиалах
                      </Button>
                      {order.status === "completed" && !order.rating && (
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold"
                          onClick={() => openRatingModal(order)}
                        >
                          <Star className="w-4 h-4 mr-1" />
                          Үнэлэх
                        </Button>
                      )}
                      {order.rating && (
                        <div className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 rounded-lg">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-yellow-400 text-sm font-bold">{order.rating}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Rating Modal */}
        {showRatingModal && selectedOrderForRating && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50 w-full max-w-md">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">Захиалгаа үнэлэх</h3>
                <p className="text-gray-400 mb-6">Захиалга: {selectedOrderForRating.id}</p>

                <div className="mb-6">
                  <p className="text-sm text-gray-400 mb-3">Үнэлгээ өгөх:</p>
                  <StarRating rating={currentRating} onRatingChange={setCurrentRating} />
                </div>

                <div className="mb-6">
                  <p className="text-sm text-gray-400 mb-3">Сэтгэгдэл (заавал биш):</p>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Таны сэтгэгдэл..."
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none"
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
                    Үнэлгээ өгөх
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  // Enhanced Status View with better notifications
  if (currentView === "status") {
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
              <Home className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <h1 className="text-xl font-bold">Захиалгын статус</h1>
              <p className="text-sm text-white/80">{orderNumber}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={triggerNotification}
              className="text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <Bell className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Enhanced Status Card */}
          <Card
            className={`overflow-hidden border-2 transition-all duration-500 ${
              orderStatus === "ready"
                ? "bg-gradient-to-br from-green-900/50 to-green-800/50 border-green-500/50 shadow-green-500/20 shadow-2xl animate-pulse"
                : orderStatus === "confirmed"
                  ? "bg-gradient-to-br from-blue-900/30 to-blue-800/30 border-blue-500/30"
                  : "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50"
            }`}
          >
            <CardContent className="p-6">
              <div className="text-center">
                <div
                  className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center transition-all duration-500 ${
                    orderStatus === "ready"
                      ? "bg-gradient-to-br from-green-400 to-green-600 animate-bounce"
                      : orderStatus === "confirmed"
                        ? "bg-gradient-to-br from-blue-400 to-blue-600"
                        : "bg-gradient-to-br from-gray-600 to-gray-700"
                  }`}
                >
                  {orderStatus === "ready" ? (
                    <CheckCircle className="w-12 h-12 text-white" />
                  ) : orderStatus === "confirmed" ? (
                    <Clock className="w-12 h-12 text-white animate-spin" />
                  ) : (
                    <ShoppingBag className="w-12 h-12 text-white" />
                  )}
                </div>

                <h2
                  className={`text-2xl font-bold mb-2 transition-all duration-500 ${
                    orderStatus === "ready"
                      ? "text-green-400 animate-pulse"
                      : orderStatus === "confirmed"
                        ? "text-blue-400"
                        : "text-gray-300"
                  }`}
                >
                  {orderStatus === "ready"
                    ? "🎉 Захиалга бэлэн боллоо!"
                    : orderStatus === "confirmed"
                      ? "Захиалга баталгаажлаа"
                      : "Захиалга хүлээгдэж байна"}
                </h2>

                <p className="text-gray-400 mb-4">
                  {orderStatus === "ready"
                    ? "Тек дээр очиж захиалгаа авна уу"
                    : orderStatus === "confirmed"
                      ? "Гал тогооны багийн хүүхэд бэлтгэж байна"
                      : "Таны захиалга баталгаажих хүлээгдэж байна"}
                </p>

                {orderStatus === "pending" && queuePosition > 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
                    <p className="text-yellow-200">
                      Дараалалд: <span className="font-bold text-yellow-400">{queuePosition}</span>-р байр
                    </p>
                  </div>
                )}

                {/* Ready Status with Confirmation Button */}
                {orderStatus === "ready" && !isOrderPickedUp && (
                  <div className="space-y-4">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Bell className="w-5 h-5 text-green-400 animate-bounce" />
                        <p className="text-green-200 font-medium">Дуут дохио дуугарч байна...</p>
                      </div>
                      <p className="text-green-300 text-sm">Тек дээр очиж захиалгаа авна уу</p>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 text-lg shadow-lg animate-pulse"
                      onClick={handleOrderConfirmation}
                    >
                      <CheckCircle className="w-6 h-6 mr-2" />
                      Батлгаажуулалаа
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Order Details */}
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50">
            <CardContent className="p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-yellow-400" />
                Захиалгын дэлгэрэнгүй
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Захиалгын дугаар:</span>
                  <span className="text-white font-mono">{orderNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Ширээний дугаар:</span>
                  <span className="text-white">#{selectedTable}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Захиалсан цаг:</span>
                  <span className="text-white">{new Date().toLocaleTimeString("mn-MN")}</span>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4 mt-4">
                <h4 className="font-medium text-white mb-3">Захиалсан хоол:</h4>
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h5 className="font-medium text-white text-sm">{item.name}</h5>
                        <p className="text-gray-400 text-xs">₮{item.price.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">×{item.quantity}</div>
                        <div className="text-green-400 text-sm font-bold">
                          ₮{(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-600 pt-3 mt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span className="text-white">Нийт дүн:</span>
                    <span className="text-green-400">₮{getSubtotal().toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Enhanced Checkout View
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
              <p className="text-sm text-white/80">{cart.length} зүйл</p>
            </div>
            <div className="w-8" />
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Enhanced Cart Items */}
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50">
            <CardContent className="p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-yellow-400" />
                Таны захиалга
              </h3>
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-700/30 rounded-lg">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-white">{item.name}</h4>
                      <p className="text-gray-400 text-sm">{item.description}</p>
                      <p className="text-green-400 font-bold">₮{item.price.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-8 h-8 rounded-full p-0 border-gray-600 hover:bg-gray-700"
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="font-bold text-white w-8 text-center">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-8 h-8 rounded-full p-0 border-gray-600 hover:bg-gray-700"
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Table Selection */}
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50">
            <CardContent className="p-6">
              <h3 className="font-bold text-white mb-4">Ширээ сонгох</h3>
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((tableNum) => (
                  <Button
                    key={tableNum}
                    variant={selectedTable === tableNum ? "default" : "outline"}
                    className={`aspect-square ${
                      selectedTable === tableNum
                        ? "bg-gradient-to-br from-yellow-500 to-orange-500 text-black font-bold shadow-lg"
                        : "border-gray-600 text-gray-300 hover:bg-gray-700"
                    }`}
                    onClick={() => setSelectedTable(tableNum)}
                  >
                    {tableNum}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Payment Methods */}
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50">
            <CardContent className="p-6">
              <h3 className="font-bold text-white mb-4">Төлбөрийн арга</h3>
              <div className="space-y-3">
                <Button
                  variant={selectedPayment === "cash" ? "default" : "outline"}
                  className={`w-full justify-start p-4 h-auto ${
                    selectedPayment === "cash"
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white border-0"
                      : "border-gray-600 text-gray-300 hover:bg-gray-700"
                  }`}
                  onClick={() => setSelectedPayment("cash")}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">💵</div>
                    <div className="text-left">
                      <div className="font-bold">Бэлэн мөнгө</div>
                      <div className="text-sm opacity-80">Тек дээр төлөх</div>
                    </div>
                  </div>
                </Button>

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
                  {
                    id: "golomt",
                    name: "Голомт банк",
                    image: "/images/golomt-logo.png",
                    color: "from-purple-600 to-purple-700",
                  },
                ].map((bank) => (
                  <Button
                    key={bank.id}
                    variant={selectedPayment === bank.id ? "default" : "outline"}
                    className={`w-full justify-start p-4 h-auto ${
                      selectedPayment === bank.id
                        ? `bg-gradient-to-r ${bank.color} text-white border-0`
                        : "border-gray-600 text-gray-300 hover:bg-gray-700"
                    }`}
                    onClick={() => handleBankPayment(bank.id)}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={bank.image || "/placeholder.svg"}
                        alt={bank.name}
                        className="w-8 h-8 rounded object-cover"
                      />
                      <div className="text-left">
                        <div className="font-bold">{bank.name}</div>
                        <div className="text-sm opacity-80">Мобайл банк</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Order Summary */}
          <Card className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-yellow-500/30">
            <CardContent className="p-6">
              <h3 className="font-bold text-white mb-4">Нийт дүн</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Хоолны дүн:</span>
                  <span className="text-white">₮{getSubtotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Үйлчилгээний хураамж:</span>
                  <span className="text-white">₮0</span>
                </div>
                <div className="border-t border-gray-600 pt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span className="text-white">Нийт төлөх дүн:</span>
                    <span className="text-green-400">₮{getSubtotal().toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Confirm Button */}
          <Button
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold py-4 text-lg shadow-lg disabled:opacity-50"
            onClick={selectedPayment === "cash" ? handlePayment : () => setCurrentView("payment")}
            disabled={!selectedTable || cart.length === 0}
          >
            {selectedPayment === "cash" ? (
              <>
                <CheckCircle className="w-6 h-6 mr-2" />
                Захиалга баталгаажуулах
              </>
            ) : (
              <>
                <CreditCard className="w-6 h-6 mr-2" />
                Төлбөр төлөх
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // Enhanced Main Home View
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Enhanced Header with branding */}
      <div className="relative bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 p-6">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                {siteBranding.logo.startsWith("data:") ? (
                  <img
                    src={siteBranding.logo || "/placeholder.svg"}
                    alt="Logo"
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                ) : (
                  <span className="text-2xl">{siteBranding.logo}</span>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{siteBranding.name}</h1>
                <p className="text-sm text-white/80">{siteBranding.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 backdrop-blur-sm"
                onClick={() => setCurrentView("branches")}
              >
                <MapPin className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 backdrop-blur-sm relative"
                onClick={() => handleProtectedNavigation("profile")}
              >
                <User className="w-5 h-5" />
                {isLoggedIn && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </Button>
            </div>
          </div>

          {/* Enhanced Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Хоол хайх..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-gray-300 focus:bg-white/20 transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Enhanced Promotional Banner */}
      {promotionalBanners.length > 0 && (
        <div className="relative h-32 overflow-hidden">
          <img
            src={promotionalBanners[currentBannerIndex]?.image || "/images/promotion-banner.png"}
            alt="Promotion"
            className="w-full h-full object-cover transition-all duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
          <div className="absolute inset-0 flex items-center justify-between p-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                {promotionalBanners[currentBannerIndex]?.title || "Онцгой санал!"}
              </h3>
              <p className="text-sm text-white/80">
                {promotionalBanners[currentBannerIndex]?.description || "Амттай хоолыг хямд үнээр"}
              </p>
            </div>
            <Button
              size="sm"
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold shadow-lg"
            >
              Дэлгэрэнгүй
            </Button>
          </div>
          {/* Banner indicators */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
            {promotionalBanners.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentBannerIndex ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Categories */}
      <div className="p-6 pb-0">
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              size="sm"
              className={`whitespace-nowrap transition-all duration-300 ${
                activeCategory === category.id
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold shadow-lg scale-105"
                  : "border-gray-600 text-gray-300 hover:bg-gray-700 hover:scale-105"
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
      <div className="p-6">
        {isLoading || isSearching ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <FoodCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const cartItem = cart.find((cartItem) => cartItem.id === item.id)
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
                        className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 p-0 transition-all duration-300"
                        onClick={() => toggleFavorite(item.id)}
                      >
                        <Heart
                          className={`w-4 h-4 transition-all duration-300 ${
                            isFavorite ? "fill-red-500 text-red-500 scale-110" : "text-white hover:text-red-400"
                          }`}
                        />
                      </Button>
                      <div className="absolute bottom-2 left-2">
                        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-white font-medium">{item.rating}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-white mb-1 group-hover:text-yellow-400 transition-colors duration-300">
                        {item.name}
                      </h3>
                      <p className="text-gray-400 text-xs mb-3 line-clamp-2">{item.description}</p>

                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-green-400 text-lg">₮{item.price.toLocaleString()}</span>
                        {cartItem && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse">
                            Сагсанд: {cartItem.quantity}
                          </Badge>
                        )}
                      </div>

                      {cartItem ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-gray-600 hover:bg-gray-700"
                            onClick={() => updateCartQuantity(item.id, cartItem.quantity - 1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-bold text-white px-3">{cartItem.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-gray-600 hover:bg-gray-700"
                            onClick={() => updateCartQuantity(item.id, cartItem.quantity + 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold shadow-lg transition-all duration-300 hover:scale-105"
                          onClick={() => addToCart(item)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Сагсанд хийх
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {filteredItems.length === 0 && !isLoading && !isSearching && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-400 mb-3">Хоол олдсонгүй</h3>
            <p className="text-gray-500">Өөр түлхүүр үг ашиглан хайж үзнэ үү</p>
          </div>
        )}
      </div>

      {/* Enhanced Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-gray-800 border-t border-gray-700/50 backdrop-blur-sm">
        <div className="flex items-center justify-around p-4">
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              currentView === "home" ? "text-yellow-400 scale-110" : "text-gray-400 hover:text-white"
            }`}
            onClick={() => setCurrentView("home")}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Нүүр</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              currentView === "favorites" ? "text-yellow-400 scale-110" : "text-gray-400 hover:text-white"
            }`}
            onClick={() => handleProtectedNavigation("favorites")}
          >
            <Heart className="w-5 h-5" />
            <span className="text-xs">Дуртай</span>
            {favorites.length > 0 && (
              <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
                {favorites.length}
              </Badge>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 relative transition-all duration-300 ${
              currentView === "checkout" ? "text-yellow-400 scale-110" : "text-gray-400 hover:text-white"
            }`}
            onClick={() => setCurrentView("checkout")}
            disabled={cart.length === 0}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-xs">Сагс</span>
            {cart.length > 0 && (
              <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs flex items-center justify-center p-0 font-bold animate-pulse">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </Badge>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              currentView === "history" ? "text-yellow-400 scale-110" : "text-gray-400 hover:text-white"
            }`}
            onClick={() => handleProtectedNavigation("history")}
          >
            <Clock className="w-5 h-5" />
            <span className="text-xs">Түүх</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              currentView === "profile" ? "text-yellow-400 scale-110" : "text-gray-400 hover:text-white"
            }`}
            onClick={() => handleProtectedNavigation("profile")}
          >
            <User className="w-5 h-5" />
            <span className="text-xs">Профайл</span>
            {isLoggedIn && (
              <div className="absolute top-1 right-3 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </Button>
        </div>
      </div>

      {/* Enhanced Floating Cart Button */}
      {cart.length > 0 && currentView === "home" && (
        <Button
          className="fixed bottom-20 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black shadow-2xl animate-bounce z-50"
          onClick={() => setCurrentView("checkout")}
        >
          <div className="relative">
            <ShoppingBag className="w-6 h-6" />
            <Badge className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </Badge>
          </div>
        </Button>
      )}

      {/* Enhanced Status Indicator */}
      {orderNumber && currentView !== "status" && (
        <Button
          className={`fixed top-20 right-6 px-4 py-2 rounded-full shadow-2xl z-50 transition-all duration-500 ${
            orderStatus === "ready"
              ? "bg-gradient-to-r from-green-500 to-green-600 text-white animate-pulse"
              : "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
          }`}
          onClick={() => setCurrentView("status")}
        >
          <div className="flex items-center gap-2">
            {orderStatus === "ready" ? (
              <CheckCircle className="w-4 h-4 animate-bounce" />
            ) : (
              <Clock className="w-4 h-4 animate-spin" />
            )}
            <span className="text-sm font-bold">{orderNumber}</span>
          </div>
        </Button>
      )}
    </div>
  )
}
