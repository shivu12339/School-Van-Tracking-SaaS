import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:schoolvan_parent/app.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('parent app renders MaterialApp', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(child: SchoolVanParentApp()),
    );
    await tester.pumpAndSettle(const Duration(seconds: 3));
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
