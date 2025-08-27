"use client";

import { Workstation, HardwareSpecs, User, ProjectAssignment } from "@/app/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Computer, Cpu, MemoryStick, Globe, Clock, User as UserIcon, Shield, Building2, MapPin, Briefcase, Calendar } from "lucide-react";

// Define the prop types
interface WorkstationDetailProps {
  workstation: Workstation | null;
}

// Format date from ISO to readable format
const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  
  // Handle different date formats
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString; // Just return the original if not a valid date
  }
  
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

// Get status badge
const getStatusBadge = (status: string) => {
  const getVariant = () => {
    switch (status.toLowerCase()) {
      case "available":
        return "success";
      case "assigned":
        return "info";
      case "maintenance":
        return "warning";
      case "active":
        return "success";
      case "inactive":
        return "secondary";
      case "on-project":
      case "on project":
        return "info";
      case "completed":
        return "secondary";
      case "planned":
        return "warning";
      default:
        return "secondary";
    }
  };
  
  return <Badge variant={getVariant()}>{status}</Badge>;
};

// Get icon based on workstation type
const getWorkstationIcon = (type: string) => {
  switch (type) {
    case "Desktop":
      return <Computer size={16} className="text-blue-500" />;
    case "Laptop":
      return <Computer size={16} className="text-purple-500" />;
    case "VM":
      return <Computer size={16} className="text-orange-500" />;
    default:
      return <Computer size={16} />;
  }
};

const WorkstationDetail = ({ workstation }: WorkstationDetailProps) => {
  if (!workstation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workstation Details</CardTitle>
          <CardDescription>Select a workstation to view details</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8 text-slate-500">
          No workstation selected
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getWorkstationIcon(workstation.type)}
          {workstation.machineName}
        </CardTitle>
        <CardDescription>
          {workstation.type} · {workstation.tier} · {workstation.location}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status section */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">Status:</div>
            <div>{getStatusBadge(workstation.status)}</div>
          </div>
          
          {/* Assigned to section */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">Assigned To:</div>
            <div className="flex items-center gap-2">
              {workstation.assignedTo ? (
                <>
                  <UserIcon size={14} className="text-blue-500" />
                  <span>{workstation.assignedTo.displayName || workstation.assignedTo.username}</span>
                </>
              ) : (
                <span className="text-slate-400">Not assigned</span>
              )}
            </div>
          </div>
          
          {/* Last seen */}
          {workstation.lastSeen && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">Last Active:</div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-slate-400" />
                {formatDate(workstation.lastSeen.toString())}
              </div>
            </div>
          )}
          
          {/* Hardware section */}
          <div className="pt-2">
            <h3 className="font-medium text-sm mb-2">Hardware Specifications</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu size={14} className="text-slate-400" />
                  <span>CPU:</span>
                </div>
                <div>{workstation.hardwareSpecs.cpuModel}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu size={14} className="text-slate-400" />
                  <span>Cores:</span>
                </div>
                <div>{workstation.hardwareSpecs.cpuCores} cores @ {workstation.hardwareSpecs.cpuSpeed} GHz</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MemoryStick size={14} className="text-slate-400" />
                  <span>RAM:</span>
                </div>
                <div>{workstation.hardwareSpecs.ram} GB</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu size={14} className="text-slate-400" />
                  <span>GPU:</span>
                </div>
                <div>{workstation.hardwareSpecs.gpu}</div>
              </div>
            </div>
          </div>
          
          {/* System information */}
          <div className="pt-2">
            <h3 className="font-medium text-sm mb-2">System Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-slate-400" />
                  <span>OS:</span>
                </div>
                <div>{workstation.os}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-slate-400" />
                  <span>OU:</span>
                </div>
                <div>{workstation.ou}</div>
              </div>
              
              {/* Salt API specific attributes if available */}
              {workstation.saltAttributes && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-400" />
                      <span>Boot Time:</span>
                    </div>
                    <div>{formatDate(workstation.saltAttributes.bootTime)}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield size={14} className="text-slate-400" />
                      <span>Salt Version:</span>
                    </div>
                    <div>{workstation.saltAttributes.saltVersion}</div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Display assigned user's project information if available */}
          {workstation.assignedTo?.projectAssignments && workstation.assignedTo.projectAssignments.length > 0 && (
            <div className="pt-2">
              <h3 className="font-medium text-sm mb-2">User Project Information</h3>
              <div className="space-y-2 text-sm">
                {workstation.assignedTo.projectAssignments.slice(0, 2).map((project, idx) => (
                  <div key={`${project.projectId}-${idx}`} className="border-l-2 border-blue-500 pl-3 py-1">
                    <div className="font-medium flex items-center gap-1.5">
                      <Briefcase size={14} className="text-blue-500" />
                      {project.projectName}
                      {getStatusBadge(project.status)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Building2 size={12} />
                      {project.client}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(project.startDate)} 
                      {project.endDate && `- ${formatDate(project.endDate)}`}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Role: {project.role}
                    </div>
                  </div>
                ))}
                
                {workstation.assignedTo.projectAssignments.length > 2 && (
                  <div className="text-xs text-slate-500 mt-1">
                    + {workstation.assignedTo.projectAssignments.length - 2} more projects
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Export both as named export and default export for maximum compatibility
export { WorkstationDetail };
export default WorkstationDetail;