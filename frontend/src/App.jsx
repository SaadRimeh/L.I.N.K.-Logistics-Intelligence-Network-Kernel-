import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ControlPanel from './components/ControlPanel';
import MapDeckView from './components/MapDeckView';
import EmergencyModal from './components/EmergencyModal';

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

  useEffect(() => {
    fetchNetwork();
    fetchActiveHazards();
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
        // Refresh network to reflect newly closed routes
        await fetchNetwork();
        await fetchActiveHazards();

        // Adjust default origin/destination according to scenario
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

        // Auto recalculate route
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
          activeScenario={activeScenario}
        />

        <MapDeckView
          nodes={nodes}
          edges={edges}
          optimalRoute={routeResult}
          activeDangerZones={activeDangerZones}
          emergencyDiversion={diversionResult}
          onNodeClick={handleNodeClick}
        />
      </div>

      <EmergencyModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
        onExecuteDiversion={handleExecuteDiversion}
        diversionResult={diversionResult}
        isCalculating={isCalculatingDiversion}
      />
    </div>
  );
}
