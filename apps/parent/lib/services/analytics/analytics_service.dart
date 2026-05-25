import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:logger/logger.dart';

final analyticsProvider = Provider((_) => AnalyticsService());

/// Hook for Firebase Analytics / Segment — logs locally in dev.
class AnalyticsService {
  final _log = Logger(printer: PrettyPrinter(methodCount: 0));

  void track(String event, [Map<String, Object?>? props]) {
    _log.i('analytics: $event ${props ?? ''}');
  }

  void screen(String name) => track('screen_view', {'screen': name});
}
