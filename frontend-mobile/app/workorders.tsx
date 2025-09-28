import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { apiService, WorkOrder, WorkOrderStatus, getStatusColor, getPriorityColor, formatDate, getStatusText } from './data/types';

export default function WorkOrdersScreen() {
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [filteredWorkOrders, setFilteredWorkOrders] = useState<WorkOrder[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<WorkOrderStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkOrders();
  }, []);

  useEffect(() => {
    filterWorkOrders();
  }, [workOrders, selectedStatus]);

  const loadWorkOrders = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      
      const response = await apiService.getWorkOrders();
      setWorkOrders(response.items);
    } catch (error) {
      console.error('Failed to load work orders:', error);
      setError('Failed to load work orders. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterWorkOrders = () => {
    if (selectedStatus === 'all') {
      setFilteredWorkOrders(workOrders);
    } else {
      setFilteredWorkOrders(workOrders.filter(wo => wo.status === selectedStatus));
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadWorkOrders(true);
  };

  const getStatusCount = (status: WorkOrderStatus | 'all'): number => {
    if (status === 'all') return workOrders.length;
    return workOrders.filter(wo => wo.status === status).length;
  };

  const StatusTab = ({ status, label }: { status: WorkOrderStatus | 'all', label: string }) => {
    const count = getStatusCount(status);
    const isActive = selectedStatus === status;
    
    return (
      <TouchableOpacity
        style={[
          styles.statusTab,
          isActive && styles.activeStatusTab,
          isActive && { borderBottomColor: status !== 'all' ? getStatusColor(status as WorkOrderStatus) : '#2563eb' }
        ]}
        onPress={() => setSelectedStatus(status)}
      >
        <Text style={[
          styles.statusTabText,
          isActive && styles.activeStatusTabText
        ]}>
          {label} ({count})
        </Text>
      </TouchableOpacity>
    );
  };

  const renderWorkOrder = ({ item }: { item: WorkOrder }) => {
    const isOverdue = item.scheduled_end && new Date(item.scheduled_end) < new Date() && 
                     item.status !== 'completed' && item.status !== 'canceled';
    
    return (
      <TouchableOpacity
        style={styles.workOrderCard}
        onPress={() =>
          router.push({
            pathname: '/workorder-details',
            params: { workOrderId: item.id.toString() }
          })
        }
        activeOpacity={0.8}
      >
        <View style={styles.workOrderHeader}>
          <Text style={styles.workOrderTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.badgesContainer}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
              <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
            </View>
            {isOverdue && (
              <View style={[styles.overdueBadge]}>
                <Text style={styles.overdueText}>OVERDUE</Text>
              </View>
            )}
          </View>
        </View>
        
        {item.description && (
          <Text style={styles.workOrderDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.workOrderMeta}>
          <Text style={styles.siteText}>Site: {item.site_id}</Text>
          {item.assigned_to && (
            <Text style={styles.assigneeText}>• {item.assigned_to}</Text>
          )}
        </View>
        
        <View style={styles.workOrderFooter}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
          
          {item.scheduled_end && (
            <Text style={[
              styles.dueDate,
              isOverdue && { color: '#dc2626', fontWeight: '600' }
            ]}>
              {formatDate(item.scheduled_end)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading work orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to load work orders</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadWorkOrders()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Work Orders</Text>
        <Text style={styles.subtitle}>{workOrders.length} total</Text>
      </View>

      <View style={styles.tabsContainer}>
        <StatusTab status="all" label="All" />
        <StatusTab status="scheduled" label="Scheduled" />
        <StatusTab status="in_progress" label="Active" />
        <StatusTab status="completed" label="Done" />
      </View>

      <FlatList
        data={filteredWorkOrders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderWorkOrder}
        contentContainerStyle={styles.workOrdersList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No work orders found</Text>
            <Text style={styles.emptyText}>
              {selectedStatus === 'all' 
                ? 'Work orders will appear here once they are created.'
                : `No ${selectedStatus.replace('_', ' ')} work orders at the moment.`
              }
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statusTab: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  activeStatusTab: {
    borderBottomWidth: 2,
  },
  statusTabText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
  activeStatusTabText: {
    color: '#1e293b',
    fontWeight: '600',
  },
  workOrdersList: {
    padding: 20,
    paddingTop: 0,
  },
  workOrderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  workOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  workOrderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: 12,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  priorityBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  overdueBadge: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  overdueText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  workOrderDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    lineHeight: 20,
  },
  workOrderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  siteText: {
    fontSize: 12,
    color: '#64748b',
  },
  assigneeText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  workOrderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#64748b',
  },
  dueDate: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
});