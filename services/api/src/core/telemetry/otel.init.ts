/**
 * Optional OpenTelemetry — enable with OTEL_ENABLED=true and install @opentelemetry/sdk-node.
 * No-op by default to keep MVP images lean; wire in AWS phase.
 */
export function initOpenTelemetry(): void {
  if (process.env.OTEL_ENABLED !== 'true') return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { NodeSDK } = require('@opentelemetry/sdk-node');
    const sdk = new NodeSDK({});
    sdk.start();
  } catch {
    // OTEL packages optional
  }
}
