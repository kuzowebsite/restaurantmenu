import { initializeApp } from "firebase/app"
import { getDatabase, ref, set, get, push, remove, update, onValue } from "firebase/database"
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

// Export onValue for use in components
export { onValue, ref }

// SMS Configuration
const SMS_CONFIG = {
  senderNumber: "80901860",
  serviceName: "Restaurant App",
  messageTemplate: (code: string, serviceName: string) =>
    `${serviceName} баталгаажуулах код: ${code}. 5 минутын дотор ашиглана уу. Хуваалцахгүй байна уу.`,
}

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
    console.log(`🔥 FIREBASE: Updating order in Firebase: ${id}`, order)
    try {
      // Use set instead of update to ensure complete data replacement and trigger all listeners
      await set(ref(database, `orders/${id}`), order)
      console.log(`🔥 FIREBASE: ✅ Order ${id} updated successfully`)

      // Add a delay to ensure Firebase has fully processed and propagated the change
      await new Promise((resolve) => setTimeout(resolve, 200))

      console.log(`🔥 FIREBASE: 🚀 Update propagation complete for ${id}`)
    } catch (error) {
      console.error(`🔥 FIREBASE: ❌ Error updating order ${id}:`, error)
      throw error
    }
  },

  // Site Branding operations
  async getSiteBranding() {
    const snapshot = await get(ref(database, "siteBranding"))
    return snapshot.exists() ? snapshot.val() : null
  },

  async updateSiteBranding(branding: any) {
    await set(ref(database, "siteBranding"), branding)
  },

  // Verification codes storage
  async storeVerificationCode(phoneNumber: string, code: string) {
    const codeData = {
      code: code,
      timestamp: Date.now(),
      used: false,
      senderNumber: SMS_CONFIG.senderNumber,
      message: SMS_CONFIG.messageTemplate(code, SMS_CONFIG.serviceName),
    }
    await set(ref(database, `verificationCodes/${phoneNumber}`), codeData)
  },

  async getVerificationCode(phoneNumber: string) {
    const snapshot = await get(ref(database, `verificationCodes/${phoneNumber}`))
    return snapshot.exists() ? snapshot.val() : null
  },

  async markCodeAsUsed(phoneNumber: string) {
    await update(ref(database, `verificationCodes/${phoneNumber}`), { used: true })
  },

  async deleteVerificationCode(phoneNumber: string) {
    await remove(ref(database, `verificationCodes/${phoneNumber}`))
  },

  // SMS Log for tracking
  async logSMS(phoneNumber: string, code: string, status: "sent" | "failed") {
    const logData = {
      phoneNumber: `+976${phoneNumber}`,
      senderNumber: SMS_CONFIG.senderNumber,
      message: SMS_CONFIG.messageTemplate(code, SMS_CONFIG.serviceName),
      status: status,
      timestamp: Date.now(),
      date: new Date().toISOString(),
    }
    const newRef = push(ref(database, "smsLogs"))
    await set(newRef, logData)
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

  // Phone authentication operations
  async sendVerificationCode(phoneNumber: string) {
    try {
      // Validate Mongolian phone number format
      const phoneRegex = /^[0-9]{8}$/
      if (!phoneRegex.test(phoneNumber)) {
        return { success: false, error: "Утасны дугаар буруу форматтай байна" }
      }

      // Generate 6-digit verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString()

      // Store the code in Firebase database (server-side storage)
      await dbOperations.storeVerificationCode(phoneNumber, code)

      // Simulate SMS sending delay
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // In production, integrate with SMS Gateway:
      // Example with Mongolian SMS providers:

      /*
      // Unitel SMS API
      const unitelResponse = await fetch('https://api.unitel.mn/sms/send', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer YOUR_API_KEY',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: SMS_CONFIG.senderNumber,
          to: `+976${phoneNumber}`,
          message: SMS_CONFIG.messageTemplate(code, SMS_CONFIG.serviceName)
        })
      })

      // Mobicom SMS API
      const mobicomResponse = await fetch('https://api.mobicom.mn/sms/send', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer YOUR_API_KEY',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: SMS_CONFIG.senderNumber,
          recipient: `976${phoneNumber}`,
          text: SMS_CONFIG.messageTemplate(code, SMS_CONFIG.serviceName)
        })
      })

      // Skytel SMS API
      const skytelResponse = await fetch('https://api.skytel.mn/sms/send', {
        method: 'POST',
        headers: {
          'X-API-Key': 'YOUR_API_KEY',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: SMS_CONFIG.senderNumber,
          to: phoneNumber,
          message: SMS_CONFIG.messageTemplate(code, SMS_CONFIG.serviceName)
        })
      })
      */

      // Log SMS for tracking
      await dbOperations.logSMS(phoneNumber, code, "sent")

      return {
        success: true,
        message: `${SMS_CONFIG.senderNumber} дугаараас +976${phoneNumber} руу баталгаажуулах код илгээгдлээ`,
        senderNumber: SMS_CONFIG.senderNumber,
      }
    } catch (error: any) {
      // Log failed SMS
      await dbOperations.logSMS(phoneNumber, "", "failed")
      return { success: false, error: "Код илгээхэд алдаа гарлаа" }
    }
  },

  async verifyPhoneCode(phoneNumber: string, code: string) {
    try {
      const storedCodeData = await dbOperations.getVerificationCode(phoneNumber)

      if (!storedCodeData) {
        return { success: false, error: "Код хүчингүй байна" }
      }

      // Check if code is already used
      if (storedCodeData.used) {
        return { success: false, error: "Код аль хэдийн ашигласан байна" }
      }

      // Check if code is expired (5 minutes)
      const now = Date.now()
      const sentTime = storedCodeData.timestamp
      if (now - sentTime > 5 * 60 * 1000) {
        await dbOperations.deleteVerificationCode(phoneNumber)
        return { success: false, error: "Кодын хугацаа дууссан байна" }
      }

      if (storedCodeData.code === code) {
        // Mark code as used and clean up
        await dbOperations.markCodeAsUsed(phoneNumber)
        await dbOperations.deleteVerificationCode(phoneNumber)

        // Check if user exists or create new user
        let user = await this.getUserByPhone(phoneNumber)
        if (!user) {
          // Create new user with phone number
          const newUser = {
            phone: phoneNumber,
            role: "user",
            createdAt: new Date().toISOString(),
          }
          await dbOperations.addUser(newUser)
          user = newUser
        }

        return { success: true, user }
      } else {
        return { success: false, error: "Код буруу байна" }
      }
    } catch (error: any) {
      return { success: false, error: "Баталгаажуулахад алдаа гарлаа" }
    }
  },

  async getUserByPhone(phone: string) {
    const snapshot = await get(ref(database, "users"))
    if (snapshot.exists()) {
      const users = Object.entries(snapshot.val()).map(([key, value]) => ({ id: key, ...value }))
      return users.find((user: any) => user.phone === phone)
    }
    return null
  },
}
