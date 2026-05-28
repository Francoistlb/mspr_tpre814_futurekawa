import json
import paho.mqtt.client as mqtt
import serial
from datetime import datetime, timezone

# ---- Config ------------------------------------------------
SERIAL_PORT  = "/dev/cu.usbmodem11201"  # Mac — Windows : "COM3"
BAUD_RATE    = 9600

MQTT_HOST    = "127.0.0.1"
MQTT_PORT    = 1883          # Brésil:1883 | Équateur:1884 | Colombie:1885

PAYS         = "bresil"      # bresil | equateur | colombie
ENTREPOT     = "BR01"        # BR01 BR02 | EQ01 EQ02 | CO01 CO02
# ------------------------------------------------------------

TOPIC = f"futurekawa/{PAYS}/{ENTREPOT}/mesures"


def on_connect(client, userdata, flags, reason_code, properties):
    print(f"MQTT connecté ({reason_code}) — topic : {TOPIC}")


mqttc = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
mqttc.on_connect = on_connect
mqttc.connect(MQTT_HOST, MQTT_PORT, 60)
mqttc.loop_start()

print(f"Lecture série sur {SERIAL_PORT}...")

with serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1) as ser:
    while True:
        line = ser.readline().decode("utf-8").strip()
        parts = line.split(" ")

        if len(parts) < 2 or "Erreur" in parts[0]:
            continue

        try:
            hum  = float(parts[0])
            temp = float(parts[1])
        except ValueError:
            print(f"Ligne ignorée (format inattendu) : {line}")
            continue

        payload = json.dumps({
            "entrepot": ENTREPOT,
            "temp":     temp,
            "hum":      hum,
            "ts":       datetime.now(timezone.utc).isoformat()
        })

        mqttc.publish(TOPIC, payload)
        print(f"Publié → {TOPIC} : {payload}")

mqttc.loop_stop()
