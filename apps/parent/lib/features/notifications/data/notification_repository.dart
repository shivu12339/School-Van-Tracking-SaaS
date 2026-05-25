import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/api_paths.dart';
import '../../../core/network/dio_client.dart';
import '../../../services/local/parent_cache.dart';
import '../domain/entities/app_notification.dart';

final notificationRepositoryProvider = Provider((ref) {
  return NotificationRepository(ref.watch(dioProvider));
});

class NotificationRepository {
  NotificationRepository(this._client);
  final DioClient _client;

  Future<({List<AppNotification> items, int total})> list({int page = 1, int limit = 20}) async {
    try {
      final data = await _client.get<Map<String, dynamic>>(
        ApiPaths.notifications,
        query: {'page': page, 'limit': limit},
        parser: (j) => j as Map<String, dynamic>,
      );
      final items = (data['items'] as List<dynamic>)
          .map((e) => AppNotification.fromJson(e as Map<String, dynamic>))
          .toList();
      final meta = data['meta'] as Map<String, dynamic>? ?? {};
      await ParentCache.cacheNotifications(items.map((e) => e.toJson()).toList());
      return (items: items, total: (meta['total'] as num?)?.toInt() ?? items.length);
    } catch (_) {
      final cached = ParentCache.getNotifications();
      final items = cached.map(AppNotification.fromJson).toList();
      return (items: items, total: items.length);
    }
  }

  Future<void> markRead(String id) async {
    await _client.patch(
      ApiPaths.notificationRead(id),
      parser: (_) => null,
    );
  }

  Future<int> unreadCount() async {
    try {
      final data = await _client.get<Map<String, dynamic>>(
        ApiPaths.notificationsUnreadCount,
        parser: (j) => j as Map<String, dynamic>,
      );
      return (data['unread'] as num?)?.toInt() ?? 0;
    } catch (_) {
      final cached = ParentCache.getNotifications();
      return cached.where((e) => e['readAt'] == null).length;
    }
  }

  Future<void> markAllRead() async {
    await _client.patch(
      ApiPaths.notificationsReadAll,
      parser: (_) => null,
    );
  }
}
