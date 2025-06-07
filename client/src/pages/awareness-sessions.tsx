
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { useOnlineStatus } from '@/hooks/use-online-status';
import type { AwarenessSessionsResponse } from '@/types/api';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { FileDown, Plus } from 'lucide-react';
import AwarenessSessionForm from '@/components/awareness-session-form-new';
import ExportDataModal from '@/components/export-data-modal';
import { downloadExportData, prepareAwarenessSessionsForExport } from '@/lib/export-to-excel';

export default function AwarenessSessions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOnline } = useOnlineStatus();
  const [activeTab, setActiveTab] = useState("new");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Fetch sessions data
  const { data: sessionsData, isLoading } = useQuery<AwarenessSessionsResponse>({
    queryKey: ['/api/awareness-sessions'],
    enabled: activeTab === "list" && !!user
  });

  // Handle export
  const handleExport = (options: any) => {
    // Prepare mock data for export
    const exportData = prepareAwarenessSessionsForExport(
      sessionsData?.sessions || [],
      sessionsData?.attendees ? Object.values(sessionsData.attendees).flat() : [],
      options
    );
    
    // Download the export data
    downloadExportData(exportData, 'awareness_sessions');
    
    toast({
      title: "Export Started",
      description: "Your data is being exported to JSON format.",
    });
  };

  // Define the new columns for the table view
  const tableColumns = [
    {
      id: "details",
      header: "Details",
      cell: ({ row }: any) => {
        const rowData = row?.original || {};
        return (
          <div>
            <div className="font-medium">{rowData.villageName || 'N/A'}</div>
            <div className="text-sm text-muted-foreground">UC: {rowData.ucName || 'N/A'}</div>
          </div>
        );
      }
    },
    {
      id: "date",
      header: "Date",
      cell: ({ row }: any) => {
        return row?.original?.sessionDate ? formatDate(row.original.sessionDate) : 'N/A';
      },
    },
    {
      id: "sessionNumber",
      header: "Session #",
      cell: ({ row }: any) => row.index + 1
    },
    {
      id: "conductedBy",
      header: "Conducted By",
      cell: ({ row }: any) => {
        const rowData = row?.original || {};
        return (
          <div>
            <div>{rowData.conductedBy || 'N/A'}</div>
            <div className="text-xs text-muted-foreground">{rowData.designation || 'developer'}</div>
          </div>
        );
      }
    },
    {
      id: "location",
      header: "Location",
      cell: ({ row }: any) => (
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary hover:text-primary-600 p-0"
        >
          View on map
        </Button>
      )
    },
    {
      id: "attendees",
      header: "Attendees",
      cell: ({ row }: any) => {
        const sessionId = row?.original?.id;
        const attendeeCount = sessionsData?.attendees?.[sessionId]?.length || 0;
        return attendeeCount;
      }
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => {
        return (
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-blue-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="bg-white h-screen overflow-y-auto px-4 py-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Awareness Sessions</h1>
          <p className="mt-1 text-sm text-gray-600">Today: {formatDate(new Date())}</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setActiveTab("new")}
            className="bg-blue-500 hover:bg-blue-600 text-white"
            size="sm"
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Session
          </Button>
          
          <Button
            onClick={() => setIsExportModalOpen(true)}
            disabled={!isOnline}
            variant="outline"
            className="border-gray-300"
            size="sm"
          >
            <FileDown className="mr-1 h-3 w-3" />
            Export
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <div className="inline-flex border rounded-md overflow-hidden">
          <button 
            className={`px-3 py-1.5 text-xs font-medium ${activeTab === "list" ? "bg-blue-50 text-blue-600" : "bg-white text-gray-600"}`}
            onClick={() => setActiveTab("list")}
          >
            List View
          </button>
          <button 
            className={`px-3 py-1.5 text-xs font-medium ${activeTab === "card" ? "bg-blue-50 text-blue-600" : "bg-white text-gray-600"}`}
            onClick={() => setActiveTab("card")}
          >
            Card View
          </button>
        </div>
      </div>
      
      {activeTab === "list" && (
        <div className="border rounded-md overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : sessionsData?.sessions?.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    {tableColumns.map((column) => (
                      <th 
                        key={column.id} 
                        scope="col" 
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessionsData.sessions.map((session: any, index: number) => (
                    <tr key={session.id || index} className="hover:bg-gray-50">
                      {tableColumns.map((column) => (
                        <td key={`${session.id}-${column.id}`} className="px-4 py-3 whitespace-nowrap text-sm">
                          {column.cell({ row: { original: session, index } })}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No sessions found</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setActiveTab("new")}
              >
                <Plus className="mr-1 h-3 w-3" />
                Create New Session
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === "card" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : sessionsData?.sessions?.length ? (
            sessionsData.sessions.map((session: any, index: number) => {
              const attendeeCount = sessionsData?.attendees?.[session.id]?.length || 0;
              return (
                <Card key={session.id || index} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{session.villageName || 'Unknown Village'}</CardTitle>
                      <div className="text-xs">#{index + 1}</div>
                    </div>
                    <CardDescription className="text-xs">UC: {session.ucName || 'N/A'}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-xs font-medium">Date:</span>
                        <span className="text-xs">{formatDate(session.sessionDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs font-medium">Conducted by:</span>
                        <span className="text-xs">{session.conductedBy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs font-medium">Attendees:</span>
                        <span className="text-xs">{attendeeCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              <p>No sessions found</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setActiveTab("new")}
              >
                <Plus className="mr-1 h-3 w-3" />
                Create New Session
              </Button>
            </div>
          )}
        </div>
      )}
      
      {activeTab === "new" && (
        <AwarenessSessionForm />
      )}

      <ExportDataModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        title="Export Awareness Sessions"
        description="Choose options for exporting awareness session data"
        type="awareness-sessions"
        userOptions={
          sessionsData?.users?.map((user: any) => ({
            label: user.fullName || user.name,
            value: user.id
          })) || []
        }
      />
    </div>
  );
}
