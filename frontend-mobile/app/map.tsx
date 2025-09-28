import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  Dimensions,
  Alert,
  Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { getActiveSites, getTasksCountBySiteId, Site, getSiteById } from './data/types';

// Platform-specific map component
const LeafletMap = ({ sites, selectedSite, onSitePress }: {
  sites: Site[];
  selectedSite: Site | null;
  onSitePress: (site: Site) => void;
}) => {
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      loadWebMap();
    }
  }, [sites]);

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
    const avgLat = sites.reduce((sum, site) => sum + site.coordinates.latitude, 0) / sites.length;
    const avgLng = sites.reduce((sum, site) => sum + site.coordinates.longitude, 0) / sites.length;

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
      const taskCounts = getTasksCountBySiteId(site.id);
      const isUrgent = taskCounts.urgent > 0;
      const markerColor = isUrgent ? '#dc2626' : '#2563eb';

      // Create custom marker
      const marker = L.circleMarker([site.coordinates.latitude, site.coordinates.longitude], {
        radius: 15,
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
          <p style="margin: 4px 0 12px 0; color: #64748b; font-size: 14px;">${site.location}</p>
          <div style="display: flex; justify-content: center; gap: 6px; margin: 12px 0;">
            <span style="background: ${markerColor}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">
              ${taskCounts.total} task${taskCounts.total !== 1 ? 's' : ''}
            </span>
            ${taskCounts.urgent > 0 ? `
              <span style="background: #dc2626; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                ${taskCounts.urgent} urgent
              </span>
            ` : ''}
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

      // Add number label
      const numberIcon = L.divIcon({
        html: `<div style="color: white; text-align: center; font-weight: bold; font-size: 12px; line-height: 30px;">${taskCounts.total}</div>`,
        className: 'number-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      L.marker([site.coordinates.latitude, site.coordinates.longitude], { 
        icon: numberIcon 
      }).addTo(map);
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
          const taskCounts = getTasksCountBySiteId(site.id);
          const isUrgent = taskCounts.urgent > 0;
          
          return (
            <TouchableOpacity
              key={site.id}
              style={[
                styles.mockMarker,
                { 
                  left: `${20 + (index * 25)}%`, 
                  top: `${40 + (index * 15)}%`,
                  backgroundColor: isUrgent ? '#dc2626' : '#2563eb'
                }
              ]}
              onPress={() => onSitePress(site)}
            >
              <Text style={styles.mockMarkerText}>{taskCounts.total}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.mapLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
          <Text style={styles.legendText}>Normal tasks</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#dc2626' }]} />
          <Text style={styles.legendText}>Urgent tasks</Text>
        </View>
      </View>
    </View>
  );
};

export default function MapScreen() {
  const router = useRouter();
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const activeSites = getActiveSites();

  const handleSitePress = (site: Site) => {
    setSelectedSite(site);
  };

  const handleNavigateToSite = (site: Site) => {
    const { latitude, longitude } = site.coordinates;
    
    if (Platform.OS === 'web') {
      // Open Google Maps in web browser
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
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
            console.log(`Navigate to: ${latitude}, ${longitude}`);
            Alert.alert('Navigation', `Would open maps to ${site.name}`);
          }
        }
      ]
    );
  };

  const SiteCard = ({ site }: { site: Site }) => {
    const taskCounts = getTasksCountBySiteId(site.id);
    
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
          <View style={styles.taskBadges}>
            <View style={[styles.taskBadge, { backgroundColor: '#2563eb' }]}>
              <Text style={styles.taskBadgeText}>{taskCounts.total}</Text>
            </View>
            {taskCounts.urgent > 0 && (
              <View style={[styles.taskBadge, { backgroundColor: '#dc2626' }]}>
                <Text style={styles.taskBadgeText}>{taskCounts.urgent}</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.siteLocation}>{site.location}</Text>
        <Text style={styles.siteCoords}>
          {site.coordinates.latitude.toFixed(4)}, {site.coordinates.longitude.toFixed(4)}
        </Text>
      </TouchableOpacity>
    );
  };

  if (activeSites.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>🎉 All caught up!</Text>
          <Text style={styles.emptyText}>No active maintenance tasks at any sites.</Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/tasks')}
          >
            <Text style={styles.actionButtonText}>View All Tasks</Text>
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
          {activeSites.length} site{activeSites.length !== 1 ? 's' : ''} with active tasks
        </Text>
      </View>

      <View style={styles.mapContainer}>
        <LeafletMap 
          sites={activeSites}
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
              <Text style={styles.actionButtonText}>🧭 Navigate Here</Text>
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
        <Text style={styles.sitesListTitle}>All Active Sites</Text>
        {activeSites.map(site => (
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
  taskBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  taskBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  taskBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  siteLocation: {
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