import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';

class LocationPermissions {
  static Future<void> ensureAll() async {
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.deniedForever ||
        permission == LocationPermission.denied) {
      throw StateError('Location permission denied');
    }
    await Permission.notification.request();
    if (await Permission.ignoreBatteryOptimizations.isDenied) {
      await Permission.ignoreBatteryOptimizations.request();
    }
  }
}
