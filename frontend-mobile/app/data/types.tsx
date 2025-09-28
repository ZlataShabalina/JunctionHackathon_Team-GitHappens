// Types matching PowerPulse backend API
export type WorkOrderStatus = 'scheduled' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'canceled';
export type WorkOrderPriority = 'low' | 'normal' | 'high';
export type AssetStatus = 'operational' | 'maintenance_due' | 'maintenance' | 'fault' | 'standby';

// Backend API types
export interface Site {
  id: string;
  name: string;
  lat: number;
  lon: number;
  address?: string | null;
  meta?: Record<string, unknown> | null;
}

export interface Asset {
  id: string;
  site_id?: string | null;
  name?: string | null;
  type?: string | null;
  status: AssetStatus;
  last_seen_at?: string | null;
  meta?: Record<string, unknown> | null;
}

export interface WorkOrder {
  id: number;
  site_id: string;
  asset_id?: string | null;
  title: string;
  description?: string | null;
  priority: WorkOrderPriority;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  status: WorkOrderStatus;
  assigned_to?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notice {
  id: number;
  site_id?: string | null;
  asset_id?: string | null;
  kind: 'planned' | 'active' | 'done';
  title: string;
  description?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at: string;
}

// API Configuration
export const API_BASE_URL = 'http://localhost:8000';

// API Service class
class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Sites
  async getSites(bbox?: string): Promise<Site[]> {
    const params = bbox ? `?bbox=${encodeURIComponent(bbox)}` : '';
    return this.request<Site[]>(`/sites${params}`);
  }

  async getSite(siteId: string): Promise<Site> {
    return this.request<Site>(`/sites/${siteId}`);
  }

  async getSiteAssets(siteId: string): Promise<{ items: Asset[] }> {
    return this.request<{ items: Asset[] }>(`/sites/${siteId}/assets`);
  }

  // Assets
  async getAssets(params?: { site_id?: string; status?: string; type?: string }): Promise<{ items: Asset[] }> {
    const searchParams = new URLSearchParams();
    if (params?.site_id) searchParams.append('site_id', params.site_id);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.type) searchParams.append('type', params.type);
    
    const queryString = searchParams.toString();
    const url = queryString ? `/assets?${queryString}` : '/assets';
    return this.request<{ items: Asset[] }>(url);
  }

  async getAsset(assetId: string): Promise<Asset> {
    return this.request<Asset>(`/assets/${assetId}`);
  }

  async updateAsset(assetId: string, updates: Partial<Asset>): Promise<Asset> {
    return this.request<Asset>(`/assets/${assetId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Work Orders
  async getWorkOrders(params?: { site_id?: string; status?: string; assigned_to?: string }): Promise<{ items: WorkOrder[] }> {
    const searchParams = new URLSearchParams();
    if (params?.site_id) searchParams.append('site_id', params.site_id);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.assigned_to) searchParams.append('assigned_to', params.assigned_to);
    
    const queryString = searchParams.toString();
    const url = queryString ? `/workorders?${queryString}` : '/workorders';
    return this.request<{ items: WorkOrder[] }>(url);
  }

  async getWorkOrder(workOrderId: number): Promise<WorkOrder> {
    return this.request<WorkOrder>(`/workorders/${workOrderId}`);
  }

  async updateWorkOrder(workOrderId: number, updates: Partial<WorkOrder>): Promise<WorkOrder> {
    return this.request<WorkOrder>(`/workorders/${workOrderId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async createWorkOrder(workOrder: Omit<WorkOrder, 'id' | 'created_at' | 'updated_at'>): Promise<WorkOrder> {
    return this.request<WorkOrder>('/workorders', {
      method: 'POST',
      body: JSON.stringify(workOrder),
    });
  }

  // Notices
  async getNotices(params?: { site_id?: string; asset_id?: string; kind?: string }): Promise<{ items: Notice[] }> {
    const searchParams = new URLSearchParams();
    if (params?.site_id) searchParams.append('site_id', params.site_id);
    if (params?.asset_id) searchParams.append('asset_id', params.asset_id);
    if (params?.kind) searchParams.append('kind', params.kind);
    
    const queryString = searchParams.toString();
    const url = queryString ? `/notices?${queryString}` : '/notices';
    return this.request<{ items: Notice[] }>(url);
  }

  // Feedback
  async submitFeedback(feedback: {
    site_id?: string;
    asset_id?: string;
    message: string;
    contact?: string;
    rating?: number;
  }): Promise<{ ok: boolean; id: number }> {
    return this.request<{ ok: boolean; id: number }>('/feedback', {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  }
}

export const apiService = new ApiService();

// Helper functions for UI
export const getStatusColor = (status: AssetStatus | WorkOrderStatus): string => {
  switch (status) {
    case 'operational':
    case 'completed':
      return '#059669';
    case 'maintenance_due':
    case 'assigned':
    case 'scheduled':
      return '#d97706';
    case 'maintenance':
    case 'in_progress':
      return '#2563eb';
    case 'fault':
    case 'on_hold':
      return '#dc2626';
    case 'standby':
    case 'canceled':
      return '#64748b';
    default:
      return '#64748b';
  }
};

export const getPriorityColor = (priority: WorkOrderPriority): string => {
  switch (priority) {
    case 'high': return '#dc2626';
    case 'normal': return '#2563eb';
    case 'low': return '#059669';
    default: return '#64748b';
  }
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays <= 7) return `In ${diffDays} days`;
  return date.toLocaleDateString();
};

export const getStatusText = (status: AssetStatus | WorkOrderStatus): string => {
  switch (status) {
    case 'maintenance_due': return 'Maintenance Due';
    case 'in_progress': return 'In Progress';
    case 'on_hold': return 'On Hold';
    default: return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  }
};