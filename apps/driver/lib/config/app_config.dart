enum AppFlavor { dev, staging, prod }

class AppConfig {
  const AppConfig({
    required this.flavor,
    required this.apiBaseUrl,
    required this.wsBaseUrl,
    required this.googleMapsApiKey,
    this.enableSslPinning = false,
  });

  final AppFlavor flavor;
  final String apiBaseUrl;
  final String wsBaseUrl;
  final String googleMapsApiKey;
  final bool enableSslPinning;

  static AppConfig fromFlavor(String flavor) {
    switch (flavor) {
      case 'prod':
        return const AppConfig(
          flavor: AppFlavor.prod,
          apiBaseUrl: 'https://api.schoolvan.app/api/v1',
          wsBaseUrl: 'https://api.schoolvan.app',
          googleMapsApiKey: String.fromEnvironment('GOOGLE_MAPS_KEY'),
          enableSslPinning: true,
        );
      case 'staging':
        return const AppConfig(
          flavor: AppFlavor.staging,
          apiBaseUrl: 'https://staging-api.schoolvan.app/api/v1',
          wsBaseUrl: 'https://staging-api.schoolvan.app',
          googleMapsApiKey: String.fromEnvironment('GOOGLE_MAPS_KEY'),
        );
      default:
        return const AppConfig(
          flavor: AppFlavor.dev,
          apiBaseUrl: 'http://10.0.2.2:4000/api/v1',
          wsBaseUrl: 'http://10.0.2.2:4000',
          googleMapsApiKey: String.fromEnvironment('GOOGLE_MAPS_KEY'),
        );
    }
  }
}
