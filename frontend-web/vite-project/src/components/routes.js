import polyline from '@mapbox/polyline';

const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImNkZTVjMWZiMDViMDQzZDE4MmExMDZjMGFiMWE5ZGExIiwiaCI6Im11cm11cjY0In0="; // Put your OpenRouteService API key here

export async function getRouteCoordinates(start, end) {
  const url = "https://api.openrouteservice.org/v2/directions/driving-car";

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: ORS_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        coordinates: [start, end],
        instructions: false
      })
    });

    const data = await resp.json();

    if (!data.routes || data.routes.length === 0) {
      console.warn("No route returned", data);
      return [];
    }

    const coords = polyline.decode(data.routes[0].geometry);
    return coords.map((c, i) => ({ lat: c[0], lon: c[1], timestamp: i }));
  } catch (err) {
    console.error("Error fetching route:", err);
    return [];
  }
}
