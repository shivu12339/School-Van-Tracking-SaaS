import 'package:flutter/material.dart';
import 'design_tokens.dart';

class AppTheme {
  static ThemeData light() {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: AppColors.surface,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        brightness: Brightness.light,
        surface: AppColors.surface,
      ),
      appBarTheme: const AppBarTheme(
        centerTitle: false,
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
      ),
      cardTheme: CardTheme(
        color: AppColors.card,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.lg),
          side: const BorderSide(color: AppColors.border),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.primary,
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadii.md)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadii.md)),
      ),
      textTheme: const TextTheme(
        headlineMedium: TextStyle(
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
          letterSpacing: -0.5,
        ),
        titleLarge: TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary),
        bodyMedium: TextStyle(color: AppColors.textSecondary),
        labelLarge: TextStyle(fontWeight: FontWeight.w600),
      ),
    );
  }
}
