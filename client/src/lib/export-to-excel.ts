export interface ExportOptions {
  dateFrom?: Date;
  dateTo?: Date;
  todayOnly?: boolean;
  filterTypes?: string[]; // For child screening (MAM, SAM, Normal)
  userIds?: number[]; // For filtering by specific users
  exportFormat?: 'json' | 'xlsx';
}

/**
 * Prepare data for export, filtering based on provided options
 * @param data Array of data to export
 * @param options Export options
 * @returns Filtered array of data
 */
export function prepareDataForExport(data: any[], options: ExportOptions = {}): any[] {
  let filteredData = [...data];
  
  // Apply date range filters
  if (options.dateFrom || options.dateTo || options.todayOnly) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    filteredData = filteredData.filter(item => {
      const itemDate = new Date(item.date || item.createdAt);
      
      if (options.todayOnly) {
        return itemDate >= today && itemDate < tomorrow;
      }
      
      if (options.dateFrom && itemDate < options.dateFrom) {
        return false;
      }
      
      if (options.dateTo) {
        const dateTo = new Date(options.dateTo);
        dateTo.setDate(dateTo.getDate() + 1); // Include the end date
        if (itemDate >= dateTo) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  // Apply user filters
  if (options.userIds && options.userIds.length > 0) {
    filteredData = filteredData.filter(item => 
      options.userIds!.includes(item.userId));
  }
  
  return filteredData;
}

/**
 * Prepare awareness sessions data for export
 * @param sessions Array of awareness sessions
 * @param attendees Array of attendees
 * @param options Export options
 * @returns Prepared data for export
 */
export function prepareAwarenessSessionsForExport(
  sessions: any[],
  attendees: any[],
  options: ExportOptions = {}
): any[] {
  // Filter sessions based on options
  const filteredSessions = prepareDataForExport(sessions, options);
  
  // Group attendees by session ID
  const attendeesBySession: Record<number, any[]> = {};
  attendees.forEach(attendee => {
    if (!attendeesBySession[attendee.sessionId]) {
      attendeesBySession[attendee.sessionId] = [];
    }
    attendeesBySession[attendee.sessionId].push(attendee);
  });
  
  // Combine sessions with their attendees
  return filteredSessions.map(session => {
    const sessionAttendees = attendeesBySession[session.id] || [];
    
    return {
      ...session,
      attendees: sessionAttendees,
      totalAttendees: sessionAttendees.length,
      location: session.latitude && session.longitude 
        ? `${session.latitude}, ${session.longitude}` 
        : 'Not recorded'
    };
  });
}

/**
 * Prepare child screenings data for export
 * @param screenings Array of child screenings
 * @param children Array of screened children
 * @param options Export options
 * @returns Prepared data for export
 */
export function prepareChildScreeningsForExport(
  screenings: any[],
  children: any[],
  options: ExportOptions = {}
): any[] {
  // Filter screenings based on options
  const filteredScreenings = prepareDataForExport(screenings, options);
  
  // Group children by screening ID
  const childrenByScreening: Record<number, any[]> = {};
  children.forEach(child => {
    if (!childrenByScreening[child.screeningId]) {
      childrenByScreening[child.screeningId] = [];
    }
    
    // Apply nutrition status filters if specified
    if (options.filterTypes && options.filterTypes.length > 0) {
      if (!options.filterTypes.includes(child.nutritionStatus)) {
        return;
      }
    }
    
    childrenByScreening[child.screeningId].push(child);
  });
  
  // Calculate statistics for each screening
  return filteredScreenings.map(screening => {
    const screeningChildren = childrenByScreening[screening.id] || [];
    
    // Count children by nutrition status
    const normalCount = screeningChildren.filter(c => c.nutritionStatus === 'Normal').length;
    const mamCount = screeningChildren.filter(c => c.nutritionStatus === 'MAM').length;
    const samCount = screeningChildren.filter(c => c.nutritionStatus === 'SAM').length;
    
    return {
      ...screening,
      children: screeningChildren,
      totalChildren: screeningChildren.length,
      stats: {
        normal: normalCount,
        mam: mamCount,
        sam: samCount
      },
      location: screening.latitude && screening.longitude 
        ? `${screening.latitude}, ${screening.longitude}` 
        : 'Not recorded'
    };
  });
}

/**
 * Download export data as JSON or XLSX
 * @param data Data to export
 * @param fileName Base file name (without extension)
 */
export function downloadExportData(data: any[], fileName: string): void {
  // In a real implementation, we would use a library like xlsx to generate
  // an Excel file. For our current purposes, we'll export as JSON.
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link element and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  }, 100);
}