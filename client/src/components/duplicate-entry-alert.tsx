import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from 'lucide-react';

interface DuplicateEntryAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onForceSubmit: () => void;
  duplicateType: 'attendee' | 'child';
}

export default function DuplicateEntryAlert({
  isOpen,
  onClose,
  onEdit,
  onForceSubmit,
  duplicateType
}: DuplicateEntryAlertProps) {
  const typeText = duplicateType === 'attendee' ? 'attendee' : 'child';
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-amber-500">
            <AlertTriangle className="h-6 w-6" />
            <AlertDialogTitle>Duplicate Entry Detected</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            This {typeText} entry appears to already exist for today with the same name, father/husband name, and village.
            Would you like to edit the existing record or force submit this as a new entry?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-amber-600 hover:bg-amber-700"
            onClick={onEdit}
          >
            Edit Existing
          </AlertDialogAction>
          <AlertDialogAction
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={onForceSubmit}
          >
            Force Submit
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
