import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import ControlPanel from './components/ControlPanel';
import MapDeckView from './components/MapDeckView';
import EmergencyModal from './components/EmergencyModal';
import DecisionDeck from './components/DecisionDeck';

const API_BASE = 'http://localhost:8000/api';

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [systemStatus, setSystemStatus] = useState({ neo4j: true, totalNodes: 0, totalEdges: 0 });
  
  const [origin, setOrigin] = useState('PORT_SALALAH');
  const [destination, setDestination] = useState('PORT_DAMMAM');
  const [priority, setPriority] = useState('balanced');
  
  const [routeResult, setRouteResult] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);
  
  const [activeDangerZones, setActiveDangerZones] = useState([]);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [decisionDeckOpen, setDecisionDeckOpen] = useState(false);
  const [intelligenceData, setIntelligenceData] = useState(null);
  
  const [diversionResult, setDiversionResult] = useState(null);
  const [isCalculatingDiversion, setIsCalculatingDiversion] = useState(false);

  // Live Flights State from OpenSky Network
  const [liveFlights, setLiveFlights] = useState([]);
  const [showLiveFlights, setShowLiveFlights] = useState(true);

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
    fetchDecisionIntelligence();

    // Auto refresh live flights every 12 seconds
    const interval = setInterval(() => {
      fetchLiveFlights();
      fetchDecisionIntelligence();
    }, 12000);

    return () => clearInterval(interval);
  }, []);

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
        await fetchDecisionIntelligence();

        if (scenarioId === 'scenario_1_maritime_closure') {
          setOrigin('PORT_SALALAH');
          setDestination('PORT_DAMMAM');
        } else if (scenarioId === 'scenario_2_airspace_hazard') {
          setOrigin('AIRPORT_DXB');
          setDestination('AIRPORT_IST');
          setEmergencyModalOpen(true);
        } else if (scenarioId === 'scenario_3_turkish_lifeline') {
          setOrigin('PORT_MERSIN');
          setDestination('HUB_RIYADH');
        }

        setTimeout(() => handleCalculateRoute(), 200);
      }
    } catch (err) {
      console.error('Failed to trigger scenario:', err);
    }
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
      await fetchNetwork();
      await fetchActiveHazards();
      await fetchLiveFlights();
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

  const handleFlightClick = (flightProps) => {
    if (flightProps.in_danger) {
      setEmergencyModalOpen(true);
    }
  };

  const dangerFlightsCount = liveFlights.filter(f => f.in_danger).length;

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        systemStatus={systemStatus}
        activeDangerCount={activeDangerZones.length}
        liveFlightsCount={liveFlights.length}
        onReset={handleResetNetwork}
      />

      <div style={{ position: 'relative', flex: 1, width: '100%', overflow: 'hidden' }}>
        <ControlPanel
          nodes={nodes}
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
          activeScenario={activeScenario}
          showLiveFlights={showLiveFlights}
          setShowLiveFlights={setShowLiveFlights}
          liveFlightsCount={liveFlights.length}
          dangerFlightsCount={dangerFlightsCount}
        />

        <MapDeckView
          nodes={nodes}
          edges={edges}
          optimalRoute={routeResult}
          activeDangerZones={activeDangerZones}
          emergencyDiversion={diversionResult}
          liveFlights={liveFlights}
          showLiveFlights={showLiveFlights}
          onNodeClick={handleNodeClick}
          onFlightClick={handleFlightClick}
        />
      </div>

      <EmergencyModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
        onExecuteDiversion={handleExecuteDiversion}
        diversionResult={diversionResult}
        isCalculating={isCalculatingDiversion}
      />

      <DecisionDeck
        isOpen={decisionDeckOpen}
        onClose={() => setDecisionDeckOpen(false)}
        intelligenceData={intelligenceData}
        onTriggerScenario={handleSimulateScenario}
      />
    </div>
  );
}
