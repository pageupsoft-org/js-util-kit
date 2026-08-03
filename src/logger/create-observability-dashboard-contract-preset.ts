import type {
    HttpObservabilityDashboardContractPreset,
    HttpObservabilityDashboardPresetName,
} from './logger-types.js';

/**
 * Returns named observability contracts to bootstrap transport dashboards.
 */
export function createObservabilityDashboardContractPreset(
    preset: HttpObservabilityDashboardPresetName = 'operations'
): HttpObservabilityDashboardContractPreset {
    if (preset === 'reliability') {
        return {
            preset,
            metrics: [
                {
                    name: 'log_transport_flush_failures_total',
                    unit: 'count',
                    source: 'metrics.onFlushComplete',
                    description: 'Total failed events observed during flush outcomes.',
                },
                {
                    name: 'log_transport_retries_attempted_total',
                    unit: 'count',
                    source: 'metrics.onRetryAttempt',
                    description: 'Retry attempts emitted while sending transport batches.',
                },
                {
                    name: 'log_transport_drop_rate',
                    unit: 'ratio',
                    source: 'metrics.onDropCountChange',
                    description: 'Drop ratio derived from dropped/enqueued counters.',
                },
                {
                    name: 'log_transport_circuit_open_batches_total',
                    unit: 'count',
                    source: 'onBatchOutcome',
                    description: 'Batches rejected when the circuit is open.',
                },
            ],
            events: [
                {
                    name: 'log_transport_circuit_transition',
                    source: 'circuitBreaker.onStateChange',
                    description: 'Circuit state transitions for outage and recovery timelines.',
                },
                {
                    name: 'log_transport_retry_budget_exhausted',
                    source: 'retryBudget.onExhausted',
                    description: 'Signals that retry guardrails stopped additional retry attempts.',
                },
                {
                    name: 'log_transport_retry_tuning_decision',
                    source: 'onRetryTuningDecision',
                    description: 'Dynamic retry decisions applied at runtime.',
                },
            ],
            recommendedPanels: [
                'Flush failure trend',
                'Retry pressure heatmap',
                'Circuit state transitions timeline',
                'Drop-rate SLO gauge',
            ],
        };
    }

    if (preset === 'diagnostics') {
        return {
            preset,
            metrics: [
                {
                    name: 'log_transport_queue_depth',
                    unit: 'count',
                    source: 'metrics.onQueueDepthChange',
                    description: 'Current in-memory queue depth over time.',
                },
                {
                    name: 'log_transport_flush_duration_ms',
                    unit: 'ms',
                    source: 'metrics.onFlushComplete',
                    description: 'Flush duration distribution for latency analysis.',
                },
                {
                    name: 'log_transport_sampling_keep_ratio',
                    unit: 'ratio',
                    source: 'onRequestSamplingDecision',
                    description: 'Proportion of sampled-in vs sampled-out batches.',
                },
                {
                    name: 'log_transport_request_success_ratio',
                    unit: 'ratio',
                    source: 'onRequestAudit',
                    description: 'Success ratio based on per-request transport audits.',
                },
            ],
            events: [
                {
                    name: 'log_transport_request_audit',
                    source: 'onRequestAudit',
                    description: 'Per-attempt request metadata including status, duration, and payload size.',
                },
                {
                    name: 'log_transport_circuit_tuning_decision',
                    source: 'circuitBreaker.onTuningDecision',
                    description: 'Applied circuit tuning values for adaptive behavior analysis.',
                },
                {
                    name: 'log_transport_chaos_decision',
                    source: 'chaos.onDecision',
                    description: 'Synthetic fault decisions used during resilience testing.',
                },
            ],
            recommendedPanels: [
                'Queue depth timeline',
                'Flush latency histogram',
                'Request audit table',
                'Sampling effectiveness gauge',
            ],
        };
    }

    return {
        preset,
        metrics: [
            {
                name: 'log_transport_events_sent_total',
                unit: 'count',
                source: 'onFlushOutcome',
                description: 'Total events delivered by flush outcomes.',
            },
            {
                name: 'log_transport_failed_events_total',
                unit: 'count',
                source: 'onFlushOutcome',
                description: 'Total failed events observed across flush outcomes.',
            },
            {
                name: 'log_transport_drop_count_total',
                unit: 'count',
                source: 'metrics.onDropCountChange',
                description: 'Cumulative events dropped by overflow, sampling, or send failures.',
            },
            {
                name: 'log_transport_flush_duration_ms',
                unit: 'ms',
                source: 'metrics.onFlushComplete',
                description: 'Flush duration to monitor delivery latency.',
            },
        ],
        events: [
            {
                name: 'log_transport_request_audit',
                source: 'onRequestAudit',
                description: 'Request-level transport audits for success/failure tracking.',
            },
            {
                name: 'log_transport_circuit_transition',
                source: 'circuitBreaker.onStateChange',
                description: 'Circuit transitions for resilience status visualization.',
            },
        ],
        recommendedPanels: [
            'Events sent vs failed',
            'Flush latency trend',
            'Drop count trend',
            'Request audit stream',
        ],
    };
}
