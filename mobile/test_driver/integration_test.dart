import 'package:integration_test/integration_test_driver.dart';

/// Runs the end-to-end test on a device and writes what it measured (step timings, frame
/// statistics) to build/integration_response_data.json.
Future<void> main() => integrationDriver();
