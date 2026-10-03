import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import ControlPanel from './components/ControlPanel';
import MapDeckView from './components/MapDeckView';
import EmergencyModal from './components/EmergencyModal';
import DecisionDeck from './components/DecisionDeck';
import EnergyIntelligenceDeck from './components/EnergyIntelligenceDeck';
import TelemetryDossier from './components/TelemetryDossier';
import LiveRadarScope from './components/LiveRadarScope';

const API_BASE = 'http://localhost:8000/api';

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [systemStatus, setSystemStatus] = useState({ neo4j: true, totalNodes: 0, totalEdges: 0 });
  
  // Tactical Radar Scope state (open by default for immediate HUD view)
  const [radarScopeOpen, setRadarScopeOpen] = useState(true);

  // Domain Filter: 'ALL' | 'MARITIME' | 'AIR' | 'DEFENSE' | 'LAND' | 'ENERGY'
  const [domainFilter, setDomainFilter] = useState('ALL');

  // Flight Type Filter: 'ALL' | 'DANGER' | 'COMMERCIAL' | 'CARGO' | 'MILITARY'
  const [flightTypeFilter, setFlightTypeFilter] = useState('ALL');

  const handleSetDomainFilter = (newDomain) => {
    setDomainFilter(newDomain);
    if (newDomain === 'DEFENSE') {
      setFlightTypeFilter('MILITARY');
    } else if (newDomain === 'AIR' && flightTypeFilter === 'MILITARY') {
      setFlightTypeFilter('ALL');
    }
  };
  const [origin, setOrigin] = useState('PORT_SALALAH');
  const [destination, setDestination] = useState('PORT_DAMMAM');
  const [priority, setPriority] = useState('balanced');
  
  const [routeResult, setRouteResult] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);
  
  const [activeDangerZones, setActiveDangerZones] = useState([]);
  const [militaryThreats, setMilitaryThreats] = useState([]);
  const [routesAnalysis, setRoutesAnalysis] = useState([]);
  
  // Live Feeds
  const [liveFlights, setLiveFlights] = useState([]);
  const [liveVessels, setLiveVessels] = useState([]);
  const [energyFacilities, setEnergyFacilities] = useState([]);

  // Modals & Panels
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [decisionDeckOpen, setDecisionDeckOpen] = useState(false);
  const [energyDeckOpen, setEnergyDeckOpen] = useState(false);
  const [intelligenceData, setIntelligenceData] = useState(null);

  // Selected Entity for Telemetry Dossier & Map Highlighting
  const [selectedEntity, setSelectedEntity] = useState(null); // { type: 'VESSEL'|'FLIGHT'|'ROUTE', data: ... }
  const [selectedTrackedPath, setSelectedTrackedPath] = useState(null);
  const [struckFacility, setStruckFacility] = useState(null);

  const [diversionResult, setDiversionResult] = useState(null);
  const [isCalculatingDiversion, setIsCalculatingDiversion] = useState(false);

  // Fetch full digital twin graph on mount
  const fetchNetwork = async () => {
    try {
      const res = await fetch(`${API_BASE}/network`);
      if (res.ok) {
        const data = await res.json();
        setNodes(data.nodes);
        setEdges(data.edges);
        setSystemStatus({
          neo4j: true,
          totalNodes: data.total_nodes,
          totalEdges: data.total_edges
        });
      }
    } catch (err) {
      console.warn('Backend API connection warning, using baseline nodes:', err);
    }
  };

  const fetchActiveHazards = async () => {
    try {
      const res = await fetch(`${API_BASE}/hazards/active`);
      if (res.ok) {
        const data = await res.json();
        setActiveDangerZones(data);
      }
    } catch (err) {
      console.warn('Error fetching hazards:', err);
    }
  };

  const fetchLiveFlights = async () => {
    try {
      const res = await fetch(`${API_BASE}/flights/live`);
      if (res.ok) {
        const data = await res.json();
        setLiveFlights(data.flights || []);
      }
    } catch (err) {
      console.warn('Error fetching live OpenSky flights:', err);
    }
  };

  const fetchLiveVessels = async () => {
    try {
      const res = await fetch(`${API_BASE}/vessels/live`);
      if (res.ok) {
        const data = await res.json();
        setLiveVessels(data.vessels || []);
      }
    } catch (err) {
      console.warn('Error fetching live vessels:', err);
    }
  };

  const fetchEnergyFacilities = async () => {
    try {
      const res = await fetch(`${API_BASE}/energy/facilities`);
      if (res.ok) {
        const data = await res.json();
        setEnergyFacilities(data.facilities || []);
      }
    } catch (err) {
      console.warn('Error fetching energy facilities:', err);
    }
  };

  const fetchRoutesAnalysis = async () => {
    try {
      const res = await fetch(`${API_BASE}/routes/analysis`);
      if (res.ok) {
        const data = await res.json();
        setRoutesAnalysis(data.routes || []);
      }
    } catch (err) {
      console.warn('Error fetching routes analysis:', err);
    }
  };

  const fetchMilitaryThreats = async () => {
    try {
      const res = await fetch(`${API_BASE}/military/threats`);
      if (res.ok) {
        const data = await res.json();
        setMilitaryThreats(data.threats || []);
      }
    } catch (err) {
      console.warn('Error fetching military threats:', err);
    }
  };

  const fetchDecisionIntelligence = async () => {
    try {
      const res = await fetch(`${API_BASE}/intelligence/evaluate`);
      if (res.ok) {
        const data = await res.json();
        setIntelligenceData(data);
      }
    } catch (err) {
      console.warn('Error fetching decision intelligence:', err);
    }
  };

  useEffect(() => {
    fetchNetwork();
    fetchActiveHazards();
    fetchLiveFlights();
    fetchLiveVessels();
    fetchEnergyFacilities();
    fetchRoutesAnalysis();
    fetchMilitaryThreats();
    fetchDecisionIntelligence();

    // Auto refresh live radar telemetry every 2.5 seconds for fluid tracking motion
    const interval = setInterval(() => {
      fetchLiveFlights();
      fetchLiveVessels();
      fetchRoutesAnalysis();
      fetchMilitaryThreats();
      fetchDecisionIntelligence();
    }, 2500);

    return () => clearInterval(interval);
  }, []);


  // Handle entity selection (ship, plane, route) and draw route on map
  const handleSelectEntity = (entity) => {
    // If clicking the already selected flight or vessel, TOGGLE OFF (deselect) to show all routes again!
    if (
      selectedEntity &&
      entity &&
      selectedEntity.type === entity.type &&
      (
        (entity.type === 'FLIGHT' && selectedEntity.data?.callsign === entity.data?.callsign) ||
        (entity.type === 'VESSEL' && selectedEntity.data?.mmsi === entity.data?.mmsi) ||
        (entity.type === 'ROUTE' && selectedEntity.data?.route_code === entity.data?.route_code)
      )
    ) {
      setSelectedEntity(null);
      setSelectedTrackedPath(null);
      return;
    }

    setSelectedEntity(entity);
    if (!entity) {
      setSelectedTrackedPath(null);
      return;
    }

    if (entity.type === 'VESSEL') {
      const v = entity.data;
      const targetCoords = v.in_danger && v.emergency_berth_coords ? v.emergency_berth_coords : v.destination_coords;
      if (targetCoords) {
        setSelectedTrackedPath({
          path: [[v.lon, v.lat], targetCoords],
          inDanger: v.in_danger,
          title: v.name
        });
      }
    } else if (entity.type === 'FLIGHT') {
      const f = entity.data;
      if (f.in_danger && f.safe_haven?.vector_coordinates) {
        setSelectedTrackedPath({
          path: f.safe_haven.vector_coordinates,
          inDanger: true,
          title: `${f.callsign} [تحويل طوارئ لمطار ${f.safe_haven.iata}]`,
          data: f
        });
      } else if (f.flight_path && f.flight_path.length >= 2) {
        setSelectedTrackedPath({
          path: f.flight_path,
          inDanger: false,
          title: `${f.callsign} (${f.origin_icao || ''} ➔ ${f.dest_icao || ''})`,
          data: f
        });
      } else {
        // Project forward track vector based on heading
        const rad = (f.heading_deg * Math.PI) / 180.0;
        const projectedLon = f.lon + Math.sin(rad) * 2.0;
        const projectedLat = f.lat + Math.cos(rad) * 2.0;
        setSelectedTrackedPath({
          path: [[f.lon, f.lat], [projectedLon, projectedLat]],
          inDanger: false,
          title: f.callsign,
          data: f
        });
      }
    } else if (entity.type === 'ROUTE') {
      const r = entity.data;
      if (r.coordinates) {
        setSelectedTrackedPath({
          path: r.coordinates,
          inDanger: r.status === 'CLOSED' || r.risk_percentage > 40,
          title: r.route_code
        });
      }
    }
  };

  // Calculate Optimal Route
  const handleCalculateRoute = async () => {
    setIsLoadingRoute(true);
    try {
      const res = await fetch(`${API_BASE}/route/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin_id: origin,
          destination_id: destination,
          priority: priority,
          allowed_modes: ['MARITIME', 'LAND', 'AIR', 'TRANSFER']
        })
      });
      if (res.ok) {
        const data = await res.json();
        setRouteResult(data);
        await fetchDecisionIntelligence();
        await fetchRoutesAnalysis();
      }
    } catch (err) {
      console.error('Failed to calculate route:', err);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Simulate Geopolitical Scenarios
  const handleSimulateScenario = async (scenarioId) => {
    try {
      setActiveScenario(scenarioId);
      const res = await fetch(`${API_BASE}/scenario/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: scenarioId })
      });
      if (res.ok) {
        await fetchNetwork();
        await fetchActiveHazards();
        await fetchLiveFlights();
        await fetchLiveVessels();
        await fetchRoutesAnalysis();
        await fetchMilitaryThreats();
        await fetchDecisionIntelligence();

        if (scenarioId === 'scenario_1_maritime_closure') {
          setDomainFilter('MARITIME');
          setOrigin('PORT_SALALAH');
          setDestination('PORT_DAMMAM');
        } else if (scenarioId === 'scenario_2_airspace_hazard') {
          setDomainFilter('AIR');
          setOrigin('AIRPORT_DXB');
          setDestination('AIRPORT_IST');
          setEmergencyModalOpen(true);
        } else if (scenarioId === 'scenario_3_turkish_lifeline') {
          setDomainFilter('LAND');
          setOrigin('PORT_MERSIN');
          setDestination('HUB_RIYADH');
        }

        setTimeout(() => handleCalculateRoute(), 200);
      }
    } catch (err) {
      console.error('Failed to trigger scenario:', err);
    }
  };

  // Handle strike simulation from Energy Intelligence Deck
  const handleSimulateStrikeOnMap = (strikeData) => {
    setStruckFacility(strikeData);
    setDomainFilter('ENERGY');
    // Also track the strike zone
    setSelectedTrackedPath({
      path: [[strikeData.lon, strikeData.lat], [strikeData.lon + 0.8, strikeData.lat + 0.8]],
      inDanger: true,
      title: strikeData.facility_name_ar
    });
  };

  // Execute In-Flight Emergency Diversion (Scenario 2)
  const handleExecuteDiversion = async (requestData) => {
    setIsCalculatingDiversion(true);
    try {
      const res = await fetch(`${API_BASE}/flight/emergency-divert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      if (res.ok) {
        const data = await res.json();
        setDiversionResult(data);
        await fetchDecisionIntelligence();
      }
    } catch (err) {
      console.error('Failed to compute emergency diversion:', err);
    } finally {
      setIsCalculatingDiversion(false);
    }
  };

  // Reset entire twin network
  const handleResetNetwork = async () => {
    try {
      await fetch(`${API_BASE}/network/reset`, { method: 'POST' });
      setActiveScenario(null);
      setRouteResult(null);
      setDiversionResult(null);
      setStruckFacility(null);
      setSelectedEntity(null);
      setSelectedTrackedPath(null);
      setDomainFilter('ALL');
      await fetchNetwork();
      await fetchActiveHazards();
      await fetchLiveFlights();
      await fetchLiveVessels();
      await fetchRoutesAnalysis();
      await fetchMilitaryThreats();
      await fetchDecisionIntelligence();
    } catch (err) {
      console.error('Error resetting network:', err);
    }
  };

  const handleNodeClick = (node) => {
    if (!origin || (origin && destination)) {
      setOrigin(node.id);
      setDestination('');
    } else {
      setDestination(node.id);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        systemStatus={systemStatus}
        activeDangerCount={activeDangerZones.length}
        liveFlightsCount={liveFlights.length}
        liveVesselsCount={liveVessels.length}
        onReset={handleResetNetwork}
        onToggleRadar={() => setRadarScopeOpen(!radarScopeOpen)}
        radarOpen={radarScopeOpen}
      />

      <div style={{ position: 'relative', flex: 1, width: '100%', overflow: 'hidden' }}>
        <ControlPanel
          nodes={nodes}
          edges={edges}
          routesAnalysis={routesAnalysis}
          origin={origin}
          setOrigin={setOrigin}
          destination={destination}
          setDestination={setDestination}
          priority={priority}
          setPriority={setPriority}
          onCalculateRoute={handleCalculateRoute}
          routeResult={routeResult}
          isLoadingRoute={isLoadingRoute}
          onSimulateScenario={handleSimulateScenario}
          onOpenEmergencyModal={() => setEmergencyModalOpen(true)}
          onOpenDecisionDeck={() => setDecisionDeckOpen(true)}
          onOpenEnergyDeck={() => setEnergyDeckOpen(true)}
          activeScenario={activeScenario}
          domainFilter={domainFilter}
          setDomainFilter={handleSetDomainFilter}
          flightTypeFilter={flightTypeFilter}
          setFlightTypeFilter={setFlightTypeFilter}
          liveFlights={liveFlights}
          liveVessels={liveVessels}
          energyFacilities={energyFacilities}
          militaryThreats={militaryThreats}
          onSelectEntity={handleSelectEntity}
          selectedEntity={selectedEntity}
        />

        <MapDeckView
          nodes={nodes}
          edges={edges}
          optimalRoute={routeResult}
          activeDangerZones={activeDangerZones}
          emergencyDiversion={diversionResult}
          liveFlights={liveFlights}
          liveVessels={liveVessels}
          energyFacilities={energyFacilities}
          struckFacility={struckFacility}
          domainFilter={domainFilter}
          flightTypeFilter={flightTypeFilter}
          setFlightTypeFilter={setFlightTypeFilter}
          selectedTrackedPath={selectedTrackedPath}
          selectedEntity={selectedEntity}
          onNodeClick={handleNodeClick}
          onFlightClick={(flight) => handleSelectEntity(flight ? { type: 'FLIGHT', data: flight } : null)}
          onVesselClick={(vessel) => handleSelectEntity(vessel ? { type: 'VESSEL', data: vessel } : null)}
          onEnergyFacilityClick={(facility) => {
            setStruckFacility(facility);
            setEnergyDeckOpen(true);
          }}
          onRouteClick={(route) => handleSelectEntity(route ? { type: 'ROUTE', data: route } : null)}
        />

        {/* Selected Entity Dossier (Ship / Plane / Route details) */}
        {selectedEntity && (
          <TelemetryDossier
            selectedEntity={selectedEntity}
            onClose={() => {
              setSelectedEntity(null);
              setSelectedTrackedPath(null);
            }}
            onTrackEntity={() => {
              if (selectedTrackedPath) {
                setSelectedTrackedPath(null);
              } else {
                handleSelectEntity(selectedEntity);
              }
            }}
            isTracked={!!selectedTrackedPath}
          />
        )}

        {/* Live 360-Degree Tactical Military Radar HUD Scope */}
        <LiveRadarScope
          isOpen={radarScopeOpen}
          onClose={() => setRadarScopeOpen(false)}
          liveFlights={liveFlights}
          liveVessels={liveVessels}
          onSelectEntity={handleSelectEntity}
          selectedEntity={selectedEntity}
        />
      </div>

      {/* Emergency Air Diversion Modal */}
      <EmergencyModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
        onExecuteDiversion={handleExecuteDiversion}
        diversionResult={diversionResult}
        isCalculating={isCalculatingDiversion}
      />

      {/* Geopolitical Decision Intelligence Deck */}
      <DecisionDeck
        isOpen={decisionDeckOpen}
        onClose={() => setDecisionDeckOpen(false)}
        intelligenceData={intelligenceData}
        onTriggerScenario={handleSimulateScenario}
      />

      {/* Dedicated Energy & Infrastructure Kernel Deck */}
      <EnergyIntelligenceDeck
        isOpen={energyDeckOpen}
        onClose={() => setEnergyDeckOpen(false)}
        onSimulateStrikeOnMap={handleSimulateStrikeOnMap}
        selectedFacilityId={struckFacility?.id || struckFacility?.facility_id}
      />
    </div>
  );
}

