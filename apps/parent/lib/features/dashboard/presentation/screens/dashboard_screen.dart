import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../students/presentation/providers/children_provider.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_view.dart';
import '../../../../shared/theme/design_tokens.dart';
import '../../../../core/network/connectivity_service.dart';
import '../../../notifications/presentation/providers/notifications_provider.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).value;
    final children = ref.watch(childrenProvider);
    final online = ref.watch(connectivityProvider).value ?? true;
    final unread = ref.watch(unreadCountProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Hi, ${user?.firstName ?? 'Parent'}'),
        actions: [
          IconButton(
            icon: Badge(
              isLabelVisible: (unread.valueOrNull ?? 0) > 0,
              label: Text('${unread.valueOrNull ?? 0}'),
              child: const Icon(Icons.notifications_outlined),
            ),
            onPressed: () => context.push('/notifications'),
          ),
          IconButton(icon: const Icon(Icons.settings_outlined), onPressed: () => context.push('/settings')),
        ],
      ),
      body: Column(
        children: [
          if (!online)
            Container(
              width: double.infinity,
              color: AppColors.warning.withValues(alpha: 0.15),
              padding: const EdgeInsets.all(8),
              child: const Text('Offline — showing cached data where available', textAlign: TextAlign.center),
            ),
          Expanded(
            child: children.when(
              loading: () => const LoadingView(message: 'Loading children…'),
              error: (e, _) => ErrorView(message: e.toString(), onRetry: () => ref.invalidate(childrenProvider)),
              data: (list) {
                if (list.isEmpty) {
                  return const Center(child: Text('No children linked to your account'));
                }
                return ListView.separated(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  itemCount: list.length,
                  separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
                  itemBuilder: (_, i) {
                    final child = list[i];
                    return Card(
                      child: ListTile(
                        leading: CircleAvatar(child: Text(child.fullName.characters.first)),
                        title: Text(child.fullName),
                        subtitle: Text([child.grade, child.section].where((e) => e != null).join(' • ')),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.push('/child/${child.id}'),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: 0,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.history), label: 'Trips'),
        ],
        onDestinationSelected: (i) {
          if (i == 1) {
            final first = children.valueOrNull?.first;
            if (first != null) context.push('/child/${first.id}/history');
          }
        },
      ),
    );
  }
}
