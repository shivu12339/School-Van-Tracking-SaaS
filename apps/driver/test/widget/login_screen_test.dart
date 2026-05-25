import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:schoolvan_driver/features/auth/presentation/screens/login_screen.dart';

void main() {
  testWidgets('driver login screen renders sign in', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(home: LoginScreen()),
      ),
    );

    expect(find.text('Sign in'), findsOneWidget);
    expect(find.text('School Van Driver'), findsOneWidget);
  });
}
