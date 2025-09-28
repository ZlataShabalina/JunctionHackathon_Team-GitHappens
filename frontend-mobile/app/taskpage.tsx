import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getTaskById, getSiteById, getAssetById, TaskStatus } from './data/types';

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

export default function TaskPage() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const router = useRouter();
  
  const task = getTaskById(taskId);
  const site = task ? getSiteById(task.siteId) : null;
  const asset = task ? getAssetById(task.assetId) : null;

  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Task not found</Text>
      </SafeAreaView>
    );
  }

  const InfoCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );

  const InfoRow = ({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) => (
    <TouchableOpacity 
      style={styles.infoRow} 
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, onPress && styles.linkValue]}>{value}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{task.title}</Text>
          <View style={styles.badgeContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
              <Text style={styles.badgeText}>{task.status.replace('-', ' ').toUpperCase()}</Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
              <Text style={styles.badgeText}>{task.priority.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <InfoCard title="Task Details">
          <InfoRow label="Task ID" value={task.id} />
          <InfoRow label="Due Date" value={new Date(task.dueDate).toLocaleDateString()} />
          <InfoRow label="Created" value={new Date(task.createdDate).toLocaleDateString()} />
          {task.assignee && (
            <InfoRow label="Assigned To" value={task.assignee} />
          )}
        </InfoCard>

        {asset && (
          <InfoCard title="Asset Information">
            <InfoRow 
              label="Asset Name" 
              value={asset.name}
              onPress={() => router.push({
                pathname: '/asset',
                params: { assetId: asset.id }
              })}
            />
            <InfoRow label="Asset Type" value={asset.type} />
            <InfoRow label="Asset ID" value={asset.id} />
            <InfoRow label="Status" value={asset.status} />
            {asset.lastMaintenance && (
              <InfoRow 
                label="Last Maintenance" 
                value={new Date(asset.lastMaintenance).toLocaleDateString()} 
              />
            )}
          </InfoCard>
        )}

        {site && (
          <InfoCard title="Site Information">
            <InfoRow 
              label="Site Name" 
              value={site.name}
              onPress={() => router.push({
                pathname: '/sitepage',
                params: { siteId: site.id }
              })}
            />
            <InfoRow label="Location" value={site.location} />
            <InfoRow label="Site ID" value={site.id} />
            <InfoRow label="Total Assets" value={site.assetCount.toString()} />
          </InfoCard>
        )}

        {task.status !== 'completed' && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
              <Text style={styles.actionButtonText}>Update Status</Text>
            </TouchableOpacity>
            {task.status === 'pending' && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.startButton]} 
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>Start Task</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  priorityBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  infoRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  label: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  linkValue: {
    color: '#2563eb',
  },
  actionsContainer: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  startButton: {
    backgroundColor: '#059669',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 40,
  },
});