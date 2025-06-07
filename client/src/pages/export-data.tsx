import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileDown,
  FileText,
  Database,
  User,
  Calendar,
  Filter
} from 'lucide-react';
import ExportDataModal from '@/components/export-data-modal';
import { downloadExportData, prepareAwarenessSessionsForExport, prepareChildScreeningsForExport } from '@/lib/export-to-excel';

export default function ExportData() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("awareness");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'awareness-sessions' | 'child-screening'>('awareness-sessions');

  // Fetch users for filtering
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!user && ['developer', 'master'].includes(user.role)
  });

  // Fetch export stats
  const { data: exportStats, isLoading } = useQuery({
    queryKey: ['/api/stats/export'],
    enabled: !!user && ['developer', 'master'].includes(user.role)
  });

  // Handle export
  const handleExport = (options: any) => {
    if (exportType === 'awareness-sessions') {
      // Mock data for awareness sessions export
      const exportData = prepareAwarenessSessionsForExport(
        exportStats?.awarenessSessions?.sessions || [],
        exportStats?.awarenessSessions?.attendees || [],
        options
      );
      
      // Download the export data
      downloadExportData(exportData, 'awareness_sessions');
    } else {
      // Mock data for child screening export
      const exportData = prepareChildScreeningsForExport(
        exportStats?.childScreenings?.screenings || [],
        exportStats?.childScreenings?.children || [],
        options
      );
      
      // Download the export data
      downloadExportData(exportData, 'child_screenings');
    }
    
    toast({
      title: "Export Started",
      description: `Your ${exportType === 'awareness-sessions' ? 'awareness sessions' : 'child screening'} data is being exported.`,
    });
  };

  // Open export modal with specific type
  const openExportModal = (type: 'awareness-sessions' | 'child-screening') => {
    setExportType(type);
    setIsExportModalOpen(true);
  };

  if (!user || !['developer', 'master'].includes(user.role)) {
    return (
      <div className="text-center py-10">
        <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-medium text-gray-900 dark:text-white">Access Denied</h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          You do not have permission to access the export data feature.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Export Data</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Export and analyze field data in structured formats
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary-500" />
              Available Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {isLoading ? (
                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                exportStats?.awarenessSessions?.total || 0
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Awareness sessions conducted
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <User className="mr-2 h-5 w-5 text-secondary-500" />
              Children Screened
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {isLoading ? (
                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                exportStats?.childScreenings?.total || 0
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Child health screenings completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-accent-500" />
              Last 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {isLoading ? (
                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                (exportStats?.awarenessSessions?.last30Days || 0) + 
                (exportStats?.childScreenings?.last30Days || 0)
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Total activities in the last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="awareness" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="awareness">Awareness Sessions</TabsTrigger>
          <TabsTrigger value="screening">Child Screening</TabsTrigger>
        </TabsList>
        
        <TabsContent value="awareness">
          <Card>
            <CardHeader>
              <CardTitle>Awareness Sessions Export</CardTitle>
              <CardDescription>
                Export session data and attendee information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                    Export Options
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <Calendar className="h-5 w-5 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Date Range Selection</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Export data within specific date ranges</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <User className="h-5 w-5 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Field Worker Filter</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Export data by specific field workers</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <FileDown className="h-5 w-5 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Multiple Format Support</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Export as JSON or Excel (.xlsx)</p>
                      </div>
                    </li>
                  </ul>
                  
                  <Button
                    className="mt-6 w-full"
                    onClick={() => openExportModal('awareness-sessions')}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export Awareness Sessions
                  </Button>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                    Export Preview
                  </h3>
                  <div className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 mb-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">EXPORT FORMAT</p>
                    <pre className="mt-1 text-sm text-gray-900 dark:text-white overflow-x-auto">
                      {`{
  "sessionId": 123,
  "date": "2023-10-10",
  "villageName": "Goth Chakar",
  "ucName": "UC-3",
  "conductedBy": "Sara Mazari",
  "location": "25.3463, 69.7457",
  "attendees": [
    {
      "name": "Fatima Bibi",
      "fatherOrHusbandName": "Abdul Kareem",
      "ageYears": 32,
      "childrenUnderFive": 2
    },
    // More attendees...
  ]
}`}
                    </pre>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <p className="mb-2">
                      The export includes session metadata, location information, and complete attendee details.
                    </p>
                    <p>
                      Excel exports include formatted sheets with proper column headers and cell formatting for easy analysis.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="screening">
          <Card>
            <CardHeader>
              <CardTitle>Child Screening Export</CardTitle>
              <CardDescription>
                Export child screening data with nutrition status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                    Export Options
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <Calendar className="h-5 w-5 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Date Range Selection</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Export data within specific date ranges</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <Filter className="h-5 w-5 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Nutrition Status Filter</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Filter by SAM, MAM, or Normal status</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <Database className="h-5 w-5 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Data Merging Option</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Merge all workers' data into one export</p>
                      </div>
                    </li>
                  </ul>
                  
                  <Button
                    className="mt-6 w-full"
                    onClick={() => openExportModal('child-screening')}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export Child Screening Data
                  </Button>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                    Export Preview
                  </h3>
                  <div className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 mb-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">EXPORT FORMAT</p>
                    <pre className="mt-1 text-sm text-gray-900 dark:text-white overflow-x-auto">
                      {`{
  "screeningId": 456,
  "date": "2023-10-09",
  "villageName": "Mir Hasan",
  "ucName": "UC-5",
  "conductedBy": "Imran Khan",
  "stats": {
    "normal": 12,
    "mam": 3,
    "sam": 1
  },
  "children": [
    {
      "childName": "Ali Hassan",
      "fatherName": "Muhammad Hassan",
      "ageMonths": 24,
      "gender": "Male",
      "muac": 13.8,
      "nutritionStatus": "Normal"
    },
    // More children...
  ]
}`}
                    </pre>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <p className="mb-2">
                      Excel exports include automatic color formatting for MUAC-based data, making it easy to identify SAM/MAM cases.
                    </p>
                    <p>
                      The export includes screening metadata, nutrition statistics, and detailed measurements for each child.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ExportDataModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        title={exportType === 'awareness-sessions' ? 'Export Awareness Sessions' : 'Export Child Screening Data'}
        description={exportType === 'awareness-sessions' 
          ? 'Choose options for exporting awareness session data' 
          : 'Choose options for exporting child screening data'
        }
        type={exportType}
        userOptions={
          users?.map((u: any) => ({
            label: u.fullName,
            value: u.id
          })) || []
        }
      />
    </div>
  );
}
