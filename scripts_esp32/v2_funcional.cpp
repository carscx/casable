#include <NimBLEDevice.h>

// === Pines ===
#define LED_PASILLO 16
#define LED_COCINA  17
#define LED_DORMITORIO  12
#define LED_ASEO  14
#define LED_LIVING  27
#define MOTOR_PIN   18

const bool LED_ACTIVE_LOW = false;
const int  PWM_FREQ = 4000;
const int  PWM_RES  = 8;

// === Variables motor ===
uint8_t V1 = 180, V2 = 210, V3 = 255;
uint8_t MIN_RUN = 80;
uint16_t SOFT_START_MS = 180;
uint8_t current = 0;

// === BLE UUIDs NUS ===
static NimBLEUUID UUID_SVC("6E400001-B5A3-F393-E0A9-E50E24DCCA9E");
static NimBLEUUID UUID_RX ("6E400002-B5A3-F393-E0A9-E50E24DCCA9E");
static NimBLEUUID UUID_TX ("6E400003-B5A3-F393-E0A9-E50E24DCCA9E");

NimBLECharacteristic* txChar = nullptr;
bool connected = false;

// === Motor helpers ===
inline void setPWM(uint8_t d){ ledcWrite(MOTOR_PIN, d); current = d; }
void softStartTo(uint8_t target){
  if (target == 0){ setPWM(0); return; }
  if (current < MIN_RUN){ ledcWrite(MOTOR_PIN, 255); delay(SOFT_START_MS); }
  setPWM(max<uint8_t>(target, MIN_RUN));
}
void motorOff(){ setPWM(0); }

// === LED helpers ===
inline void setPin(int pin, bool on){
  digitalWrite(pin, LED_ACTIVE_LOW ? (on ? LOW : HIGH) : (on ? HIGH : LOW));
}
inline bool pinIsOn(int pin){
  int v = digitalRead(pin);
  return LED_ACTIVE_LOW ? (v == LOW) : (v == HIGH);
}
inline void notify(const String& s){ if (connected && txChar){ txChar->setValue(s.c_str()); txChar->notify(); } }

// === Comandos BLE ===
void handleCmd(String cmd){
  cmd.trim(); cmd.toUpperCase();

  auto onoff = [&](int pin, bool on, const char* name){
    setPin(pin, on); notify(String("OK: ")+name+(on?" ON":" OFF"));
  };
  auto toggle = [&](int pin, const char* name){
    setPin(pin, !pinIsOn(pin)); notify(String("OK: ")+name+" TOGGLE");
  };
  auto status = [&](int pin, const char* name){
    notify(String(name)+"="+(pinIsOn(pin)?"ON":"OFF"));
  };

  if      (cmd=="PASILLO ON")      onoff(LED_PASILLO, true,  "PASILLO");
  else if (cmd=="PASILLO OFF")     onoff(LED_PASILLO, false, "PASILLO");
  else if (cmd=="PASILLO TOGGLE")  toggle(LED_PASILLO, "PASILLO");
  else if (cmd=="PASILLO STATUS")  status(LED_PASILLO, "PASILLO");

  else if (cmd=="COCINA ON")       onoff(LED_COCINA, true,  "COCINA");
  else if (cmd=="COCINA OFF")      onoff(LED_COCINA, false, "COCINA");
  else if (cmd=="COCINA TOGGLE")   toggle(LED_COCINA, "COCINA");
  else if (cmd=="COCINA STATUS")   status(LED_COCINA, "COCINA");

  else if (cmd=="DORMITORIO ON")       onoff(LED_DORMITORIO, true,  "DORMITORIO");
  else if (cmd=="DORMITORIO OFF")      onoff(LED_DORMITORIO, false, "DORMITORIO");
  else if (cmd=="DORMITORIO TOGGLE")   toggle(LED_DORMITORIO, "DORMITORIO");
  else if (cmd=="DORMITORIO STATUS")   status(LED_DORMITORIO, "DORMITORIO");

  else if (cmd=="ASEO ON")       onoff(LED_ASEO, true,  "ASEO");
  else if (cmd=="ASEO OFF")      onoff(LED_ASEO, false, "ASEO");
  else if (cmd=="ASEO TOGGLE")   toggle(LED_ASEO, "ASEO");
  else if (cmd=="ASEO STATUS")   status(LED_ASEO, "ASEO");

  else if (cmd=="LIVING ON")       onoff(LED_LIVING, true,  "LIVING");
  else if (cmd=="LIVING OFF")      onoff(LED_LIVING, false, "LIVING");
  else if (cmd=="LIVING TOGGLE")   toggle(LED_LIVING, "LIVING");
  else if (cmd=="LIVING STATUS")   status(LED_LIVING, "LIVING");

  else if (cmd=="VENTILADOR 1")    { softStartTo(V1); notify("OK: VENTILADOR 1"); }
  else if (cmd=="VENTILADOR 2")    { softStartTo(V2); notify("OK: VENTILADOR 2"); }
  else if (cmd=="VENTILADOR 3")    { softStartTo(V3); notify("OK: VENTILADOR 3"); }
  else if (cmd=="VENTILADOR OFF")  { motorOff();      notify("OK: VENTILADOR OFF"); }

  else if (cmd=="ALL ON")          { setPin(LED_PASILLO,true);setPin(LED_COCINA,true);setPin(LED_DORMITORIO,true);setPin(LED_ASEO,true);setPin(LED_LIVING,true);softStartTo(V2);notify("OK: ALL ON"); }
  else if (cmd=="ALL OFF")         { setPin(LED_PASILLO,false);setPin(LED_COCINA,false);setPin(LED_DORMITORIO,false);setPin(LED_ASEO,false);setPin(LED_LIVING,false);motorOff();notify("OK: ALL OFF"); }
  else                              notify("ERR");
}

// === BLE setup ===
class SvrCB : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer*)    { connected = true; }
  void onDisconnect(NimBLEServer*) { connected = false; NimBLEDevice::startAdvertising(); }
};
class RxCB : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* c){ handleCmd(String(c->getValue().c_str())); }
  void onWrite(NimBLECharacteristic* c, NimBLEConnInfo&){ onWrite(c); }
};

void setup() {
  pinMode(LED_PASILLO, OUTPUT); setPin(LED_PASILLO,false);
  pinMode(LED_COCINA,  OUTPUT); setPin(LED_COCINA,false);
  pinMode(LED_DORMITORIO,  OUTPUT); setPin(LED_DORMITORIO,false);
  pinMode(LED_ASEO,  OUTPUT); setPin(LED_ASEO,false);
  pinMode(LED_LIVING,  OUTPUT); setPin(LED_LIVING,false);

  ledcAttach(MOTOR_PIN, PWM_FREQ, PWM_RES); // versión para core 3.x
  setPWM(0);

  NimBLEDevice::init("CasaBLE");
  NimBLEDevice::setDeviceName("CasaBLE");
  NimBLEDevice::setPower(ESP_PWR_LVL_P9);

  auto srv = NimBLEDevice::createServer(); srv->setCallbacks(new SvrCB());
  auto svc = srv->createService(UUID_SVC);

  txChar = svc->createCharacteristic(UUID_TX, NIMBLE_PROPERTY::NOTIFY);
  auto rx = svc->createCharacteristic(UUID_RX, NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_NR);
  rx->setCallbacks(new RxCB());
  svc->start();

  auto adv = NimBLEDevice::getAdvertising();
  NimBLEAdvertisementData advData; advData.setFlags(0x06); advData.addServiceUUID(UUID_SVC); advData.setName("CasaBLE");
  NimBLEAdvertisementData scanData; scanData.setName("CasaBLE");
  adv->setAdvertisementData(advData);
  adv->setScanResponseData(scanData);
  adv->start();
}
void loop() {}
