import 'package:flutter/material.dart';

class AppTheme {
  static ThemeData light() {
    const primary = Color(0xFF2563EB);
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(seedColor: primary, brightness: Brightness.light),
      appBarTheme: const AppBarTheme(centerTitle: false, elevation: 0),
      cardTheme: CardTheme(
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
    );
  }
}
