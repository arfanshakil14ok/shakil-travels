/// Supported application environments
enum EnvironmentType { development, staging, production }

/// Target platform host network context for development
enum DevHostMode {
  /// Standard Android Emulator loopback alias (maps to 127.0.0.1 on the host machine)
  androidEmulator,

  /// Physical Android device over local Wi-Fi / LAN (requires host machine IP, e.g. 192.168.1.50)
  physicalDeviceLan,

  /// Custom host / port override
  custom,
}
