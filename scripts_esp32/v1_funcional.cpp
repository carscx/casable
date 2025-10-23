  #include <NimBLEDevice.h>

  // Pines
  #define LED_PASILLO 16
  #define LED_COCINA  17
  const bool LED_ACTIVE_LOW = false; // deja false con el cableado indicado

  // UUIDs NUS
  static NimBLEUUID UUID_SVC("6E400001-B5A3-F393-E0A9-E50E24DCCA9E");
  static NimBLEUUID UUID_RX ("6E400002-B5A3-F393-E0A9-E50E24DCCA9E");
  static NimBLEUUID UUID_TX ("6E400003-B5A3-F393-E0A9-E50E24DCCA9E");

  NimBLECharacteristic* txChar = nullptr;
  bool connected = false;

  inline void setPin(int pin, bool on){
    digitalWrite(pin, LED_ACTIVE_LOW ? (on ? LOW : HIGH) : (on ? HIGH : LOW));
  }
  inline bool pinIsOn(int pin){
    int v = digitalRead(pin);
    return LED_ACTIVE_LOW ? (v == LOW) : (v == HIGH);
  }
  inline void notify(const String& s){ if (connected && txChar){ txChar->setValue(s.c_str()); txChar->notify(); } }

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

    else if (cmd=="ALL ON")          { setPin(LED_PASILLO,true); setPin(LED_COCINA,true);  notify("OK: ALL ON"); }
    else if (cmd=="ALL OFF")         { setPin(LED_PASILLO,false);setPin(LED_COCINA,false); notify("OK: ALL OFF"); }
    else                              notify("ERR");
  }

  class SvrCB : public NimBLEServerCallbacks {
    void onConnect(NimBLEServer*)    { connected = true; }
    void onDisconnect(NimBLEServer*) { connected = false; NimBLEDevice::startAdvertising(); }
  };
  class RxCB : public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic* c){ handleCmd(String(c->getValue().c_str())); }
    void onWrite(NimBLECharacteristic* c, NimBLEConnInfo&){ onWrite(c); } // compat
  };

  void setup() {
    pinMode(LED_PASILLO, OUTPUT); setPin(LED_PASILLO,false);
    pinMode(LED_COCINA,  OUTPUT); setPin(LED_COCINA,false);

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
