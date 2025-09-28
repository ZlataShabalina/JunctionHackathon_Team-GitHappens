import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  Dimensions,
  Alert,
  Platform,
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiService, Site, WorkOrder, Asset } from './data/types';

// Platform-specific map component
const LeafletMap = ({ sites, sitesWithWorkOrders, selectedSite, onSitePress }: {
  sites: Site[];
  sitesWithWorkOrders: Set<string>;
  selectedSite: Site | null;
  onSitePress: (site: Site) => void;
}) => {
  const mapRef = React.useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      loadWebMap();
    }
  }, [sites, sitesWithWorkOrders]);

  const loadWebMap = () => {
    // Only run on web platform
    if (typeof window === 'undefined') return;

    // Dynamically load Leaflet for web
    const loadLeaflet = async () => {
      // Load Leaflet CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // Load Leaflet JS
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = resolve;
        document.head.appendChild(script);
      });
    };

    loadLeaflet().then(() => {
      initializeMap();
    });
  };

  const initializeMap = () => {
    if (!mapRef.current || typeof window === 'undefined' || !(window as any).L) return;

    const L = (window as any).L;
    
    // Calculate map center
    const avgLat = sites.reduce((sum, site) => sum + site.lat, 0) / sites.length;
    const avgLng = sites.reduce((sum, site) => sum + site.lon, 0) / sites.length;

    // Initialize map
    const map = L.map(mapRef.current).setView([avgLat, avgLng], 11);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    const markers: any[] = [];

    // Add markers for each site
    sites.forEach((site) => {
      const hasWorkOrders = sitesWithWorkOrders.has(site.id);
      const markerColor = hasWorkOrders ? '#2563eb' : '#64748b';

      // Create custom marker
      const marker = L.circleMarker([site.lat, site.lon], {
        radius: hasWorkOrders ? 15 : 8,
        fillColor: markerColor,
        color: 'white',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.9
      });

      // Create popup content
      const popupContent = `
        <div style="text-align: center; min-width: 180px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <h3 style="margin: 8px 0; color: #1e293b; font-size: 16px;">${site.name}</h3>
          ${site.address ? `<p style="margin: 4px 0; color: #64748b; font-size: 14px;">${site.address}</p>` : ''}
          <p style="margin: 4px 0 12px 0; color: #64748b; font-size: 12px; font-family: monospace;">${site.lat.toFixed(4)}, ${site.lon.toFixed(4)}</p>
          <div style="margin: 12px 0;">
            ${hasWorkOrders ? `
              <span style="background: #2563eb; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                Active Work Orders
              </span>
            ` : `
              <span style="background: #64748b; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                No Active Work
              </span>
            `}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 220,
        className: 'custom-popup'
      });

      // Add click handler
      marker.on('click', function() {
        onSitePress(site);
      });

      marker.addTo(map);
      markers.push(marker);
    });

    // Fit map to show all markers
    if (markers.length > 0) {
      const group = new L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.15));
    }
  };

  if (Platform.OS === 'web') {
    return (
      <div 
        ref={mapRef} 
        style={{ 
          height: '100%', 
          width: '100%', 
          borderRadius: '12px',
          overflow: 'hidden'
        }} 
      />
    );
  }

  // Fallback for mobile platforms (when WebView isn't available)
  return (
    <View style={styles.mapFallback}>
      <Text style={styles.mapFallbackTitle}>📍 Site Locations</Text>
      <Text style={styles.mapFallbackSubtitle}>
        Interactive map available on mobile app
      </Text>
      <View style={styles.mockMarkersContainer}>
        {sites.map((site, index) => {
          const hasWorkOrders = sitesWithWorkOrders.has(site.id);
          
          return (
            <TouchableOpacity
              key={site.id}
              style={[
                styles.mockMarker,
                { 
                  left: `${20 + (index * 25)}%`, 
                  top: `${40 + (index * 15)}%`,
                  backgroundColor: hasWorkOrders ? '#2563eb' : '#64748b'
                }
              ]}
              onPress={() => onSitePress(site)}
            >
              <Text style={styles.mockMarkerText}>
                {hasWorkOrders ? '●' : '○'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.mapLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
          <Text style={styles.legendText}>Has work orders</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#64748b' }]} />
          <Text style={styles.legendText}>No active work</Text>
        </View>
      </View>
    </View>
  );
};

export default function MapScreen() {
  const router = useRouter();
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [sitesWithWorkOrders, setSitesWithWorkOrders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load sites and work orders in parallel
      const [sitesResponse, workOrdersResponse] = await Promise.all([
        apiService.getSites(),
        apiService.getWorkOrders({ status: 'scheduled' }) // Only active work orders
          .catch(() => ({ items: [] })), // Fallback if work orders fail
      ]);

      setSites(sitesResponse);

      // Create set of site IDs that have active work orders
      const activeSiteIds = new Set(
        workOrdersResponse.items
          .filter(wo => wo.status === 'scheduled' || wo.status === 'assigned' || wo.status === 'in_progress')
          .map(wo => wo.site_id)
      );
      setSitesWithWorkOrders(activeSiteIds);
    } catch (error) {
      console.error('Failed to load map data:', error);
      setError('Failed to load map data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSitePress = (site: Site) => {
    setSelectedSite(site);
  };

  const handleNavigateToSite = (site: Site) => {
    const { lat, lon } = site;
    
    if (Platform.OS === 'web') {
      // Open Google Maps in web browser
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
      window.open(url, '_blank');
      return;
    }
    
    Alert.alert(
      'Navigate to Site',
      `Open navigation to ${site.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Maps', 
          onPress: () => {
            // For mobile platforms, you'd use expo-linking here
            console.log(`Navigate to: ${lat}, ${lon}`);
            Alert.alert('Navigation', `Would open maps to ${site.name}`);
          }
        }
      ]
    );
  };

  const SiteCard = ({ site }: { site: Site }) => {
    const hasWorkOrders = sitesWithWorkOrders.has(site.id);
    
    return (
      <TouchableOpacity 
        style={styles.siteCard}
        onPress={() => router.push({
          pathname: '/sitepage',
          params: { siteId: site.id }
        })}
        activeOpacity={0.8}
      >
        <View style={styles.siteCardHeader}>
          <Text style={styles.siteCardName}>{site.name}</Text>
          <View style={styles.statusBadge}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: hasWorkOrders ? '#2563eb' : '#64748b' }
            ]} />
            <Text style={styles.statusText}>
              {hasWorkOrders ? 'Active Work' : 'No Work'}
            </Text>
          </View>
        </View>
        
        {site.address && (
          <Text style={styles.siteAddress}>{site.address}</Text>
        )}
        
        <Text style={styles.siteCoords}>
          {site.lat.toFixed(4)}, {site.lon.toFixed(4)}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading map data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to load map</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadMapData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (sites.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No sites available</Text>
          <Text style={styles.emptyText}>Sites will appear here once they are added to the system.</Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/sites')}
          >
            <Text style={styles.actionButtonText}>Browse Sites</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Site Locations</Text>
        <Text style={styles.subtitle}>
          {sites.length} site{sites.length !== 1 ? 's' : ''} • {sitesWithWorkOrders.size} with active work
        </Text>
      </View>

      <View style={styles.mapContainer}>
        <LeafletMap 
          sites={sites}
          sitesWithWorkOrders={sitesWithWorkOrders}
          selectedSite={selectedSite}
          onSitePress={handleSitePress}
        />
      </View>

      {selectedSite && (
        <View style={styles.selectedSiteContainer}>
          <Text style={styles.selectedSiteTitle}>Selected Site</Text>
          <SiteCard site={selectedSite} />
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.navigateButton}
              onPress={() => handleNavigateToSite(selectedSite)}
            >
              <Text style={styles.actionButtonText}>Navigate Here</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.detailsButton}
              onPress={() => router.push({
                pathname: '/sitepage',
                params: { siteId: selectedSite.id }
              })}
            >
              <Text style={styles.actionButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={styles.sitesList} showsVerticalScrollIndicator={false}>
        <Text style={styles.sitesListTitle}>All Sites</Text>
        {sites.map(site => (
          <SiteCard key={site.id} site={site} />
        ))}
      </ScrollView>
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
  mapContainer: {
    height: 300,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: '#e2e8f0',
  },
  mapFallback: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapFallbackTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  mapFallbackSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  mockMarkersContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mockMarker: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  mockMarkerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mapLegend: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#64748b',
  },
  selectedSiteContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  selectedSiteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  navigateButton: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  detailsButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  sitesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sitesListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  siteCard: {
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
  siteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  siteCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  siteAddress: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  siteCoords: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
});