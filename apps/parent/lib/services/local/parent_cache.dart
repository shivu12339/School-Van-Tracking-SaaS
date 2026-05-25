import 'package:hive_flutter/hive_flutter.dart';

class ParentCache {
  static const _boxName = 'parent_cache';

  static Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox(_boxName);
  }

  static Box get box => Hive.box(_boxName);

  static Future<void> cacheTripState(String studentId, Map<String, dynamic> state) async {
    await box.put('trip_$studentId', state);
  }

  static Map<String, dynamic>? getTripState(String studentId) {
    final raw = box.get('trip_$studentId');
    if (raw is Map) return Map<String, dynamic>.from(raw);
    return null;
  }

  static Future<void> cacheNotifications(List<Map<String, dynamic>> items) async {
    await box.put('notifications', items);
  }

  static List<Map<String, dynamic>> getNotifications() {
    final raw = box.get('notifications');
    if (raw is List) {
      return raw.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    }
    return [];
  }

  static Future<void> cacheChildren(List<Map<String, dynamic>> children) async {
    await box.put('children', children);
  }

  static List<Map<String, dynamic>> getChildren() {
    final raw = box.get('children');
    if (raw is List) {
      return raw.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    }
    return [];
  }
}
