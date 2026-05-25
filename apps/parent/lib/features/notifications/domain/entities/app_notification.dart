import 'package:equatable/equatable.dart';

class AppNotification extends Equatable {
  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.createdAt,
    this.readAt,
    this.tripId,
    this.studentId,
  });

  final String id;
  final String title;
  final String body;
  final String type;
  final DateTime createdAt;
  final DateTime? readAt;
  final String? tripId;
  final String? studentId;

  bool get isRead => readAt != null;

  factory AppNotification.fromJson(Map<String, dynamic> json) => AppNotification(
        id: json['id'] as String,
        title: json['title'] as String? ?? 'Notification',
        body: json['body'] as String? ?? '',
        type: json['type'] as String? ?? 'GENERAL',
        createdAt: DateTime.parse(json['createdAt'] as String),
        readAt: json['readAt'] != null ? DateTime.parse(json['readAt'] as String) : null,
        tripId: json['tripId'] as String?,
        studentId: json['studentId'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'body': body,
        'type': type,
        'createdAt': createdAt.toIso8601String(),
        'readAt': readAt?.toIso8601String(),
        'tripId': tripId,
        'studentId': studentId,
      };

  @override
  List<Object?> get props => [id];
}
