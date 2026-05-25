import 'package:equatable/equatable.dart';

class Trip extends Equatable {
  const Trip({
    required this.id,
    required this.status,
    required this.direction,
    required this.tripDate,
    this.routeName,
    this.vanRegistration,
    this.studentCount = 0,
  });

  final String id;
  final String status;
  final String direction;
  final DateTime tripDate;
  final String? routeName;
  final String? vanRegistration;
  final int studentCount;

  factory Trip.fromJson(Map<String, dynamic> json) {
    final van = json['van'] as Map<String, dynamic>?;
    final route = json['route'] as Map<String, dynamic>?;
    final count = json['_count'] as Map<String, dynamic>?;
    return Trip(
      id: json['id'] as String,
      status: json['status'] as String,
      direction: json['direction'] as String,
      tripDate: DateTime.parse(json['tripDate'] as String),
      routeName: route?['routeName'] as String?,
      vanRegistration: van?['registrationNo'] as String?,
      studentCount: count?['tripStudents'] as int? ?? 0,
    );
  }

  bool get isActive => status == 'IN_PROGRESS';

  @override
  List<Object?> get props => [id, status];
}
