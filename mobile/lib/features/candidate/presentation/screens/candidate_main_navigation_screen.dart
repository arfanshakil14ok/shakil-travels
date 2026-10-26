import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/network/api_client.dart';
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
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppColors.surfaceWhite,
          boxShadow: [
            BoxShadow(
              color: Color(0x0F000000),
              offset: Offset(0, -2),
              blurRadius: 8,
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: _onTabSelected,
          type: BottomNavigationBarType.fixed,
          backgroundColor: AppColors.surfaceWhite,
          selectedItemColor: AppColors.corporateNavy,
          unselectedItemColor: AppColors.textDisabled,
          selectedFontSize: 11,
          unselectedFontSize: 11,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w700),
          unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500),
          elevation: 0,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.dashboard_rounded),
              activeIcon: Icon(
                Icons.dashboard_rounded,
                color: AppColors.corporateNavy,
              ),
              label: 'হোম',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.travel_explore_rounded),
              activeIcon: Icon(
                Icons.travel_explore_rounded,
                color: AppColors.corporateNavy,
              ),
              label: 'সার্কুলার',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.assignment_rounded),
              activeIcon: Icon(
                Icons.assignment_rounded,
                color: AppColors.corporateNavy,
              ),
              label: 'আবেদন',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.folder_shared_rounded),
              activeIcon: Icon(
                Icons.folder_shared_rounded,
                color: AppColors.corporateNavy,
              ),
              label: 'ডকুমেন্টস',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_rounded),
              activeIcon: Icon(
                Icons.person_rounded,
                color: AppColors.corporateNavy,
              ),
              label: 'প্রোফাইল',
            ),
          ],
        ),
      ),
    );
  }
}
