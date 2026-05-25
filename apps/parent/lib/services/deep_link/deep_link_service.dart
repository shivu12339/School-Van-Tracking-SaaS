import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:uni_links/uni_links.dart';

final deepLinkServiceProvider = Provider<DeepLinkService>((ref) => DeepLinkService());

class DeepLinkService {
  StreamSubscription? _sub;

  Future<void> init(GoRouter router) async {
    try {
      final initial = await getInitialUri();
      if (initial != null) _route(router, initial);
    } catch (_) {}

    _sub = uriLinkStream.listen((uri) {
      if (uri != null) _route(router, uri);
    });
  }

  void _route(GoRouter router, Uri uri) {
    // schoolvan://track/{studentId}
    if (uri.scheme == 'schoolvan' && uri.host == 'track') {
      final studentId = uri.pathSegments.isNotEmpty ? uri.pathSegments.first : null;
      if (studentId != null && studentId.isNotEmpty) {
        router.go('/child/$studentId/track');
      }
      return;
    }
    // https://app.schoolvan.app/track/{studentId}
    final segments = uri.pathSegments;
    if (segments.length >= 2 && segments.first == 'track') {
      router.go('/child/${segments[1]}/track');
    } else if (segments.isNotEmpty && segments.first == 'notifications') {
      router.go('/notifications');
    }
  }

  void dispose() => _sub?.cancel();
}
