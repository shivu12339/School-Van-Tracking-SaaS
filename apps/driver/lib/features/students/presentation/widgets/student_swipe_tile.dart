import 'package:flutter/material.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import '../../domain/entities/trip_student.dart';

class StudentSwipeTile extends StatelessWidget {
  const StudentSwipeTile({
    super.key,
    required this.student,
    required this.onPicked,
    required this.onDropped,
  });

  final TripStudent student;
  final VoidCallback onPicked;
  final VoidCallback onDropped;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Slidable(
        key: ValueKey(student.id),
        startActionPane: student.isPending
            ? ActionPane(
                motion: const DrawerMotion(),
                children: [
                  SlidableAction(
                    onPressed: (_) => onPicked(),
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                    icon: Icons.check,
                    label: 'PICKED',
                  ),
                ],
              )
            : null,
        endActionPane: student.isPicked
            ? ActionPane(
                motion: const DrawerMotion(),
                children: [
                  SlidableAction(
                    onPressed: (_) => onDropped(),
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                    icon: Icons.flag,
                    label: 'DROP',
                  ),
                ],
              )
            : null,
        child: Card(
          child: ListTile(
            title: Text(student.fullName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            subtitle: Text('${student.status}${student.grade != null ? ' · ${student.grade}' : ''}'),
            trailing: _statusIcon(student.status),
          ),
        ),
      ),
    );
  }

  Widget _statusIcon(String status) {
    switch (status) {
      case 'PICKED':
        return const Icon(Icons.directions_bus, color: Colors.green);
      case 'DROPPED':
        return const Icon(Icons.home, color: Colors.blue);
      default:
        return const Icon(Icons.schedule, color: Colors.orange);
    }
  }
}
