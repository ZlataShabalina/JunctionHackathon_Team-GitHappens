// Mock data generation utilities

// Generate route points between two locations
export const generateRoute = (start, end, segments = 10) => {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const ratio = i / segments;
    const lat = start.lat + (end.lat - start.lat) * ratio;
    const lng = start.lng + (end.lng - start.lng) * ratio;
    points.push(addGPSNoise(lat, lng));
  }
  return points;
};

// Simulate realistic GPS coordinates with slight variations
export const addGPSNoise = (lat, lng, accuracy = 0.0001) => ({
  lat: lat + (Math.random() - 0.5) * accuracy,
  lng: lng + (Math.random() - 0.5) * accuracy
});

export const initializeSites = () => {
  return [
    { id: 'FIN-001', name: 'Oulu Substation', lat: 65.0121, lng: 25.4651, type: 'substation', status: 'stable', country: 'Finland' },
    { id: 'FIN-002', name: 'Vaasa Power Tower', lat: 63.0951, lng: 21.6165, type: 'tower', status: 'warning', country: 'Finland' },
    { id: 'FIN-003', name: 'Helsinki Main Grid', lat: 60.1699, lng: 24.9384, type: 'plant', status: 'stable', country: 'Finland' },
    { id: 'NOR-001', name: 'Bergen Substation', lat: 60.3913, lng: 5.3221, type: 'substation', status: 'critical', country: 'Norway' },
    { id: 'NOR-002', name: 'Trondheim Tower', lat: 63.4305, lng: 10.3951, type: 'tower', status: 'stable', country: 'Norway' },
    { id: 'SWE-001', name: 'Stockholm Central', lat: 59.3293, lng: 18.0686, type: 'plant', status: 'maintenance', country: 'Sweden' },
    { id: 'SWE-002', name: 'Gothenburg Grid', lat: 57.7089, lng: 11.9746, type: 'substation', status: 'stable', country: 'Sweden' }
  ];
};

export const initializeTrucks = async (sites) => {
  const countries = [
    { code: 'FIN', name: 'Finland', depot: { lat: 64.2008, lng: 27.7286 } },
    { code: 'NOR', name: 'Norway', depot: { lat: 59.9139, lng: 10.7522 } },
    { code: 'SWE', name: 'Sweden', depot: { lat: 59.3293, lng: 18.0686 } }
  ];

  const trucks = [];

  for (const country of countries) {
    for (let i = 1; i <= 4; i++) {
      const isMoving = Math.random() > 0.3;
      const targetSite = isMoving ? 
        sites.filter(s => s.country === country.name)[Math.floor(Math.random() * sites.filter(s => s.country === country.name).length)] : 
        null;
      
      const truck = {
        id: `${country.code}-${i.toString().padStart(3, '0')}`,
        name: `${country.name} Unit ${i}`,
        status: isMoving ? 'moving' : Math.random() > 0.7 ? 'maintenance' : 'parked',
        lat: country.depot.lat,
        lng: country.depot.lng,
        targetSite,
        route: targetSite ? generateRoute(country.depot, targetSite) : [],
        routeProgress: 0,
        speed: 45 + Math.random() * 25, // km/h
        crew: Math.floor(Math.random() * 3) + 2,
        eta: null,
        lastUpdate: new Date(),
        fuel: Math.floor(Math.random() * 40) + 60 // %
      };

      if (truck.status === 'moving' && truck.route.length > 0) {
        const distance = Math.sqrt(
          Math.pow(targetSite.lat - country.depot.lat, 2) + 
          Math.pow(targetSite.lng - country.depot.lng, 2)
        ) * 111; // Rough km conversion
        truck.eta = Math.floor(distance / truck.speed * 60); // minutes
      }

      trucks.push(truck);
    }
  }

  return trucks;
};

export const generateAlerts = (sites) => {
  return sites
    .filter(site => site.status === 'critical')
    .map(site => ({
      id: `alert-${site.id}`,
      type: 'critical',
      message: `Critical issue detected at ${site.name}`,
      timestamp: new Date(),
      siteId: site.id
    }));
};