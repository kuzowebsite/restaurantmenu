import { initializeApp } from "firebase/app"
import { getDatabase, ref, set, get, push, remove, update } from "firebase/database"
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyA_1KCk07ExJkWx6P_ek6T-qCy4ceclZ5g",
  authDomain: "restaurant-ac0ee.firebaseapp.com",
  databaseURL: "https://restaurant-ac0ee-default-rtdb.firebaseio.com",
  projectId: "restaurant-ac0ee",
  storageBucket: "restaurant-ac0ee.firebasestorage.app",
  messagingSenderId: "656648327824",
  appId: "1:656648327824:web:c58332e9e4c01fbc15fe15",
  measurementId: "G-FGFQG9GB8F",
}

const app = initializeApp(firebaseConfig)
export const database = getDatabase(app)
export const auth = getAuth(app)

// Database operations
export const dbOperations = {
  // Categories
  async getCategories() {
    const snapshot = await get(ref(database, "categories"))
    return snapshot.exists() ? Object.entries(snapshot.val()).map(([key, value]) => ({ id: key, ...value })) : []
  },

  async addCategory(category: any) {
    const newRef = push(ref(database, "categories"))
    await set(newRef, { ...category, id: newRef.key })
    return newRef.key
  },

  async updateCategory(id: string, category: any) {
    await update(ref(database, `categories/${id}`), category)
  },

  async deleteCategory(id: string) {
    await remove(ref(database, `categories/${id}`))
  },

  // Menu Items
  async getMenuItems() {
    const snapshot = await get(ref(database, "menuItems"))
    return snapshot.exists() ? Object.entries(snapshot.val()).map(([key, value]) => ({ id: key, ...value })) : []
  },

  async addMenuItem(item: any) {
    const newRef = push(ref(database, "menuItems"))
    await set(newRef, { ...item, id: newRef.key })
    return newRef.key
  },

  async updateMenuItem(id: string, item: any) {
    await update(ref(database, `menuItems/${id}`), item)
  },

  async deleteMenuItem(id: string) {
    await remove(ref(database, `menuItems/${id}`))
  },

  // Branches
  async getBranches() {
    const snapshot = await get(ref(database, "branches"))
    return snapshot.exists() ? Object.entries(snapshot.val()).map(([key, value]) => ({ id: key, ...value })) : []
  },

  async addBranch(branch: any) {
    const newRef = push(ref(database, "branches"))
    await set(newRef, { ...branch, id: newRef.key })
    return newRef.key
  },

  async updateBranch(id: string, branch: any) {
    await update(ref(database, `branches/${id}`), branch)
  },

  async deleteBranch(id: string) {
    await remove(ref(database, `branches/${id}`))
  },

  // Banners
  async getBanners() {
    const snapshot = await get(ref(database, "banners"))
    return snapshot.exists() ? Object.entries(snapshot.val()).map(([key, value]) => ({ id: key, ...value })) : []
  },

  async addBanner(banner: any) {
    const newRef = push(ref(database, "banners"))
    await set(newRef, { ...banner, id: newRef.key })
    return newRef.key
  },

  async updateBanner(id: string, banner: any) {
    await update(ref(database, `banners/${id}`), banner)
  },

  async deleteBanner(id: string) {
    await remove(ref(database, `banners/${id}`))
  },

  // Users
  async getUsers() {
    const snapshot = await get(ref(database, "users"))
    return snapshot.exists() ? Object.entries(snapshot.val()).map(([key, value]) => ({ id: key, ...value })) : []
  },

  async addUser(user: any) {
    const newRef = push(ref(database, "users"))
    await set(newRef, { ...user, id: newRef.key })
    return newRef.key
  },

  async updateUser(id: string, user: any) {
    await update(ref(database, `users/${id}`), user)
  },

  async getUserByEmail(email: string) {
    const snapshot = await get(ref(database, "users"))
    if (snapshot.exists()) {
      const users = Object.entries(snapshot.val()).map(([key, value]) => ({ id: key, ...value }))
      return users.find((user: any) => user.email === email)
    }
    return null
  },

  // Orders
  async getOrders() {
    const snapshot = await get(ref(database, "orders"))
    return snapshot.exists() ? Object.entries(snapshot.val()).map(([key, value]) => ({ id: key, ...value })) : []
  },

  async addOrder(order: any) {
    const newRef = push(ref(database, "orders"))
    await set(newRef, { ...order, id: newRef.key })
    return newRef.key
  },

  async updateOrder(id: string, order: any) {
    await update(ref(database, `orders/${id}`), order)
  },

  // Image operations (base64 storage)
  async uploadImage(imageFile: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64String = reader.result as string
        resolve(base64String)
      }
      reader.onerror = reject
      reader.readAsDataURL(imageFile)
    })
  },

  // Favorites
  async getFavorites(userId: string) {
    const snapshot = await get(ref(database, `favorites/${userId}`))
    return snapshot.exists() ? snapshot.val() : []
  },

  async addFavorite(userId: string, itemId: number) {
    const favoritesRef = ref(database, `favorites/${userId}`)
    const snapshot = await get(favoritesRef)
    const currentFavorites = snapshot.exists() ? snapshot.val() : []
    const updatedFavorites = [...currentFavorites, itemId]
    await set(favoritesRef, updatedFavorites)
  },

  async removeFavorite(userId: string, itemId: number) {
    const favoritesRef = ref(database, `favorites/${userId}`)
    const snapshot = await get(favoritesRef)
    const currentFavorites = snapshot.exists() ? snapshot.val() : []
    const updatedFavorites = currentFavorites.filter((id: number) => id !== itemId)
    await set(favoritesRef, updatedFavorites)
  },

  // Order History
  async getOrderHistory(userId: string) {
    const snapshot = await get(ref(database, `orderHistory/${userId}`))
    return snapshot.exists() ? Object.entries(snapshot.val()).map(([key, value]) => ({ id: key, ...value })) : []
  },

  async addOrderToHistory(userId: string, order: any) {
    const newRef = push(ref(database, `orderHistory/${userId}`))
    await set(newRef, { ...order, id: newRef.key })
    return newRef.key
  },

  // User Profile
  async getUserProfile(userId: string) {
    const snapshot = await get(ref(database, `userProfiles/${userId}`))
    return snapshot.exists() ? snapshot.val() : null
  },

  async updateUserProfile(userId: string, profile: any) {
    await update(ref(database, `userProfiles/${userId}`), profile)
  },
}

// Authentication operations
export const authOperations = {
  async loginUser(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = await dbOperations.getUserByEmail(email)
      return { success: true, user: user || { email, role: "user" } }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async registerUser(email: string, password: string, userData: any) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const newUser = {
        email,
        role: userData.role || "user", // Default role is "user", but can be "admin"
        ...userData,
        createdAt: new Date().toISOString(),
      }
      await dbOperations.addUser(newUser)
      return { success: true, user: newUser }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },
}
