import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { mockSites, mockTasks, mockAssets } from './data/types';

export default function HomeScreen() {
  const router = useRouter();

  // Quick stats for dashboard
  const totalSites = mockSites.length;
  const totalAssets = mockAssets.length;
  const activeTasks = mockTasks.filter(task => 
    task.status === 'pending' || task.status === 'in-progress'
  ).length;
  const overdueTasks = mockTasks.filter(task => task.status === 'overdue').length;

  const QuickStat = ({ label, value, color = '#2563eb' }: { label: string; value: number; color?: string }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const ActionButton = ({ title, onPress, color = '#2563eb' }: { title: string; onPress: () => void; color?: string }) => (
    <TouchableOpacity 
      style={[styles.actionButton, { backgroundColor: color }]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Asset Manager</Text>
        <Text style={styles.subtitle}>Maintenance Dashboard</Text>
      </View>

      <View style={styles.statsContainer}>
        <QuickStat label="Sites" value={totalSites} />
        <QuickStat label="Assets" value={totalAssets} />
        <QuickStat label="Active Tasks" value={activeTasks} color="#059669" />
        <QuickStat label="Overdue" value={overdueTasks} color="#dc2626" />
      </View>

      <View style={styles.actionsContainer}>
        <ActionButton
          title="Browse Sites"
          onPress={() => router.push('/sites')}
        />
        
        <ActionButton
          title="View Tasks"
          onPress={() => router.push('/tasks')}
          color="#059669"
        />
        
        <ActionButton
          title="View Map"
          onPress={() => router.push('/map')}
          color="#7c3aed"
        />
        
        {overdueTasks > 0 && (
          <ActionButton
            title={`${overdueTasks} Overdue Tasks`}
            onPress={() => router.push('/tasks')}
            color="#dc2626"
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '48%',
    marginBottom: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  actionsContainer: {
    gap: 16,
  },
  actionButton: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});