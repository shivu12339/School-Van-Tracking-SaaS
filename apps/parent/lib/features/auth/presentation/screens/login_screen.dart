import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import '../../../../shared/theme/design_tokens.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _email = TextEditingController(text: 'parent@demo-school.app');
  final _password = TextEditingController();
  final _schoolCode = TextEditingController(text: 'SVT-DEMO-001');

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _schoolCode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider);

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 48),
              Text('School Van', style: Theme.of(context).textTheme.headlineMedium),
              Text('Parent', style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: AppColors.primary)),
              const SizedBox(height: 8),
              const Text('Track your child\'s ride in real time'),
              const SizedBox(height: 32),
              TextField(
                controller: _email,
                decoration: const InputDecoration(labelText: 'Email'),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: AppSpacing.md),
              TextField(
                controller: _password,
                decoration: const InputDecoration(labelText: 'Password'),
                obscureText: true,
              ),
              const SizedBox(height: AppSpacing.md),
              TextField(
                controller: _schoolCode,
                decoration: const InputDecoration(labelText: 'School code'),
              ),
              const SizedBox(height: AppSpacing.lg),
              if (auth.hasError)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(auth.error.toString(), style: const TextStyle(color: AppColors.danger)),
                ),
              FilledButton(
                onPressed: auth.isLoading
                    ? null
                    : () => ref.read(authStateProvider.notifier).login(
                          _email.text.trim(),
                          _password.text,
                          _schoolCode.text.trim(),
                        ),
                child: Text(auth.isLoading ? 'Signing in…' : 'Sign in'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
