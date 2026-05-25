import 'package:hive_flutter/hive_flutter.dart';

class HiveBoxes {
  static const gpsQueue = 'gps_queue';
  static const actionQueue = 'action_queue';
  static const activeTrip = 'active_trip';

  static Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox<Map>(gpsQueue);
    await Hive.openBox<Map>(actionQueue);
    await Hive.openBox(activeTrip);
  }

  static Box<Map> get gps => Hive.box<Map>(gpsQueue);
  static Box<Map> get actions => Hive.box<Map>(actionQueue);
  static Box get trip => Hive.box(activeTrip);
}
