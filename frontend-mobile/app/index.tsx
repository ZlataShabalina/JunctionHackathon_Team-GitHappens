import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { apiService, Site, Asset, WorkOrder } from './data/types';

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSites: 0,
    totalAssets: 0,
    activeWorkOrders: 0,
    overdueWorkOrders: 0,
    faultAssets: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load data in parallel
      const [sitesResponse, assetsResponse, workOrdersResponse] = await Promise.all([
        apiService.getSites(),
        apiService.getAssets(),
        apiService.getWorkOrders(),
      ]);

      const sites = sitesResponse;
      const assets = assetsResponse.items;
      const workOrders = workOrdersResponse.items;

      // Calculate stats
      const activeWorkOrders = workOrders.filter(wo => 
        wo.status === 'scheduled' || wo.status === 'assigned' || wo.status === 'in_progress'
      ).length;

      const overdueWorkOrders = workOrders.filter(wo => {
        if (!wo.scheduled_end || wo.status === 'completed' || wo.status === 'canceled') return false;
        return new Date(wo.scheduled_end) < new Date();
      }).length;

      const faultAssets = assets.filter(asset => asset.status === 'fault').length;

      setStats({
        totalSites: sites.length,
        totalAssets: assets.length,
        activeWorkOrders,
        overdueWorkOrders,
        faultAssets,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const QuickStat = ({ label, value, color = '#2563eb', onPress }: { 
    label: string; 
    value: number; 
    color?: string; 
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const ActionButton = ({ title, onPress, color = '#2563eb' }: { 
    title: string; 
    onPress: () => void; 
    color?: string;
  }) => (
    <TouchableOpacity 
      style={[styles.actionButton, { backgroundColor: color }]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PowerPulse</Text>
        <Text style={styles.subtitle}>Asset Management Dashboard</Text>
      </View>

      <View style={styles.statsContainer}>
        <QuickStat 
          label="Sites" 
          value={stats.totalSites}
          onPress={() => router.push('/sites')}
        />
        <QuickStat 
          label="Assets" 
          value={stats.totalAssets}
        />
        <QuickStat 
          label="Active Work Orders" 
          value={stats.activeWorkOrders} 
          color="#059669"
          onPress={() => router.push('/workorders')}
        />
        <QuickStat 
          label="Overdue" 
          value={stats.overdueWorkOrders} 
          color="#dc2626"
          onPress={() => router.push('/workorders')}
        />
      </View>

      {stats.faultAssets > 0 && (
        <View style={styles.alertContainer}>
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>⚠️ Attention Required</Text>
            <Text style={styles.alertText}>
              {stats.faultAssets} asset{stats.faultAssets !== 1 ? 's' : ''} reporting faults
            </Text>
          </View>
        </View>
      )}

      <View style={styles.actionsContainer}>
        <ActionButton
          title="Browse Sites"
          onPress={() => router.push('/sites')}
        />
        
        <ActionButton
          title="View Work Orders"
          onPress={() => router.push('/workorders')}
          color="#059669"
        />
        
        <ActionButton
          title="View Map"
          onPress={() => router.push('/map')}
          color="#7c3aed"
        />
        
        {stats.overdueWorkOrders > 0 && (
          <ActionButton
            title={`${stats.overdueWorkOrders} Overdue Work Orders`}
            onPress={() => router.push('/workorders')}
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
    marginBottom: 20,
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
  alertContainer: {
    marginBottom: 20,
  },
  alertCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: '#7f1d1d',
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