// The four Nigerian mobile networks SpeedCap ranks.
export const NETWORKS = [
  { id: "mtn", name: "MTN", color: "#FFCB05" },
  { id: "airtel", name: "Airtel", color: "#E4002B" },
  { id: "glo", name: "Glo", color: "#3FA535" },
  { id: "9mobile", name: "9mobile", color: "#0E6B4F" },
];

export const NETWORK_IDS = NETWORKS.map((n) => n.id);

// Port Harcourt neighbourhoods used to seed sample data and to name locations
// when the reverse-geocoding service is unavailable. Coordinates are approximate.
export const AREAS = [
  { id: "old-gra", name: "Old GRA", lat: 4.7845, lng: 7.0105 },
  { id: "gra-phase-2", name: "GRA Phase 2", lat: 4.8235, lng: 6.9995 },
  { id: "d-line", name: "D-Line", lat: 4.7985, lng: 7.0085 },
  { id: "diobu", name: "Mile 1, Diobu", lat: 4.7905, lng: 6.9975 },
  { id: "borokiri", name: "Borokiri", lat: 4.7505, lng: 7.0345 },
  { id: "trans-amadi", name: "Trans-Amadi", lat: 4.8125, lng: 7.0405 },
  { id: "woji", name: "Woji", lat: 4.8255, lng: 7.0555 },
  { id: "elelenwo", name: "Elelenwo", lat: 4.8355, lng: 7.0745 },
  { id: "rumuola", name: "Rumuola", lat: 4.8385, lng: 7.0125 },
  { id: "rumuigbo", name: "Rumuigbo", lat: 4.8545, lng: 6.9855 },
  { id: "rumuodara", name: "Rumuodara", lat: 4.8605, lng: 7.0205 },
  { id: "eliozu", name: "Eliozu", lat: 4.8655, lng: 7.0305 },
  { id: "rumuokoro", name: "Rumuokoro", lat: 4.8695, lng: 7.0005 },
  { id: "choba", name: "Choba", lat: 4.8945, lng: 6.9105 },
  { id: "aluu", name: "Aluu", lat: 4.9335, lng: 6.9425 },
];
