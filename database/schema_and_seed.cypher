// ==============================================================================
// L.I.N.K. (Logistics Intelligence Network Kernel)
// Neo4j Digital Twin Schema & Seeding Script (Middle East Supply Chain Network)
// ==============================================================================

// 1. Constraints and Indexes for Performance & Data Integrity
CREATE CONSTRAINT unique_location_id IF NOT EXISTS
FOR (n:Location) REQUIRE n.id IS UNIQUE;

CREATE INDEX location_type_idx IF NOT EXISTS
FOR (n:Location) ON (n.type);

CREATE INDEX location_country_idx IF NOT EXISTS
FOR (n:Location) ON (n.country);

// ------------------------------------------------------------------------------
// 2. Seeding Nodes: Strategic Chokepoints, Ports, Airports & Land Hubs
// ------------------------------------------------------------------------------

// --- Strategic Maritime Chokepoints ---
MERGE (c1:Location:Chokepoint {id: 'CHOKE_HORMUZ'})
SET c1.name = 'Strait of Hormuz',
    c1.name_ar = 'مضيق هرمز',
    c1.country = 'International Waters',
    c1.lat = 26.5667,
    c1.lon = 56.2500,
    c1.type = 'CHOKEPOINT',
    c1.status = 'OPEN';

MERGE (c2:Location:Chokepoint {id: 'CHOKE_BAB_EL_MANDEB'})
SET c2.name = 'Bab al-Mandab Strait',
    c2.name_ar = 'مضيق باب المندب',
    c2.country = 'International Waters',
    c2.lat = 12.5833,
    c2.lon = 43.3333,
    c2.type = 'CHOKEPOINT',
    c2.status = 'OPEN';

MERGE (c3:Location:Chokepoint {id: 'CHOKE_SUEZ'})
SET c3.name = 'Suez Canal (South Entry)',
    c3.name_ar = 'قناة السويس',
    c3.country = 'Egypt',
    c3.lat = 29.9333,
    c3.lon = 32.5500,
    c3.type = 'CHOKEPOINT',
    c3.status = 'OPEN';

// --- Maritime Ports (Scenario 1 & Scenario 3) ---
MERGE (p1:Location:Port {id: 'PORT_JEBEL_ALI'})
SET p1.name = 'Port of Jebel Ali (Dubai)',
    p1.name_ar = 'ميناء جبل علي',
    p1.country = 'UAE',
    p1.lat = 24.9857,
    p1.lon = 55.0683,
    p1.type = 'PORT',
    p1.capacity_teu_day = 52000,
    p1.status = 'OPEN';

MERGE (p2:Location:Port {id: 'PORT_DAMMAM'})
SET p2.name = 'King Abdulaziz Port (Dammam)',
    p2.name_ar = 'ميناء الملك عبد العزيز بالدمام',
    p2.country = 'Saudi Arabia',
    p2.lat = 26.5020,
    p2.lon = 50.2110,
    p2.type = 'PORT',
    p2.capacity_teu_day = 28000,
    p2.status = 'OPEN';

MERGE (p3:Location:Port {id: 'PORT_JEDDAH'})
SET p3.name = 'Jeddah Islamic Port',
    p3.name_ar = 'ميناء جدة الإسلامي',
    p3.country = 'Saudi Arabia',
    p3.lat = 21.4858,
    p3.lon = 39.1820,
    p3.type = 'PORT',
    p3.capacity_teu_day = 35000,
    p3.status = 'OPEN';

MERGE (p4:Location:Port {id: 'PORT_SALALAH'})
SET p4.name = 'Port of Salalah',
    p4.name_ar = 'ميناء صلالة',
    p4.country = 'Oman',
    p4.lat = 16.9410,
    p4.lon = 54.0080,
    p4.type = 'PORT',
    p4.capacity_teu_day = 24000,
    p4.status = 'OPEN';

MERGE (p5:Location:Port {id: 'PORT_MERSIN'})
SET p5.name = 'Port of Mersin (Strategic Lifeline Gateway)',
    p5.name_ar = 'ميناء مرسين التركي (الجسر المنقذ)',
    p5.country = 'Turkey',
    p5.lat = 36.7950,
    p5.lon = 34.6430,
    p5.type = 'PORT',
    p5.capacity_teu_day = 30000,
    p5.status = 'OPEN';

MERGE (p6:Location:Port {id: 'PORT_AQABA'})
SET p6.name = 'Port of Aqaba',
    p6.name_ar = 'ميناء العقبة',
    p6.country = 'Jordan',
    p6.lat = 29.5160,
    p6.lon = 34.9960,
    p6.type = 'PORT',
    p6.capacity_teu_day = 12000,
    p6.status = 'OPEN';

// --- Major International Airports (Scenario 2 Emergency Divert & Flight Corridors) ---
MERGE (a1:Location:Airport {id: 'AIRPORT_DXB'})
SET a1.name = 'Dubai International Airport',
    a1.name_ar = 'مطار دبي الدولي',
    a1.country = 'UAE',
    a1.lat = 25.2532,
    a1.lon = 55.3657,
    a1.iata = 'DXB',
    a1.type = 'AIRPORT',
    a1.safe_haven = true,
    a1.status = 'OPEN';

MERGE (a2:Location:Airport {id: 'AIRPORT_RUH'})
SET a2.name = 'King Khalid International Airport (Riyadh)',
    a2.name_ar = 'مطار الملك خالد الدولي بالرياض',
    a2.country = 'Saudi Arabia',
    a2.lat = 24.9576,
    a2.lon = 46.6988,
    a2.iata = 'RUH',
    a2.type = 'AIRPORT',
    a2.safe_haven = true,
    a2.status = 'OPEN';

MERGE (a3:Location:Airport {id: 'AIRPORT_AMM'})
SET a3.name = 'Queen Alia International Airport (Amman - Safe Haven)',
    a3.name_ar = 'مطار الملكة علياء الدولي (عمّان - ملاذ آمن)',
    a3.country = 'Jordan',
    a3.lat = 31.7226,
    a3.lon = 35.9932,
    a3.iata = 'AMM',
    a3.type = 'AIRPORT',
    a3.safe_haven = true,
    a3.status = 'OPEN';

MERGE (a4:Location:Airport {id: 'AIRPORT_BGW'})
SET a4.name = 'Baghdad International Airport (Safe Haven)',
    a4.name_ar = 'مطار بغداد الدولي (ملاذ آمن)',
    a4.country = 'Iraq',
    a4.lat = 33.2625,
    a4.lon = 44.2344,
    a4.iata = 'BGW',
    a4.type = 'AIRPORT',
    a4.safe_haven = true,
    a4.status = 'OPEN';

MERGE (a5:Location:Airport {id: 'AIRPORT_IKA'})
SET a5.name = 'Tehran Imam Khomeini International Airport',
    a5.name_ar = 'مطار الإمام الخميني الدولي (طهران)',
    a5.country = 'Iran',
    a5.lat = 35.4161,
    a5.lon = 51.1522,
    a5.iata = 'IKA',
    a5.type = 'AIRPORT',
    a5.safe_haven = false,
    a5.status = 'OPEN';

MERGE (a6:Location:Airport {id: 'AIRPORT_DAM'})
SET a6.name = 'Damascus International Airport',
    a6.name_ar = 'مطار دمشق الدولي',
    a6.country = 'Syria',
    a6.lat = 33.4114,
    a6.lon = 36.5156,
    a6.iata = 'DAM',
    a6.type = 'AIRPORT',
    a6.safe_haven = false,
    a6.status = 'OPEN';

MERGE (a7:Location:Airport {id: 'AIRPORT_IST'})
SET a7.name = 'Istanbul Airport',
    a7.name_ar = 'مطار إسطنبول الدولي',
    a7.country = 'Turkey',
    a7.lat = 41.2753,
    a7.lon = 28.7519,
    a7.iata = 'IST',
    a7.type = 'AIRPORT',
    a7.safe_haven = true,
    a7.status = 'OPEN';

// --- Strategic Inland Logistics Hubs & Cross-Border Nodes ---
MERGE (h1:Location:LogisticsHub {id: 'HUB_RIYADH'})
SET h1.name = 'Riyadh Dry Port & Intermodal Logistics City',
    h1.name_ar = 'الميناء الجاف والمركز اللوجستي بالرياض',
    h1.country = 'Saudi Arabia',
    h1.lat = 24.6460,
    h1.lon = 46.7720,
    h1.type = 'LOGISTICS_HUB',
    h1.status = 'OPEN';

MERGE (h2:Location:LogisticsHub {id: 'HUB_GAZIANTEP'})
SET h2.name = 'Gaziantep Inland Logistics Gateway',
    h2.name_ar = 'مركز غازي عنتاب اللوجستي الداخلي',
    h2.country = 'Turkey',
    h2.lat = 37.0662,
    h2.lon = 37.3833,
    h2.type = 'LOGISTICS_HUB',
    h2.status = 'OPEN';

MERGE (h3:Location:LogisticsHub {id: 'HUB_ZAKHO'})
SET h3.name = 'Ibrahim Khalil / Zakho Border Crossing',
    h3.name_ar = 'معبر إبراهيم الخليل / زاخو الحدودي',
    h3.country = 'Iraq-Turkey Border',
    h3.lat = 37.1460,
    h3.lon = 42.6820,
    h3.type = 'LOGISTICS_HUB',
    h3.status = 'OPEN';

// ------------------------------------------------------------------------------
// 3. Seeding Edges: MARITIME_ROUTE, FLIGHT_CORRIDOR, LAND_BRIDGE, INTERMODAL
// ------------------------------------------------------------------------------

// --- Maritime Routes (Bidirectional) ---
// Route 1: Arabian Sea (Salalah) <-> Strait of Hormuz <-> Jebel Ali <-> Dammam
MATCH (p_sal:Location {id: 'PORT_SALALAH'}), (c_hor:Location {id: 'CHOKE_HORMUZ'})
MERGE (p_sal)-[r1:MARITIME_ROUTE {route_code: 'SEA-SAL-HOR'}]->(c_hor)
SET r1.distance_km = 1250, r1.time_hours = 38.0, r1.cost_usd = 2200, r1.status = 'OPEN', r1.risk_level = 0.05, r1.mode = 'MARITIME'
MERGE (c_hor)-[r2:MARITIME_ROUTE {route_code: 'SEA-HOR-SAL'}]->(p_sal)
SET r2.distance_km = 1250, r2.time_hours = 38.0, r2.cost_usd = 2200, r2.status = 'OPEN', r2.risk_level = 0.05, r2.mode = 'MARITIME';

MATCH (c_hor:Location {id: 'CHOKE_HORMUZ'}), (p_dxb:Location {id: 'PORT_JEBEL_ALI'})
MERGE (c_hor)-[r1:MARITIME_ROUTE {route_code: 'SEA-HOR-DXB'}]->(p_dxb)
SET r1.distance_km = 210, r1.time_hours = 7.0, r1.cost_usd = 600, r1.status = 'OPEN', r1.risk_level = 0.10, r1.mode = 'MARITIME'
MERGE (p_dxb)-[r2:MARITIME_ROUTE {route_code: 'SEA-DXB-HOR'}]->(c_hor)
SET r2.distance_km = 210, r2.time_hours = 7.0, r2.cost_usd = 600, r2.status = 'OPEN', r2.risk_level = 0.10, r2.mode = 'MARITIME';

MATCH (p_dxb:Location {id: 'PORT_JEBEL_ALI'}), (p_dam:Location {id: 'PORT_DAMMAM'})
MERGE (p_dxb)-[r1:MARITIME_ROUTE {route_code: 'SEA-DXB-DAM'}]->(p_dam)
SET r1.distance_km = 620, r1.time_hours = 18.0, r1.cost_usd = 1100, r1.status = 'OPEN', r1.risk_level = 0.08, r1.mode = 'MARITIME'
MERGE (p_dam)-[r2:MARITIME_ROUTE {route_code: 'SEA-DAM-DXB'}]->(p_dxb)
SET r2.distance_km = 620, r2.time_hours = 18.0, r2.cost_usd = 1100, r2.status = 'OPEN', r2.risk_level = 0.08, r2.mode = 'MARITIME';

// Route 2: Arabian Sea <-> Bab al-Mandab <-> Jeddah <-> Suez <-> Mersin
MATCH (p_sal:Location {id: 'PORT_SALALAH'}), (c_bab:Location {id: 'CHOKE_BAB_EL_MANDEB'})
MERGE (p_sal)-[r1:MARITIME_ROUTE {route_code: 'SEA-SAL-BAB'}]->(c_bab)
SET r1.distance_km = 1290, r1.time_hours = 40.0, r1.cost_usd = 2400, r1.status = 'OPEN', r1.risk_level = 0.12, r1.mode = 'MARITIME'
MERGE (c_bab)-[r2:MARITIME_ROUTE {route_code: 'SEA-BAB-SAL'}]->(p_sal)
SET r2.distance_km = 1290, r2.time_hours = 40.0, r2.cost_usd = 2400, r2.status = 'OPEN', r2.risk_level = 0.12, r2.mode = 'MARITIME';

MATCH (c_bab:Location {id: 'CHOKE_BAB_EL_MANDEB'}), (p_jed:Location {id: 'PORT_JEDDAH'})
MERGE (c_bab)-[r1:MARITIME_ROUTE {route_code: 'SEA-BAB-JED'}]->(p_jed)
SET r1.distance_km = 1080, r1.time_hours = 32.0, r1.cost_usd = 1900, r1.status = 'OPEN', r1.risk_level = 0.15, r1.mode = 'MARITIME'
MERGE (p_jed)-[r2:MARITIME_ROUTE {route_code: 'SEA-JED-BAB'}]->(c_bab)
SET r2.distance_km = 1080, r2.time_hours = 32.0, r2.cost_usd = 1900, r2.status = 'OPEN', r2.risk_level = 0.15, r2.mode = 'MARITIME';

MATCH (p_jed:Location {id: 'PORT_JEDDAH'}), (c_suez:Location {id: 'CHOKE_SUEZ'})
MERGE (p_jed)-[r1:MARITIME_ROUTE {route_code: 'SEA-JED-SUEZ'}]->(c_suez)
SET r1.distance_km = 1020, r1.time_hours = 30.0, r1.cost_usd = 2600, r1.status = 'OPEN', r1.risk_level = 0.05, r1.mode = 'MARITIME'
MERGE (c_suez)-[r2:MARITIME_ROUTE {route_code: 'SEA-SUEZ-JED'}]->(p_jed)
SET r2.distance_km = 1020, r2.time_hours = 30.0, r2.cost_usd = 2600, r2.status = 'OPEN', r2.risk_level = 0.05, r2.mode = 'MARITIME';

MATCH (c_suez:Location {id: 'CHOKE_SUEZ'}), (p_mer:Location {id: 'PORT_MERSIN'})
MERGE (c_suez)-[r1:MARITIME_ROUTE {route_code: 'SEA-SUEZ-MER'}]->(p_mer)
SET r1.distance_km = 820, r1.time_hours = 25.0, r1.cost_usd = 1800, r1.status = 'OPEN', r1.risk_level = 0.04, r1.mode = 'MARITIME'
MERGE (p_mer)-[r2:MARITIME_ROUTE {route_code: 'SEA-MER-SUEZ'}]->(c_suez)
SET r2.distance_km = 820, r2.time_hours = 25.0, r2.cost_usd = 1800, r2.status = 'OPEN', r2.risk_level = 0.04, r2.mode = 'MARITIME';

// --- Strategic Multi-Modal Land Bridges (Scenario 1 & 3) ---
// Arabian Peninsula Land Bridge: Port Dammam <-> Riyadh Dry Port <-> Port Jeddah
MATCH (p_dam:Location {id: 'PORT_DAMMAM'}), (h_ruh:Location {id: 'HUB_RIYADH'})
MERGE (p_dam)-[r1:LAND_BRIDGE {route_code: 'LAND-DAM-RUH'}]->(h_ruh)
SET r1.distance_km = 410, r1.time_hours = 4.5, r1.cost_usd = 650, r1.status = 'OPEN', r1.risk_level = 0.01, r1.mode = 'LAND'
MERGE (h_ruh)-[r2:LAND_BRIDGE {route_code: 'LAND-RUH-DAM'}]->(p_dam)
SET r2.distance_km = 410, r2.time_hours = 4.5, r2.cost_usd = 650, r2.status = 'OPEN', r2.risk_level = 0.01, r2.mode = 'LAND';

MATCH (h_ruh:Location {id: 'HUB_RIYADH'}), (p_jed:Location {id: 'PORT_JEDDAH'})
MERGE (h_ruh)-[r1:LAND_BRIDGE {route_code: 'LAND-RUH-JED'}]->(p_jed)
SET r1.distance_km = 950, r1.time_hours = 10.0, r1.cost_usd = 1200, r1.status = 'OPEN', r1.risk_level = 0.01, r1.mode = 'LAND'
MERGE (p_jed)-[r2:LAND_BRIDGE {route_code: 'LAND-JED-RUH'}]->(h_ruh)
SET r2.distance_km = 950, r2.time_hours = 10.0, r2.cost_usd = 1200, r2.status = 'OPEN', r2.risk_level = 0.01, r2.mode = 'LAND';

// UAE Land Bridge to Saudi: Port Jebel Ali <-> Riyadh
MATCH (p_dxb:Location {id: 'PORT_JEBEL_ALI'}), (h_ruh:Location {id: 'HUB_RIYADH'})
MERGE (p_dxb)-[r1:LAND_BRIDGE {route_code: 'LAND-DXB-RUH'}]->(h_ruh)
SET r1.distance_km = 880, r1.time_hours = 9.5, r1.cost_usd = 1100, r1.status = 'OPEN', r1.risk_level = 0.02, r1.mode = 'LAND'
MERGE (h_ruh)-[r2:LAND_BRIDGE {route_code: 'LAND-RUH-DXB'}]->(p_dxb)
SET r2.distance_km = 880, r2.time_hours = 9.5, r2.cost_usd = 1100, r2.status = 'OPEN', r2.risk_level = 0.02, r2.mode = 'LAND';

// Turkish Lifeline Bridge (Scenario 3): Port Mersin -> Gaziantep -> Zakho (Border) -> Baghdad -> Riyadh
MATCH (p_mer:Location {id: 'PORT_MERSIN'}), (h_gaz:Location {id: 'HUB_GAZIANTEP'})
MERGE (p_mer)-[r1:LAND_BRIDGE {route_code: 'LAND-MER-GAZ'}]->(h_gaz)
SET r1.distance_km = 295, r1.time_hours = 3.5, r1.cost_usd = 450, r1.status = 'OPEN', r1.risk_level = 0.02, r1.mode = 'LAND'
MERGE (h_gaz)-[r2:LAND_BRIDGE {route_code: 'LAND-GAZ-MER'}]->(p_mer)
SET r2.distance_km = 295, r2.time_hours = 3.5, r2.cost_usd = 450, r2.status = 'OPEN', r2.risk_level = 0.02, r2.mode = 'LAND';

MATCH (h_gaz:Location {id: 'HUB_GAZIANTEP'}), (h_zak:Location {id: 'HUB_ZAKHO'})
MERGE (h_gaz)-[r1:LAND_BRIDGE {route_code: 'LAND-GAZ-ZAK'}]->(h_zak)
SET r1.distance_km = 490, r1.time_hours = 6.0, r1.cost_usd = 750, r1.status = 'OPEN', r1.risk_level = 0.08, r1.mode = 'LAND'
MERGE (h_zak)-[r2:LAND_BRIDGE {route_code: 'LAND-ZAK-GAZ'}]->(h_gaz)
SET r2.distance_km = 490, r2.time_hours = 6.0, r2.cost_usd = 750, r2.status = 'OPEN', r2.risk_level = 0.08, r2.mode = 'LAND';

MATCH (h_zak:Location {id: 'HUB_ZAKHO'}), (a_bgw:Location {id: 'AIRPORT_BGW'})
MERGE (h_zak)-[r1:LAND_BRIDGE {route_code: 'LAND-ZAK-BGW'}]->(a_bgw)
SET r1.distance_km = 530, r1.time_hours = 6.5, r1.cost_usd = 800, r1.status = 'OPEN', r1.risk_level = 0.10, r1.mode = 'LAND'
MERGE (a_bgw)-[r2:LAND_BRIDGE {route_code: 'LAND-BGW-ZAK'}]->(h_zak)
SET r2.distance_km = 530, r2.time_hours = 6.5, r2.cost_usd = 800, r2.status = 'OPEN', r2.risk_level = 0.10, r2.mode = 'LAND';

MATCH (a_bgw:Location {id: 'AIRPORT_BGW'}), (h_ruh:Location {id: 'HUB_RIYADH'})
MERGE (a_bgw)-[r1:LAND_BRIDGE {route_code: 'LAND-BGW-RUH'}]->(h_ruh)
SET r1.distance_km = 990, r1.time_hours = 11.5, r1.cost_usd = 1350, r1.status = 'OPEN', r1.risk_level = 0.06, r1.mode = 'LAND'
MERGE (h_ruh)-[r2:LAND_BRIDGE {route_code: 'LAND-RUH-BGW'}]->(a_bgw)
SET r2.distance_km = 990, r2.time_hours = 11.5, r2.cost_usd = 1350, r2.status = 'OPEN', r2.risk_level = 0.06, r2.mode = 'LAND';

// --- Flight Corridors (Scenario 2: Iran / Syria airspace & divert corridors) ---
// Dubai <-> Tehran (Crosses Iranian Airspace)
MATCH (a_dxb:Location {id: 'AIRPORT_DXB'}), (a_ika:Location {id: 'AIRPORT_IKA'})
MERGE (a_dxb)-[r1:FLIGHT_CORRIDOR {route_code: 'AIR-DXB-IKA'}]->(a_ika)
SET r1.distance_km = 1200, r1.time_hours = 2.1, r1.cost_usd = 4200, r1.status = 'OPEN', r1.risk_level = 0.05, r1.mode = 'AIR'
MERGE (a_ika)-[r2:FLIGHT_CORRIDOR {route_code: 'AIR-IKA-DXB'}]->(a_dxb)
SET r2.distance_km = 1200, r2.time_hours = 2.1, r2.cost_usd = 4200, r2.status = 'OPEN', r2.risk_level = 0.05, r2.mode = 'AIR';

// Tehran <-> Istanbul (Crosses Northwest Iran & Eastern Turkey)
MATCH (a_ika:Location {id: 'AIRPORT_IKA'}), (a_ist:Location {id: 'AIRPORT_IST'})
MERGE (a_ika)-[r1:FLIGHT_CORRIDOR {route_code: 'AIR-IKA-IST'}]->(a_ist)
SET r1.distance_km = 2050, r1.time_hours = 3.2, r1.cost_usd = 6800, r1.status = 'OPEN', r1.risk_level = 0.06, r1.mode = 'AIR'
MERGE (a_ist)-[r2:FLIGHT_CORRIDOR {route_code: 'AIR-IST-IKA'}]->(a_ika)
SET r2.distance_km = 2050, r2.time_hours = 3.2, r2.cost_usd = 6800, r2.status = 'OPEN', r2.risk_level = 0.06, r2.mode = 'AIR';

// Damascus Corridor (Crosses Syrian Airspace)
MATCH (a_ruh:Location {id: 'AIRPORT_RUH'}), (a_dam:Location {id: 'AIRPORT_DAM'})
MERGE (a_ruh)-[r1:FLIGHT_CORRIDOR {route_code: 'AIR-RUH-DAM'}]->(a_dam)
SET r1.distance_km = 1420, r1.time_hours = 2.4, r1.cost_usd = 4900, r1.status = 'OPEN', r1.risk_level = 0.20, r1.mode = 'AIR'
MERGE (a_dam)-[r2:FLIGHT_CORRIDOR {route_code: 'AIR-DAM-RUH'}]->(a_ruh)
SET r2.distance_km = 1420, r2.time_hours = 2.4, r2.cost_usd = 4900, r2.status = 'OPEN', r2.risk_level = 0.20, r2.mode = 'AIR';

MATCH (a_dam:Location {id: 'AIRPORT_DAM'}), (a_ist:Location {id: 'AIRPORT_IST'})
MERGE (a_dam)-[r1:FLIGHT_CORRIDOR {route_code: 'AIR-DAM-IST'}]->(a_ist)
SET r1.distance_km = 1060, r1.time_hours = 1.9, r1.cost_usd = 3800, r1.status = 'OPEN', r1.risk_level = 0.22, r1.mode = 'AIR'
MERGE (a_ist)-[r2:FLIGHT_CORRIDOR {route_code: 'AIR-IST-DAM'}]->(a_dam)
SET r2.distance_km = 1060, r2.time_hours = 1.9, r2.cost_usd = 3800, r2.status = 'OPEN', r2.risk_level = 0.22, r2.mode = 'AIR';

// Safe Diversion Air Corridors (Bypass through Amman AMM & Baghdad BGW)
MATCH (a_dxb:Location {id: 'AIRPORT_DXB'}), (a_bgw:Location {id: 'AIRPORT_BGW'})
MERGE (a_dxb)-[r1:FLIGHT_CORRIDOR {route_code: 'AIR-DXB-BGW'}]->(a_bgw)
SET r1.distance_km = 1400, r1.time_hours = 2.3, r1.cost_usd = 4600, r1.status = 'OPEN', r1.risk_level = 0.05, r1.mode = 'AIR'
MERGE (a_bgw)-[r2:FLIGHT_CORRIDOR {route_code: 'AIR-BGW-DXB'}]->(a_dxb)
SET r2.distance_km = 1400, r2.time_hours = 2.3, r2.cost_usd = 4600, r2.status = 'OPEN', r2.risk_level = 0.05, r2.mode = 'AIR';

MATCH (a_bgw:Location {id: 'AIRPORT_BGW'}), (a_amm:Location {id: 'AIRPORT_AMM'})
MERGE (a_bgw)-[r1:FLIGHT_CORRIDOR {route_code: 'AIR-BGW-AMM'}]->(a_amm)
SET r1.distance_km = 800, r1.time_hours = 1.4, r1.cost_usd = 2900, r1.status = 'OPEN', r1.risk_level = 0.03, r1.mode = 'AIR'
MERGE (a_amm)-[r2:FLIGHT_CORRIDOR {route_code: 'AIR-AMM-BGW'}]->(a_bgw)
SET r2.distance_km = 800, r2.time_hours = 1.4, r2.cost_usd = 2900, r2.status = 'OPEN', r2.risk_level = 0.03, r2.mode = 'AIR';

MATCH (a_amm:Location {id: 'AIRPORT_AMM'}), (a_ist:Location {id: 'AIRPORT_IST'})
MERGE (a_amm)-[r1:FLIGHT_CORRIDOR {route_code: 'AIR-AMM-IST'}]->(a_ist)
SET r1.distance_km = 1240, r1.time_hours = 2.1, r1.cost_usd = 4300, r1.status = 'OPEN', r1.risk_level = 0.02, r1.mode = 'AIR'
MERGE (a_ist)-[r2:FLIGHT_CORRIDOR {route_code: 'AIR-IST-AMM'}]->(a_amm)
SET r2.distance_km = 1240, r2.time_hours = 2.1, r2.cost_usd = 4300, r2.status = 'OPEN', r2.risk_level = 0.02, r2.mode = 'AIR';

MATCH (a_ru:Location {id: 'AIRPORT_RUH'}), (a_amm:Location {id: 'AIRPORT_AMM'})
MERGE (a_ru)-[r1:FLIGHT_CORRIDOR {route_code: 'AIR-RUH-AMM'}]->(a_amm)
SET r1.distance_km = 1280, r1.time_hours = 2.2, r1.cost_usd = 4400, r1.status = 'OPEN', r1.risk_level = 0.02, r1.mode = 'AIR'
MERGE (a_amm)-[r2:FLIGHT_CORRIDOR {route_code: 'AIR-AMM-RUH'}]->(a_ru)
SET r2.distance_km = 1280, r2.time_hours = 2.2, r2.cost_usd = 4400, r2.status = 'OPEN', r2.risk_level = 0.02, r2.mode = 'AIR';

// --- Intermodal Transfer Edges (Connecting Ports/Airports/Hubs in Same Vicinity) ---
// Dammam Port <-> Riyadh Hub Transfer Link (handling & transshipment node)
MATCH (p_dam:Location {id: 'PORT_DAMMAM'}), (p_dxb:Location {id: 'PORT_JEBEL_ALI'}), (a_dxb:Location {id: 'AIRPORT_DXB'})
MERGE (p_dxb)-[t1:INTERMODAL_TRANSFER {transfer_id: 'TRF-DXB-SEA-AIR'}]->(a_dxb)
SET t1.time_hours = 2.0, t1.cost_usd = 250, t1.status = 'OPEN', t1.mode = 'TRANSFER'
MERGE (a_dxb)-[t2:INTERMODAL_TRANSFER {transfer_id: 'TRF-DXB-AIR-SEA'}]->(p_dxb)
SET t2.time_hours = 2.0, t2.cost_usd = 250, t2.status = 'OPEN', t2.mode = 'TRANSFER';

MATCH (p_jed:Location {id: 'PORT_JEDDAH'}), (h_ruh:Location {id: 'HUB_RIYADH'}), (a_ruh:Location {id: 'AIRPORT_RUH'})
MERGE (h_ruh)-[t1:INTERMODAL_TRANSFER {transfer_id: 'TRF-RUH-LAND-AIR'}]->(a_ruh)
SET t1.time_hours = 1.5, t1.cost_usd = 180, t1.status = 'OPEN', t1.mode = 'TRANSFER'
MERGE (a_ruh)-[t2:INTERMODAL_TRANSFER {transfer_id: 'TRF-RUH-AIR-LAND'}]->(h_ruh)
SET t2.time_hours = 1.5, t2.cost_usd = 180, t2.status = 'OPEN', t2.mode = 'TRANSFER';
