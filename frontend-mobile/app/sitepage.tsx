import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getSiteById, getAssetsBySiteId, Asset, AssetStatus } from './data/types';

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
    case 'critical': return 'Critical';
    default: return status;
  }
};

export default function SitePageScreen() {
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const router = useRouter();
  
  const site = getSiteById(siteId);
  const assets = getAssetsBySiteId(siteId);
  
  if (!site) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Site not found</Text>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.assetName}>{item.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      <Text style={styles.assetType}>{item.type}</Text>
      {item.lastMaintenance && (
        <Text style={styles.lastMaintenance}>
          Last maintenance: {new Date(item.lastMaintenance).toLocaleDateString()}
        </Text>
      )}
    </TouchableOpacity>
  );

  const statusCounts = assets.reduce((acc, asset) => {
    acc[asset.status] = (acc[asset.status] || 0) + 1;
    return acc;
  }, {} as Record<AssetStatus, number>);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{site.name}</Text>
        <Text style={styles.location}>{site.location}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{assets.length}</Text>
          <Text style={styles.statLabel}>Total Assets</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#059669' }]}>
            {statusCounts.operational || 0}
          </Text>
          <Text style={styles.statLabel}>Operational</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#dc2626' }]}>
            {(statusCounts.critical || 0) + (statusCounts.maintenance || 0)}
          </Text>
          <Text style={styles.statLabel}>Need Attention</Text>
        </View>
      </View>

      <View style={styles.assetsSection}>
        <Text style={styles.sectionTitle}>Assets</Text>
        {assets.length === 0 ? (
          <Text style={styles.noAssets}>No assets found for this site</Text>
        ) : (
          <FlatList
            data={assets}
            keyExtractor={(item) => item.id}
            renderItem={renderAsset}
            contentContainerStyle={styles.assetsList}
            showsVerticalScrollIndicator={false}
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
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  location: {
    fontSize: 16,
    color: '#64748b',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  noAssets: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 40,
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
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  assetType: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  lastMaintenance: {
    fontSize: 12,
    color: '#9ca3af',
  },
  errorText: {
    fontSize: 18,
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 40,
  },
});