import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { formatText, isValidDateFormat } from '@/lib/text-formatter';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useLocalStorage } from '@/hooks/use-local-storage';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import LocationInput from '@/components/location-input';
import DuplicateEntryAlert from '@/components/duplicate-entry-alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ChildForm, { ChildFormValues } from '@/components/child-form';
import PendingChildrenList from '@/components/pending-children-list';

// Schema for the main screening info
const screeningSchema = z.object({
  villageName: z.string().min(1, 'Village name is required'),
  ucName: z.string().min(1, 'UC name is required'),
  latitude: z.number().nullable(),
  longitude: z.number().nullable()
});

type ScreeningFormValues = z.infer<typeof screeningSchema>;

export default function ChildScreeningForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOnline } = useOnlineStatus();
  const [isLoading, setIsLoading] = useState(false);
  const [screenedChildren, setScreenedChildren] = useState<any[]>([]);
  const [isDuplicateWarningOpen, setIsDuplicateWarningOpen] = useState(false);
  const [currentChild, setCurrentChild] = useState<ChildFormValues | null>(null);
  const [pendingChildren, setPendingChildren] = useLocalStorage<any[]>('pending_screened_children', []);
  const [screeningId, setScreeningId] = useState<number | null>(null);
  const [isScreeningSubmitted, setIsScreeningSubmitted] = useState(false);
  const [filterType, setFilterType] = useState<string[]>([]);

  // Form for screening data
  const screeningForm = useForm<ScreeningFormValues>({
    resolver: zodResolver(screeningSchema),
    defaultValues: {
      villageName: '',
      ucName: '',
      latitude: null,
      longitude: null
    }
  });
  
  // Create a screening session
  const createScreening = async (formData: ScreeningFormValues) => {
    setIsLoading(true);
    
    try {
      // Format text inputs
      const formattedData = {
        ...formData,
        villageName: formatText(formData.villageName),
        ucName: formatText(formData.ucName),
        conductedBy: user?.fullName || '',
        designation: user?.role === 'fmt' ? 'Field Monitor' : 'Social Mobilizer',
        userId: user?.id
      };
      
      // If offline, store data locally
      if (!isOnline) {
        const tempScreeningId = Date.now(); // Use timestamp as temporary ID
        setScreeningId(tempScreeningId);
        
        // Store screening data in local storage
        const pendingScreenings = JSON.parse(localStorage.getItem('pending_screenings') || '[]');
        pendingScreenings.push({
          ...formattedData,
          id: tempScreeningId,
          date: new Date().toISOString()
        });
        localStorage.setItem('pending_screenings', JSON.stringify(pendingScreenings));
        
        toast({
          title: 'Screening saved offline',
          description: 'Screening data will be synced when you are back online.',
        });
        
        setIsScreeningSubmitted(true);
        return tempScreeningId;
      }
      
      // If online, submit to server
      const res = await apiRequest('POST', '/api/child-screenings', formattedData);
      const data = await res.json();
      
      toast({
        title: 'Screening created successfully',
        description: 'You can now add children to this screening.',
      });
      
      setIsScreeningSubmitted(true);
      setScreeningId(data.id);
      return data.id;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to create screening',
        description: error.message || 'An error occurred while creating the screening.'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Submit the screening if not already submitted
  const submitScreening = async () => {
    if (!isScreeningSubmitted) {
      const data = screeningForm.getValues();
      return await createScreening(data);
    }
    return screeningId;
  };

  // Check for duplicates
  const checkDuplicateChild = (name: string, fatherName: string): boolean => {
    return screenedChildren.some(child => 
      formatText(child.childName) === formatText(name) && 
      formatText(child.fatherName) === formatText(fatherName)
    );
  };

  // Submit child data after checks
  const submitChildData = async (data: ChildFormValues) => {
    setIsLoading(true);
    
    // Ensure we have a screening ID first
    const newScreeningId = await submitScreening();
    
    if (!newScreeningId) {
      setIsLoading(false);
      return;
    }
    
    try {
      // Format text inputs
      const formattedData = {
        ...data,
        childName: formatText(data.childName),
        fatherName: formatText(data.fatherName),
        screeningId: newScreeningId
      };
      
      // If offline, store data locally
      if (!isOnline) {
        const tempId = Date.now(); // Use timestamp as temporary ID
        
        // Add to pending children
        const newPendingChild = {
          ...formattedData,
          id: tempId,
          createdAt: new Date().toISOString()
        };
        
        setPendingChildren([...pendingChildren, newPendingChild]);
        
        // Update local display
        setScreenedChildren([...screenedChildren, newPendingChild]);
        
        toast({
          title: 'Child data saved offline',
          description: 'Child data will be synced when you are back online.',
        });
      } else {
        // If online, submit to server
        const res = await apiRequest('POST', '/api/screened-children', formattedData);
        const responseData = await res.json();
        
        // Update local display
        setScreenedChildren([...screenedChildren, responseData]);
        
        // Invalidate screened children query
        queryClient.invalidateQueries({ queryKey: [`/api/screened-children/screening/${newScreeningId}`] });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to add child',
        description: error.message || 'An error occurred while adding the child.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission for the main screening form
  const onSubmitScreening = async (data: ScreeningFormValues) => {
    await createScreening(data);
  };

  // Handle location change
  const handleLocationChange = (latitude: number | null, longitude: number | null) => {
    screeningForm.setValue('latitude', latitude);
    screeningForm.setValue('longitude', longitude);
  };

  // Handle filter change
  const handleFilterChange = (status: string) => {
    if (filterType.includes(status)) {
      setFilterType(filterType.filter(type => type !== status));
    } else {
      setFilterType([...filterType, status]);
    }
  };

  // Handle removing a child (optional feature)
  const handleRemoveChild = (id: number | string) => {
    setScreenedChildren(screenedChildren.filter(c => c.id !== id));
    setPendingChildren(pendingChildren.filter(c => c.id !== id));
    
    toast({
      title: 'Child removed',
      description: 'The child has been removed from the list.',
    });
  };

  // Handle forced submission of a duplicate
  const handleForceSubmit = async (child: ChildFormValues) => {
    await submitChildData(child);
    setIsDuplicateWarningOpen(false);
    setCurrentChild(null);
  };

  return (
    <div className="space-y-6">
      {/* Screening Information Form */}
      <Card>
        <CardHeader>
          <CardTitle>Screening Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...screeningForm}>
            <form onSubmit={screeningForm.handleSubmit(onSubmitScreening)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={screeningForm.control}
                  name="villageName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Village Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Village Name"
                          disabled={isScreeningSubmitted || isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={screeningForm.control}
                  name="ucName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UC Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="UC Name"
                          disabled={isScreeningSubmitted || isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormItem>
                  <FormLabel>Conducted By</FormLabel>
                  <Input
                    value={user?.fullName || ''}
                    disabled
                  />
                </FormItem>

                <FormItem>
                  <FormLabel>Designation</FormLabel>
                  <Input
                    value={user?.role === 'fmt' ? 'Field Monitor' : 'Social Mobilizer'}
                    disabled
                  />
                </FormItem>
              </div>

              <FormItem>
                <FormLabel>Location</FormLabel>
                <LocationInput
                  onLocationChange={handleLocationChange}
                  initialLatitude={screeningForm.getValues('latitude')}
                  initialLongitude={screeningForm.getValues('longitude')}
                />
                <FormMessage />
              </FormItem>

              {!isScreeningSubmitted && (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="mt-4"
                >
                  {isLoading ? 'Creating Screening...' : 'Create Screening'}
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Child Form - Only show if screening is submitted */}
      {isScreeningSubmitted && (
        <ChildForm 
          screeningId={screeningId}
          onAddChild={submitChildData}
          checkDuplicate={checkDuplicateChild}
          isLoading={isLoading}
        />
      )}

      {/* Display added children */}
      {isScreeningSubmitted && screenedChildren.length > 0 && (
        <PendingChildrenList 
          children={screenedChildren}
          onDelete={handleRemoveChild}
          filter={filterType}
          onFilterChange={handleFilterChange}
        />
      )}

      {/* Duplicate Entry Alert */}
      <DuplicateEntryAlert
        isOpen={isDuplicateWarningOpen}
        onClose={() => setIsDuplicateWarningOpen(false)}
        onEdit={() => {
          setIsDuplicateWarningOpen(false);
          toast({
            title: 'Edit mode',
            description: 'Please find and edit the existing entry',
          });
        }}
        onForceSubmit={() => {
          if (currentChild) {
            handleForceSubmit(currentChild);
          }
        }}
        duplicateType="child"
      />
    </div>
  );
}