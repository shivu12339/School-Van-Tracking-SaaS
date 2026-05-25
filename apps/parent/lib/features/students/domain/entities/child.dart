import 'package:equatable/equatable.dart';

class Child extends Equatable {
  const Child({
    required this.id,
    required this.fullName,
    this.grade,
    this.section,
    this.homeLatitude,
    this.homeLongitude,
  });

  final String id;
  final String fullName;
  final String? grade;
  final String? section;
  final double? homeLatitude;
  final double? homeLongitude;

  factory Child.fromJson(Map<String, dynamic> json) => Child(
        id: json['id'] as String,
        fullName: json['fullName'] as String,
        grade: json['grade'] as String?,
        section: json['section'] as String?,
        homeLatitude: _dbl(json['homeLatitude']),
        homeLongitude: _dbl(json['homeLongitude']),
      );

  static double? _dbl(dynamic v) => v == null ? null : double.tryParse(v.toString());

  @override
  List<Object?> get props => [id];
}
