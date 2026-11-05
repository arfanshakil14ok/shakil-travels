import 'package:flutter/material.dart';

/// SHAKIL TRAVELS Unified Spacing Scale
/// Standard 4dp/8dp spacing tokens for responsive, uniform UI layouts.
class AppSpacing {
  // Spacing Scale
  static const double xxs = 2.0;
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 20.0;
  static const double xxl = 24.0;
  static const double xxxl = 32.0;
  static const double huge = 48.0;

  // Edge Insets Presets
  static const EdgeInsets pagePadding = EdgeInsets.all(lg);
  static const EdgeInsets cardPadding = EdgeInsets.all(lg);
  static const EdgeInsets cardPaddingDense = EdgeInsets.all(md);
  static const EdgeInsets dialogPadding = EdgeInsets.all(xxl);
  static const EdgeInsets buttonPadding = EdgeInsets.symmetric(
    horizontal: xl,
    vertical: md,
  );
  static const EdgeInsets inputPadding = EdgeInsets.symmetric(
    horizontal: lg,
    vertical: md,
  );
  static const EdgeInsets horizontalScreen = EdgeInsets.symmetric(
    horizontal: lg,
  );
  static const EdgeInsets verticalScreen = EdgeInsets.symmetric(
    vertical: lg,
  );

  // Border Radius Scale
  static const double radiusXs = 4.0;
  static const double radiusSm = 6.0;
  static const double radiusMd = 8.0;
  static const double radiusLg = 10.0;
  static const double radiusXl = 12.0;
  static const double radiusXxl = 16.0;
  static const double radiusPill = 999.0;

  // BorderRadius Presets
  static const BorderRadius roundedSm = BorderRadius.all(
    Radius.circular(radiusSm),
  );
  static const BorderRadius roundedMd = BorderRadius.all(
    Radius.circular(radiusMd),
  );
  static const BorderRadius roundedLg = BorderRadius.all(
    Radius.circular(radiusLg),
  );
  static const BorderRadius roundedXl = BorderRadius.all(
    Radius.circular(radiusXl),
  );
  static const BorderRadius roundedPill = BorderRadius.all(
    Radius.circular(radiusPill),
  );

  // Minimum Touch Target (Accessibility requirement >= 48dp)
  static const double minTouchTarget = 48.0;
}
