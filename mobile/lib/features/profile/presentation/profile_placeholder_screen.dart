import 'package:flutter/material.dart';
import '../../../app/theme/app_colors.dart';

class ProfilePlaceholderScreen extends StatelessWidget {
  final String title;

  const ProfilePlaceholderScreen({
    super.key,
    this.title = 'User Profile',
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24.0),
          child: Text(
            'Candidate dossier and staff profile features will be integrated in Phase 2.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }
}
