import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/errors/api_exception.dart';
import '../../../../core/network/api_client.dart';
import '../../../../shared/widgets/app_card.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_indicator.dart';
import 'package:shakil_travels/features/staff/data/staff_models.dart';
import 'package:shakil_travels/features/staff/data/staff_repository.dart';

class AdminAuditLogsScreen extends StatefulWidget {
  final StaffRepository? repository;

  const AdminAuditLogsScreen({super.key, this.repository});

  @override
  State<AdminAuditLogsScreen> createState() => _AdminAuditLogsScreenState();
}

class _AdminAuditLogsScreenState extends State<AdminAuditLogsScreen> {
  late final StaffRepository _repository;
  final _searchController = TextEditingController();

  bool _isLoading = true;
  String? _errorMessage;

  List<StaffAuditLogModel> _logs = [];
  int _totalCount = 0;

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? StaffRepository(apiClient: ApiClient());
    _loadLogs();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadLogs() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await _repository.getAuditLogs(
        search: _searchController.text.trim(),
        pageSize: 50,
      );

      if (mounted) {
        setState(() {
          _logs = res['logs'] as List<StaffAuditLogModel>;
          _totalCount = res['total'] as int? ?? _logs.length;
          _isLoading = false;
        });
      }
    } on NetworkException catch (_) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'ইন্টারনেট সংযোগ পাওয়া যায়নি। পুনরায় চেষ্টা করুন।';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = e.toString().replaceFirst('ApiException: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      appBar: AppBar(
        title: Text('সিস্টেম অডিট লগ ট্রেইল ($_totalCount)'),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _isLoading ? null : _loadLogs,
            tooltip: 'রিফ্রেশ করুন',
          ),
        ],
      ),
      body: Column(
        children: [
          _buildSearchBar(),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      color: AppColors.surfaceWhite,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: 'একশন বা বিবরণ দিয়ে খুঁজুন (উদা: LOGIN, VERIFY)...',
          hintStyle: const TextStyle(
            fontSize: 12,
            color: AppColors.textDisabled,
          ),
          prefixIcon: const Icon(
            Icons.search_rounded,
            size: 20,
            color: AppColors.corporateNavy,
          ),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear_rounded, size: 18),
                  onPressed: () {
                    _searchController.clear();
                    _loadLogs();
                  },
                )
              : null,
          filled: true,
          fillColor: AppColors.pageBackground,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 14,
            vertical: 10,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: AppColors.cardBorder),
          ),
        ),
        onSubmitted: (_) => _loadLogs(),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: LoadingIndicator(message: 'সার্ভার অডিট রেকর্ড লোড হচ্ছে...'),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: ErrorView(message: _errorMessage!, onRetry: _loadLogs),
        ),
      );
    }

    if (_logs.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.history_rounded,
                size: 48,
                color: AppColors.corporatePink,
              ),
              SizedBox(height: 12),
              Text(
                'কোনো অডিট রেকর্ড পাওয়া যায়নি',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.deepNavy,
                ),
              ),
              SizedBox(height: 6),
              Text(
                'সার্ভারে এই মুহূর্তে কোনো অডিট লগ নেই।',
                style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadLogs,
      color: AppColors.corporateNavy,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _logs.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (context, index) {
          final log = _logs[index];
          return _buildAuditLogCard(log);
        },
      ),
    );
  }

  Widget _buildAuditLogCard(StaffAuditLogModel log) {
    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.corporateNavy.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  log.action,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: AppColors.corporateNavy,
                  ),
                ),
              ),
              Text(
                log.createdAt.replaceFirst('T', ' ').split('.').first,
                style: const TextStyle(
                  fontSize: 10,
                  color: AppColors.textDisabled,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            log.description ?? log.entity,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.deepNavy,
            ),
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'ইউজার: ${log.userName ?? 'System'}',
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.textSecondary,
                ),
              ),
              if (log.ipAddress != null)
                Text(
                  'IP: ${log.ipAddress}',
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppColors.textDisabled,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
