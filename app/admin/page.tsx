"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AdminDashboard from "../../components/admin-dashboard"
import { dbOperations } from "../../lib/firebase"

const defaultCategories = [
  { id: "цай", name: "Цай", icon: "🍵" },
  { id: "ундаа", name: "Ундаа", icon: "🥤" },
  { id: "кофе", name: "Кофе", icon: "☕" },
  { id: "milkshake", name: "Milkshake", icon: "🥛" },
  { id: "салат", name: "Салат", icon: "🥗" },
  { id: "хоол", name: "Хоол", icon: "🍽️" },
  { id: "багц", name: "Багц", icon: "📦" },
  { id: "шөл", name: "Шөл", icon: "🍲" },
  { id: "ширхэг", name: "Ширхэг", icon: "🍖" },
]

const defaultMenuItems = [
  // Цай (Tea)
  {
    id: 1,
    name: "Лемон цай",
    description: "Цитрон амттай сэрүүн цай",
    price: 2500,
    rating: 4.5,
    image: "/images/tsai1.jpg",
    category: "цай",
  },
  {
    id: 2,
    name: "Жимсний цай",
    description: "Амттай халуун жимсний цай",
    price: 2800,
    rating: 4.3,
    image: "/images/tsai3.jpg",
    category: "цай",
  },
  {
    id: 3,
    name: "Цэцэгт цай",
    description: "Өнгөлөг цэцэгт цай",
    price: 3200,
    rating: 4.7,
    image: "/images/tsai2.jpg",
    category: "цай",
  },
  // Ундаа (Drinks)
  {
    id: 4,
    name: "Кока кола",
    description: "Классик кока кола 0.5л",
    price: 1800,
    rating: 4.8,
    image: "/images/cola.jpg",
    category: "ундаа",
  },
  {
    id: 5,
    name: "Спрайт",
    description: "Сэрүүн спрайт 0.5л",
    price: 1800,
    rating: 4.6,
    image: "/images/sprite.avif",
    category: "ундаа",
  },
  {
    id: 6,
    name: "Фанта",
    description: "Жүржийн амттай фанта 0.5л",
    price: 1800,
    rating: 4.4,
    image: "/images/fanta.png",
    category: "ундаа",
  },
  // Кофе (Coffee)
  {
    id: 7,
    name: "Латте",
    description: "Сүүтэй латте кофе",
    price: 4500,
    rating: 4.9,
    image: "/images/coffee.jpg",
    category: "кофе",
  },
  {
    id: 8,
    name: "Капучино",
    description: "Классик капучино",
    price: 4200,
    rating: 4.7,
    image: "/images/coffee.jpg",
    category: "кофе",
  },
  // Milkshake
  {
    id: 9,
    name: "Гүзээлзгэнэтэй милкшейк",
    description: "Амттай гүзээлзгэнэтэй милкшейк",
    price: 5500,
    rating: 4.8,
    image: "/images/milkshake.webp",
    category: "milkshake",
  },
  {
    id: 10,
    name: "Шоколадтай милкшейк",
    description: "Баялаг шоколадтай милкшейк",
    price: 5800,
    rating: 4.9,
    image: "/images/milkshake.webp",
    category: "milkshake",
  },
  // Салат (Salad)
  {
    id: 11,
    name: "Оливье салат",
    description: "Уламжлалт оливье салат",
    price: 6500,
    rating: 4.6,
    image: "/images/salat.jpg",
    category: "салат",
  },
  {
    id: 12,
    name: "Цезарь салат",
    description: "Тахианы махтай цезарь салат",
    price: 7800,
    rating: 4.7,
    image: "/images/salat.jpg",
    category: "салат",
  },
  // Хоол (Food)
  {
    id: 13,
    name: "Хуушуур",
    description: "Уламжлалт монгол хуушуур",
    price: 3500,
    rating: 4.9,
    image: "/images/huushuur.png",
    category: "хоол",
  },
  {
    id: 14,
    name: "Буузы",
    description: "Уурын буузы, 8 ширхэг",
    price: 4000,
    rating: 4.8,
    image: "/images/buuz.png",
    category: "хоол",
  },
  // Багц (Set)
  {
    id: 15,
    name: "Өглөөний багц",
    description: "Кофе + талх + өндөг",
    price: 8500,
    rating: 4.5,
    image: "/images/breakfast-set.png",
    category: "багц",
  },
  {
    id: 16,
    name: "Үдийн багц",
    description: "Хоол + салат + ундаа",
    price: 12000,
    rating: 4.7,
    image: "/images/lunch-set.png",
    category: "багц",
  },
  // Шөл (Soup)
  {
    id: 17,
    name: "Ногооны шөл",
    description: "Амттай ногооны шөл",
    price: 4500,
    rating: 4.3,
    image: "/images/vegetable-soup.png",
    category: "шөл",
  },
  {
    id: 18,
    name: "Махны шөл",
    description: "Баялаг махны шөл",
    price: 5500,
    rating: 4.6,
    image: "/images/meat-soup.png",
    category: "шөл",
  },
  // Ширхэг (Pieces)
  {
    id: 19,
    name: "Цусан хошуу",
    description: "Уламжлалт цусан хошуу",
    price: 8500,
    rating: 4.8,
    image: "/images/besbarmax.jpg",
    category: "ширхэг",
  },
  {
    id: 20,
    name: "Махны ширхэг",
    description: "Шарсан махны ширхэг",
    price: 9500,
    rating: 4.7,
    image: "/images/besbarmax.jpg",
    category: "ширхэг",
  },
]

// Promotional banners data
const defaultPromotionalBanners = [
  {
    id: 1,
    title: "60% хүртэл",
    subtitle: "хөнгөлөлт",
    buttonText: "Авах",
    bgColor: "from-green-600 to-green-500",
    image: "/images/promotion-banner.png",
  },
  {
    id: 2,
    title: "Шинэ амт",
    subtitle: "танилцуулга",
    buttonText: "Үзэх",
    bgColor: "from-blue-600 to-blue-500",
    image: "/placeholder.svg?height=80&width=80",
  },
  {
    id: 3,
    title: "Хурдан хүргэлт",
    subtitle: "15 минутад",
    buttonText: "Захиалах",
    bgColor: "from-purple-600 to-purple-500",
    image: "/placeholder.svg?height=80&width=80",
  },
  {
    id: 4,
    title: "Багц хоол",
    subtitle: "хямд үнээр",
    buttonText: "Сонгох",
    bgColor: "from-orange-600 to-orange-500",
    image: "/placeholder.svg?height=80&width=80",
  },
]

// Branch locations data
const defaultBranches = [
  {
    id: 1,
    name: "Төв салбар",
    address: "Сүхбаатар дүүрэг, 1-р хороо, Чингисийн өргөн чөлөө 15",
    phone: "+976 7777 1111",
    hours: "08:00 - 22:00",
    status: "Нээлттэй",
    distance: "0.5 км",
    image: "/placeholder.svg?height=120&width=200",
  },
  {
    id: 2,
    name: "Хан-Уул салбар",
    address: "Хан-Уул дүүрэг, 4-р хороо, Зайсангийн гудамж 25",
    phone: "+976 7777 2222",
    hours: "09:00 - 21:00",
    status: "Нээлттэй",
    distance: "2.1 км",
    image: "/placeholder.svg?height=120&width=200",
  },
  {
    id: 3,
    name: "Баянзүрх салбар",
    address: "Баянзүрх дүүрэг, 12-р хороо, Энхтайваны өргөн чөлөө 45",
    phone: "+976 7777 3333",
    hours: "08:30 - 21:30",
    status: "Нээлттэй",
    distance: "3.7 км",
    image: "/placeholder.svg?height=120&width=200",
  },
  {
    id: 4,
    name: "Чингэлтэй салбар",
    address: "Чингэлтэй дүүрэг, 6-р хороо, Мирзо Улугбекийн гудамж 12",
    phone: "+976 7777 4444",
    hours: "10:00 - 20:00",
    status: "Хаалттай",
    distance: "5.2 км",
    image: "/placeholder.svg?height=120&width=200",
  },
]

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

  // Firebase data states
  const [categories, setCategories] = useState(defaultCategories)
  const [menuItems, setMenuItems] = useState(defaultMenuItems)
  const [branches, setBranches] = useState(defaultBranches)
  const [promotionalBanners, setPromotionalBanners] = useState(defaultPromotionalBanners)
  const [users, setUsers] = useState<any[]>([
    {
      id: 1,
      name: "Мөнхбат",
      email: "monkhbat@email.com",
      phone: "+976 9999 9999",
      joinDate: "2023-05-15",
      status: "active",
      totalOrders: 15,
      totalSpent: 245000,
    },
    {
      id: 2,
      name: "Болормаа",
      email: "bolormaa@email.com",
      phone: "+976 8888 8888",
      joinDate: "2023-06-20",
      status: "active",
      totalOrders: 8,
      totalSpent: 120000,
    },
  ])
  const [orders, setOrders] = useState<any[]>([
    {
      id: "#001",
      customerName: "Мөнхбат",
      table: 5,
      items: [
        { name: "Хуушуур", quantity: 2, price: 3500 },
        { name: "Цай", quantity: 1, price: 2500 },
      ],
      total: 9500,
      status: "completed",
      orderTime: "2024-01-15 14:30",
      completedTime: "2024-01-15 14:45",
    },
    {
      id: "#002",
      customerName: "Болормаа",
      table: 3,
      items: [
        { name: "Буузы", quantity: 1, price: 4000 },
        { name: "Ногооны шөл", quantity: 1, price: 4500 },
      ],
      total: 8500,
      status: "ready",
      orderTime: "2024-01-15 15:20",
      completedTime: null,
    },
    {
      id: "#003",
      customerName: "Зочин",
      table: 7,
      items: [
        { name: "Оливье салат", quantity: 1, price: 6500 },
        { name: "Кока кола", quantity: 2, price: 1800 },
      ],
      total: 10100,
      status: "confirmed",
      orderTime: "2024-01-15 15:45",
      completedTime: null,
    },
  ])

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

      if (firebaseCategories.length > 0) setCategories(firebaseCategories)
      if (firebaseMenuItems.length > 0) setMenuItems(firebaseMenuItems)
      if (firebaseBranches.length > 0) setBranches(firebaseBranches)
      if (firebaseBanners.length > 0) setPromotionalBanners(firebaseBanners)
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

  if (!isAdmin || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-500"></div>
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
