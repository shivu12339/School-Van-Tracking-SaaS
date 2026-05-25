import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/api_paths.dart';
import '../../../core/network/dio_client.dart';
import '../../tracking/domain/entities/van_location.dart';
import '../../../services/local/parent_cache.dart';
import '../domain/entities/child.dart';

final parentRepositoryProvider = Provider((ref) => ParentRepository(ref.watch(dioProvider)));

class ParentRepository {
  ParentRepository(this._client);
  final DioClient _client;

  Future<List<Child>> getChildren() async {
    try {
      final list = await _client.get<List<dynamic>>(
        ApiPaths.parentChildren,
        parser: (j) => j as List<dynamic>,
      );
      final children = list.map((e) => Child.fromJson(e as Map<String, dynamic>)).toList();
      await ParentCache.cacheChildren(
        children
            .map((c) => {
                  'id': c.id,
                  'fullName': c.fullName,
                  'grade': c.grade,
                  'section': c.section,
                  'homeLatitude': c.homeLatitude,
                  'homeLongitude': c.homeLongitude,
                })
            .toList(),
      );
      return children;
    } catch (_) {
      return ParentCache.getChildren().map(Child.fromJson).toList();
    }
  }

  Future<Map<String, dynamic>?> getActiveTrip(String studentId) async {
    try {
      return await _client.get<Map<String, dynamic>>(
        ApiPaths.parentActiveTrip(studentId),
        parser: (j) => j as Map<String, dynamic>?,
      );
    } catch (_) {
      return null;
    }
  }

  Future<Map<String, dynamic>> getTripOverview(String tripId, String studentId) async {
    return _client.get(
      ApiPaths.parentTripOverview(tripId, studentId),
      parser: (j) => j as Map<String, dynamic>,
    );
  }

  Future<VanLocation?> getLive(String tripId, String studentId) async {
    try {
      return await _client.get<VanLocation>(
        ApiPaths.parentLive(tripId),
        query: {'studentId': studentId},
        parser: (j) => j == null ? null : VanLocation.fromJson(j as Map<String, dynamic>),
      );
    } catch (_) {
      return null;
    }
  }

  Future<EtaInfo?> getEta(String tripId, String studentId) async {
    try {
      return await _client.get<EtaInfo>(
        ApiPaths.parentEta(tripId),
        query: {'studentId': studentId},
        parser: (j) => j == null ? null : EtaInfo.fromJson(j as Map<String, dynamic>),
      );
    } catch (_) {
      return null;
    }
  }

  Future<List<Map<String, dynamic>>> getPlayback(String tripId, String studentId) async {
    final list = await _client.get<List<dynamic>>(
      ApiPaths.parentPlayback(tripId),
      query: {'studentId': studentId},
      parser: (j) => j as List<dynamic>,
    );
    return list.cast<Map<String, dynamic>>();
  }

  Future<List<Map<String, dynamic>>> getTripHistory(String studentId) async {
    final list = await _client.get<List<dynamic>>(
      ApiPaths.parentTripHistory(studentId),
      parser: (j) => j as List<dynamic>,
    );
    return list.cast<Map<String, dynamic>>();
  }
}
