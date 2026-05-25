import 'package:equatable/equatable.dart';

class TripStudent extends Equatable {
  const TripStudent({
    required this.id,
    required this.studentId,
    required this.fullName,
    required this.status,
    this.grade,
    this.stopName,
    this.latitude,
    this.longitude,
  });

  final String id;
  final String studentId;
  final String fullName;
  final String status;
  final String? grade;
  final String? stopName;
  final double? latitude;
  final double? longitude;

  factory TripStudent.fromJson(Map<String, dynamic> json) {
    final student = json['student'] as Map<String, dynamic>;
    final stop = json['stop'] as Map<String, dynamic>?;
    return TripStudent(
      id: json['id'] as String,
      studentId: student['id'] as String,
      fullName: student['fullName'] as String,
      status: json['status'] as String,
      grade: student['grade'] as String?,
      stopName: stop?['stopName'] as String?,
      latitude: _toDouble(student['homeLatitude']),
      longitude: _toDouble(student['homeLongitude']),
    );
  }

  static double? _toDouble(dynamic v) {
    if (v == null) return null;
    return double.tryParse(v.toString());
  }

  bool get isPending => status == 'PENDING';
  bool get isPicked => status == 'PICKED';
  bool get isDropped => status == 'DROPPED';

  @override
  List<Object?> get props => [id, status];
}
