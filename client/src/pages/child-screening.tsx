import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { useOnlineStatus } from '@/hooks/use-online-status';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileDown, Plus } from 'lucide-react';
import ChildScreeningForm from '@/components/child-screening-form-new';
import StatusPill from '@/components/status-pill';
import DataTable from '@/components/data-table';
import ExportDataModal from '@/components/export-data-modal';
import { downloadExportData, prepareChildScreeningsForExport } from '@/lib/export-to-excel';

export default function ChildScreening() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOnline } = useOnlineStatus();
  const [activeTab, setActiveTab] = useState("new");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Fetch screenings data
  const { data: screeningsData, isLoading } = useQuery({
    queryKey: ['/api/child-screenings'],
    enabled: activeTab === "list" && !!user
  });

  // Handle export
  const handleExport = (options: any) => {
    // Prepare mock data for export
    const exportData = prepareChildScreeningsForExport(
      screeningsData?.screenings || [],
      screeningsData?.children || [],
      options
    );
    
    // Download the export data
    downloadExportData(exportData, 'child_screenings');
    
    toast({
      title: "Export Started",
      description: "Your data is being exported to JSON format.",
    });
  };

  // Set up columns for the data table
  const columns = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }: any) => formatDate(row.original.date),
    },
    {
      accessorKey: "villageName",
      header: "Village",
    },
    {
      accessorKey: "ucName",
      header: "UC Name",
    },
    {
      accessorKey: "conductedBy",
      header: "Conducted By",
    },
    {
      accessorKey: "childrenCount",
      header: "Children Screened",
    },
    {
      accessorKey: "stats",
      header: "Nutrition Status",
      cell: ({ row }: any) => {
        const stats = row.original.stats || { normal: 0, mam: 0, sam: 0 };
        return (
          <div className="flex space-x-1">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Normal: {stats.normal || 0}
            </Badge>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              MAM: {stats.mam || 0}
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              SAM: {stats.sam || 0}
            </Badge>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // View details
              toast({
                title: "Viewing Screening Details",
                description: `Viewing details for screening in ${row.original.villageName}`,
              });
            }}
          >
            View
          </Button>
          
          {user && ['developer', 'master'].includes(user.role) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
              onClick={() => {
                // Delete screening
                toast({
                  variant: "destructive",
                  title: "Delete Screening",
                  description: "This feature is not yet implemented.",
                });
              }}
            >
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Define the table columns for child screening
  const tableColumns = [
    {
      id: "name",
      header: "NAME",
      cell: ({ row }: any) => {
        const child = row?.original || {};
        return child.name || 'N/A';
      }
    },
    {
      id: "fatherName",
      header: "FATHER'S NAME",
      cell: ({ row }: any) => {
        const child = row?.original || {};
        return child.fatherName || 'N/A';
      }
    },
    {
      id: "village",
      header: "VILLAGE",
      cell: ({ row }: any) => {
        const child = row?.original || {};
        return child.village || 'N/A';
      }
    },
    {
      id: "age",
      header: "AGE",
      cell: ({ row }: any) => {
        const child = row?.original || {};
        return child.ageMonths ? `${child.ageMonths} months` : 'N/A';
      }
    },
    {
      id: "muac",
      header: "MUAC",
      cell: ({ row }: any) => {
        const child = row?.original || {};
        return child.muac ? `${child.muac} cm` : 'N/A';
      }
    },
    {
      id: "status",
      header: "STATUS",
      cell: ({ row }: any) => {
        const child = row?.original || {};
        const status = child.status || 'Unknown';
        
        let colorClass = "";
        if (status === 'Normal') {
          colorClass = "bg-green-500 text-white";
        } else if (status === 'MAM') {
          colorClass = "bg-yellow-500 text-white";
        } else if (status === 'SAM') {
          colorClass = "bg-red-500 text-white";
        }
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
            {status}
          </span>
        );
      }
    },
    {
      id: "vaccination",
      header: "VACCINATION",
      cell: ({ row }: any) => {
        const child = row?.original || {};
        const vaccinationStatus = child.vaccinationStatus || '0-Dose';
        
        let colorClass = "";
        if (vaccinationStatus === 'Completed') {
          colorClass = "text-green-600";
        } else if (vaccinationStatus === '0-Dose') {
          colorClass = "text-green-600";
        }
        
        return (
          <span className={`text-sm font-medium ${colorClass}`}>
            {vaccinationStatus}
            {vaccinationStatus === '0-Dose' && child.isUnderVaccinationAge && (
              <span className="ml-2 text-yellow-500">⚠</span>
            )}
          </span>
        );
      }
    }
  ];

  // Mock data for children stats
  const mockStats = {
    sam: 1,
    mam: 1,
    normal: 2
  };

  // Mock data for children
  const mockChildren = [
    { 
      id: 1, 
      name: 'Ali Khan', 
      fatherName: 'Noor Khan', 
      village: 'Shah Zaman', 
      ageMonths: 6, 
      muac: 12.5, 
      status: 'Normal', 
      vaccinationStatus: '0-Dose',
      isUnderVaccinationAge: false
    },
    { 
      id: 2, 
      name: 'Ali Gul', 
      fatherName: 'Noor Hasan', 
      village: 'Mitha Khan Jamali', 
      ageMonths: 36, 
      muac: 12.2, 
      status: 'MAM', 
      vaccinationStatus: 'Completed',
      isUnderVaccinationAge: false
    },
    { 
      id: 3, 
      name: 'Shahzia', 
      fatherName: 'Khan Muhammad', 
      village: 'Mitha Khan Jamali', 
      ageMonths: 48, 
      muac: 13.2, 
      status: 'Normal', 
      vaccinationStatus: '0-Dose',
      isUnderVaccinationAge: true
    },
    { 
      id: 4, 
      name: 'Shahzaib', 
      fatherName: 'Nabi Bux', 
      village: 'Village Janan Jamali', 
      ageMonths: 36, 
      muac: 11.2, 
      status: 'SAM', 
      vaccinationStatus: 'Completed',
      isUnderVaccinationAge: false
    }
  ];

  return (
    <div className="bg-white h-screen overflow-y-auto px-4 py-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Child Screening</h1>
          <p className="mt-1 text-sm text-gray-600">Today: {formatDate(new Date())}</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setActiveTab("new")}
            className="bg-blue-500 hover:bg-blue-600 text-white"
            size="sm"
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Screening
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
          
          <Button
            variant="outline"
            className="border-gray-300"
            size="sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
          </Button>
        </div>
      </div>

      {/* Status Cards - Smaller, more compact design */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-red-50 border border-red-100 rounded-lg p-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-red-500 text-xs">⚠</span>
            <h3 className="text-xs font-medium text-red-800">SAM</h3>
          </div>
          <div className="mt-1 text-lg font-semibold text-red-900 text-center">{mockStats.sam}</div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-yellow-500 text-xs">⚠</span>
            <h3 className="text-xs font-medium text-yellow-800">MAM</h3>
          </div>
          <div className="mt-1 text-lg font-semibold text-yellow-900 text-center">{mockStats.mam}</div>
        </div>
        
        <div className="bg-green-50 border border-green-100 rounded-lg p-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-green-500 text-xs">✓</span>
            <h3 className="text-xs font-medium text-green-800">Normal</h3>
          </div>
          <div className="mt-1 text-lg font-semibold text-green-900 text-center">{mockStats.normal}</div>
        </div>
      </div>

      {/* Tab View Options */}
      <div className="mb-4">
        <div className="inline-flex border rounded-md overflow-hidden">
          <button 
            className={`px-4 py-2 text-sm font-medium ${activeTab === "list" ? "bg-blue-50 text-blue-600" : "bg-white text-gray-600"}`}
            onClick={() => setActiveTab("list")}
          >
            Table View
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium ${activeTab === "card" ? "bg-blue-50 text-blue-600" : "bg-white text-gray-600"}`}
            onClick={() => setActiveTab("card")}
          >
            Card View
          </button>
        </div>
      </div>
      
      {/* Table View */}
      {activeTab === "list" && (
        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {tableColumns.map((column) => (
                    <th 
                      key={column.id} 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockChildren.map((child, index) => {
                  // Add different background colors based on status
                  let rowClass = "";
                  if (child.status === 'Normal') {
                    rowClass = "bg-green-50/50";
                  } else if (child.status === 'MAM') {
                    rowClass = "bg-yellow-50/50";
                  } else if (child.status === 'SAM') {
                    rowClass = "bg-red-50/50";
                  }
                  
                  return (
                    <tr key={child.id} className={rowClass}>
                      {tableColumns.map((column) => (
                        <td key={`${child.id}-${column.id}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {column.cell({ row: { original: child, index } })}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Card View */}
      {activeTab === "card" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockChildren.map((child) => {
            let cardClass = "border";
            if (child.status === 'Normal') {
              cardClass = "border-green-200 bg-green-50";
            } else if (child.status === 'MAM') {
              cardClass = "border-yellow-200 bg-yellow-50";
            } else if (child.status === 'SAM') {
              cardClass = "border-red-200 bg-red-50";
            }
            
            return (
              <div key={child.id} className={`rounded-lg overflow-hidden ${cardClass}`}>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">{child.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      child.status === 'Normal' ? "bg-green-500 text-white" :
                      child.status === 'MAM' ? "bg-yellow-500 text-white" :
                      "bg-red-500 text-white"
                    }`}>
                      {child.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Father:</span>
                      <span className="font-medium">{child.fatherName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Village:</span>
                      <span className="font-medium">{child.village}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Age:</span>
                      <span className="font-medium">{child.ageMonths} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">MUAC:</span>
                      <span className="font-medium">{child.muac} cm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vaccination:</span>
                      <span className="font-medium text-green-600">
                        {child.vaccinationStatus}
                        {child.vaccinationStatus === '0-Dose' && child.isUnderVaccinationAge && (
                          <span className="ml-2 text-yellow-500">⚠</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Screening Form */}
      {activeTab === "new" && (
        <ChildScreeningForm />
      )}

      <ExportDataModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        title="Export Child Screenings"
        description="Choose options for exporting child screening data"
        type="child-screening"
        userOptions={
          screeningsData?.users?.map((user: any) => ({
            label: user.fullName,
            value: user.id
          })) || []
        }
      />
    </div>
  );
}
