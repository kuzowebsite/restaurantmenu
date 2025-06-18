"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AdminDashboard from "../../components/admin-dashboard"
import { dbOperations } from "../../lib/firebase"

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

export default function AdminPage() {
  const router = useRouter()
  const [currentView, setCurrentView] = useState<ViewType>("admin")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Firebase data states
  const [categories, setCategories] = useState<any[]>([])
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [promotionalBanners, setPromotionalBanners] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])

  // Check authentication on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser")
    const isLoggedIn = localStorage.getItem("isLoggedIn")

    if (storedUser && isLoggedIn === "true") {
      const user = JSON.parse(storedUser)
      setCurrentUser(user)

      if (user.role === "admin") {
        setIsAdmin(true)
        loadFirebaseData()
      } else {
        // Not an admin, redirect to home
        router.push("/")
      }
    } else {
      // Not logged in, redirect to login
      router.push("/login")
    }
    setIsLoading(false)
  }, [router])

  const loadFirebaseData = async () => {
    try {
      const [firebaseCategories, firebaseMenuItems, firebaseBranches, firebaseBanners, firebaseUsers, firebaseOrders] =
        await Promise.all([
          dbOperations.getCategories(),
          dbOperations.getMenuItems(),
          dbOperations.getBranches(),
          dbOperations.getBanners(),
          dbOperations.getUsers(),
          dbOperations.getOrders(),
        ])

      setCategories(firebaseCategories)
      setMenuItems(firebaseMenuItems)
      setBranches(firebaseBranches)
      setPromotionalBanners(firebaseBanners)
      setUsers(firebaseUsers)
      setOrders(firebaseOrders)
    } catch (error) {
      console.error("Error loading Firebase data:", error)
    }
  }

  const handleAdminLogout = () => {
    localStorage.removeItem("currentUser")
    localStorage.removeItem("isLoggedIn")
    setCurrentUser(null)
    setIsAdmin(false)
    router.push("/")
  }

  const handleViewChange = (view: ViewType) => {
    if (view === "home") {
      router.push("/")
    } else {
      setCurrentView(view)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">Ачааллаж байна...</h3>
          <p className="text-gray-500">Админ панел ачааллаж байна</p>
        </div>
      </div>
    )
  }

  if (!isAdmin || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-400 mb-2">Админы эрх шаардлагатай</h3>
          <p className="text-gray-500 mb-6">Та админы эрхээр нэвтрэх шаардлагатай</p>
          <button
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-2 rounded-lg"
            onClick={() => router.push("/")}
          >
            Нүүр хуудас руу буцах
          </button>
        </div>
      </div>
    )
  }

  return (
    <AdminDashboard
      currentView={currentView}
      setCurrentView={handleViewChange}
      isAdmin={isAdmin}
      handleAdminLogout={handleAdminLogout}
      adminCategories={categories}
      setAdminCategories={setCategories}
      adminMenuItems={menuItems}
      setAdminMenuItems={setMenuItems}
      adminBranches={branches}
      setAdminBranches={setBranches}
      adminBanners={promotionalBanners}
      setAdminBanners={setPromotionalBanners}
      adminUsers={users}
      setAdminUsers={setUsers}
      adminOrders={orders}
      setAdminOrders={setOrders}
      dbOperations={dbOperations}
    />
  )
}
