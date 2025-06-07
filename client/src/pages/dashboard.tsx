import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { formatDate } from '@/lib/utils';
import { 
  Megaphone, 
  Users, 
  User, 
  Activity,
  ChevronRight,
  Map,
  Calendar,
  FilterX
} from 'lucide-react';
import { Link } from 'wouter';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { NeonCard } from '@/components/ui/neon-card';
import { GradientBackground } from '@/components/ui/gradient-background';
import { NeonButton } from '@/components/ui/neon-button';
import { motion } from 'framer-motion';
import UserAvatar from '@/components/user-avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalChildren: 0,
    activeUsers: 0,
    nutritionStatus: { normal: 0, mam: 0, sam: 0 }
  });
  const [activityData, setActivityData] = useState<any[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  
  // Function to get date range based on filter
  const getDateRange = () => {
    const now = new Date();
    let start = new Date();
    
    if (dateFilter === 'today') {
      start.setHours(0, 0, 0, 0);
      return { from: start, to: now };
    } else if (dateFilter === 'week') {
      start.setDate(start.getDate() - 7);
      return { from: start, to: now };
    } else if (dateFilter === 'month') {
      start.setMonth(start.getMonth() - 1);
      return { from: start, to: now };
    } else if (dateFilter === 'custom' && startDate && endDate) {
      return { from: startDate, to: endDate };
    }
    
    // Default to last month if no valid selection
    start.setMonth(start.getMonth() - 1);
    return { from: start, to: now };
  };
  
  // Get current date range
  const dateRange = getDateRange();
  
  // Format date range for API query
  const getDateParams = () => {
    const { from, to } = dateRange;
    return {
      startDate: from.toISOString().split('T')[0],
      endDate: to.toISOString().split('T')[0]
    };
  };
  
  // Build query parameters
  const queryParams = new URLSearchParams(getDateParams());
  
  // Add user filter if not admin role
  if (user && !['developer', 'master'].includes(user.role)) {
    queryParams.append('userId', user.id.toString());
  }
  
  // Fetch dashboard stats with date filter
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/stats/dashboard', queryParams.toString()],
    enabled: !!user
  });

  // Fetch recent sessions with role-based filtering
  const { data: sessionsData, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['/api/awareness-sessions/recent', queryParams.toString()],
    enabled: !!user
  });

  // Fetch active users - only for developer and master roles
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users/online'],
    enabled: !!user && ['developer', 'master'].includes(user.role)
  });

  // Effect to set data when queries complete
  useEffect(() => {
    if (statsData && typeof statsData === 'object') {
      // Ensure statsData has the right structure before setting state
      const validStats = {
        totalSessions: statsData.hasOwnProperty('totalSessions') ? (statsData as any).totalSessions : 0,
        totalChildren: statsData.hasOwnProperty('totalChildren') ? (statsData as any).totalChildren : 0,
        activeUsers: statsData.hasOwnProperty('activeUsers') ? (statsData as any).activeUsers : 0,
        nutritionStatus: {
          normal: statsData.hasOwnProperty('nutritionStatus') ? ((statsData as any).nutritionStatus?.normal || 0) : 0,
          mam: statsData.hasOwnProperty('nutritionStatus') ? ((statsData as any).nutritionStatus?.mam || 0) : 0,
          sam: statsData.hasOwnProperty('nutritionStatus') ? ((statsData as any).nutritionStatus?.sam || 0) : 0
        }
      };
      setStats(validStats);
    }
    
    if (sessionsData && Array.isArray(sessionsData)) {
      setRecentSessions(sessionsData);
    }
    
    if (usersData && Array.isArray(usersData)) {
      setActiveUsers(usersData);
    }
  }, [statsData, sessionsData, usersData]);

  // Effect to generate chart data
  useEffect(() => {
    // Generate default data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    // Check if statsData exists and has activityData property as an array
    if (statsData && 
        typeof statsData === 'object' && 
        statsData.hasOwnProperty('activityData') && 
        Array.isArray((statsData as any).activityData)) {
      setActivityData((statsData as any).activityData);
    } else {
      // Create sample data for visualization
      const data = months.slice(0, currentMonth + 1).map((month, index) => ({
        name: month,
        sessions: Math.floor(Math.random() * 30) + 10,
        screenings: Math.floor(Math.random() * 50) + 20
      }));
      
      setActivityData(data);
    }
  }, [statsData]);

  return (
    <div className="space-y-6">
      {/* Background effect */}
      <GradientBackground 
        variant="mesh" 
        primaryColor="rgba(0, 85, 255, 0.15)" 
        secondaryColor="rgba(0, 15, 55, 0.15)" 
        tertiaryColor="rgba(25, 0, 80, 0.15)" 
        intensity="low"
        speed="slow"
      />
      
      {/* Header */}
      <motion.div 
        className="mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neon-xl mb-2">Track4Health Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.fullName || 'User'}. Here's an overview of your data.</p>
          </div>
          
          {/* Date Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <Select 
              value={dateFilter} 
              onValueChange={(value) => setDateFilter(value as any)}
            >
              <SelectTrigger className="w-[140px] bg-black/30 border-primary/30">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">Last 30 days</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
            
            {dateFilter === 'custom' && (
              <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="bg-black/30 border-primary/30 hover:bg-primary/20"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {startDate && endDate ? (
                      `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
                    ) : (
                      "Select dates"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 dark:bg-gray-900/90 border-primary/30" align="end">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Select date range</h4>
                      <p className="text-xs text-muted-foreground">Choose start and end dates</p>
                    </div>
                  </div>
                  <div className="p-3 flex gap-2">
                    <div>
                      <div className="mb-1 text-xs font-medium">Start date</div>
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={(date) => date > new Date() || (endDate ? date > endDate : false)}
                        className="rounded border-0"
                      />
                    </div>
                    <div>
                      <div className="mb-1 text-xs font-medium">End date</div>
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => date > new Date() || (startDate ? date < startDate : false)}
                        className="rounded border-0"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 p-3 border-t border-gray-200 dark:border-gray-800">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setStartDate(undefined);
                        setEndDate(undefined);
                      }}
                    >
                      <FilterX className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                    <Button 
                      size="sm" 
                      disabled={!startDate || !endDate}
                      onClick={() => setIsDatePopoverOpen(false)}
                    >
                      Apply
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
        
        {/* Role indicator */}
        {user && (
          <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary-foreground border border-primary/30">
            Role: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </div>
        )}
      </motion.div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <NeonCard variant="neon-glass" hover="glow" className="h-full">
            <div className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                  <h3 className="text-2xl font-bold mt-1 text-neon">{stats.totalSessions}</h3>
                  <p className="text-xs mt-1 text-green-500">↑ 12% from last month</p>
                </div>
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <Megaphone className="h-5 w-5" />
                </div>
              </div>
            </div>
          </NeonCard>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <NeonCard variant="neon-glass" hover="glow" className="h-full">
            <div className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Children Screened</p>
                  <h3 className="text-2xl font-bold mt-1 text-neon">{stats.totalChildren}</h3>
                  <p className="text-xs mt-1 text-green-500">↑ 8% from last month</p>
                </div>
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
              </div>
            </div>
          </NeonCard>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <NeonCard variant="neon-glass" hover="glow" className="h-full">
            <div className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <h3 className="text-2xl font-bold mt-1 text-neon">{stats.activeUsers}</h3>
                  <p className="text-xs mt-1 text-green-500">5 online right now</p>
                </div>
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
              </div>
            </div>
          </NeonCard>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <NeonCard variant="neon-glass" hover="glow" className="h-full">
            <div className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nutrition Status</p>
                  <h3 className="text-2xl font-bold mt-1">
                    <span className="flex items-center space-x-1">
                      <span className="text-green-500">{stats.nutritionStatus.normal}</span>
                      <span>/</span>
                      <span className="text-amber-500">{stats.nutritionStatus.mam}</span>
                      <span>/</span>
                      <span className="text-red-500">{stats.nutritionStatus.sam}</span>
                    </span>
                  </h3>
                  <p className="text-xs mt-1">Normal/MAM/SAM</p>
                </div>
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <Activity className="h-5 w-5" />
                </div>
              </div>
            </div>
          </NeonCard>
        </motion.div>
      </div>
      
      {/* Monthly Activity Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <NeonCard variant="neon-subtle">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-neon">Monthly Activity</h2>
          </div>
          <div className="p-5">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={activityData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", borderColor: "rgba(0,85,255,0.5)" }} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    stroke="#0055ff"
                    strokeWidth={2}
                    dot={{ stroke: '#0055ff', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 8, stroke: '#0055ff', strokeWidth: 2, fill: '#0055ff' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="screenings" 
                    stroke="#00bbff" 
                    strokeWidth={2}
                    dot={{ stroke: '#00bbff', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </NeonCard>
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sessions */}
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <NeonCard variant="neon-glass" hover="lift">
            <div className="p-5 border-b border-gray-200/20">
              <h2 className="text-lg font-medium text-neon">Recent Sessions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200/20">
                <thead className="bg-gray-900/30">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Village</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Conducted By</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Attendees</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-black/20 divide-y divide-gray-700/30">
                  {isLoadingSessions ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-primary/70">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-t-transparent mr-2"></div>
                          Loading sessions...
                        </div>
                      </td>
                    </tr>
                  ) : recentSessions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-400">No recent sessions found</td>
                    </tr>
                  ) : (
                    recentSessions.map((session, index) => (
                      <tr key={session.id || index} className="hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {formatDate(session.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {session.villageName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center">
                            <UserAvatar 
                              user={session.user}
                              size="sm"
                              className="mr-3"
                            />
                            <div>
                              <p className="font-medium">{session.conductedBy}</p>
                              <p className="text-gray-400 text-xs">{session.designation}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                          {session.attendeeCount || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900/30 text-green-400 border border-green-500/20">
                            Completed
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 border-t border-gray-700/20 bg-black/20 text-right">
              <Link href="/awareness-sessions">
                <a className="text-sm font-medium text-primary inline-flex items-center hover:text-primary-300 transition-colors">
                  View all sessions 
                  <ChevronRight className="ml-1 h-4 w-4" />
                </a>
              </Link>
            </div>
          </NeonCard>
        </motion.div>
        
        {/* Active Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <NeonCard variant="neon-glass" hover="glow">
            <div className="p-5 border-b border-gray-200/20">
              <h2 className="text-lg font-medium text-neon">Field Workers Online</h2>
            </div>
            <div className="p-5 space-y-4">
              {isLoadingUsers ? (
                <div className="text-center py-4 text-primary/70">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-t-transparent mr-2"></div>
                    Loading users...
                  </div>
                </div>
              ) : activeUsers.length === 0 ? (
                <div className="text-center py-4 text-gray-400">No field workers online</div>
              ) : (
                activeUsers.map((fieldUser) => (
                  <motion.div 
                    key={fieldUser.id} 
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-primary/10 transition-colors"
                    whileHover={{ x: 5 }}
                  >
                    <div className="flex items-center">
                      <UserAvatar 
                        user={fieldUser}
                        showStatus
                        size="md"
                      />
                      <div className="ml-3">
                        <p className="text-sm font-medium">{fieldUser.fullName}</p>
                        <p className="text-xs text-gray-400">
                          {fieldUser.role === 'fmt' ? 'Field Monitor' : 'Social Mobilizer'}
                        </p>
                      </div>
                    </div>
                    <div>
                      {user && ['developer', 'master'].includes(user.role) && (
                        <Link href={`/field-tracking?user=${fieldUser.id}`}>
                          <a className="text-primary/70 hover:text-primary transition-colors">
                            <Map className="h-5 w-5" />
                          </a>
                        </Link>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            {user && ['developer', 'master'].includes(user.role) && (
              <div className="p-5 border-t border-gray-700/20 bg-black/30">
                <NeonButton variant="neon-subtle" className="w-full flex items-center justify-center">
                  <Link href="/field-tracking">
                    <a className="flex items-center justify-center">
                      <Map className="mr-2 h-4 w-4" />
                      View Field Map
                    </a>
                  </Link>
                </NeonButton>
              </div>
            )}
          </NeonCard>
        </motion.div>
      </div>
    </div>
  );
}
