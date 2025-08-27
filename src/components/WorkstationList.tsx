"use client"

import { Workstation, WorkstationStatus } from "@/app/lib/data"
import { Badge } from "@/app/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { 
  QuickActions, 
  QuickActionsContent, 
  QuickActionsItem, 
  QuickActionsTrigger,
  QuickActionsSeparator
} from "@/app/components/ui/quick-actions"
import { useToast } from "@/app/components/ui/simple-toast"
import { formatDistanceToNow, parseISO } from "date-fns"
import { 
  Computer, 
  Laptop, 
  Server, 
  Cloud, 
  RefreshCcw, 
  PowerOff, 
  Terminal, 
  Settings, 
  Trash2, 
  AlertCircle
} from "lucide-react"

const statusColor: Record<WorkstationStatus, string> = {
  online: "bg-green-100 text-green-800 border-green-200",
  offline: "bg-gray-100 text-gray-800 border-gray-200",
  maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200",
  warning: "bg-orange-100 text-orange-800 border-orange-200"
}

const typeIcon = {
  desktop: Computer,
  laptop: Laptop,
  server: Server,
  virtual: Cloud
}

export function WorkstationItem({ workstation }: { workstation: Workstation }) {
  const { addToast } = useToast()
  const Icon = typeIcon[workstation.type]

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true })
    } catch (e) {
      return dateString
    }
  }

  const handleAction = (action: string) => {
    addToast({
      title: `${action} ${workstation.name}`,
      description: `${action} action triggered on workstation ${workstation.name}`,
      variant: action === 'Delete' ? 'destructive' : 'info',
      duration: 3000
    })
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-all bg-white dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-md bg-blue-50 dark:bg-slate-800">
          <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{workstation.name}</h3>
            <Badge className={statusColor[workstation.status]}>
              {workstation.status}
            </Badge>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {workstation.ip} • {workstation.os} • {formatTime(workstation.lastSeen)}
          </div>
        </div>
      </div>
      
      <QuickActions>
        <QuickActionsTrigger variant="ghost" />
        <QuickActionsContent className="w-48">
          <QuickActionsItem onClick={() => handleAction('Refresh')}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            <span>Refresh</span>
          </QuickActionsItem>
          <QuickActionsItem onClick={() => handleAction('Restart')}>
            <PowerOff className="mr-2 h-4 w-4" />
            <span>Restart</span>
          </QuickActionsItem>
          <QuickActionsItem onClick={() => handleAction('Remote')}>
            <Terminal className="mr-2 h-4 w-4" />
            <span>Remote Terminal</span>
          </QuickActionsItem>
          <QuickActionsSeparator />
          <QuickActionsItem onClick={() => handleAction('Settings')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </QuickActionsItem>
          <QuickActionsItem 
            onClick={() => handleAction('Delete')}
            className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950 focus:text-red-700"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </QuickActionsItem>
        </QuickActionsContent>
      </QuickActions>
    </div>
  )
}

export function WorkstationList({ workstations }: { workstations: Workstation[] }) {
  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardHeader withBorder className="bg-slate-50 dark:bg-slate-900">
        <CardTitle size="sm">Workstations</CardTitle>
      </CardHeader>
      <CardContent padded="sm" className="flex flex-col gap-2">
        {workstations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
            <AlertCircle className="h-10 w-10 mb-3 opacity-40" />
            <p>No workstations found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {workstations.map((workstation) => (
              <WorkstationItem key={workstation.id} workstation={workstation} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}