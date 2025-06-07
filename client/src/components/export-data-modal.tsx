import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatDate, formatDateForInput } from "@/lib/utils";
import { Calendar as CalendarIcon, FileDown } from "lucide-react";

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: any) => void;
  title: string;
  description: string;
  type: 'awareness-sessions' | 'child-screening';
  userOptions?: { label: string; value: number }[];
}

export default function ExportDataModal({
  isOpen,
  onClose,
  onExport,
  title,
  description,
  type,
  userOptions = []
}: ExportDataModalProps) {
  const [dateRange, setDateRange] = useState<boolean>(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [todayOnly, setTodayOnly] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<string>('json');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  
  // Child screening specific state
  const [filterNormal, setFilterNormal] = useState<boolean>(true);
  const [filterMAM, setFilterMAM] = useState<boolean>(true);
  const [filterSAM, setFilterSAM] = useState<boolean>(true);
  const [mergeWorkerData, setMergeWorkerData] = useState<boolean>(false);
  
  const handleExport = () => {
    // Build export options
    const options = {
      dateFrom: dateRange ? dateFrom : undefined,
      dateTo: dateRange ? dateTo : undefined,
      todayOnly: todayOnly,
      exportFormat: exportFormat,
      userIds: selectedUsers.length > 0 ? selectedUsers : undefined,
      mergeWorkerData: type === 'child-screening' ? mergeWorkerData : undefined,
      filterTypes: type === 'child-screening' 
        ? [
            ...(filterNormal ? ['Normal'] : []),
            ...(filterMAM ? ['MAM'] : []),
            ...(filterSAM ? ['SAM'] : [])
          ]
        : undefined
    };
    
    onExport(options);
    
    // Reset state
    setDateRange(false);
    setDateFrom(undefined);
    setDateTo(undefined);
    setTodayOnly(false);
    setExportFormat('json');
    setSelectedUsers([]);
    setFilterTypes([]);
    setFilterNormal(true);
    setFilterMAM(true);
    setFilterSAM(true);
    setMergeWorkerData(false);
    
    // Close modal
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Date Options */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="todayOnly" 
                checked={todayOnly} 
                onCheckedChange={(checked) => {
                  if (checked) {
                    setDateRange(false);
                    setDateFrom(undefined);
                    setDateTo(undefined);
                  }
                  setTodayOnly(checked as boolean);
                }}
              />
              <Label htmlFor="todayOnly">Export today's data only</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="dateRange" 
                checked={dateRange} 
                onCheckedChange={(checked) => {
                  if (checked) {
                    setTodayOnly(false);
                  }
                  setDateRange(checked as boolean);
                }}
              />
              <Label htmlFor="dateRange">Select date range</Label>
            </div>
            
            {dateRange && (
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="grid gap-2">
                  <Label htmlFor="dateFrom">From Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="dateFrom"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? formatDate(dateFrom) : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="dateTo">To Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="dateTo"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? formatDate(dateTo) : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>
          
          {/* Child Screening Specific Options */}
          {type === 'child-screening' && (
            <div className="space-y-2">
              <Label>Nutrition Status Filter</Label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="filterNormal" 
                    checked={filterNormal} 
                    onCheckedChange={(checked) => setFilterNormal(checked as boolean)}
                  />
                  <Label htmlFor="filterNormal" className="text-green-600 dark:text-green-400">Normal</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="filterMAM" 
                    checked={filterMAM} 
                    onCheckedChange={(checked) => setFilterMAM(checked as boolean)}
                  />
                  <Label htmlFor="filterMAM" className="text-amber-600 dark:text-amber-400">MAM</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="filterSAM" 
                    checked={filterSAM} 
                    onCheckedChange={(checked) => setFilterSAM(checked as boolean)}
                  />
                  <Label htmlFor="filterSAM" className="text-red-600 dark:text-red-400">SAM</Label>
                </div>
              </div>
              
              <div className="mt-4 flex items-center space-x-2">
                <Checkbox 
                  id="mergeWorkerData" 
                  checked={mergeWorkerData} 
                  onCheckedChange={(checked) => setMergeWorkerData(checked as boolean)}
                />
                <Label htmlFor="mergeWorkerData">Merge all workers' data in one export</Label>
              </div>
            </div>
          )}
          
          {/* User Selection - only if options available */}
          {userOptions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="userSelect">Filter by User</Label>
              <Select
                value={selectedUsers.length > 0 ? "selected" : "all"}
                onValueChange={(value) => {
                  if (value === "all") setSelectedUsers([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="selected">Selected Users ({selectedUsers.length})</SelectItem>
                </SelectContent>
              </Select>
              
              {selectedUsers.length > 0 || true /* Always show for demo */ && (
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                  {userOptions.map(user => (
                    <div key={user.value} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`user-${user.value}`}
                        checked={selectedUsers.includes(user.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedUsers([...selectedUsers, user.value]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.value));
                          }
                        }}
                      />
                      <Label htmlFor={`user-${user.value}`}>{user.label}</Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Export Format */}
          <div className="space-y-2">
            <Label htmlFor="exportFormat">Export Format</Label>
            <Select
              value={exportFormat}
              onValueChange={setExportFormat}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleExport}>
            <FileDown className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
