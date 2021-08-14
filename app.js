window.onload = () => {
  // Select all the UI elements
  const fanStateIndicator = document.getElementById("fan-state-indicator"),
    speedIndicator = document.getElementById("speed-indicator"),
    swingIndicator = document.getElementById("swing-indicator"),
    timerIndicator = document.getElementById("timer-indicator"),
    pwrBtnLbl = document.getElementById("pwr-btn-lbl"),
    pwrBtn = document.getElementById("btn-power"),
    swingBtn = document.getElementById("btn-swing"),
    speedOneBtn = document.getElementById("btn-one"),
    speedTwoBtn = document.getElementById("btn-two"),
    speedThreeBtn = document.getElementById("btn-three"),
    settingBtn = document.getElementById("setting-btn"),
    modal = document.getElementById("modal"),
    fanIpInput = document.getElementById("fan-ip"),
    setIpBtn = document.getElementById("set-ip-btn"),
    currentIp = document.getElementById("current-ip"),
    snackbar = document.getElementById("snackbar"),
    dialog = document.getElementById("dialog"),
    reconnectBtn = document.getElementById("reconnect-btn");

  // Read from local storage
  let fanIp = localStorage.getItem("fanIp");

  // If IP is not set, open the modal
  if (!fanIp) {
    modal.style.display = "flex";
  } else {
    currentIp.innerText = fanIp + "/";
  }

  // Show modal on clicking seetting button
  settingBtn.addEventListener("click", (e) => {
    modal.style.display = "flex";
  });

  // Close modal on clicking outside the modal
  modal.addEventListener("click", (e) => {
    if (!fanIp) return;
    e.target.id === "modal" ? (modal.style.display = "none") : null;
  });

  // Store IP address on local storage
  setIpBtn.addEventListener("click", (e) => {
    let timer;
    const ip = fanIpInput.value;
    if (validateIp(ip)) {
      localStorage.setItem("fanIp", `http://${ip}`);
      showSnack(snackbar, "success", "IP address stored successfully.");
      modal.style.display = "none";

      timer = setTimeout(() => {
        location.reload();
        clearTimeout(timer);
      }, 1000);
    } else
      return showSnack(snackbar, "alert", "Please enter the valid IP address.");
  });

  // Initilize fan object
  let fan = new Fan(
    fanIp,
    pwrBtnLbl,
    fanStateIndicator,
    speedIndicator,
    swingIndicator,
    timerIndicator,
    dialog
  );

  // Connect to the fan
  fan.connect();

  // Add listeners to the speed button
  pwrBtn.addEventListener("click", (e) => {
    if (!fanIp) modal.style.display = "flex";
    fan.state.connected && !fan.state.fanOn ? fan.turn("on") : fan.turn("off");
    fan.state.error
      ? showSnack(
          snackbar,
          "alert",
          "Can't connect to the fan. Check the IP address."
        )
      : null;
  });

  speedOneBtn.addEventListener("click", () => {
    if (!fan.state.fanOn)
      showSnack(snackbar, "alert", "Turn on the fan first.");
    fan.state.fanOn ? fan.speed("One") : null;
  });

  speedTwoBtn.addEventListener("click", () => {
    if (!fan.state.fanOn)
      showSnack(snackbar, "alert", "Turn on the fan first.");
    fan.state.fanOn ? fan.speed("Two") : null;
  });

  speedThreeBtn.addEventListener("click", () => {
    if (!fan.state.fanOn)
      showSnack(snackbar, "alert", "Turn on the fan first.");
    fan.state.fanOn ? fan.speed("Three") : null;
  });

  swingBtn.addEventListener("click", (e) => {
    if (!fan.state.fanOn)
      showSnack(snackbar, "alert", "Turn on the fan first.");
    fan.state.fanOn && !fan.state.swing ? fan.swing("On") : fan.swing("Off");
  });

  reconnectBtn.addEventListener("click", () => fan.connect());
};

class Fan {
  constructor(
    address,
    pwrBtnLbl,
    fanStateIndicator,
    speedIndicator,
    swingIndicator,
    timerIndicator,
    dialog
  ) {
    this.state = {
      loading: true,
      connected: false,
      error: false,
      fanOn: 0,
      speed: 0,
      swing: 0,
    };
    this.address = address;
    this.pwrBtnLbl = pwrBtnLbl;
    this.fanState = fanStateIndicator;
    this.speedIndicator = speedIndicator;
    this.swingIndicator = swingIndicator;
    this.timerIndicator = timerIndicator;
    this.dialog = dialog;
  }

  // Update state and update UI
  setState(newState) {
    this.state = Object.assign(this.state, newState);

    // Upadate the UI
    this.updateUi();
  }

  // Check whether the connection to the fan is established or not
  connect() {
    this.setState({ loading: true });
    fetch(this.address)
      .then((res) => res.json())
      .then((json) => {
        this.setState(json);
      })
      .catch((e) => {
        this.setState({ error: true });
      })
      .finally(() => {
        this.setState({ loading: false });
        this.updateUi();
      });
  }

  /**
   * Toggle the fan ON/OFF
   * @cmd "on"/"off"
   */
  turn(cmd) {
    fetch(`${this.address}/${cmd}`)
      .then((res) => res.json())
      .then((json) => this.setState(json))
      .catch((e) => this.setState({ error: true }));
  }

  swing(cmd) {
    fetch(`${this.address}/swing${cmd}`)
      .then((res) => res.json())
      .then((json) => this.setState(json))
      .catch((e) => this.setState({ error: true }));
  }

  // Handle speed
  speed(speed) {
    fetch(`${this.address}/speed${speed}`)
      .then((res) => res.json())
      .then((json) => this.setState(json))
      .catch((e) => this.setState({ error: true }));
  }

  // Function to update UI
  updateUi() {
    this.dialog.style.visibility =
      !this.state.loading && this.state.error ? "visible" : "hidden";
    this.pwrBtnLbl.className = this.state.fanOn ? "pwr-off" : "pwr-on";
    this.fanState.innerText = this.state.error
      ? "n/a"
      : this.state.fanOn
      ? "On"
      : "Off";

    this.fanState.style.color = this.state.error
      ? "#505050"
      : this.state.fanOn
      ? "#00CE00"
      : "red";

    this.swingIndicator.innerText = this.state.error
      ? "n/a"
      : this.state.swing
      ? "On"
      : "Off";
    this.swingIndicator.style.color = this.state.error
      ? "#505050"
      : this.state.swing
      ? "#00CE00"
      : "red";

    this.speedIndicator.innerText =
      this.state.speed == 1
        ? "one"
        : this.state.speed == 2
        ? "two"
        : this.state.speed == 3
        ? "three"
        : "n/a";
  }
}

// Validate IP address
function validateIp(ip) {
  const regex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  if (regex.test(ip)) return true;
  else return false;
}

// Show snack
let timer;
function showSnack(snack, type, message) {
  snack.innerText = message;
  snack.className = type;

  clearTimeout(timer);
  timer = setTimeout(() => {
    snack.className = "";
  }, 2000);
}
