import https from "node:https";
import fs from "node:fs";

const query = `[out:json];
(
  node["railway"="station"](-6.9, 106.3, -6.0, 107.3);
  node["railway"="halt"](-6.9, 106.3, -6.0, 107.3);
);
out center;`;

const lines = {
  BOGOR: ["Jakarta Kota", "Jayakarta", "Mangga Besar", "Sawah Besar", "Juanda", "Gondangdia", "Cikini", "Manggarai", "Tebet", "Cawang", "Duren Kalibata", "Pasar Minggu Baru", "Pasar Minggu", "Tanjung Barat", "Lenteng Agung", "Universitas Pancasila", "Universitas Indonesia", "Pondok Cina", "Depok Baru", "Depok", "Citayam", "Bojong Gede", "Cilebut", "Bogor"],
  CIKARANG: ["Cikarang", "Metland Telagamurni", "Cibitung", "Tambun", "Bekasi Timur", "Bekasi", "Kranji", "Cakung", "Klender Baru", "Buaran", "Klender", "Cipinang", "Jatinegara", "Matraman", "Manggarai", "Sudirman", "Karet", "BNI City", "Tanah Abang", "Duri", "Angke", "Kampung Bandan", "Rajawali", "Kemayoran", "Pasar Senen", "Gang Sentiong", "Kramat", "Pondok Jati", "Jatinegara"],
  RANGKASBITUNG: ["Tanah Abang", "Palmerah", "Kebayoran", "Pondok Ranji", "Jurangmangu", "Sudimara", "Rawa Buntu", "Serpong", "Cisauk", "Cicayur", "Parung Panjang", "Cilejit", "Daru", "Tenjo", "Tigaraksa", "Cikoya", "Maja", "Citeras", "Rangkasbitung"],
  TANGERANG: ["Duri", "Grogol", "Pesing", "Taman Kota", "Bojong Indah", "Rawa Buaya", "Kalideres", "Poris", "Batu Ceper", "Tanah Tinggi", "Tangerang"],
  TANJUNG_PRIOK: ["Jakarta Kota", "Kampung Bandan", "Ancol", "Tanjung Priok"]
};

const allStationNames = new Set(Object.values(lines).flat().map(n => n.toLowerCase()));

const url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);
https.get(url, (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
    const json = JSON.parse(data);
    const stationCoords = {};
    
    // Find matching stations
    for (const el of json.elements) {
      if (el.tags && el.tags.name) {
        const name = el.tags.name.toLowerCase().replace("stasiun ", "").trim();
        const altName = (el.tags["name:en"] || "").toLowerCase().replace("stasiun ", "").trim();
        // find best match in allStationNames
        for (const st of allStationNames) {
          if (name.includes(st) || st.includes(name) || altName.includes(st)) {
            if (!stationCoords[st]) {
              stationCoords[st] = { lat: el.lat, lng: el.lon };
            }
          }
        }
      }
    }
    
    // Fallbacks
    if (!stationCoords["jakarta kota"]) stationCoords["jakarta kota"] = {lat: -6.1374, lng: 106.8143};
    if (!stationCoords["manggarai"]) stationCoords["manggarai"] = {lat: -6.2098, lng: 106.8502};
    if (!stationCoords["bogor"]) stationCoords["bogor"] = {lat: -6.5947, lng: 106.7888};

    fs.writeFileSync("src/krl.json", JSON.stringify({ lines, coords: stationCoords }, null, 2));
    console.log("Written to src/krl.json");
  });
}).on("error", (err) => {
  console.error("Error:", err.message);
});
