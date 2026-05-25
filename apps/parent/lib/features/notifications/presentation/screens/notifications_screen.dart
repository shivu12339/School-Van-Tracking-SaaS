import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../providers/notifications_provider.dart';
import '../../data/notification_repository.dart';
import '../../domain/entities/app_notification.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_view.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scroll.position.pixels >= _scroll.position.maxScrollExtent - 200) {
      ref.read(notificationsListProvider.notifier).loadMore();
    }
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final page = ref.watch(notificationsListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () async {
              await ref.read(notificationRepositoryProvider).markAllRead();
              ref.invalidate(notificationsListProvider);
              ref.invalidate(unreadCountProvider);
            },
            child: const Text('Read all'),
          ),
        ],
      ),
      body: page.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: e.toString(),
          onRetry: () => ref.read(notificationsListProvider.notifier).load(refresh: true),
        ),
        data: (data) {
          if (data.items.isEmpty) {
            return const Center(child: Text('No notifications yet'));
          }
          return RefreshIndicator(
            onRefresh: () => ref.read(notificationsListProvider.notifier).load(refresh: true),
            child: _NotificationList(
              scrollController: _scroll,
              items: data.items,
              hasMore: data.hasMore,
              onTap: (n) => _onTap(context, n),
            ),
          );
        },
      ),
    );
  }

  Future<void> _onTap(BuildContext context, AppNotification n) async {
    if (!n.isRead) {
      await ref.read(notificationsListProvider.notifier).markRead(n.id);
    }
    if (n.studentId != null && n.tripId != null && context.mounted) {
      context.push('/child/${n.studentId}/track');
    }
  }
}

class _NotificationList extends StatelessWidget {
  const _NotificationList({
    required this.scrollController,
    required this.items,
    required this.hasMore,
    required this.onTap,
  });

  final ScrollController scrollController;
  final List<AppNotification> items;
  final bool hasMore;
  final void Function(AppNotification) onTap;

  @override
  Widget build(BuildContext context) {
    final grouped = <String, List<AppNotification>>{};
    for (final n in items) {
      final key = DateFormat.yMMMMd().format(n.createdAt);
      grouped.putIfAbsent(key, () => []).add(n);
    }

    return ListView(
      controller: scrollController,
      children: [
        ...grouped.entries.expand((entry) {
          return [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Text(entry.key, style: Theme.of(context).textTheme.labelLarge),
            ),
            ...entry.value.map((n) {
              return ListTile(
                leading: Icon(
                  _iconForType(n.type),
                  color: n.isRead ? null : Theme.of(context).colorScheme.primary,
                ),
                title: Text(n.title),
                subtitle: Text(n.body),
                trailing: n.isRead ? null : const Icon(Icons.circle, size: 8),
                onTap: () => onTap(n),
              );
            }),
          ];
        }),
        if (hasMore)
          const Padding(
            padding: EdgeInsets.all(24),
            child: Center(child: CircularProgressIndicator()),
          ),
      ],
    );
  }

  IconData _iconForType(String type) {
    switch (type.toUpperCase()) {
      case 'GEOFENCE_1KM':
      case 'GEOFENCE_500M':
        return Icons.near_me;
      case 'STUDENT_PICKED':
        return Icons.login;
      case 'STUDENT_DROPPED':
        return Icons.logout;
      default:
        return Icons.notifications_outlined;
    }
  }
}
