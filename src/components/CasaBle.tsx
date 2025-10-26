/// <reference types="web-bluetooth" />
import { useRef, useState } from "react";
import "./casa-ble.css";

const NUS_SERVICE = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const NUS_RX = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const NUS_TX = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

// --- Iconos --- (Sin cambios)
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

// --- BLE hook --- (Sin cambios)
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

// --- Componente Principal --- (Sin cambios lógicos)
export default function CasaBle() {
  const { connected, connect, disconnect, send } = useBle();

  const [entrada, setEntrada] = useState(false);
  const [cocina, setCocina] = useState(false);
  const [dormitorio, setDormitorio] = useState(false);
  const [aseo, setAseo] = useState(false);
  const [living, setLiving] = useState(false);
  const [estufa, setEstufa] = useState(false);
  const [vent, setVent] = useState(0);

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

      {/* Plano con flex-grow se ajusta al espacio */}
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

        <div className={`zona comedor nivel-${vent}`}>
          {" "}
          {/* Quitamos onClick de aquí */}
          <div
            className="ventilador"
            onClick={(e) => {
              e.stopPropagation();
              connected && cycleVent();
            }}
          >
            {" "}
            {/* Añadimos onClick aquí */}
            <div className="etiqueta">
              <IconFan level={vent} /> Ventilador Comedor
            </div>
            <div className="stepper">
              <button
                className="btn"
                disabled={!connected || vent <= 0}
                onClick={(e) => {
                  e.stopPropagation();
                  stepVent(-1);
                }}
              >
                –
              </button>{" "}
              {/* Añadimos stopPropagation */}
              <strong>{vent === 0 ? "OFF" : `Vel ${vent}`}</strong>
              <button
                className="btn"
                disabled={!connected || vent >= 3}
                onClick={(e) => {
                  e.stopPropagation();
                  stepVent(+1);
                }}
              >
                +
              </button>{" "}
              {/* Añadimos stopPropagation */}
            </div>
          </div>
        </div>
      </div>

      {/* Acciones ahora está al final gracias a flexbox */}
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
