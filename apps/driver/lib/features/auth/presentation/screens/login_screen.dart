import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _email = TextEditingController();
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
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 48),
              Text('School Van Driver', style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 8),
              Text('Sign in to start your route', style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 32),
              TextField(
                controller: _email,
                decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _password,
                decoration: const InputDecoration(labelText: 'Password', border: OutlineInputBorder()),
                obscureText: true,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _schoolCode,
                decoration: const InputDecoration(labelText: 'School code', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 24),
              if (auth.hasError)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(auth.error.toString(), style: const TextStyle(color: Colors.red)),
                ),
              FilledButton(
                onPressed: auth.isLoading
                    ? null
                    : () => ref.read(authStateProvider.notifier).login(
                          _email.text.trim(),
                          _password.text,
                          _schoolCode.text.trim(),
                        ),
                child: Text(auth.isLoading ? 'Signing in...' : 'Sign in'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
