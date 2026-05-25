import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../services/notifications/fcm_service.dart';
import '../../data/auth_repository.dart';
import '../../domain/entities/auth_user.dart';

final authStateProvider = StateNotifierProvider<AuthNotifier, AsyncValue<AuthUser?>>((ref) {
  return AuthNotifier(ref);
});

class AuthNotifier extends StateNotifier<AsyncValue<AuthUser?>> {
  AuthNotifier(this._ref) : super(const AsyncValue.loading()) {
    _init();
  }

  final Ref _ref;
  AuthRepository get _repo => _ref.read(authRepositoryProvider);

  Future<void> _init() async {
    state = await AsyncValue.guard(() => _repo.restore());
  }

  Future<void> login(String email, String password, String schoolCode) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => _repo.login(email: email, password: password, schoolCode: schoolCode),
    );
    if (state.hasValue && state.value != null) {
      try {
        await _ref.read(fcmServiceProvider).initialize();
      } catch (_) {}
    }
  }

  Future<void> logout() async {
    await _repo.logout();
    state = const AsyncValue.data(null);
  }
}
