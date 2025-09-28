import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { mockSites, Site } from './data/types';

export default function SitesScreen() {
  const router = useRouter();

  const renderSite = ({ item }: { item: Site }) => (
    <TouchableOpacity
      style={styles.siteCard}
      onPress={() =>
        router.push({
          pathname: '/sitepage',
          params: { siteId: item.id }
        })
      }
      activeOpacity={0.8}
    >
      <View style={styles.siteHeader}>
        <Text style={styles.siteName}>{item.name}</Text>
        <View style={styles.assetBadge}>
          <Text style={styles.assetCount}>{item.assetCount}</Text>
        </View>
      </View>
      <Text style={styles.siteLocation}>{item.location}</Text>
      <View style={styles.siteFooter}>
        <Text style={styles.viewDetails}>View Details →</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sites</Text>
        <Text style={styles.subtitle}>{mockSites.length} locations</Text>
      </View>
      
      <FlatList
        data={mockSites}
        keyExtractor={(item) => item.id}
        renderItem={renderSite}
        contentContainerStyle={styles.listContainer}
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  siteCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  siteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  siteName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  assetBadge: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 12,
  },
  assetCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  siteLocation: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  siteFooter: {
    alignItems: 'flex-end',
  },
  viewDetails: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
});