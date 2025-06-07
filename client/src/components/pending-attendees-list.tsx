import React from 'react';
import { Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AttendeeFormValues } from '@/components/attendee-form';

interface PendingAttendeesListProps {
  attendees: (AttendeeFormValues & { id?: number | string })[];
  onDelete?: (id: number | string) => void;
  onEdit?: (id: number | string) => void;
}

export default function PendingAttendeesList({ 
  attendees, 
  onDelete, 
  onEdit 
}: PendingAttendeesListProps) {
  // Vaccination status badge styling
  const getVaccineBadge = (status: string, isDue: boolean) => {
    let color = '';
    
    if (status === 'Complete') {
      color = 'bg-green-100 text-green-800 border-green-400';
    } else if (isDue) {
      color = 'bg-red-100 text-red-800 border-red-400';
    } else {
      color = 'bg-amber-100 text-amber-800 border-amber-400';
    }
    
    return (
      <Badge className={`${color} font-normal`}>
        {status} {isDue && '(Due)'}
      </Badge>
    );
  };

  if (!attendees || attendees.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendees</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No attendees added yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Added Attendees ({attendees.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>F/H Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Children &lt;5</TableHead>
                <TableHead>Vaccination</TableHead>
                {(onDelete || onEdit) && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendees.map((attendee) => (
                <TableRow key={attendee.id || `${attendee.name}-${attendee.fatherOrHusbandName}`}>
                  <TableCell className="font-medium">{attendee.name}</TableCell>
                  <TableCell>{attendee.fatherOrHusbandName}</TableCell>
                  <TableCell>{attendee.ageYears}</TableCell>
                  <TableCell>{attendee.gender}</TableCell>
                  <TableCell>{attendee.childrenUnderFive || 0}</TableCell>
                  <TableCell>
                    {attendee.childrenUnderFive && attendee.childrenUnderFive > 0 
                      ? getVaccineBadge(attendee.vaccinationStatus || '0 - Dose', attendee.vaccineDue || false)
                      : <span className="text-gray-400">N/A</span>
                    }
                  </TableCell>
                  {(onDelete || onEdit) && (
                    <TableCell>
                      <div className="flex space-x-2">
                        {onEdit && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => attendee.id && onEdit(attendee.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => attendee.id && onDelete(attendee.id)}
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