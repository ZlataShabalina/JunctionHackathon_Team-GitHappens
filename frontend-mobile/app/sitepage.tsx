import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiService, Site, Asset, getStatusColor, getStatusText } from './data/types';

export default function SitePageScreen() {
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const router = useRouter();
  
  const [site, setSite] = useState<Site | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (siteId) {
      loadSiteData();
    }
  }, [siteId]);

  const loadSiteData = async (isRefresh = false) => {
    if (!siteId) return;

    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      // Load site details and assets in parallel
      const [siteResponse, assetsResponse] = await Promise.all([
        apiService.getSite(siteId),
        apiService.getSiteAssets(siteId),
      ]);

      setSite(siteResponse);
      setAssets(assetsResponse.items);
    } catch (error) {
      console.error('Failed to load site data:', error);
      setError('Failed to load site details. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSiteData(true);
  };

  const renderAsset = ({ item }: { item: Asset }) => (
    <TouchableOpacity
      style={styles.assetCard}
      onPress={() => router.push({
        pathname: '/asset',
        params: { assetId: item.id }
      })}
      activeOpacity={0.8}
    >
      <View style={styles.assetHeader}>
        <Text style={styles.assetName}>{item.name || 'Unnamed Asset'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.assetMeta}>
        <Text style={styles.assetType}>{item.type || 'Unknown Type'}</Text>
        <Text style={styles.assetId}>ID: {item.id}</Text>
      </View>
      
      {item.last_seen_at && (
        <Text style={styles.lastSeen}>
          Last seen: {new Date(item.last_seen_at).toLocaleDateString()}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading site details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !site) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to load site</Text>
          <Text style={styles.errorText}>{error || 'Site not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadSiteData()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate asset statistics
  const statusCounts = assets.reduce((acc, asset) => {
    acc[asset.status] = (acc[asset.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const operationalCount = statusCounts.operational || 0;
  const maintenanceCount = (statusCounts.maintenance_due || 0) + (statusCounts.maintenance || 0);
  const faultCount = statusCounts.fault || 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{site.name}</Text>
        {site.address && (
          <Text style={styles.address}>{site.address}</Text>
        )}
        <Text style={styles.coordinates}>
          {site.lat.toFixed(6)}, {site.lon.toFixed(6)}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{assets.length}</Text>
          <Text style={styles.statLabel}>Total Assets</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#059669' }]}>
            {operationalCount}
          </Text>
          <Text style={styles.statLabel}>Operational</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#d97706' }]}>
            {maintenanceCount}
          </Text>
          <Text style={styles.statLabel}>Maintenance</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#dc2626' }]}>
            {faultCount}
          </Text>
          <Text style={styles.statLabel}>Faults</Text>
        </View>
      </View>

      <View style={styles.assetsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Assets</Text>
          <TouchableOpacity
            style={styles.viewWorkOrdersButton}
            onPress={() => router.push({
              pathname: '/workorders',
              // Could add site filter parameter here if backend supports it
            })}
          >
            <Text style={styles.viewWorkOrdersText}>View Work Orders</Text>
          </TouchableOpacity>
        </View>
        
        {assets.length === 0 ? (
          <View style={styles.emptyAssetsContainer}>
            <Text style={styles.emptyAssetsText}>No assets found for this site</Text>
          </View>
        ) : (
          <FlatList
            data={assets}
            keyExtractor={(item) => item.id}
            renderItem={renderAsset}
            contentContainerStyle={styles.assetsList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#2563eb']}
                tintColor="#2563eb"
              />
            }
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
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  address: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 14,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  assetsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  viewWorkOrdersButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewWorkOrdersText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  emptyAssetsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyAssetsText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  assetsList: {
    paddingBottom: 20,
  },
  assetCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  assetMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  assetType: {
    fontSize: 14,
    color: '#64748b',
    textTransform: 'capitalize',
  },
  assetId: {
    fontSize: 14,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  lastSeen: {
    fontSize: 12,
    color: '#94a3b8',
  },
});