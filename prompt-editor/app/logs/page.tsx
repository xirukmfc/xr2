"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { AlertTriangle, Clock, Server, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataFilters } from "@/components/ui/data-filters"
import { DataTable } from "@/components/ui/data-table"
import { Pagination } from "@/components/ui/pagination"
import type { Column } from "@/components/ui/data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { apiClient } from "@/lib/api"
import { useNotification } from "@/components/notification-provider"

export interface ApiLog {
  id: string
  api_key_id: string
  api_key_name: string
  request_id: string
  endpoint: string
  method: string
  request_params: any
  request_body: any
  response_body: any
  latency_ms: number
  status_code: number
  error_message?: string
  is_success: boolean
  client_ip: string
  user_agent?: string
  created_at: string
}

function LogsPageContent() {
  const [logs, setLogs] = useState<ApiLog[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [sortBy, setSortBy] = useState("created_at")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const { showNotification } = useNotification()

  // fullscreen viewer
  const [viewerOpen, setViewerOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null)

  const openViewer = (log: ApiLog) => {
    setSelectedLog(log)
    setViewerOpen(true)
  }

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params: any = {
        page: currentPage,
        per_page: itemsPerPage
      }
      
      if (activeFilter !== 'all') {
        if (activeFilter === 'success') {
          params.is_success = true
        } else if (activeFilter === 'error') {
          params.is_success = false
        }
      }

      const data = await apiClient.getApiLogs(params)
      setLogs(data.logs || [])
      setTotal(data.total || 0)
      setTotalPages(data.pages || 0)
    } catch (error) {
      console.error('Error fetching logs:', error)
      showNotification("Failed to fetch API logs", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [currentPage, itemsPerPage, activeFilter])

  const getStatusBadge = (statusCode: number, isSuccess: boolean) => {
    if (isSuccess) {
      return "bg-green-50 text-green-700 border-green-200"
    } else if (statusCode >= 500) {
      return "bg-red-50 text-red-700 border-red-200"
    } else if (statusCode >= 400) {
      return "bg-orange-50 text-orange-700 border-orange-200"
    }
    return "bg-gray-50 text-gray-700 border-gray-200"
  }

  const getStatusDot = (isSuccess: boolean) => {
    return isSuccess ? "bg-green-500" : "bg-red-500"
  }

  const getResponseTimeColor = (ms: number) => {
    if (ms < 1000) return "text-green-600"
    if (ms < 3000) return "text-orange-600"
    return "text-red-600"
  }

  const prettyJson = (raw: string) => {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2)
    } catch {
      return raw
    }
  }

  const formatResponse = (responseBody: any) => {
    // If it's already an object, stringify it
    if (typeof responseBody === 'object' && responseBody !== null) {
      return JSON.stringify(responseBody, null, 2)
    }

    // If it's a string, try to parse it as JSON
    if (typeof responseBody === 'string') {
      try {
        // Try to parse as JSON
        const parsed = JSON.parse(responseBody)
        return JSON.stringify(parsed, null, 2)
      } catch {
        // If parsing fails, try to convert Python dict string to JSON
        try {
          // Replace single quotes with double quotes for Python dict notation
          const jsonString = responseBody
            .replace(/'/g, '"')
            .replace(/None/g, 'null')
            .replace(/True/g, 'true')
            .replace(/False/g, 'false')
          const parsed = JSON.parse(jsonString)
          return JSON.stringify(parsed, null, 2)
        } catch {
          // If all else fails, return as is
          return responseBody
        }
      }
    }

    return String(responseBody)
  }

  const filterOptions = [
    { key: "all", label: "All" },
    { key: "success", label: "Success" },
    { key: "error", label: "Error" },
  ]

  const sortOptions = [
    { value: "created_at", label: "Sort by: Request Time" },
    { value: "latency_ms", label: "Sort by: Duration" },
    { value: "status_code", label: "Sort by: Status Code" },
    { value: "endpoint", label: "Sort by: Endpoint" },
  ]

  const columns: Column<ApiLog>[] = [
    {
      key: "request",
      header: "Request & Response",
      width: "col-span-5",
      render: (log) => (
        <div className="flex items-center space-x-2 min-w-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusDot(log.is_success)}`}></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1 text-xs truncate">
              <span className="font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0">{log.method}</span>
              <span className="text-slate-500 truncate">{log.endpoint}</span>
              <span className="text-slate-400 flex-shrink-0">({log.api_key_name})</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "timing",
      header: "Timing",
      width: "col-span-3",
      render: (log) => (
        <div className="text-xs">
          <div className="flex items-center space-x-1 truncate">
            <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="text-slate-700 truncate">{new Date(log.created_at).toLocaleString()}</span>
          </div>
        </div>
      ),
    },
    {
      key: "source",
      header: "Source",
      width: "col-span-2",
      render: (log) => (
        <div className="flex items-center space-x-2 text-xs truncate">
          <Server className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <span className="text-slate-700 truncate">{log.client_ip}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "col-span-1",
      render: (log) => (
        <div className="flex items-center">
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${getStatusBadge(log.status_code, log.is_success)}`}
          >
            {log.status_code}
          </span>
        </div>
      ),
    },
  ]

  // Client-side filtering for search (since the backend already handles pagination)
  let displayedLogs = logs.filter((log) => {
    if (!searchQuery) return true
    
    const searchLower = searchQuery.toLowerCase()
    const requestBody = JSON.stringify(log.request_body || log.request_params || {}).toLowerCase()
    const responseBody = JSON.stringify(log.response_body || {}).toLowerCase()
    const errorMessage = (log.error_message || '').toLowerCase()
    
    return (
      requestBody.includes(searchLower) ||
      responseBody.includes(searchLower) ||
      errorMessage.includes(searchLower) ||
      log.endpoint.toLowerCase().includes(searchLower) ||
      log.client_ip.toLowerCase().includes(searchLower)
    )
  })

  // Add refresh function
  const handleRefresh = () => {
    fetchLogs()
  }

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-[12px] pb-[12px] h-[65px] bg-white border-b border-slate-200">
          <DataFilters
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            searchPlaceholder="Search logs..."
            activeFilter={activeFilter}
            onFilter={setActiveFilter}
            filterOptions={filterOptions}
            sortBy={sortBy}
            onSort={setSortBy}
            sortOptions={sortOptions}
            showNewPromptButton={false}
            customActionButton={
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
                className="h-[35px]"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            }
          />
      </div>

      <div className="flex flex-col">
        <DataTable
          data={displayedLogs}
          columns={columns}
          isLoading={loading}
          onRowClick={(log) => openViewer(log)}
          emptyState={{
            icon: <AlertTriangle className="w-6 h-6 text-slate-400" />,
            title: "No logs found",
            description: "No API logs match your current search and filter criteria.",
          }}
        />
        <Pagination
          totalItems={total}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemName="logs"
        />
      </div>

      {/* Fullscreen Log Viewer */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="w-screen h-screen max-w-[100vw] p-0 rounded-none">
          <div className="flex flex-col h-full">
            <DialogHeader className="px-6 py-4 border-b border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-base">
                    <span className="mr-2 inline-flex items-center text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {selectedLog?.method}
                    </span>
                    {selectedLog?.endpoint}
                  </DialogTitle>
                  <div className="mt-2 text-xs text-slate-600">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-medium border mr-2 ${selectedLog ? getStatusBadge(selectedLog.status_code, selectedLog.is_success) : ""}`}>
                      {selectedLog?.status_code} {selectedLog?.is_success ? 'SUCCESS' : 'ERROR'}
                    </span>
                    <span className="mr-2">API Key: {selectedLog?.api_key_name}</span>
                    <span className="mr-2">IP: {selectedLog?.client_ip}</span>
                    <span className="mr-2">Time: {selectedLog ? new Date(selectedLog.created_at).toLocaleString() : ''}</span>
                    <span>{selectedLog?.latency_ms}ms</span>
                  </div>
                  {selectedLog?.error_message && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded whitespace-pre-wrap font-mono">
                      {formatResponse(selectedLog.error_message)}
                    </div>
                  )}
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-slate-700 mb-2">Request</div>
                  <div className="text-xs text-slate-500 mb-2 h-[35px]">
                    Request ID: {selectedLog?.request_id}
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded p-4 max-h-96 overflow-auto">
                    <pre className="text-xs leading-relaxed whitespace-pre-wrap">
{selectedLog ? JSON.stringify({
  params: selectedLog.request_params,
  body: selectedLog.request_body
}, null, 2) : ""}
                    </pre>
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-slate-700 mb-2">Response</div>
                  <div className="text-xs text-slate-500 mb-2 h-[35px]">
                    User Agent: {selectedLog?.user_agent || 'Unknown'}
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded p-4 max-h-[530px] overflow-auto">
                    <pre className="text-xs leading-relaxed whitespace-pre-wrap">
{selectedLog ? (selectedLog.error_message ? formatResponse(selectedLog.error_message) : formatResponse(selectedLog.response_body)) : ""}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function LogsPage() {
  return (
    <ProtectedRoute>
      <LogsPageContent />
    </ProtectedRoute>
  )
}
