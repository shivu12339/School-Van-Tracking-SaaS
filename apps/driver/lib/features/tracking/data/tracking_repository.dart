import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/api_paths.dart';
import '../../../core/network/dio_client.dart';
import '../domain/entities/gps_point.dart';

final trackingRepositoryProvider = Provider<TrackingRepository>((ref) {
  return TrackingRepository(ref.watch(dioProvider));
});

class TrackingRepository {
  TrackingRepository(this._client);
  final DioClient _client;

  Future<void> startTrip(String tripId) async {
    await _client.post(
      ApiPaths.trackingStart,
      data: {'tripId': tripId},
      parser: (_) => null,
    );
  }

  Future<void> stopTrip(String tripId) async {
    await _client.post(
      ApiPaths.trackingStop,
      data: {'tripId': tripId},
      parser: (_) => null,
    );
  }

  Future<void> pushLocation(GpsPoint point) async {
    await _client.post(
      ApiPaths.trackingLocation,
      data: point.toJson(),
      parser: (_) => null,
    );
  }

  Future<void> syncOffline(String tripId, List<GpsPoint> points) async {
    await _client.post(
      ApiPaths.trackingSync,
      data: {
        'tripId': tripId,
        'points': points.map((p) => p.toLocationJson()).toList(),
      },
      parser: (_) => null,
    );
  }

  Future<void> triggerSos({
    required String tripId,
    double? latitude,
    double? longitude,
    String? description,
  }) async {
    await _client.post(
      ApiPaths.trackingSos(tripId),
      data: {
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
        if (description != null) 'description': description,
      },
      parser: (_) => null,
    );
  }
}
