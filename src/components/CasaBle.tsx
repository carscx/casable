/// <reference types="web-bluetooth" />
import { useRef, useState } from "react";
// No importamos "./casa-ble.css" porque los estilos están abajo

const NUS_SERVICE = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const NUS_RX = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const NUS_TX = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

// --- Estilos CSS (Autocontenidos) ---
const styles = `
:root {
  --color-bg: #f0f4f8;
  --color-bg-zona: #ffffff;
  --color-bg-zona-on: #fef9c3;
  --color-border: #e2e8f0;
  --color-text: #334155;
  --color-text-on: #ca8a04;
  --color-icon: #94a3b8;
  --color-icon-on: #facc15;
  --color-btn: #3b82f6;
  --color-btn-text: #ffffff;
  --color-btn-hover: #2563eb;
  --color-fan-0: #cbd5e1;
  --color-fan-1: #60a5fa;
  --color-fan-2: #2563eb;
  --color-fan-3: #1d4ed8;
  --color-heater: #888;
  --color-heater-on: #ff6a00;
  --color-heater-on-light: #ff9a00;
  --color-heater-bg-on: rgba(255, 106, 0, 0.1);
}

.app {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  max-width: 400px;
  margin: 0 auto;
  background: var(--color-bg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--color-bg-zona);
  border-bottom: 1px solid var(--color-border);
}
header h2 {
  margin: 0;
  color: var(--color-text);
}

.btn {
  background: var(--color-btn);
  color: var(--color-btn-text);
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn:hover {
  background: var(--color-btn-hover);
}
.btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.plano {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  transition: opacity 0.3s;
}
.plano.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.zona {
  background: var(--color-bg-zona);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--color-text);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.zona:hover {
  border-color: #94a3b8;
}
.zona.on {
  background: var(--color-bg-zona-on);
  color: var(--color-text-on);
  border-color: var(--color-icon-on);
}
.zona.comedor {
  grid-column: 1 / -1;
  background: transparent;
  border: none;
  padding: 0;
  box-shadow: none;
}
.zona.estufa.on {
  background-color: var(--color-heater-bg-on);
  color: var(--color-heater-on);
  border-color: var(--color-heater-on);
}


/* --- Iconos --- */
.icon-bulb path {
  fill: var(--color-icon);
  transition: fill 0.3s;
}
.icon-bulb.on path {
  fill: var(--color-icon-on);
}

.icon-fan { transition: transform 0.5s; }
.icon-fan circle { fill: var(--color-fan-0); }
.icon-fan path { fill: var(--color-fan-0); }
.icon-fan.lvl-1 { transform: rotate(180deg); }
.icon-fan.lvl-1 circle { fill: var(--color-fan-1); }
.icon-fan.lvl-1 path { fill: var(--color-fan-1); }
.icon-fan.lvl-2 { transform: rotate(360deg); }
.icon-fan.lvl-2 circle { fill: var(--color-fan-2); }
.icon-fan.lvl-2 path { fill: var(--color-fan-2); }
.icon-fan.lvl-3 { transform: rotate(720deg); }
.icon-fan.lvl-3 circle { fill: var(--color-fan-3); }
.icon-fan.lvl-3 path { fill: var(--color-fan-3); }

.icon-heater path:first-of-type {
  fill: var(--color-icon);
  transition: fill 0.3s;
}
.icon-heater.on path:first-of-type {
  fill: var(--color-heater-on);
}
.icon-heater path:last-of-type {
  fill: #aaa;
  transition: fill 0.3s;
}
.icon-heater.on path:last-of-type {
  fill: var(--color-heater-on-light);
}

.ventilador {
  background: var(--color-bg-zona);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.etiqueta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
}
.stepper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.stepper button {
  font-size: 1.2rem;
  width: 2rem;
  height: 2rem;
  padding: 0;
  text-align: center;
  line-height: 2rem;
}
.stepper strong {
  font-weight: 600;
  min-width: 40px;
  text-align: center;
  color: var(--color-text);
}
.nivel-1 .stepper strong { color: var(--color-fan-1); }
.nivel-2 .stepper strong { color: var(--color-fan-2); }
.nivel-3 .stepper strong { color: var(--color-fan-3); }


.acciones {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  margin-top: auto;
  background: var(--color-bg-zona);
  border-top: 1px solid var(--color-border);
}
.acciones button {
  flex: 1;
}
`;

// --- Iconos ---
function IconBulb({ on = false }: { on?: boolean }) {
  return (
    <svg
      className={`icon-bulb ${on ? "on" : ""}`}
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden
    >
      <path d="M9 21h6v-1H9v1zm3-19a7 7 0 0 0-4.93 11.93c.53.53.93 1.18 1.1 1.9l.06.26h7.54l.06-.26c.17-.72.57-1.37 1.1-1.9A7 7 0 0 0 12 2zM8.5 17a3.5 3.5 0 0 0-1.02-2.48A5.5 5.5 0 1 1 16.52 14.5 3.5 3.5 0 0 0 15.5 17H8.5z" />
    </svg>
  );
}
function IconFan({ level = 0 }: { level?: number }) {
  return (
    <svg
      className={`icon-fan lvl-${level}`}
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden
    >
      <circle cx="12" cy="12" r="2.2" />
      <path d="M12 4c2.8 0 3.8 3.4 1.2 4.6l-1.2.6-.6-1.2C10.4 5.4 11 4 12 4zM20 12c0 2.8-3.4 3.8-4.6 1.2l-.6-1.2 1.2-.6C18.6 10.4 20 11 20 12zM12 20c-2.8 0-3.8-3.4-1.2-4.6l1.2-.6.6 1.2c1 2.6.4 4-0.6 4zM4 12c0-2.8 3.4-3.8 4.6-1.2l.6 1.2-1.2.6C5.4 13.6 4 13 4 12z" />
    </svg>
  );
}
// +++ NUEVO ÍCONO +++
function IconHeater({ on = false }: { on?: boolean }) {
  return (
    <svg
      className={`icon-heater ${on ? "on" : ""}`}
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden
    >
      <path d="M19 11h-1V4h-2v7h-2V5h-2v6H9V4H7v7H6a2 2 0 0 0-2 2v7h17v-7a2 2 0 0 0-2-2zM6 18v-5h12v5H6z" />
      <path d="M8 13h2v3H8zm4 0h2v3h-2z" />
    </svg>
  );
}

// --- BLE hook ---
function useBle() {
  const deviceRef = useRef<BluetoothDevice | null>(null);
  const rxRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const txRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const [connected, setConnected] = useState(false);

  async function connect() {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: "CasaBLE" }],
      optionalServices: [NUS_SERVICE]
    });
    deviceRef.current = device;
    device.addEventListener("gattserverdisconnected", () =>
      setConnected(false)
    );
    const server = await device.gatt!.connect();
    const svc = await server.getPrimaryService(NUS_SERVICE);
    rxRef.current = await svc.getCharacteristic(NUS_RX);
    txRef.current = await svc.getCharacteristic(NUS_TX);
    await txRef.current.startNotifications();
    setConnected(true);
  }
  function disconnect() {
    deviceRef.current?.gatt?.disconnect();
  }

  async function send(cmd: string) {
    if (!rxRef.current) return;
    const data = new TextEncoder().encode(cmd);
    // @ts-ignore
    if (rxRef.current.writeValueWithoutResponse)
      await rxRef.current.writeValueWithoutResponse(data);
    else await rxRef.current.writeValue(data);
  }
  return { connected, connect, disconnect, send };
}

// --- Componente Principal ---
export default function CasaBle() {
  const { connected, connect, disconnect, send } = useBle();

  // +++ Estados Actualizados +++
  const [entrada, setEntrada] = useState(false); // Pasillo -> Entrada
  const [cocina, setCocina] = useState(false);
  const [dormitorio, setDormitorio] = useState(false);
  const [aseo, setAseo] = useState(false);
  const [living, setLiving] = useState(false);
  const [estufa, setEstufa] = useState(false); // <-- NUEVO
  const [vent, setVent] = useState(0); // 0..3

  // +++ Funciones 'toggle' y 'all' Actualizadas +++
  async function toggle(
    zone: "ENTRADA" | "COCINA" | "DORMITORIO" | "ASEO" | "LIVING" | "ESTUFA"
  ) {
    const mapState = {
      ENTRADA: entrada,
      COCINA: cocina,
      DORMITORIO: dormitorio,
      ASEO: aseo,
      LIVING: living,
      ESTUFA: estufa
    } as const;
    const setters = {
      ENTRADA: setEntrada,
      COCINA: setCocina,
      DORMITORIO: setDormitorio,
      ASEO: setAseo,
      LIVING: setLiving,
      ESTUFA: setEstufa
    } as const;

    // @ts-ignore
    const next = !mapState[zone];
    // @ts-ignore
    setters[zone](next);
    await send(`${zone} ${next ? "ON" : "OFF"}`);
  }

  async function cycleVent() {
    const next = (vent + 1) % 4;
    setVent(next);
    await send(next === 0 ? "VENTILADOR OFF" : `VENTILADOR ${next}`);
  }
  async function stepVent(delta: number) {
    const next = Math.max(0, Math.min(3, vent + delta));
    setVent(next);
    await send(next === 0 ? "VENTILADOR OFF" : `VENTILADOR ${next}`);
  }
  async function all(on: boolean) {
    setEntrada(on);
    setCocina(on);
    setDormitorio(on);
    setAseo(on);
    setLiving(on);
    setEstufa(on);
    setVent(on ? 2 : 0);
    await send(on ? "ALL ON" : "ALL OFF");
  }

  return (
    <div className="app">
      {/* Añadimos los estilos al DOM */}
      <style>{styles}</style>

      <header>
        <h2>🏠 CasaBLE</h2>
        {!connected ? (
          <button className="btn" onClick={connect}>
            Conectar
          </button>
        ) : (
          <button className="btn" onClick={disconnect}>
            Desconectar
          </button>
        )}
      </header>

      <div className={`plano ${connected ? "" : "disabled"}`}>
        {/* --- ENTRADA (Antes Pasillo) --- */}
        <div
          className={`zona entrada ${entrada ? "on" : ""}`}
          onClick={() => connected && toggle("ENTRADA")}
        >
          <IconBulb on={entrada} />
          <span>Entrada</span>
        </div>

        <div
          className={`zona cocina ${cocina ? "on" : ""}`}
          onClick={() => connected && toggle("COCINA")}
        >
          <IconBulb on={cocina} />
          <span>Cocina</span>
        </div>

        <div
          className={`zona dormitorio ${dormitorio ? "on" : ""}`}
          onClick={() => connected && toggle("DORMITORIO")}
        >
          <IconBulb on={dormitorio} />
          <span>Dormitorio</span>
        </div>
        <div
          className={`zona bano ${aseo ? "on" : ""}`}
          onClick={() => connected && toggle("ASEO")}
        >
          <IconBulb on={aseo} />
          <span>Baño</span>
        </div>

        <div
          className={`zona living ${living ? "on" : ""}`}
          onClick={() => connected && toggle("LIVING")}
        >
          <IconBulb on={living} />
          <span>Living</span>
        </div>

        {/* --- NUEVA ZONA: ESTUFA --- */}
        <div
          className={`zona estufa ${estufa ? "on" : ""}`}
          onClick={() => connected && toggle("ESTUFA")}
        >
          <IconHeater on={estufa} />
          <span>Estufa</span>
        </div>

        <div
          className={`zona comedor nivel-${vent}`}
          onClick={() => connected && cycleVent()}
        >
          <div className="ventilador" onClick={(e) => e.stopPropagation()}>
            <div className="etiqueta">
              <IconFan level={vent} /> Ventilador Comedor
            </div>
            <div className="stepper">
              <button
                className="btn"
                disabled={!connected || vent <= 0}
                onClick={() => stepVent(-1)}
              >
                –
              </button>
              <strong>{vent === 0 ? "OFF" : `Vel ${vent}`}</strong>
              <button
                className="btn"
                disabled={!connected || vent >= 3}
                onClick={() => stepVent(+1)}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="acciones">
        <button className="btn" disabled={!connected} onClick={() => all(true)}>
          Todo ON
        </button>
        <button
          className="btn"
          disabled={!connected}
          onClick={() => all(false)}
        >
          Todo OFF
        </button>
      </div>
    </div>
  );
}
