import { createTransportResilienceProfilePreset } from './create-transport-resilience-profile-preset.js';
import { toDatadogLogEvent } from './to-datadog-log-event.js';
import { toElkLogDocument } from './to-elk-log-document.js';
import { toOpenTelemetryLogRecord } from './to-opentelemetry-log-record.js';
import type {
    HttpBatchSerializationContext,
    HttpProviderResilienceTemplate,
    HttpProviderResilienceTemplateName,
    HttpProviderResilienceTemplateOptions,
    LoggerEvent,
} from './logger-types.js';

/**
 * Creates a provider-oriented HTTP transport template that composes resilience
 * defaults with provider-specific payload serialization.
 */
export function createProviderResilienceTemplate(
    template: HttpProviderResilienceTemplateName,
    options: HttpProviderResilienceTemplateOptions = {}
): HttpProviderResilienceTemplate {
    if (template === 'datadog-http') {
        const profile = createTransportResilienceProfilePreset(options.profile ?? 'availability-first');

        return {
            ...profile,
            method: 'POST',
            headers: {
                accept: 'application/json',
            },
            contentType: 'application/json',
            serializeBatch: (events, context) =>
                _serializeDatadogBatch(events, context, options.datadogMapper, options.includeTraceMetadataEnvelope),
        };
    }

    if (template === 'elk-http') {
        const profile = createTransportResilienceProfilePreset(options.profile ?? 'cost-efficient');

        return {
            ...profile,
            method: 'POST',
            headers: {
                accept: 'application/json',
            },
            contentType: 'application/x-ndjson',
            serializeBatch: (events) => _serializeElkBulkNdjson(events, options.elkMapper),
        };
    }

    const profile = createTransportResilienceProfilePreset(options.profile ?? 'cost-efficient');

    return {
        ...profile,
        method: 'POST',
        headers: {
            accept: 'application/json',
        },
        contentType: 'application/json',
        serializeBatch: (events, context) =>
            _serializeOpenTelemetryBatch(
                events,
                context,
                options.openTelemetryMapper,
                options.includeTraceMetadataEnvelope
            ),
    };
}

function _serializeDatadogBatch(
    events: readonly LoggerEvent[],
    context: HttpBatchSerializationContext,
    mapper: HttpProviderResilienceTemplateOptions['datadogMapper'],
    includeTraceMetadataEnvelope: boolean | undefined
): string {
    const logs = events.map((event) => toDatadogLogEvent(event, mapper));

    if (includeTraceMetadataEnvelope !== false && context.traceMetadata != null) {
        return JSON.stringify({
            logs,
            traceMetadata: context.traceMetadata,
        });
    }

    return JSON.stringify(logs);
}

function _serializeElkBulkNdjson(
    events: readonly LoggerEvent[],
    mapper: HttpProviderResilienceTemplateOptions['elkMapper']
): string {
    const lines: string[] = [];

    for (const event of events) {
        const payload = toElkLogDocument(event, mapper);
        const index = typeof payload._index === 'string' && payload._index.trim().length > 0 ? payload._index : undefined;
        const source = { ...payload };
        delete source._index;

        if (index != null) {
            lines.push(JSON.stringify({ index: { _index: index } }));
        } else {
            lines.push(JSON.stringify({ index: {} }));
        }

        lines.push(JSON.stringify(source));
    }

    return `${lines.join('\n')}\n`;
}

function _serializeOpenTelemetryBatch(
    events: readonly LoggerEvent[],
    context: HttpBatchSerializationContext,
    mapper: HttpProviderResilienceTemplateOptions['openTelemetryMapper'],
    includeTraceMetadataEnvelope: boolean | undefined
): string {
    const logRecords = events.map((event) => toOpenTelemetryLogRecord(event, mapper));

    const payload: Record<string, unknown> = {
        resourceLogs: [
            {
                scopeLogs: [
                    {
                        logRecords,
                    },
                ],
            },
        ],
    };

    if (includeTraceMetadataEnvelope !== false && context.traceMetadata != null) {
        payload.traceMetadata = context.traceMetadata;
    }

    return JSON.stringify(payload);
}