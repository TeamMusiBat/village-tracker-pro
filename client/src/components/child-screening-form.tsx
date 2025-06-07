import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { formatText, isValidDateFormat } from '@/lib/text-formatter';
import { getNutritionStatus } from '@/lib/utils';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import LocationInput from '@/components/location-input';
import DuplicateEntryAlert from '@/components/duplicate-entry-alert';
import StatusPill from '@/components/status-pill';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Schema for the main screening info
const screeningSchema = z.object({
  villageName: z.string().min(1, 'Village name is required'),
  ucName: z.string().min(1, 'UC name is required'),
  latitude: z.number().nullable(),
  longitude: z.number().nullable()
});

// Schema for child entry
const childSchema = z.object({
  childName: z.string().min(1, 'Child name is required'),
  fatherName: z.string().min(1, 'Father name is required'),
  ageMonths: z.number().min(1, 'Age is required').nullable().or(z.literal('')),
  dateOfBirth: z.string().refine(val => !val || isValidDateFormat(val), {
    message: 'Date of birth must be in DD/MM/YYYY format'
  }),
  gender: z.enum(['Male', 'Female']),
  muac: z.number().min(1, 'MUAC is required').nullable().or(z.literal('')),
  weight: z.number().min(0.1, 'Weight is required').nullable().or(z.literal('')),
  height: z.number().min(1, 'Height is required').nullable().or(z.literal('')),
  nutritionStatus: z.enum(['Normal', 'MAM', 'SAM']),
  vaccinationStatus: z.string(),
  vaccineDue: z.boolean().default(false),
  belongsToSameAddress: z.boolean().default(false)
});

type ScreeningFormValues = z.infer<typeof screeningSchema>;
type ChildFormValues = z.infer<typeof childSchema>;

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

  // Form for child data
  const childForm = useForm<ChildFormValues>({
    resolver: zodResolver(childSchema),
    defaultValues: {
      childName: '',
      fatherName: '',
      ageMonths: null,
      dateOfBirth: '',
      gender: 'Male',
      muac: null,
      weight: null,
      height: null,
      nutritionStatus: 'Normal',
      vaccinationStatus: '0 - Dose',
      vaccineDue: false,
      belongsToSameAddress: false
    }
  });

  // Watch MUAC to auto-calculate nutrition status
  const muac = childForm.watch('muac');
  
  useEffect(() => {
    if (muac !== null && muac !== '') {
      const status = getNutritionStatus(Number(muac));
      childForm.setValue('nutritionStatus', status);
    }
  }, [muac, childForm]);
  
  // Create a screening session
  const createScreening = async (data: ScreeningFormValues) => {
    setIsLoading(true);
    
    try {
      // Format text inputs
      const formattedData = {
        ...data,
        villageName: formatText(data.villageName),
        ucName: formatText(data.ucName),
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

  // Add a child
  const addChild = async (data: ChildFormValues) => {
    // Check for duplicates
    const isDuplicate = screenedChildren.some(child => 
      formatText(child.childName) === formatText(data.childName) && 
      formatText(child.fatherName) === formatText(data.fatherName)
    );
    
    if (isDuplicate) {
      setCurrentChild(data);
      setIsDuplicateWarningOpen(true);
      return;
    }
    
    await submitChildData(data);
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
      
      // Reset child form - name and father name only
      childForm.setValue('childName', '');
      childForm.setValue('fatherName', '');
      
      toast({
        title: 'Child added successfully',
      });
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

  // Handle form submission
  const onSubmitScreening = async (data: ScreeningFormValues) => {
    await createScreening(data);
  };

  const onSubmitChild = async (data: ChildFormValues) => {
    await addChild(data);
  };

  // Handle location change
  const handleLocationChange = (latitude: number | null, longitude: number | null) => {
    screeningForm.setValue('latitude', latitude);
    screeningForm.setValue('longitude', longitude);
  };

  // Handle closing the duplicate warning
  const handleCloseDuplicateWarning = () => {
    setIsDuplicateWarningOpen(false);
    setCurrentChild(null);
  };

  // Handle editing existing child instead
  const handleEditExisting = () => {
    handleCloseDuplicateWarning();
    // Implement edit functionality
    toast({
      title: 'Edit mode',
      description: 'Please find and edit the existing entry',
    });
  };

  // Handle force submitting the duplicate
  const handleForceSubmit = () => {
    if (currentChild) {
      submitChildData(currentChild);
    }
    handleCloseDuplicateWarning();
  };

  // Handle filter change
  const handleFilterChange = (status: string) => {
    if (filterType.includes(status)) {
      setFilterType(filterType.filter(type => type !== status));
    } else {
      setFilterType([...filterType, status]);
    }
  };

  // Filtered children
  const filteredChildren = React.useMemo(() => {
    if (filterType.length === 0) return screenedChildren;
    return screenedChildren.filter(child => filterType.includes(child.nutritionStatus));
  }, [screenedChildren, filterType]);

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
        <Card>
          <CardHeader>
            <CardTitle>Add Child</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...childForm}>
              <form onSubmit={childForm.handleSubmit(onSubmitChild)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={childForm.control}
                    name="childName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Child Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Child Name"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={childForm.control}
                    name="fatherName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Father Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Father Name"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormField
                    control={childForm.control}
                    name="ageMonths"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age (Months)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                            placeholder="Age in months"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={childForm.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="DD/MM/YYYY"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={childForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormField
                    control={childForm.control}
                    name="muac"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>MUAC (cm)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                            placeholder="e.g. 12.5"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={childForm.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                            placeholder="e.g. 8.7"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={childForm.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Height (cm)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                            placeholder="e.g. 75.5"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={childForm.control}
                    name="nutritionStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nutrition Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Normal">Normal</SelectItem>
                            <SelectItem value="MAM">MAM</SelectItem>
                            <SelectItem value="SAM">SAM</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={childForm.control}
                    name="vaccinationStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vaccination Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select vaccination status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0 - Dose">0 - Dose</SelectItem>
                            <SelectItem value="1st - Dose">1st - Dose</SelectItem>
                            <SelectItem value="2nd - Dose">2nd - Dose</SelectItem>
                            <SelectItem value="3rd - Dose">3rd - Dose</SelectItem>
                            <SelectItem value="MR - 1">MR - 1</SelectItem>
                            <SelectItem value="MR - 2">MR - 2</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={childForm.control}
                    name="vaccineDue"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Vaccine Due
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={childForm.control}
                    name="belongsToSameAddress"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Kid Belongs From Same Address
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="mt-4"
                >
                  {isLoading ? 'Adding Child...' : 'Add Child'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Screened Children List */}
      {screenedChildren.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
              <CardTitle>Screening Results</CardTitle>
              <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                <div className="text-sm">Filter:</div>
                <div className="flex items-center space-x-1">
                  <Checkbox 
                    id="filterNormal"
                    checked={filterType.includes('Normal')}
                    onCheckedChange={() => handleFilterChange('Normal')}
                  />
                  <label htmlFor="filterNormal" className="text-sm text-green-600 dark:text-green-400">Normal</label>
                </div>
                <div className="flex items-center space-x-1">
                  <Checkbox 
                    id="filterMAM"
                    checked={filterType.includes('MAM')}
                    onCheckedChange={() => handleFilterChange('MAM')}
                  />
                  <label htmlFor="filterMAM" className="text-sm text-amber-600 dark:text-amber-400">MAM</label>
                </div>
                <div className="flex items-center space-x-1">
                  <Checkbox 
                    id="filterSAM"
                    checked={filterType.includes('SAM')}
                    onCheckedChange={() => handleFilterChange('SAM')}
                  />
                  <label htmlFor="filterSAM" className="text-sm text-red-600 dark:text-red-400">SAM</label>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Child Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Father Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Age (Months)</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gender</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">MUAC (cm)</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vaccination</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredChildren.map((child, index) => (
                    <tr key={child.id || index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{child.childName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{child.fatherName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{child.ageMonths}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{child.gender}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{child.muac}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusPill status={child.nutritionStatus as any} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{child.vaccinationStatus}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <button 
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                          onClick={() => {
                            // Edit functionality
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          onClick={() => {
                            // Delete functionality
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Duplicate Entry Alert */}
      <DuplicateEntryAlert
        isOpen={isDuplicateWarningOpen}
        onClose={handleCloseDuplicateWarning}
        onEdit={handleEditExisting}
        onForceSubmit={handleForceSubmit}
        duplicateType="child"
      />
    </div>
  );
}
