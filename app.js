// Class to create fan object
class Fan {
  /**
   * @constructor
   * @param {HTMLElement} address - IP address of the fan
   * @param {HTMLElement} pwrBtnLbl - Label of the power button on UI
   * @param {HTMLElement} fanStateIndicator - Element which shows current state of the fan on UI
   * @param {HTMLElement} speedIndicator - Element which shows speed of the fan on UI
   * @param {HTMLElement} swingIndicator - Element which show wherether the fan is swinging or not on UI
   * @param {HTMLElement} timerIndicator - Element which shows timer state on UI
   * @param {HTMLElement} dialog - Element to show error when failed to connect to the fan
   */
  constructor(
    address,
    pwrBtnLbl,
    fanStateIndicator,
    speedIndicator,
    swingIndicator,
    timerIndicator,
    dialog
  ) {
    this.address = address;
    this.pwrBtnLbl = pwrBtnLbl;
    this.fanState = fanStateIndicator;
    this.speedIndicator = speedIndicator;
    this.swingIndicator = swingIndicator;
    this.timerIndicator = timerIndicator;
    this.dialog = dialog;

    this.state = {
      loading: true,
      connected: false,
      error: false,
      fanOn: 0,
      speed: 0,
      swing: 0,
    };
  }

  /**
   * Update state and UI
   * @param {Object} newState - State to set
   */
  setState(newState) {
    this.state = Object.assign(this.state, newState);

    // Update the UI after setting new state
    this.updateUi();
  }

  // Check whether the connection to the fan is established or not
  connect() {
    this.setState({ loading: true, error: false });
    fetch(this.address)
      .then((res) => res.json())
      .then((json) => {
        this.setState({ ...json, loading: false });
      })
      .catch((e) => {
        this.setState({ error: true, loading: false });
      });
  }

  /**
   * Toggle the fan ON/OFF
   * @param {String} cmd - "on" or "off"
   */
  turn(cmd) {
    fetch(`${this.address}/${cmd}`)
      .then((res) => res.json())
      .then((json) => this.setState(json))
      .catch((e) => this.setState({ error: true }));
  }

  /**
   * Toggle the swing
   * @param {string} cmd - "On" or "Off"
   */
  swing(cmd) {
    fetch(`${this.address}/swing${cmd}`)
      .then((res) => res.json())
      .then((json) => this.setState(json))
      .catch((e) => this.setState({ error: true }));
  }

  /**
   * Handle the fan speed
   * @param {string} speed - <One/Two/Three>
   */
  speed(speed) {
    fetch(`${this.address}/speed${speed}`)
      .then((res) => res.json())
      .then((json) => this.setState(json))
      .catch((e) => this.setState({ error: true }));
  }

  // Function to update UI on every state change
  updateUi() {
    !this.state.loading && this.state.error
      ? this.dialog.show()
      : this.dialog.close();

    this.pwrBtnLbl.style.background = this.state.fanOn
      ? "url(./assets/power-on.svg)"
      : "url(./assets/power-off.svg)";

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
    reconnectBtn = document.getElementById("reconnect-btn"),
    dialog = document.getElementsByTagName("dialog")[0];

  // Read fan IP address from local storage
  let fanIp = localStorage.getItem("fanIp");

  // If IP is not set, open the modal
  if (!fanIp) {
    modal.style.display = "flex";
  } else {
    currentIp.innerText = fanIp + "/";
  }

  // Show the modal on clicking setting button
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

  // Add listeners to the buttons
  pwrBtn.addEventListener("click", () => {
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
      return showSnack(snackbar, "alert", "Turn on the fan first.");
    fan.state.fanOn ? fan.speed("One") : null;
  });

  speedTwoBtn.addEventListener("click", () => {
    if (!fan.state.fanOn)
      return showSnack(snackbar, "alert", "Turn on the fan first.");
    fan.state.fanOn ? fan.speed("Two") : null;
  });

  speedThreeBtn.addEventListener("click", () => {
    if (!fan.state.fanOn)
      return showSnack(snackbar, "alert", "Turn on the fan first.");
    fan.state.fanOn ? fan.speed("Three") : null;
  });

  swingBtn.addEventListener("click", () => {
    if (!fan.state.fanOn)
      return showSnack(snackbar, "alert", "Turn on the fan first.");
    fan.state.fanOn && !fan.state.swing ? fan.swing("On") : fan.swing("Off");
  });

  reconnectBtn.addEventListener("click", () => fan.connect());
};

/**
 * Function for validatting IP address
 * @param {ip} ip - IP address of the fan entered by the user
 * @returns {boolean} - True if valid IP address is entered else False
 */
function validateIp(ip) {
  const regex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  return regex.test(ip);
}

/**
 *
 * @param {HTMLElement} snack - Snack element
 * @param {string} type - Type of the snackbar
 * @param {string} message - Message to display
 */
function showSnack(snack, type, message) {
  let timer;
  snack.innerText = message;
  snack.className = type;

  clearTimeout(timer);
  timer = setTimeout(() => {
    snack.className = "";
  }, 2000);
}
