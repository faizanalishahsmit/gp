import { useCallback, useEffect, useRef, useState } from 'react';
import { CameraPresetMode, RuinedCityCanvas } from './components/RuinedCityCanvas';
import { TouchControlsHUD } from './components/TouchControlsHUD';
import { ArchitecturalCodexModal } from './components/ArchitecturalCodexModal';
import { SectorMinimap } from './components/SectorMinimap';
import { LEVEL1_BUILDINGS } from './data/level1Data';
import { PlayerTelemetry, VirtualInputState } from './types/world';
import {
  BookOpen,
  Building2,
  Camera,
  CheckCircle2,
  Compass,
  Gamepad2,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export function App() {
  const virtualInputRef = useRef<VirtualInputState>({
    moveX: 0,
    moveY: 0,
    isRunning: true,
    jumpRequested: false,
    interactRequested: false,
    lookDeltaX: 0,
    lookDeltaY: 0
  });

  const [cameraPreset, setCameraPreset] = useState<CameraPresetMode>('STANDARD');
  const [teleportTarget, setTeleportTarget] = useState<{ id: string; timestamp: number } | null>(
    null
  );
  const [isCodexOpen, setIsCodexOpen] = useState<boolean>(false);
  const [showTouchHUD, setShowTouchHUD] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 860;
    }
    return false;
  });
  const [isPointerLocked, setIsPointerLocked] = useState<boolean>(false);
  const [gateCompleted, setGateCompleted] = useState<boolean>(false);
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);

  const [telemetry, setTelemetry] = useState<PlayerTelemetry>({
    x: 0,
    y: 0,
    z: 96,
    speed: 0,
    headingDeg: 0,
    state: 'IDLE',
    isGrounded: true,
    nearestLandmark: LEVEL1_BUILDINGS[0],
    distanceToExitGate: 214,
    canActivateExitGate: false,
    discoveredLandmarks: ['entrance-arch'],
    fps: 60
  });

  const handleActivateExitGate = useCallback(() => {
    setGateCompleted(true);
    setShowCompletionModal(true);
    if (document.pointerLockElement) {
      document.exitPointerLock?.();
    }
  }, []);

  const handleTeleportToLandmark = useCallback((landmarkId: string) => {
    setTeleportTarget({ id: landmarkId, timestamp: performance.now() });
  }, []);

  // Keyboard shortcuts for Camera Angle cycle (V) and Architectural Codex (C)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyV') {
        setCameraPreset((prev) => {
          const order: CameraPresetMode[] = [
            'STANDARD',
            'CLOSE_SHOULDER',
            'WIDE_VISTA',
            'HIGH_SURVEY'
          ];
          return order[(order.indexOf(prev) + 1) % order.length];
        });
      } else if (e.code === 'KeyC') {
        setIsCodexOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* FULL-VIEWPORT 3D ANIME RUINED CITY CANVAS */}
      <RuinedCityCanvas
        virtualInputRef={virtualInputRef}
        cameraPreset={cameraPreset}
        teleportTarget={teleportTarget}
        gateCompleted={gateCompleted}
        onTelemetryUpdate={setTelemetry}
        onActivateExitGate={handleActivateExitGate}
        onPointerLockChange={setIsPointerLocked}
      />

      {/* TOP-LEFT BRANDING & LEVEL 1 STATUS BAR */}
      <div className="pointer-events-none fixed top-4 left-4 z-30 flex flex-col gap-2 max-w-md">
        <div className="hud-panel hud-clip pointer-events-auto px-4 py-2.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-[11px] font-mono-tech uppercase tracking-widest text-amber-300">
                PYQUEST REBIRTH // LEVEL 1
              </span>
            </div>
            <span className="text-[11px] font-mono-tech text-emerald-300">
              {telemetry.fps} FPS · {telemetry.state}
            </span>
          </div>

          <h1 className="font-display text-lg sm:text-xl font-bold uppercase tracking-wider text-amber-50 mt-0.5">
            Kyoraku Sector 01 — Ruined City Entrance
          </h1>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono-tech text-slate-300">
            <span>
              SURVEYED:{' '}
              <strong className="text-amber-300">
                {telemetry.discoveredLandmarks.length}/{LEVEL1_BUILDINGS.length}
              </strong>{' '}
              LANDMARKS
            </span>
            <span>·</span>
            <span>
              EXIT GATE:{' '}
              <strong className="text-cyan-300">{telemetry.distanceToExitGate}m NORTH</strong>
            </span>
          </div>
        </div>

        {/* Dynamic Nearest Building / Architectural Detail Readout */}
        {telemetry.nearestLandmark && (
          <div className="hud-panel pointer-events-auto rounded px-3.5 py-2 border-l-2 border-l-amber-400">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono-tech uppercase tracking-widest text-amber-400">
                {telemetry.nearestLandmark.code} // {telemetry.nearestLandmark.category}
              </span>
              <span className="text-[10px] font-mono-tech text-slate-400">
                {telemetry.nearestLandmark.stories}F STRUCTURE
              </span>
            </div>
            <div className="font-display text-sm font-bold text-white">
              {telemetry.nearestLandmark.name}
            </div>
            <div className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-snug">
              {telemetry.nearestLandmark.architecturalNotes}
            </div>
          </div>
        )}
      </div>

      {/* TOP-CENTER ACTION TOOLBAR (CAMERA ANGLES, LANDMARK TOUR, CODEX & ANDROID HUD TOGGLE) */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 hidden lg:flex items-center gap-2">
        <div className="hud-panel rounded-full px-3 py-1.5 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const order: CameraPresetMode[] = [
                'STANDARD',
                'CLOSE_SHOULDER',
                'WIDE_VISTA',
                'HIGH_SURVEY'
              ];
              setCameraPreset(order[(order.indexOf(cameraPreset) + 1) % order.length]);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 hover:bg-amber-500 hover:text-slate-950 text-amber-200 text-xs font-mono-tech uppercase tracking-wider transition-colors"
            title="Cycle Third-Person Camera Framing (Shortcut: V)"
          >
            <Camera className="w-3.5 h-3.5" />
            Cam: {cameraPreset.replace('_', ' ')} [V]
          </button>

          <button
            type="button"
            onClick={() => setIsCodexOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-200 border border-amber-400/40 text-xs font-mono-tech uppercase tracking-wider transition-colors"
            title="Open AAA Visual Research & 12-Landmark Architectural Codex (Shortcut: C)"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Art & Architecture Codex [C]
          </button>

          <button
            type="button"
            onClick={() => setShowTouchHUD((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono-tech uppercase tracking-wider transition-colors ${
              showTouchHUD
                ? 'bg-cyan-400 text-slate-950 font-bold'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
            }`}
            title="Toggle Android / Mobile Virtual Joystick & Touch Buttons"
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            Android HUD: {showTouchHUD ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* TOP-RIGHT LIVE TACTICAL MINIMAP & MOBILE ACTION BUTTONS */}
      <div className="fixed top-4 right-4 z-30 flex flex-col items-end gap-2">
        <SectorMinimap
          telemetry={telemetry}
          onSelectLandmark={handleTeleportToLandmark}
        />

        <div className="flex lg:hidden items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsCodexOpen(true)}
            className="hud-panel px-2.5 py-1.5 rounded text-[11px] font-mono-tech uppercase text-amber-300 flex items-center gap-1"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Codex
          </button>
          <button
            type="button"
            onClick={() => setShowTouchHUD((p) => !p)}
            className="hud-panel px-2.5 py-1.5 rounded text-[11px] font-mono-tech uppercase text-cyan-300 flex items-center gap-1"
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            Touch
          </button>
        </div>
      </div>

      {/* CENTER-BOTTOM INTERACTIVE LEVEL 1 EXIT GATE PROMPT WHEN IN PROXIMITY */}
      {telemetry.canActivateExitGate && !showCompletionModal && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30">
          <button
            type="button"
            onClick={handleActivateExitGate}
            className="hud-panel-amber hud-clip animate-pulse-glow px-6 py-3.5 flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform"
          >
            <Sparkles className="w-5 h-5 text-cyan-300" />
            <div className="text-left">
              <div className="text-[10px] font-mono-tech uppercase tracking-widest text-cyan-300">
                ASTRAL RESONANCE SANCTUM THRESHOLD REACHED
              </div>
              <div className="font-display text-base sm:text-lg font-bold uppercase tracking-wider text-white">
                Press [E] or Click to Activate Level 1 Exit Gate
              </div>
            </div>
          </button>
        </div>
      )}

      {/* BOTTOM ARCHITECTURAL QUICK-INSPECTOR BAR & CONTROLS LEGEND */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-20 hidden md:flex flex-col items-center gap-1.5 max-w-4xl w-full px-4 pointer-events-none">
        {/* Quick Camera Jump Strip to Inspect Any of the Ruined City Landmarks */}
        <div className="hud-panel pointer-events-auto rounded-full px-3 py-1.5 flex items-center gap-1 overflow-x-auto max-w-full">
          <span className="text-[10px] font-mono-tech uppercase tracking-wider text-amber-300/90 px-2 flex items-center gap-1 shrink-0">
            <Building2 className="w-3 h-3" />
            Inspect Sector:
          </span>
          {[
            { id: 'entrance-arch', label: 'Gate-00 Entrance' },
            { id: 'b1-transit-terminal', label: 'B1 Terminal' },
            { id: 'b2-kurokawa-hab', label: 'B2 Hab-Block' },
            { id: 'b3-helion-annex', label: 'B3 Exposed Interior' },
            { id: 'b4-vermillion-arcade', label: 'B4 Arcade' },
            { id: 'overpass-viaduct', label: 'Collapsed Viaduct' },
            { id: 'b5-sentinel-spire', label: 'B5 Relay Spire' },
            { id: 'b6-civic-archives', label: 'B6 Archives' },
            { id: 'b8-meridian-tower', label: 'B8 Skyscraper' },
            { id: 'exit-gate', label: 'EXIT GATE (N)' }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTeleportToLandmark(item.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-mono-tech whitespace-nowrap transition-all ${
                telemetry.nearestLandmark?.id === item.id
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : item.id === 'exit-gate'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 hover:bg-cyan-400 hover:text-slate-950'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Desktop Controls Hint Bar */}
        <div className="hud-panel rounded-full px-4 py-1 text-[11px] font-mono-tech text-slate-300 flex items-center gap-4">
          <span>
            <strong className="text-amber-300">WASD</strong> Move
          </span>
          <span>
            <strong className="text-amber-300">SHIFT</strong> Run
          </span>
          <span>
            <strong className="text-amber-300">SPACE</strong> Jump
          </span>
          <span>
            <strong className="text-amber-300">
              {isPointerLocked ? 'MOUSE (LOCKED)' : 'DRAG MOUSE / DBL-CLICK LOCK'}
            </strong>{' '}
            Camera Orbit
          </span>
          <span>
            <strong className="text-amber-300">SCROLL</strong> Zoom
          </span>
          <span>
            <strong className="text-cyan-300">E</strong> Activate Exit Gate
          </span>
        </div>
      </div>

      {/* ANDROID / MOBILE VIRTUAL TOUCH CONTROLS */}
      {showTouchHUD && (
        <TouchControlsHUD
          virtualInputRef={virtualInputRef}
          canActivateExitGate={telemetry.canActivateExitGate}
          onActivateExitGate={handleActivateExitGate}
        />
      )}

      {/* AAA VISUAL RESEARCH & ARCHITECTURAL FIELD CODEX MODAL */}
      <ArchitecturalCodexModal
        isOpen={isCodexOpen}
        discoveredIds={telemetry.discoveredLandmarks}
        onClose={() => setIsCodexOpen(false)}
        onTeleportToBuilding={handleTeleportToLandmark}
      />

      {/* LEVEL 1 EXIT GATE COMPLETION MODAL */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="hud-panel-amber hud-clip max-w-xl w-full p-7 rounded-lg border border-cyan-300/40 text-center space-y-5">
            <div className="mx-auto w-14 h-14 rounded-full bg-cyan-400/20 border border-cyan-300 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-400/25">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <div className="text-xs font-mono-tech uppercase tracking-widest text-cyan-300">
                PYQUEST REBIRTH // ASTRAL RESONANCE SANCTUM SYNCHRONIZED
              </div>
              <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-white mt-1">
                Level 1 — Ruined City Entrance Complete
              </h2>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                Kaelen has traversed the ruined Kyoraku Outer Boulevard, surveyed the collapsed
                overpass and exposed interiors, and activated the Monumental Astral Exit Gate.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-slate-950/70 rounded-lg p-3.5 border border-white/10 font-mono-tech">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Landmarks Surveyed</div>
                <div className="text-lg font-bold text-amber-300">
                  {telemetry.discoveredLandmarks.length} / {LEVEL1_BUILDINGS.length}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Distinct Buildings</div>
                <div className="text-lg font-bold text-cyan-300">9 Structures</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Sector Status</div>
                <div className="text-lg font-bold text-emerald-400">CLEARED</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCompletionModal(false)}
                className="flex items-center gap-2 px-5 py-2.5 rounded bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-display font-bold uppercase tracking-wider text-sm transition-colors"
              >
                <Compass className="w-4 h-4" />
                Continue Free-Roam Exploration
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCompletionModal(false);
                  setGateCompleted(false);
                  handleTeleportToLandmark('entrance-arch');
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-200 border border-amber-400/35 font-display font-bold uppercase tracking-wider text-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Return to South Entrance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
