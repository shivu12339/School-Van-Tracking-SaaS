import 'package:equatable/equatable.dart';

class VanLocation extends Equatable {
  const VanLocation({
    required this.tripId,
    required this.latitude,
    required this.longitude,
    this.speed,
    this.heading,
    required this.timestamp,
  });

  final String tripId;
  final double latitude;
  final double longitude;
  final double? speed;
  final double? heading;
  final DateTime timestamp;

  factory VanLocation.fromJson(Map<String, dynamic> json) => VanLocation(
        tripId: json['tripId'] as String,
        latitude: (json['latitude'] as num).toDouble(),
        longitude: (json['longitude'] as num).toDouble(),
        speed: (json['speed'] as num?)?.toDouble(),
        heading: (json['heading'] as num?)?.toDouble(),
        timestamp: DateTime.parse(json['timestamp'] as String),
      );

  @override
  List<Object?> get props => [tripId, latitude, longitude, timestamp];
}

class EtaInfo {
  const EtaInfo({
    required this.etaMinutes,
    required this.distanceMeters,
    required this.updatedAt,
  });

  final int etaMinutes;
  final double distanceMeters;
  final DateTime updatedAt;

  factory EtaInfo.fromJson(Map<String, dynamic> json) => EtaInfo(
        etaMinutes: (json['etaMinutes'] as num).toInt(),
        distanceMeters: (json['distanceMeters'] as num).toDouble(),
        updatedAt: DateTime.parse(json['updatedAt'] as String),
      );
}
