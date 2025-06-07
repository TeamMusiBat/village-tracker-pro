
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getRoleLabel } from '@/lib/utils';
import type { User } from '@shared/schema';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, UserCog, UserX } from 'lucide-react';

import AddUserForm from '@/components/add-user-form';
import UserAvatar from '@/components/user-avatar';
import ConfirmationDialog from '@/components/confirmation-dialog';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

export default function UserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: !!user && ['developer', 'master'].includes(user.role)
  });

  // Delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await apiRequest('DELETE', `/api/users/${selectedUser.id}`);
      
      // Invalidate users query to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      toast({
        title: "User deleted",
        description: `${selectedUser.fullName || selectedUser.name} has been removed.`,
      });
      
      setSelectedUser(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete user",
        description: error.message || "An error occurred while deleting the user.",
      });
    }
  };

  // Filter users based on current user's role
  const getFilteredUsers = () => {
    if (!users) return [];
    
    // If developer, show all users except developer
    if (user?.role === 'developer') {
      return users.filter((u: User) => u.id !== user.id);
    }
    
    // If master, show only FMT and SM
    if (user?.role === 'master') {
      return users.filter((u: User) => ['fmt', 'sm'].includes(u.role));
    }
    
    return [];
  };

  // Can only add user if current user is developer or master
  const canAddUser = user && ['developer', 'master'].includes(user.role);
  
  // Only developer can manage masters
  const canManageMasters = user?.role === 'developer';

  const filteredUsers = getFilteredUsers();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">User Management</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage users and their permissions
          </p>
        </div>
        
        {canAddUser && (
          <Button onClick={() => setIsAddUserDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            All users in the system. {user?.role === 'developer' ? 'You can manage all users.' : 'You can only manage field workers.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((userData: User) => (
                <Card key={userData.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4 flex justify-between items-start">
                      <div className="flex items-center">
                        <UserAvatar 
                          user={userData}
                          showStatus
                          size="lg"
                          className="mr-4"
                        />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {userData.fullName || userData.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {getRoleLabel(userData.role)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            @{userData.username}
                          </p>
                        </div>
                      </div>
                      
                      {/* User is a developer or (user is master and the userData role is not master) */}
                      {(user?.role === 'developer' || (user?.role === 'master' && userData.role !== 'master')) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          onClick={() => {
                            setSelectedUser(userData);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <UserX className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Status</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {userData.isOnline ? 
                              <span className="text-green-600 dark:text-green-400">Online</span> : 
                              <span className="text-gray-500">Offline</span>
                            }
                          </p>
                        </div>
                        
                        {userData.email && (
                          <div className="col-span-2">
                            <p className="text-gray-500 dark:text-gray-400">Email</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {userData.email}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              <UserCog className="h-10 w-10 mx-auto mb-4 text-gray-400" />
              <p>No users found that you can manage</p>
              {canAddUser && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setIsAddUserDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First User
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. {!canManageMasters && "As a Master, you can only add Field Monitors and Social Mobilizers."}
            </DialogDescription>
          </DialogHeader>
          <AddUserForm onSuccess={() => setIsAddUserDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        description={`Are you sure you want to delete ${selectedUser?.fullName || selectedUser?.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
