class GpsPoint {
  GpsPoint({
    required this.tripId,
    required this.latitude,
    required this.longitude,
    required this.speed,
    required this.heading,
    required this.timestamp,
    this.accuracy,
  });

  final String tripId;
  final double latitude;
  final double longitude;
  final double speed;
  final double heading;
  final DateTime timestamp;
  final double? accuracy;

  Map<String, dynamic> toJson() => {
        'tripId': tripId,
        ...toLocationJson(),
      };

  Map<String, dynamic> toLocationJson() => {
        'latitude': latitude,
        'longitude': longitude,
        'speed': speed,
        'heading': heading,
        'timestamp': timestamp.toUtc().toIso8601String(),
        if (accuracy != null) 'accuracy': accuracy,
      };

  factory GpsPoint.fromHive(Map<dynamic, dynamic> map) {
    return GpsPoint(
      tripId: map['tripId'] as String,
      latitude: (map['latitude'] as num).toDouble(),
      longitude: (map['longitude'] as num).toDouble(),
      speed: (map['speed'] as num).toDouble(),
      heading: (map['heading'] as num).toDouble(),
      timestamp: DateTime.parse(map['timestamp'] as String),
      accuracy: (map['accuracy'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toHive() => {
        'tripId': tripId,
        'latitude': latitude,
        'longitude': longitude,
        'speed': speed,
        'heading': heading,
        'timestamp': timestamp.toIso8601String(),
        'accuracy': accuracy,
      };
}
