import { addGPSNoise } from './MockData.js';

export const updateTruckPositions = (trucks) => {
  return trucks.map(truck => {
    if (truck.status === 'moving' && truck.route && truck.route.length > 0) {
      const newProgress = truck.routeProgress + 1;
      if (newProgress >= truck.route.length) {
        return {
          ...truck,
          status: 'maintenance',
          routeProgress: 0,
          eta: null,
          lastUpdate: new Date()
        };
      }
      
      const currentPos = truck.route[newProgress];
      return {
        ...truck,
        lat: currentPos.lat,
        lng: currentPos.lng,
        routeProgress: newProgress,
        eta: Math.max(0, truck.eta - 1),
        lastUpdate: new Date()
      };
    }
    
    // Add slight GPS drift for parked vehicles
    if (truck.status === 'parked') {
      const driftedPos = addGPSNoise(truck.lat, truck.lng, 0.00005);
      return {
        ...truck,
        lat: driftedPos.lat,
        lng: driftedPos.lng,
        lastUpdate: new Date()
      };
    }

    return truck;
  });
};

export const calculateStats = (trucks) => {
  return {
    active: trucks.filter(t => t.status === 'moving').length,
    parked: trucks.filter(t => t.status === 'parked').length,
    maintenance: trucks.filter(t => t.status === 'maintenance').length
  };
};