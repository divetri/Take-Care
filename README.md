# KRL Smart Alarm & Route Tracker

An elegant, user-centric location-based smart alarm application tailored for Indonesian KRL Commuter Line transfers. It ensures that commuters never miss their departure stations, transit transfers, or connections. Styled on a gorgeous aesthetic combining custom themes with highly refined typography.

---

## 📅 Last Updated
**May 23, 2026**

---

## ✨ Features

### 🚂 Smart Sequenced Alarms for Transits
* **End-to-End Route Milestones:** Automatically detects necessary transfers (e.g., *Manggarai*, *Tanah Abang*) along the shortest path between your departure and arrival stations.
* **Sequenced Trigger Sequence:** Plays consecutive safety alarms to warn you when approaching intermediate transit stations, followed by your final destination.
* **Persistent States:** Retains your departure selection, destination selection, and trigger configuration even after canceling or dismissing an alarm, eliminating tedious re-entry.

### 📍 Highly Custom Trigger Modes
* **Immediate Area (100 m):** Rings an alarm when you are immediately nearby (100-meter radius).
* **Early Station Warnings:** Set alarms to notify you **1 Station Before** or **2 Stations Before** you reach the target station to avoid last-minute rushes.

### 🌐 Always-Light Leaflet Map Visuals
* **Persistent Maps Clarity:** Leverages Cartesian high-contrast light tiles (`cartocdn.com/light_all`) permanently, ensuring complete geographical legibility and bright contrast ratios across all dynamic applications.
* **Color-Coded Waypoints:** Includes color-coded path markers on map lines:
  * **Green pin/dot:** Departure station.
  * **Yellow pin/dot:** Transit stations.
  * **Blue pin/dot:** Destination station.

### 🎨 Fully Custom Aesthetic & Typography
* **Ubuntu Font Integration:** Polished displays, lists, map popups, and dialog sheets with the elegant, high-legibility **Ubuntu Typography** system.
* **Refined Pastel Palette Harmony:** Implements a warm, carefully picked palette theme (*Primrose & Pink*):
  * **Primrose** (`#E18AAA`)
  * **Classy Pink** (`#E4A0B7`)
  * **Boho Pink** (`#ECBDC4`)
  * **Pinkish** (`#EFCFD4`)
  * **Sofia** (`#F5DCE0`)
* **Responsive Layout Modes:** Works flawlessly across mobile portrait screens and expansive desktop displays.

---

## 🛠️ Technology Stack
* **Framework:** React 18+ with Vite
* **Design & Styling:** Tailwind CSS
* **Map Engine:** Leaflet (React-Leaflet)
* **Animation:** Motion (`motion/react`)
* **Icons:** Lucide React
