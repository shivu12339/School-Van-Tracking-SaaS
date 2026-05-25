import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:schoolvan_driver/features/auth/data/auth_repository.dart';
import 'package:schoolvan_driver/features/auth/domain/entities/auth_user.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late MockAuthRepository repo;

  setUp(() {
    repo = MockAuthRepository();
  });

  test('login returns AuthUser from repository', () async {
    const user = AuthUser(
      id: 'u1',
      email: 'd@test.com',
      role: 'DRIVER',
      schoolId: 's1',
      firstName: 'Driver',
      permissions: [],
    );
    when(() => repo.login(
          email: any(named: 'email'),
          password: any(named: 'password'),
          schoolCode: any(named: 'schoolCode'),
        )).thenAnswer((_) async => user);

    final result = await repo.login(
      email: 'd@test.com',
      password: 'pass',
      schoolCode: 'SVT',
    );
    expect(result.id, 'u1');
    expect(result.role, 'DRIVER');
  });
}
