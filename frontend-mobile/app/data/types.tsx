// Minimal types for frontend-only operation
// Designed for easy backend integration later

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'overdue';
export type AssetStatus = 'operational' | 'maintenance' | 'offline' | 'critical';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface Site {
  id: string;
  name: string;
  location: string;
  assetCount: number;
  coordinates: { latitude: number; longitude: number };
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  status: AssetStatus;
  siteId: string;
  lastMaintenance?: string;
}

export interface Task {
  createdDate: string | number | Date;
  id: string;
  title: string;
  assetId: string;
  siteId: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  assignee?: string;
}

// Minimal mock data - just enough for UI functionality
export const mockSites: Site[] = [
  { id: '1', name: 'Central Station', location: 'Downtown', assetCount: 5, coordinates: { latitude: 40.7128, longitude: -74.0060 } },
  { id: '2', name: 'North Plant', location: 'Industrial District', assetCount: 8, coordinates: { latitude: 40.7589, longitude: -73.9851 } },
  { id: '3', name: 'East Facility', location: 'Riverside', assetCount: 3, coordinates: { latitude: 40.6782, longitude: -73.9442 } }
];

export const mockAssets: Asset[] = [
  { id: 'a1', name: 'Generator Unit 1', type: 'Generator', status: 'operational', siteId: '1', lastMaintenance: '2024-08-15' },
  { id: 'a2', name: 'Cooling Pump A2', type: 'Pump', status: 'maintenance', siteId: '1', lastMaintenance: '2024-09-01' },
  { id: 'a3', name: 'Main Transformer', type: 'Transformer', status: 'operational', siteId: '1' },
  { id: 'a4', name: 'Backup Generator', type: 'Generator', status: 'critical', siteId: '2', lastMaintenance: '2024-07-20' },
  { id: 'a5', name: 'Water Pump B1', type: 'Pump', status: 'operational', siteId: '2' },
  { id: 'a6', name: 'Control Panel', type: 'Electrical', status: 'offline', siteId: '3', lastMaintenance: '2024-06-10' }
];

export const mockTasks: Task[] = [
  { id: 't1', title: 'Generator inspection', assetId: 'a1', siteId: '1', status: 'in-progress', priority: 'high', dueDate: '2024-10-15', assignee: 'John M.', createdDate: '2024-09-15' },
  { id: 't2', title: 'Replace pump bearings', assetId: 'a2', siteId: '1', status: 'pending', priority: 'critical', dueDate: '2024-10-08', assignee: 'Sarah C.', createdDate: '2024-09-10' },
  { id: 't3', title: 'Transformer oil test', assetId: 'a3', siteId: '1', status: 'completed', priority: 'medium', dueDate: '2024-09-30', createdDate: '2024-09-01' },
  { id: 't4', title: 'Emergency repair', assetId: 'a4', siteId: '2', status: 'overdue', priority: 'critical', dueDate: '2024-09-25', assignee: 'Mike J.', createdDate: '2024-09-20' }
];

// Helper functions for data lookups
export const getSiteById = (id: string): Site | undefined => 
  mockSites.find(site => site.id === id);

export const getAssetById = (id: string): Asset | undefined => 
  mockAssets.find(asset => asset.id === id);

export const getTaskById = (id: string): Task | undefined => 
  mockTasks.find(task => task.id === id);

export const getAssetsBySiteId = (siteId: string): Asset[] => 
  mockAssets.filter(asset => asset.siteId === siteId);

export const getTasksByStatus = (status?: TaskStatus): Task[] => 
  status ? mockTasks.filter(task => task.status === status) : mockTasks;

export const getActiveSites = (): Site[] => {
  const activeSiteIds = mockTasks
    .filter(task => task.status === 'pending' || task.status === 'in-progress' || task.status === 'overdue')
    .map(task => task.siteId);
  const uniqueSiteIds = [...new Set(activeSiteIds)];
  return mockSites.filter(site => uniqueSiteIds.includes(site.id));
};

export const getTasksCountBySiteId = (siteId: string): { total: number; urgent: number } => {
  const siteTasks = mockTasks.filter(task => task.siteId === siteId);
  const urgentTasks = siteTasks.filter(task => 
    task.status === 'overdue' || (task.priority === 'critical' || task.priority === 'high')
  );
  return {
    total: siteTasks.length,
    urgent: urgentTasks.length
  };
};