import paho.mqtt.client as mqtt
import serial


# The callback for when the client receives a CONNACK response from the server.
def on_connect(client, userdata, flags, reason_code, properties):
    print(f"Connected with result code {reason_code}")
    # Subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed.
    # client.subscribe("$SYS/#")


# The callback for when a PUBLISH message is received from the server.
def on_message(client, userdata, msg):
    print(msg.topic + " " + str(msg.payload))


mqttc = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
mqttc.on_connect = on_connect
mqttc.on_message = on_message

# with serial.Serial("/dev/cu.usbmodem11201", 9600, timeout=1) as ser:
#     while True:
#         line = ser.readline().decode("utf-8").strip()
#         line = line.split(" ")
#         if len(line) > 1:
#             if "Erreur" not in line[0]:
#                 print("humidity is", line[0], "and temp is", line[1])

mqttc.connect("127.0.0.1", 1884, 60)

# Blocking call that processes network traffic, dispatches callbacks and
# handles reconnecting.
# Other loop*() functions are available that give a threaded interface and a
# manual interface.
mqttc.loop_start()

with serial.Serial("/dev/cu.usbmodem11201", 9600, timeout=1) as ser:
    while True:
        line = ser.readline().decode("utf-8").strip()
        line = line.split(" ")
        if len(line) > 1:
            if "Erreur" not in line[0]:
                print("humidity is", line[0], "and temp is", line[1])
                mqttc.publish("paho/humidity", line[0])
                mqttc.publish("paho/temperature", line[1])

mqttc.loop_stop()
