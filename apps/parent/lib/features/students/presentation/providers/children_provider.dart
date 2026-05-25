import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/parent_repository.dart';
import '../../domain/entities/child.dart';

final childrenProvider = FutureProvider.autoDispose<List<Child>>((ref) async {
  return ref.watch(parentRepositoryProvider).getChildren();
});
