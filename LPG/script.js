const LPG_CAPACITY_KG = 14.2;
const EMPTY_CYLINDER_WEIGHT_KG = 15.3;
const brokerUrl = "wss://test.mosquitto.org:8081/mqtt";
const MQTT_TOPIC = "aswin/lpg/level";
const clientId =
  "lpg_dashboard_" + Math.random().toString(16).substring(2, 10);

const elements = {
  connectionStatus: document.getElementById("connection-status"),
  connectionStatusText: document.getElementById("connection-status-text"),
  lpgPercentage: document.getElementById("lpg-percentage"),
  lpgRemaining: document.getElementById("lpg-remaining"),
  totalWeight: document.getElementById("total-weight"),
  cylinderStatus: document.getElementById("cylinder-status"),
  statusHelp: document.getElementById("status-help"),
  statusCard: document.getElementById("status-card"),
  statusIcon: document.getElementById("status-icon"),
  progressBar: document.querySelector(".level-progress"),
  progressFill: document.getElementById("level-progress-fill"),
  lastUpdated: document.getElementById("last-updated"),
  feedback: document.getElementById("message-feedback"),
};

function getCylinderStatus(percentage) {
  if (percentage > 25) {
    return {
      key: "normal",
      label: "NORMAL",
      help: "LPG level is in the safe range",
      icon: "✓",
    };
  }

  if (percentage > 10) {
    return {
      key: "low",
      label: "LOW",
      help: "Plan a refill soon",
      icon: "!",
    };
  }

  return {
    key: "critical",
    label: "CRITICAL - BOOK REFILL",
    help: "Book a refill immediately",
    icon: "!",
  };
}

function setConnectionState(isConnected) {
  elements.connectionStatus.classList.toggle("connected", isConnected);
  elements.connectionStatus.classList.toggle("disconnected", !isConnected);
  elements.connectionStatusText.textContent = isConnected
    ? "MQTT Connected"
    : "MQTT Disconnected";
}

function updateDashboard(rawPercentage) {
  const percentage = Math.min(100, Math.max(0, rawPercentage));
  const lpgRemaining = (percentage / 100) * LPG_CAPACITY_KG;
  const totalWeight = EMPTY_CYLINDER_WEIGHT_KG + lpgRemaining;
  const status = getCylinderStatus(percentage);

  elements.lpgPercentage.textContent = percentage.toFixed(1);
  elements.lpgRemaining.textContent = lpgRemaining.toFixed(2);
  elements.totalWeight.textContent = totalWeight.toFixed(2);
  elements.cylinderStatus.textContent = status.label;
  elements.statusHelp.textContent = status.help;
  elements.statusIcon.textContent = status.icon;

  elements.statusCard.className = `metric-card status-card status-card--${status.key}`;
  elements.progressFill.className = `level-progress__fill ${status.key}`;
  elements.progressFill.style.width = `${percentage}%`;
  elements.progressBar.setAttribute("aria-valuenow", percentage.toFixed(1));
  elements.lastUpdated.textContent = `Updated ${new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date())}`;
  elements.feedback.textContent = "";
  elements.feedback.classList.remove("error");
}

function handleMqttMessage(topic, message) {
  const rawValue = message.toString().trim();
  console.log("MQTT topic:", topic);
  console.log("MQTT raw message:", rawValue);

  if (topic !== MQTT_TOPIC) {
    return;
  }

  const percentage = parseFloat(rawValue);

  if (
    rawValue === "" ||
    !Number.isFinite(percentage) ||
    percentage < 0 ||
    percentage > 100
  ) {
    elements.feedback.textContent = `Ignored invalid MQTT value: “${rawValue || "empty"}”`;
    elements.feedback.classList.add("error");
    return;
  }

  updateDashboard(percentage);

  if (typeof window.updateCylinderLevel === "function") {
    window.updateCylinderLevel(percentage);
  } else {
    window.pendingCylinderLevel = percentage;
  }
}

function connectToMqtt() {
  if (typeof mqtt === "undefined") {
    elements.feedback.textContent = "Unable to load the MQTT library. Check your internet connection and refresh.";
    elements.feedback.classList.add("error");
    return;
  }

  const client = mqtt.connect(brokerUrl, {
    clientId: clientId,
    clean: true,
    keepalive: 60,
    reconnectPeriod: 3000,
    connectTimeout: 10000,
  });

  client.on("connect", () => {
    console.log("MQTT Connected");
    setConnectionState(true);
    client.subscribe(MQTT_TOPIC, { qos: 0 }, (error, granted) => {
      if (error) {
        console.error("MQTT subscription failed", error);
        elements.feedback.textContent = "Connected, but unable to subscribe to the LPG topic.";
        elements.feedback.classList.add("error");
        return;
      }

      console.log("MQTT subscription succeeded", { topic: MQTT_TOPIC, granted });
    });
  });

  client.on("message", handleMqttMessage);

  client.on("close", () => {
    console.log("MQTT connection closed");
    setConnectionState(false);
  });

  client.on("offline", () => {
    console.log("MQTT offline");
    setConnectionState(false);
  });

  client.on("error", (error) => {
    console.error("MQTT connection error", error);
    setConnectionState(false);
  });

  client.on("reconnect", () => {
    console.log("MQTT reconnecting");
    setConnectionState(false);
  });
}

connectToMqtt();
