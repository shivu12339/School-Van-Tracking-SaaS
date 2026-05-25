import 'package:equatable/equatable.dart';

class DriverProfile extends Equatable {
  const DriverProfile({
    required this.driverName,
    this.driverPhone,
    this.vanRegistration,
    this.vanLabel,
    this.routeName,
    this.routeDirection,
    this.tripId,
  });

  final String driverName;
  final String? driverPhone;
  final String? vanRegistration;
  final String? vanLabel;
  final String? routeName;
  final String? routeDirection;
  final String? tripId;

  factory DriverProfile.fromActiveTrip(Map<String, dynamic> active) {
    final trip = active['trip'] as Map<String, dynamic>? ?? active;
    if (trip['id'] == null && active['tripId'] != null) {
      return DriverProfile(
        driverName: 'Driver',
        tripId: active['tripId'] as String?,
      );
    }
    final driver = trip['driver'] as Map<String, dynamic>?;
    final user = driver?['user'] as Map<String, dynamic>?;
    final van = trip['van'] as Map<String, dynamic>?;
    final route = trip['route'] as Map<String, dynamic>?;
    final name = user != null
        ? '${user['firstName']} ${user['lastName'] ?? ''}'.trim()
        : 'Driver';
    return DriverProfile(
      driverName: name,
      driverPhone: user?['phone'] as String?,
      vanRegistration: van?['registrationNo'] as String?,
      vanLabel: van?['label'] as String?,
      routeName: route?['routeName'] as String?,
      routeDirection: route?['direction'] as String?,
      tripId: trip['id'] as String?,
    );
  }

  @override
  List<Object?> get props => [driverName, tripId];
}
