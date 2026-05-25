import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../services/notifications/fcm_service.dart';
import '../../data/auth_repository.dart';
import '../../domain/entities/auth_user.dart';

final authStateProvider =
    StateNotifierProvider<AuthNotifier, AsyncValue<AuthUser?>>((ref) {
  return AuthNotifier(ref);
});

class AuthNotifier extends StateNotifier<AsyncValue<AuthUser?>> {
  AuthNotifier(this._ref) : super(const AsyncValue.loading()) {
    _restore();
  }

  final Ref _ref;
  AuthRepository get _repository => _ref.read(authRepositoryProvider);

  Future<void> _restore() async {
    try {
      final user = await _repository.restoreSession();
      state = AsyncValue.data(user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> login(String email, String password, String schoolCode) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => _repository.login(
        email: email,
        password: password,
        schoolCode: schoolCode,
      ),
    );
    if (state.hasValue && state.value != null) {
      try {
        await _ref.read(fcmServiceProvider).initialize();
      } catch (_) {}
    }
  }

  Future<void> logout() async {
    await _repository.logout();
    state = const AsyncValue.data(null);
  }
}
