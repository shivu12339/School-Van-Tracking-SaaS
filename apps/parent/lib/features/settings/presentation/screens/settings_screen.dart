import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../../config/app_config.dart';
import '../../../../core/network/dio_client.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  String _version = '';

  @override
  void initState() {
    super.initState();
    PackageInfo.fromPlatform().then((p) => setState(() => _version = p.version));
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authStateProvider).value;
    final config = ref.watch(appConfigProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          ListTile(
            title: Text(user?.email ?? ''),
            subtitle: Text('${user?.firstName ?? ''} ${user?.lastName ?? ''}'.trim()),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.cloud_outlined),
            title: const Text('Environment'),
            subtitle: Text(config.flavor.name),
          ),
          ListTile(
            leading: const Icon(Icons.security),
            title: const Text('Security'),
            subtitle: Text(config.enableSslPinning ? 'SSL pinning enabled' : 'Standard TLS'),
          ),
          ListTile(
            leading: const Icon(Icons.info_outline),
            title: const Text('App version'),
            subtitle: Text(_version),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text('Sign out', style: TextStyle(color: Colors.red)),
            onTap: () => ref.read(authStateProvider.notifier).logout(),
          ),
        ],
      ),
    );
  }
}
