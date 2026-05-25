import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/api_paths.dart';
import '../../../core/network/dio_client.dart';

final studentsRepositoryProvider = Provider<StudentsRepository>((ref) {
  return StudentsRepository(ref.watch(dioProvider));
});

class StudentsRepository {
  StudentsRepository(this._client);

  final DioClient _client;

  Future<void> markPicked(String tripId, String studentId) async {
    await _client.put(
      ApiPaths.trackingPickup(tripId, studentId),
      parser: (_) => null,
    );
  }

  Future<void> markDropped(String tripId, String studentId) async {
    await _client.put(
      ApiPaths.trackingDropoff(tripId, studentId),
      parser: (_) => null,
    );
  }
}
