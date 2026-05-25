import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../domain/entities/driver_profile.dart';
import '../../../../shared/theme/design_tokens.dart';

class DriverProfileScreen extends StatelessWidget {
  const DriverProfileScreen({super.key, required this.profile});

  final DriverProfile profile;

  Future<void> _callDriver(BuildContext context) async {
    final phone = profile.driverPhone;
    if (phone == null || phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No phone number on file')),
      );
      return;
    }
    final uri = Uri(scheme: 'tel', path: phone);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Driver & van')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          Card(
            child: ListTile(
              leading: const CircleAvatar(child: Icon(Icons.person)),
              title: Text(profile.driverName),
              subtitle: const Text('Assigned driver'),
              trailing: profile.driverPhone != null
                  ? IconButton(
                      icon: const Icon(Icons.phone),
                      onPressed: () => _callDriver(context),
                    )
                  : null,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.directions_bus),
                  title: Text(profile.vanRegistration ?? 'Van'),
                  subtitle: Text(profile.vanLabel ?? 'School transport'),
                ),
                if (profile.routeName != null)
                  ListTile(
                    leading: const Icon(Icons.route),
                    title: Text(profile.routeName!),
                    subtitle: Text(profile.routeDirection ?? ''),
                  ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          if (profile.driverPhone != null)
            FilledButton.icon(
              onPressed: () => _callDriver(context),
              icon: const Icon(Icons.phone),
              label: const Text('Call driver'),
            ),
        ],
      ),
    );
  }
}
