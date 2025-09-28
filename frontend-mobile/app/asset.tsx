import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAssetById, getSiteById, mockTasks, AssetStatus } from './data/types';

const getStatusColor = (status: AssetStatus): string => {
  switch (status) {
    case 'operational': return '#059669';
    case 'maintenance': return '#d97706';
    case 'offline': return '#64748b';
    case 'critical': return '#dc2626';
    default: return '#64748b';
  }
};

const getStatusText = (status: AssetStatus): string => {
  switch (status) {
    case 'operational': return 'Operational';
    case 'maintenance': return 'Under Maintenance';
    case 'offline': return 'Offline';
    case 'critical': return 'Critical Issue';
    default: return status;
  }
};

export default function AssetDetailsScreen() {
  const { assetId } = useLocalSearchParams<{ assetId: string }>();
  const router = useRouter();
  
  const asset = getAssetById(assetId);
  const site = asset ? getSiteById(asset.siteId) : null;
  const relatedTasks = mockTasks.filter(task => task.assetId === assetId);

  if (!asset) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Asset not found</Text>
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
          <Text style={styles.title}>{asset.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(asset.status) }]}>
            <Text style={styles.statusText}>{getStatusText(asset.status)}</Text>
          </View>
        </View>

        <InfoCard title="Asset Details">
          <InfoRow label="Asset ID" value={asset.id} />
          <InfoRow label="Type" value={asset.type} />
          <InfoRow label="Status" value={getStatusText(asset.status)} />
          {asset.lastMaintenance && (
            <InfoRow 
              label="Last Maintenance" 
              value={new Date(asset.lastMaintenance).toLocaleDateString()} 
            />
          )}
        </InfoCard>

        {site && (
          <InfoCard title="Location">
            <InfoRow 
              label="Site" 
              value={site.name}
              onPress={() => router.push({
                pathname: '/sitepage',
                params: { siteId: site.id }
              })}
            />
            <InfoRow label="Location" value={site.location} />
            <InfoRow label="Site ID" value={site.id} />
          </InfoCard>
        )}

        <InfoCard title="Maintenance Tasks">
          {relatedTasks.length === 0 ? (
            <Text style={styles.noTasks}>No maintenance tasks found</Text>
          ) : (
            <View>
              {relatedTasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={styles.taskItem}
                  onPress={() => router.push({
                    pathname: '/taskpage',
                    params: { taskId: task.id }
                  })}
                  activeOpacity={0.7}
                >
                  <View style={styles.taskHeader}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={[styles.taskStatus, { color: getStatusColor(task.status as AssetStatus) }]}>
                      {task.status}
                    </Text>
                  </View>
                  <Text style={styles.taskDue}>
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </Text>
                  {task.assignee && (
                    <Text style={styles.taskAssignee}>Assigned to: {task.assignee}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </InfoCard>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <Text style={styles.actionButtonText}>Schedule Maintenance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} activeOpacity={0.8}>
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>View History</Text>
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
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
  noTasks: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  taskItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    flex: 1,
  },
  taskStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  taskDue: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  taskAssignee: {
    fontSize: 12,
    color: '#64748b',
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
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2563eb',
    elevation: 0,
    shadowOpacity: 0,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#2563eb',
  },
  errorText: {
    fontSize: 18,
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 40,
  },
});