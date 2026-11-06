import 'package:flutter/material.dart';

import '../../../../shared/widgets/app_bottom_navigation.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/security/secure_storage.dart';
import 'package:shakil_travels/features/auth/data/auth_repository.dart';
import 'package:shakil_travels/features/auth/data/session_model.dart';
import 'package:shakil_travels/features/candidate/data/candidate_repository.dart';
import 'candidate_applications_screen.dart';
import 'candidate_dashboard_screen.dart';
import 'candidate_documents_screen.dart';
import 'candidate_jobs_screen.dart';
import 'candidate_profile_screen.dart';

class CandidateMainNavigationScreen extends StatefulWidget {
  final SessionModel session;
  final int initialTabIndex;
  final CandidateRepository? repository;
  final AuthRepository? authRepository;

  const CandidateMainNavigationScreen({
    super.key,
    required this.session,
    this.initialTabIndex = 0,
    this.repository,
    this.authRepository,
  });

  @override
  State<CandidateMainNavigationScreen> createState() =>
      _CandidateMainNavigationScreenState();
}

class _CandidateMainNavigationScreenState
    extends State<CandidateMainNavigationScreen> {
  late int _currentIndex;
  late final CandidateRepository _repository;
  late final AuthRepository _authRepository;

  @override
  void initState() {
    super.initState();
    SecureStorageService.warmSession(
      token: widget.session.token,
      role: widget.session.role,
    );
    _currentIndex = widget.initialTabIndex;
    _repository =
        widget.repository ?? CandidateRepository(apiClient: ApiClient());
    _authRepository =
        widget.authRepository ?? AuthRepository(apiClient: ApiClient());
  }

  void _onTabSelected(int index) {
    if (_currentIndex != index) {
      setState(() {
        _currentIndex = index;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: [
          CandidateDashboardScreen(
            session: widget.session,
            repository: _repository,
            onNavigateTab: _onTabSelected,
          ),
          CandidateJobsScreen(repository: _repository),
          CandidateApplicationsScreen(
            repository: _repository,
            onNavigateTab: _onTabSelected,
          ),
          CandidateDocumentsScreen(repository: _repository),
          CandidateProfileScreen(
            session: widget.session,
            repository: _repository,
            authRepository: _authRepository,
          ),
        ],
      ),
      bottomNavigationBar: AppBottomNavigation(
        currentIndex: _currentIndex,
        onTap: _onTabSelected,
        items: const [
          AppBottomNavItem(
            icon: Icons.dashboard_rounded,
            label: 'হোম',
            tooltip: 'ক্যান্ডিডেট ড্যাশবোর্ড',
          ),
          AppBottomNavItem(
            icon: Icons.travel_explore_rounded,
            label: 'সার্কুলার',
            tooltip: 'চাকরির সার্কুলার',
          ),
          AppBottomNavItem(
            icon: Icons.assignment_rounded,
            label: 'আবেদন',
            tooltip: 'আমার আবেদনসমূহ',
          ),
          AppBottomNavItem(
            icon: Icons.folder_shared_rounded,
            label: 'ডকুমেন্টস',
            tooltip: 'কাগজপত্র ও পাসপোর্ট',
          ),
          AppBottomNavItem(
            icon: Icons.person_rounded,
            label: 'প্রোফাইল',
            tooltip: 'প্রোফাইল সেটিংস',
          ),
        ],
      ),
    );
  }
}
