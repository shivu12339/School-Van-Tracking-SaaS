import 'package:equatable/equatable.dart';

class AuthUser extends Equatable {
  const AuthUser({
    required this.id,
    required this.email,
    required this.role,
    this.schoolId,
    required this.firstName,
    this.lastName,
  });

  final String id;
  final String email;
  final String role;
  final String? schoolId;
  final String firstName;
  final String? lastName;

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
        id: json['id'] as String,
        email: json['email'] as String,
        role: json['role'] as String,
        schoolId: json['schoolId'] as String?,
        firstName: json['firstName'] as String? ?? '',
        lastName: json['lastName'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'role': role,
        'schoolId': schoolId,
        'firstName': firstName,
        'lastName': lastName,
      };

  @override
  List<Object?> get props => [id];
}
