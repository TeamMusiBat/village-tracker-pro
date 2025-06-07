import React from 'react';
import { Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChildFormValues } from '@/components/child-form';

interface PendingChildrenListProps {
  children: (ChildFormValues & { id?: number | string })[];
  onDelete?: (id: number | string) => void;
  onEdit?: (id: number | string) => void;
  filter?: string[];
  onFilterChange?: (status: string) => void;
}

export default function PendingChildrenList({ 
  children, 
  onDelete, 
  onEdit,
  filter,
  onFilterChange
}: PendingChildrenListProps) {
  // Nutrition status badge styling
  const getStatusBadge = (status: string) => {
    let color = '';
    
    if (status === 'SAM') {
      color = 'bg-red-100 text-red-800 border-red-400';
    } else if (status === 'MAM') {
      color = 'bg-amber-100 text-amber-800 border-amber-400';
    } else {
      color = 'bg-green-100 text-green-800 border-green-400';
    }
    
    return <Badge className={`${color} font-normal`}>{status}</Badge>;
  };
  
  // Vaccination status badge styling
  const getVaccineBadge = (status: string, isDue: boolean) => {
    let color = '';
    
    if (status === 'Complete') {
      color = 'bg-green-100 text-green-800 border-green-400';
    } else if (isDue) {
      color = 'bg-red-100 text-red-800 border-red-400';
    } else {
      color = 'bg-blue-100 text-blue-800 border-blue-400';
    }
    
    return (
      <Badge className={`${color} font-normal`}>
        {status} {isDue && '(Due)'}
      </Badge>
    );
  };

  // Get filtered children
  const filteredChildren = filter && filter.length > 0
    ? children.filter(child => filter.includes(child.nutritionStatus))
    : children;

  if (!children || children.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Children</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No children added yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Added Children ({filteredChildren.length})</CardTitle>
        {onFilterChange && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Filter:</span>
            <Badge 
              className={`cursor-pointer ${(!filter || filter.includes('SAM')) ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}
              onClick={() => onFilterChange('SAM')}
            >
              SAM
            </Badge>
            <Badge 
              className={`cursor-pointer ${(!filter || filter.includes('MAM')) ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}
              onClick={() => onFilterChange('MAM')}
            >
              MAM
            </Badge>
            <Badge 
              className={`cursor-pointer ${(!filter || filter.includes('Normal')) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
              onClick={() => onFilterChange('Normal')}
            >
              Normal
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Father</TableHead>
                <TableHead>Age (Mon)</TableHead>
                <TableHead>MUAC</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vaccination</TableHead>
                {(onDelete || onEdit) && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChildren.map((child) => (
                <TableRow 
                  key={child.id || `${child.childName}-${child.fatherName}`}
                  className={
                    child.nutritionStatus === 'SAM' ? 'bg-red-50' :
                    child.nutritionStatus === 'MAM' ? 'bg-amber-50' : ''
                  }
                >
                  <TableCell className="font-medium">{child.childName}</TableCell>
                  <TableCell>{child.fatherName}</TableCell>
                  <TableCell>{child.ageMonths}</TableCell>
                  <TableCell>{child.muac}</TableCell>
                  <TableCell>{getStatusBadge(child.nutritionStatus)}</TableCell>
                  <TableCell>
                    {getVaccineBadge(child.vaccinationStatus || '0 - Dose', child.vaccineDue || false)}
                  </TableCell>
                  {(onDelete || onEdit) && (
                    <TableCell>
                      <div className="flex space-x-2">
                        {onEdit && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => child.id && onEdit(child.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => child.id && onDelete(child.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}