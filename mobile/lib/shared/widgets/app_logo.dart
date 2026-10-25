import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../core/config/app_config.dart';

class AppLogo extends StatelessWidget {
  final double size;
  final bool showTagline;
  final bool lightVariant;

  const AppLogo({
    super.key,
    this.size = 54,
    this.showTagline = true,
    this.lightVariant = false,
  });

  @override
  Widget build(BuildContext context) {
    final titleColor = lightVariant ? AppColors.surfaceWhite : AppColors.corporateNavy;
    final subColor = lightVariant ? AppColors.corporatePink : AppColors.textSecondary;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Brand Mark Container
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: lightVariant ? AppColors.surfaceWhite.withOpacity(0.12) : AppColors.corporateNavy,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: lightVariant ? AppColors.corporatePink.withOpacity(0.4) : AppColors.corporatePink,
              width: 1.5,
            ),
          ),
          child: Center(
            child: Image.asset(
              'assets/brand/logo-mark.png',
              width: size * 0.7,
              height: size * 0.7,
              errorBuilder: (_, __, ___) => Icon(
                Icons.flight_takeoff_rounded,
                color: lightVariant ? AppColors.surfaceWhite : AppColors.corporatePink,
                size: size * 0.55,
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Text(
          AppConfig.appName,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: titleColor,
            letterSpacing: 1.2,
          ),
        ),
        if (showTagline) ...[
          const SizedBox(height: 2),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: AppColors.corporatePink.withOpacity(0.2),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              'RECRUITING LICENSE: ${AppConfig.recruitingLicense}',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: subColor,
                letterSpacing: 0.6,
              ),
            ),
          ),
        ],
      ],
    );
  }
}
