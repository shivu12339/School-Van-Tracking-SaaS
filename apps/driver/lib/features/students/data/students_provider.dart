import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../trips/data/trips_repository.dart';
import '../domain/entities/trip_student.dart';
import 'students_repository.dart';
import '../../../../services/socket/tracking_socket_manager.dart';
import '../../../../services/sync/offline_sync_service.dart';

final tripStudentsProvider = FutureProvider.family<List<TripStudent>, String>((ref, tripId) {
  return ref.watch(tripsRepositoryProvider).getStudents(tripId);
});

final studentActionsProvider = StateNotifierProvider<StudentActionsNotifier, AsyncValue<void>>((ref) {
  return StudentActionsNotifier(ref);
});

class StudentActionsNotifier extends StateNotifier<AsyncValue<void>> {
  StudentActionsNotifier(this._ref) : super(const AsyncValue.data(null));

  final Ref _ref;

  Future<void> markPicked(String tripId, String studentId) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final socket = _ref.read(trackingSocketProvider);
      final offline = _ref.read(offlineSyncServiceProvider);
      final students = _ref.read(studentsRepositoryProvider);

      if (await offline.isOnline()) {
        if (socket.isConnected) {
          socket.emitStudentPicked(tripId, studentId);
        }
        await students.markPicked(tripId, studentId);
      } else {
        await offline.enqueueAction('student_picked', {
          'tripId': tripId,
          'studentId': studentId,
        });
        if (socket.isConnected) {
          socket.emitStudentPicked(tripId, studentId);
        }
      }
      _ref.invalidate(tripStudentsProvider(tripId));
    });
  }

  Future<void> markDropped(String tripId, String studentId) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final socket = _ref.read(trackingSocketProvider);
      final offline = _ref.read(offlineSyncServiceProvider);
      final students = _ref.read(studentsRepositoryProvider);

      if (await offline.isOnline()) {
        if (socket.isConnected) {
          socket.emitStudentDropped(tripId, studentId);
        }
        await students.markDropped(tripId, studentId);
      } else {
        await offline.enqueueAction('student_dropped', {
          'tripId': tripId,
          'studentId': studentId,
        });
        if (socket.isConnected) {
          socket.emitStudentDropped(tripId, studentId);
        }
      }
      _ref.invalidate(tripStudentsProvider(tripId));
    });
  }
}
