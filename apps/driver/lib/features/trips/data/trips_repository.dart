import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/api_paths.dart';
import '../../../core/network/dio_client.dart';
import '../../students/domain/entities/trip_student.dart';
import '../domain/entities/trip.dart';

final tripsRepositoryProvider = Provider<TripsRepository>((ref) {
  return TripsRepository(ref.watch(dioProvider));
});

class TripsRepository {
  TripsRepository(this._client);
  final DioClient _client;

  Future<List<Trip>> getTodayTrips() async {
    final list = await _client.get<List<dynamic>>(
      ApiPaths.driverTrips,
      parser: (json) => json as List<dynamic>,
    );
    return list.map((e) => Trip.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<Trip>> getHistory() async {
    final list = await _client.get<List<dynamic>>(
      ApiPaths.driverTripsHistory,
      parser: (json) => json as List<dynamic>,
    );
    return list.map((e) => Trip.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Trip> getTrip(String tripId) async {
    return _client.get<Trip>(
      ApiPaths.driverTrip(tripId),
      parser: (json) => Trip.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<List<TripStudent>> getStudents(String tripId) async {
    final list = await _client.get<List<dynamic>>(
      ApiPaths.driverTripStudents(tripId),
      parser: (json) => json as List<dynamic>,
    );
    return list
        .map((e) => TripStudent.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
