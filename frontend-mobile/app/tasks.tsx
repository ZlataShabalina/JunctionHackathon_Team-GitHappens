import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { mockTasks, getSiteById, getAssetById, Task, TaskStatus } from './data/types';

const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case 'completed': return '#059669';
    case 'in-progress': return '#2563eb';
    case 'pending': return '#d97706';
    case 'overdue': return '#dc2626';
    default: return '#64748b';
  }
};

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'critical': return '#dc2626';
    case 'high': return '#ea580c';
    case 'medium': return '#d97706';
    case 'low': return '#059669';
    default: return '#64748b';
  }
};

const formatDate = (dateString: string): string => {
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

export default function TasksScreen() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');

  const filteredTasks = selectedStatus === 'all' 
    ? mockTasks 
    : mockTasks.filter(task => task.status === selectedStatus);

  const statusCounts = mockTasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<TaskStatus, number>);

  const StatusTab = ({ status, label, count }: { status: TaskStatus | 'all', label: string, count: number }) => (
    <TouchableOpacity
      style={[
        styles.statusTab,
        selectedStatus === status && styles.activeStatusTab,
        selectedStatus === status && { borderBottomColor: getStatusColor(status as TaskStatus) }
      ]}
      onPress={() => setSelectedStatus(status)}
    >
      <Text style={[
        styles.statusTabText,
        selectedStatus === status && styles.activeStatusTabText
      ]}>
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  const renderTask = ({ item }: { item: Task }) => {
    const site = getSiteById(item.siteId);
    const asset = getAssetById(item.assetId);
    
    return (
      <TouchableOpacity
        style={styles.taskCard}
        onPress={() =>
          router.push({
            pathname: '/taskpage',
            params: { taskId: item.id }
          })
        }
        activeOpacity={0.8}
      >
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
          </View>
        </View>
        
        <Text style={styles.taskDetails}>
          {asset?.name} • {site?.name}
        </Text>
        
        <View style={styles.taskFooter}>
          <View style={styles.taskMeta}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={styles.statusText}>{item.status.replace('-', ' ')}</Text>
            {item.assignee && (
              <Text style={styles.assigneeText}>• {item.assignee}</Text>
            )}
          </View>
          <Text style={[
            styles.dueDate,
            item.status === 'overdue' && { color: '#dc2626', fontWeight: '600' }
          ]}>
            {formatDate(item.dueDate)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Maintenance Tasks</Text>
      </View>

      <View style={styles.tabsContainer}>
        <StatusTab status="all" label="All" count={mockTasks.length} />
        <StatusTab status="pending" label="Pending" count={statusCounts.pending || 0} />
        <StatusTab status="in-progress" label="Active" count={statusCounts['in-progress'] || 0} />
        <StatusTab status="overdue" label="Overdue" count={statusCounts.overdue || 0} />
      </View>

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        contentContainerStyle={styles.tasksList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  tasksList: {
    padding: 20,
    paddingTop: 0,
  },
  taskCard: {
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
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  priorityBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 12,
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  taskDetails: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskMeta: {
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
    textTransform: 'capitalize',
  },
  assigneeText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  dueDate: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
});