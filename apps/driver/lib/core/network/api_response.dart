class ApiResponse<T> {
  ApiResponse({required this.success, required this.data, this.meta});

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Object? json) fromJsonT,
  ) {
    return ApiResponse(
      success: json['success'] as bool? ?? true,
      data: fromJsonT(json['data']),
      meta: json['meta'] as Map<String, dynamic>?,
    );
  }

  final bool success;
  final T data;
  final Map<String, dynamic>? meta;
}
