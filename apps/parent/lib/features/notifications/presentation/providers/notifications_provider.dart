import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/notification_repository.dart';
import '../../domain/entities/app_notification.dart';

final unreadCountProvider = FutureProvider.autoDispose<int>((ref) async {
  return ref.watch(notificationRepositoryProvider).unreadCount();
});

final notificationsListProvider =
    StateNotifierProvider.autoDispose<NotificationsListNotifier, AsyncValue<NotificationsPage>>((ref) {
  return NotificationsListNotifier(ref);
});

class NotificationsPage {
  const NotificationsPage({
    required this.items,
    required this.total,
    required this.page,
    required this.hasMore,
  });

  final List<AppNotification> items;
  final int total;
  final int page;
  final bool hasMore;
}

class NotificationsListNotifier extends StateNotifier<AsyncValue<NotificationsPage>> {
  NotificationsListNotifier(this._ref) : super(const AsyncValue.loading()) {
    load();
  }

  final Ref _ref;
  static const _pageSize = 20;

  Future<void> load({bool refresh = false}) async {
    if (refresh) state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final result = await _ref.read(notificationRepositoryProvider).list(page: 1, limit: _pageSize);
      return NotificationsPage(
        items: result.items,
        total: result.total,
        page: 1,
        hasMore: result.items.length < result.total,
      );
    });
  }

  Future<void> loadMore() async {
    final current = state.valueOrNull;
    if (current == null || !current.hasMore || state.isLoading) return;

    final nextPage = current.page + 1;
    try {
      final result = await _ref
          .read(notificationRepositoryProvider)
          .list(page: nextPage, limit: _pageSize);
      state = AsyncValue.data(NotificationsPage(
        items: [...current.items, ...result.items],
        total: result.total,
        page: nextPage,
        hasMore: current.items.length + result.items.length < result.total,
      ));
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> markRead(String id) async {
    await _ref.read(notificationRepositoryProvider).markRead(id);
    final current = state.valueOrNull;
    if (current == null) return;
    state = AsyncValue.data(NotificationsPage(
      items: current.items
          .map((n) => n.id == id ? AppNotification(
                id: n.id,
                title: n.title,
                body: n.body,
                type: n.type,
                createdAt: n.createdAt,
                readAt: DateTime.now(),
                tripId: n.tripId,
                studentId: n.studentId,
              ) : n)
          .toList(),
      total: current.total,
      page: current.page,
      hasMore: current.hasMore,
    ));
    _ref.invalidate(unreadCountProvider);
  }
}

/// Legacy alias for simple consumers.
final notificationsProvider = Provider.autoDispose<AsyncValue<List<AppNotification>>>((ref) {
  return ref.watch(notificationsListProvider).whenData((p) => p.items);
});
