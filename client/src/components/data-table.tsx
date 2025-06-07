import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  X,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataTableColumn<T> {
  header: string;
  id?: string;
  accessorKey?: keyof T | ((row: T) => React.ReactNode);
  cell?: (info: any) => React.ReactNode;
  sortable?: boolean;
  searchable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  maxRowsPerPage?: number;
  searchable?: boolean;
  filterable?: boolean;
  filterColumn?: string;
  filterPlaceholder?: string;
  filterOptions?: {
    key: keyof T;
    values: any[];
    labels: string[];
  }[];
  actions?: React.ReactNode;
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  maxRowsPerPage = 10,
  searchable = true,
  filterable = false,
  filterColumn,
  filterPlaceholder,
  filterOptions = [],
  actions
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeFilters, setActiveFilters] = useState<Record<string, any[]>>({});
  
  // Apply search
  const filteredData = React.useMemo(() => {
    let filtered = [...data];
    
    // Apply search
    if (searchQuery) {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(row => {
        return columns.some(column => {
          if (typeof column.accessorKey === 'function') return false;
          if (!column.searchable) return false;
          
          const value = row[column.accessorKey as keyof T];
          if (value === null || value === undefined) return false;
          
          return String(value).toLowerCase().includes(lowercaseQuery);
        });
      });
    }
    
    // Apply filters
    if (filterable && Object.keys(activeFilters).length > 0) {
      filtered = filtered.filter(row => {
        return Object.entries(activeFilters).every(([key, values]) => {
          if (!values.length) return true; // No filter applied for this key
          return values.includes(row[key]);
        });
      });
    }
    
    // Apply sorting
    if (sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        if (aValue === bValue) return 0;
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        return sortDirection === 'asc'
          ? aValue > bValue ? 1 : -1
          : aValue > bValue ? -1 : 1;
      });
    }
    
    return filtered;
  }, [data, searchQuery, sortBy, sortDirection, activeFilters]);
  
  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredData.length / maxRowsPerPage));
  const paginatedData = filteredData.slice(
    (currentPage - 1) * maxRowsPerPage,
    currentPage * maxRowsPerPage
  );
  
  // Handle sorting
  const handleSort = (column: DataTableColumn<T>) => {
    if (!column.sortable) return;
    
    const accessorKey = typeof column.accessorKey === 'string' ? column.accessorKey : null;
    if (!accessorKey) return;
    
    if (sortBy === accessorKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(accessorKey as keyof T);
      setSortDirection('asc');
    }
  };
  
  // Handle filtering
  const toggleFilter = (key: keyof T, value: any) => {
    setActiveFilters(prev => {
      const currentFilters = prev[key as string] || [];
      const valueIndex = currentFilters.indexOf(value);
      
      let newFilters = [...currentFilters];
      if (valueIndex === -1) {
        // Add value to filter
        newFilters.push(value);
      } else {
        // Remove value from filter
        newFilters.splice(valueIndex, 1);
      }
      
      return {
        ...prev,
        [key as string]: newFilters
      };
    });
    
    // Reset to first page
    setCurrentPage(1);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setActiveFilters({});
    setSearchQuery('');
    setCurrentPage(1);
  };
  
  return (
    <div className="w-full">
      {/* Search and Filter Section */}
      {(searchable || filterable) && (
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          {searchable && (
            <div className="relative w-full sm:w-64">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          )}
          
          {filterable && filterOptions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <div key={option.key as string} className="relative group">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    {option.key as string}
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                  
                  <div className="hidden group-hover:block absolute z-10 top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-2 w-48">
                    {option.values.map((value, idx) => (
                      <div key={value} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          id={`filter-${option.key}-${value}`}
                          checked={activeFilters[option.key as string]?.includes(value) || false}
                          onChange={() => toggleFilter(option.key, value)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                        />
                        <label 
                          htmlFor={`filter-${option.key}-${value}`}
                          className="text-sm text-gray-700 dark:text-gray-300"
                        >
                          {option.labels[idx] || value}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {Object.keys(activeFilters).length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center"
                >
                  Clear Filters
                  <X className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          
          {actions && (
            <div className="flex ml-auto">
              {actions}
            </div>
          )}
        </div>
      )}
      
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead 
                  key={index}
                  className={cn(column.sortable && "cursor-pointer select-none")}
                  onClick={() => column.sortable && handleSort(column)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {column.sortable && sortBy === column.accessorKey && (
                      <span>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-6 text-gray-500 dark:text-gray-400">
                  No results found
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      {column.cell ? column.cell({row: {original: row}}) : (
                        column.accessorKey ? (
                          typeof column.accessorKey === 'function' 
                            ? column.accessorKey(row)
                            : (row[column.accessorKey] !== undefined && row[column.accessorKey] !== null) 
                              ? row[column.accessorKey] 
                              : 'N/A'
                        ) : 'N/A'
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing <span className="font-medium">{Math.min(filteredData.length, 1 + (currentPage - 1) * maxRowsPerPage)}</span> to <span className="font-medium">{Math.min(filteredData.length, currentPage * maxRowsPerPage)}</span> of <span className="font-medium">{filteredData.length}</span> results
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
