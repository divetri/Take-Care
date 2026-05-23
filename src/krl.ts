export const KRL_LINES = {
  BOGOR: ["Jakarta Kota", "Jayakarta", "Mangga Besar", "Sawah Besar", "Juanda", "Gondangdia", "Cikini", "Manggarai", "Tebet", "Cawang", "Duren Kalibata", "Pasar Minggu Baru", "Pasar Minggu", "Tanjung Barat", "Lenteng Agung", "Universitas Pancasila", "Universitas Indonesia", "Pondok Cina", "Depok Baru", "Depok", "Citayam", "Bojong Gede", "Cilebut", "Bogor"],
  CIKARANG: ["Cikarang", "Metland Telagamurni", "Cibitung", "Tambun", "Bekasi Timur", "Bekasi", "Kranji", "Cakung", "Klender Baru", "Buaran", "Klender", "Cipinang", "Jatinegara", "Matraman", "Manggarai", "Sudirman", "Karet", "BNI City", "Tanah Abang", "Duri", "Angke", "Kampung Bandan", "Rajawali", "Kemayoran", "Pasar Senen", "Gang Sentiong", "Kramat", "Pondok Jati", "Jatinegara"],
  RANGKASBITUNG: ["Tanah Abang", "Palmerah", "Kebayoran", "Pondok Ranji", "Jurangmangu", "Sudimara", "Rawa Buntu", "Serpong", "Cisauk", "Cicayur", "Parung Panjang", "Cilejit", "Daru", "Tenjo", "Tigaraksa", "Cikoya", "Maja", "Citeras", "Rangkasbitung"],
  TANGERANG: ["Duri", "Grogol", "Pesing", "Taman Kota", "Bojong Indah", "Rawa Buaya", "Kalideres", "Poris", "Batu Ceper", "Tanah Tinggi", "Tangerang"],
  TANJUNG_PRIOK: ["Jakarta Kota", "Kampung Bandan", "Ancol", "Tanjung Priok"]
};

// Transit stations
export const TRANSITS = ["Jakarta Kota", "Manggarai", "Jatinegara", "Tanah Abang", "Duri", "Kampung Bandan"];

// Get all unique stations
export const ALL_STATIONS = Array.from(new Set(Object.values(KRL_LINES).flat())).sort();

// Graph builder
export function buildGraph() {
  const graph: Record<string, string[]> = {};
  
  for (const st of ALL_STATIONS) {
    graph[st] = [];
  }

  for (const [lineName, stations] of Object.entries(KRL_LINES)) {
    for (let i = 0; i < stations.length; i++) {
       if (i > 0) {
         if (!graph[stations[i]].includes(stations[i - 1])) graph[stations[i]].push(stations[i - 1]);
       }
       if (i < stations.length - 1) {
         if (!graph[stations[i]].includes(stations[i + 1])) graph[stations[i]].push(stations[i + 1]);
       }
    }
  }

  // Handle Jatinegara Loop manually
  if (!graph["Jatinegara"].includes("Cipinang")) graph["Jatinegara"].push("Cipinang");
  if (!graph["Jatinegara"].includes("Pondok Jati")) graph["Jatinegara"].push("Pondok Jati");

  return graph;
}

export function findShortestPath(start: string, end: string): string[] {
  const graph = buildGraph();
  const queue = [{ node: start, path: [start] }];
  const visited = new Set([start]);

  while (queue.length > 0) {
    const { node, path } = queue.shift()!;
    if (node === end) return path;

    for (const neighbor of graph[node] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ node: neighbor, path: [...path, neighbor] });
      }
    }
  }
  return [];
}
