import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../core/errors/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/security/secure_storage.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_logo.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../data/auth_repository.dart';
import '../../admin/presentation/screens/admin_main_navigation_screen.dart';

class AdminLoginScreen extends StatefulWidget {
  final AuthRepository? authRepository;

  const AdminLoginScreen({super.key, this.authRepository});

  @override
  State<AdminLoginScreen> createState() => _AdminLoginScreenState();
}

class _AdminLoginScreenState extends State<AdminLoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _obscurePassword = true;
  bool _isLoading = false;
  String? _errorMessage;

  late final AuthRepository _authRepository;

  @override
  void initState() {
    super.initState();
    _authRepository = widget.authRepository ??
        AuthRepository(
          apiClient: ApiClient(),
          secureStorage: SecureStorageService(),
        );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submitLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final session = await _authRepository.loginAdmin(
        email: _emailController.text,
        password: _passwordController.text,
      );

      if (!mounted) return;

      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(
          builder: (_) => AdminMainNavigationScreen(session: session),
        ),
        (route) => false,
      );
    } on RateLimitException catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.message);
    } on UnauthorizedException catch (e) {
      if (!mounted) return;
      setState(
        () => _errorMessage = e.message.isNotEmpty
            ? e.message
            : 'Invalid administrator credentials',
      );
    } on ForbiddenException catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.message);
    } on NetworkException catch (_) {
      if (!mounted) return;
      setState(
        () => _errorMessage =
            'Cannot reach backend server. Please check your network connection.',
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e
            .toString()
            .replaceFirst('Exception: ', '')
            .replaceFirst('ApiException: ', '');
      });
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.pageBackground,
      appBar: AppBar(
        title: const Text('Admin Console / এডমিন লগইন'),
        backgroundColor: AppColors.deepNavy,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 10),
                const Center(child: AppLogo(size: 60)),
                const SizedBox(height: 16),
                const Text(
                  'Executive Operations & ERP',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.deepNavy,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Super Administrators & Enterprise Executive Management Only.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 24),
                if (_errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.errorLight,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: AppColors.error.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(
                          Icons.security_rounded,
                          color: AppColors.error,
                          size: 20,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: const TextStyle(
                              color: AppColors.error,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                AppCard(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      AppTextField(
                        controller: _emailController,
                        label: 'Admin Email (এডমিন ইমেইল)',
                        hint: 'admin@shakilglobal.com',
                        prefixIcon: Icons.admin_panel_settings_outlined,
                        keyboardType: TextInputType.emailAddress,
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) {
                            return 'Administrator email is required';
                          }
                          if (!val.contains('@') || !val.contains('.')) {
                            return 'Enter a valid corporate email';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      AppTextField(
                        controller: _passwordController,
                        label: 'Master Password (পাসওয়ার্ড)',
                        hint: 'Enter your administrator password',
                        prefixIcon: Icons.lock_outline_rounded,
                        obscureText: _obscurePassword,
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility_off_rounded
                                : Icons.visibility_rounded,
                            color: AppColors.textSecondary,
                            size: 20,
                          ),
                          onPressed: () {
                            setState(() {
                              _obscurePassword = !_obscurePassword;
                            });
                          },
                        ),
                        validator: (val) {
                          if (val == null || val.isEmpty) {
                            return 'Password is required';
                          }
                          return null;
                        },
                        onFieldSubmitted: (_) => _submitLogin(),
                      ),
                      const SizedBox(height: 24),
                      AppButton(
                        text: 'Authenticate Admin Session',
                        isLoading: _isLoading,
                        icon: Icons.vpn_key_rounded,
                        onPressed: _isLoading ? null : _submitLogin,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                const Center(
                  child: Text(
                    'SECURITY NOTICE: Role permissions are validated on the server for each operation.\nUnauthorized portal access attempts trigger security audit logs.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 11,
                      color: AppColors.textMuted,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
