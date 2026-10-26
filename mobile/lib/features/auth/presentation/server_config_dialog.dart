import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../app/theme/app_colors.dart';
import '../../../core/config/app_config.dart';

class ServerConfigDialog extends StatefulWidget {
  const ServerConfigDialog({super.key});

  static Future<void> show(BuildContext context) {
    return showDialog<void>(
      context: context,
      builder: (_) => const ServerConfigDialog(),
    );
  }

  @override
  State<ServerConfigDialog> createState() => _ServerConfigDialogState();
}

class _ServerConfigDialogState extends State<ServerConfigDialog> {
  late final TextEditingController _urlController;
  bool _isTesting = false;
  String? _testResult;
  bool _isSuccess = false;

  @override
  void initState() {
    super.initState();
    _urlController = TextEditingController(text: AppConfig.baseUrl);
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _testConnection() async {
    final targetUrl = _urlController.text.trim();
    if (targetUrl.isEmpty) return;

    setState(() {
      _isTesting = true;
      _testResult = null;
    });

    try {
      final dio = Dio(
        BaseOptions(
          connectTimeout: const Duration(seconds: 4),
          receiveTimeout: const Duration(seconds: 4),
        ),
      );
      final healthEndpoint = '$targetUrl/api/health';
      final response = await dio.get<Map<String, dynamic>>(healthEndpoint);

      if (response.statusCode == 200) {
        final data = response.data;
        final serviceName = data?['service'] ?? 'SHAKIL TRAVELS ERP';
        setState(() {
          _isTesting = false;
          _isSuccess = true;
          _testResult = '✓ Connected: $serviceName (Healthy)';
        });
      } else {
        setState(() {
          _isTesting = false;
          _isSuccess = false;
          _testResult = '✗ HTTP ${response.statusCode}: Unexpected status';
        });
      }
    } catch (e) {
      setState(() {
        _isTesting = false;
        _isSuccess = false;
        if (e is DioException) {
          _testResult = '✗ Cannot connect (${e.type.name}): Check Wi-Fi & IP';
        } else {
          _testResult = '✗ Error: $e';
        }
      });
    }
  }

  Future<void> _saveConfig() async {
    final url = _urlController.text.trim();
    if (url.isEmpty) return;

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('custom_server_url', url);
    } catch (_) {}

    AppConfig.updateApiBaseUrl(url);

    if (mounted) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Server updated to $url'),
          backgroundColor: AppColors.success,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Row(
        children: [
          Icon(Icons.dns_rounded, color: AppColors.corporateNavy),
          SizedBox(width: 8),
          Text(
            'Server Settings',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Configure the SHAKIL TRAVELS ERP server URL for this device:',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _urlController,
              decoration: InputDecoration(
                labelText: 'Server Base URL',
                hintText: 'http://192.168.0.127:3000',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 10,
                ),
              ),
              keyboardType: TextInputType.url,
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              children: [
                ActionChip(
                  label: const Text('Wi-Fi Phone (0.127)', style: TextStyle(fontSize: 11)),
                  onPressed: () {
                    _urlController.text = 'http://192.168.0.127:3000';
                  },
                ),
                ActionChip(
                  label: const Text('PC Emulator', style: TextStyle(fontSize: 11)),
                  onPressed: () {
                    _urlController.text = 'http://10.0.2.2:3000';
                  },
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (_isTesting)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(8.0),
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              )
            else if (_testResult != null)
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: _isSuccess
                      ? AppColors.success.withValues(alpha: 0.1)
                      : AppColors.error.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: _isSuccess ? AppColors.success : AppColors.error,
                  ),
                ),
                child: Text(
                  _testResult!,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: _isSuccess ? AppColors.success : AppColors.error,
                  ),
                ),
              ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              icon: const Icon(Icons.wifi_tethering_rounded, size: 16),
              label: const Text('Test Connection'),
              onPressed: _isTesting ? null : _testConnection,
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.corporateNavy,
            foregroundColor: Colors.white,
          ),
          onPressed: _saveConfig,
          child: const Text('Save & Apply'),
        ),
      ],
    );
  }
}
