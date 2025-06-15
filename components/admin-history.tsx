"use client"

import { useState } from "react"
import { ArrowLeft, Search, Download, Eye, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface AdminHistoryProps {
  completedOrders: any[]
  setCurrentView: (view: string) => void
  safeToLocaleString: (value: any) => string
}

export default function AdminHistory({ completedOrders, setCurrentView, safeToLocaleString }: AdminHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState("all")

  const filteredOrders =
    completedOrders?.filter((order) => {
      const matchesSearch =
        !searchQuery ||
        order?.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order?.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order?.table?.toString().includes(searchQuery)

      const matchesDate =
        dateFilter === "all" ||
        (() => {
          const orderDate = new Date(order?.completedTime || order?.createdAt)
          const today = new Date()
          const yesterday = new Date(today)
          yesterday.setDate(yesterday.getDate() - 1)
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)

          switch (dateFilter) {
            case "today":
              return orderDate.toDateString() === today.toDateString()
            case "yesterday":
              return orderDate.toDateString() === yesterday.toDateString()
            case "week":
              return orderDate >= weekAgo
            default:
              return true
          }
        })()

      return matchesSearch && matchesDate
    }) || []

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentView("admin")}
          className="text-white hover:bg-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Захиалгын түүх</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-gray-600 text-gray-300">
            <Download className="w-4 h-4 mr-2" />
            Экспорт
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">{completedOrders?.length || 0}</div>
              <div className="text-sm text-gray-400">Дууссан захиалга</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-500">
                ₮{safeToLocaleString(completedOrders?.reduce((sum, order) => sum + (order?.total || 0), 0))}
              </div>
              <div className="text-sm text-gray-400">Нийт орлого</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-500">
                {filteredOrders?.filter((o) => {
                  const orderDate = new Date(o?.completedTime || o?.createdAt)
                  const today = new Date()
                  return orderDate.toDateString() === today.toDateString()
                })?.length || 0}
              </div>
              <div className="text-sm text-gray-400">Өнөөдрийн захиалга</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-500">
                {Math.round(
                  (completedOrders?.reduce((sum, order) => sum + (order?.total || 0), 0) || 0) /
                    (completedOrders?.length || 1),
                )}
              </div>
              <div className="text-sm text-gray-400">Дундаж захиалга</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Захиалгын дугаар, нэр, ширээ хайх..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2"
          >
            <option value="all">Бүх огноо</option>
            <option value="today">Өнөөдөр</option>
            <option value="yesterday">Өчигдөр</option>
            <option value="week">Сүүлийн 7 хоног</option>
          </select>
        </div>

        {/* History List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Дууссан захиалгууд ({filteredOrders?.length || 0})</h2>
          </div>

          {filteredOrders && filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <Card key={order?.id} className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <h3 className="font-semibold text-white text-lg flex items-center gap-2">
                          {order?.id || "N/A"}
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            Ширээ #{order?.table || "N/A"}
                          </Badge>
                        </h3>
                        <p className="text-sm text-gray-400">
                          {order?.customerName || "Зочин"} • Захиалсан: {order?.orderTime || "N/A"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Дууссан:{" "}
                          {order?.completedTime ? new Date(order.completedTime).toLocaleString("mn-MN") : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Дууссан</Badge>
                      <span className="font-semibold text-green-500 text-lg">₮{safeToLocaleString(order?.total)}</span>
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

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      Төлбөрийн арга: {order?.paymentMethod === "cash" ? "Бэлэн мөнгө" : order?.paymentMethod || "N/A"}
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
              <div className="text-gray-500 mb-4">
                {searchQuery || dateFilter !== "all" ? "Хайлтын үр дүн олдсонгүй" : "Дууссан захиалга байхгүй"}
              </div>
              {(searchQuery || dateFilter !== "all") && (
                <Button
                  variant="outline"
                  className="border-gray-600 text-gray-300"
                  onClick={() => {
                    setSearchQuery("")
                    setDateFilter("all")
                  }}
                >
                  Шүүлтүүр цэвэрлэх
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
