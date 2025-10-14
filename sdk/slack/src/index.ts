import { App, WorkflowStep } from '@slack/bolt';
import axios from 'axios';
import { BASE_URL } from './shared/config';

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: false,
    appToken: process.env.SLACK_APP_TOKEN,
});

const step = new WorkflowStep('xr2_get_prompt', {
    edit: async ({ ack, configure }) => {
        await ack();
        await configure({
            blocks: [
                {
                    type: 'input',
                    block_id: 'slug_block',
                    label: { type: 'plain_text', text: 'Slug' },
                    element: { type: 'plain_text_input', action_id: 'slug' },
                },
                
            ],
        });
    },
    save: async ({ ack, view, update }) => {
        await ack();
        const slug = (view.state.values['slug_block']['slug'] as any).value as string;
        const inputs = { slug: { value: slug } } as any;
        const outputs = [
            { type: 'text', name: 'trace_id', label: 'trace_id' },
            { type: 'text', name: 'version_number', label: 'version_number' },
        ];
        await update({ inputs, outputs });
    },
    execute: async ({ step, complete, fail }) => {
        try {
            const { slug } = step.inputs as any;
            const apiKey = process.env.XR2_API_KEY as string;
            const url = `${BASE_URL.replace(/\/$/, '')}/api/v1/get-prompt`;
            const res = await axios.post(
                url,
                { slug: slug.value, source_name: 'slack_sdk' },
                { headers: { Authorization: `Bearer ${apiKey}` } }
            );
            await complete({ outputs: { trace_id: res.data.trace_id, version_number: String(res.data.version_number) } });
        } catch (e: any) {
            await fail({ error: { message: e?.message || 'Failed to get prompt' } });
        }
    },
});

const trackEventStep = new WorkflowStep('xr2_track_event', {
    edit: async ({ ack, configure }) => {
        await ack();
        await configure({
            blocks: [
                {
                    type: 'input',
                    block_id: 'trace_id_block',
                    label: { type: 'plain_text', text: 'Trace ID' },
                    element: { type: 'plain_text_input', action_id: 'trace_id' },
                },
                {
                    type: 'input',
                    block_id: 'event_name_block',
                    label: { type: 'plain_text', text: 'Event Name' },
                    element: { type: 'plain_text_input', action_id: 'event_name' },
                },
                {
                    type: 'input',
                    block_id: 'category_block',
                    label: { type: 'plain_text', text: 'Category' },
                    element: { type: 'plain_text_input', action_id: 'category' },
                },
            ],
        });
    },
    save: async ({ ack, view, update }) => {
        await ack();
        const trace_id = (view.state.values['trace_id_block']['trace_id'] as any).value as string;
        const event_name = (view.state.values['event_name_block']['event_name'] as any).value as string;
        const category = (view.state.values['category_block']['category'] as any).value as string;
        const inputs = { 
            trace_id: { value: trace_id },
            event_name: { value: event_name },
            category: { value: category }
        } as any;
        const outputs = [
            { type: 'text', name: 'event_id', label: 'event_id' },
            { type: 'text', name: 'status', label: 'status' },
        ];
        await update({ inputs, outputs });
    },
    execute: async ({ step, complete, fail }) => {
        try {
            const { trace_id, event_name, category } = step.inputs as any;
            const apiKey = process.env.XR2_API_KEY as string;
            const url = `${BASE_URL.replace(/\/$/, '')}/api/v1/events`;
            const res = await axios.post(
                url,
                { 
                    trace_id: trace_id.value, 
                    event_name: event_name.value, 
                    category: category.value,
                    fields: {}
                },
                { headers: { Authorization: `Bearer ${apiKey}` } }
            );
            await complete({ outputs: { event_id: res.data.event_id, status: res.data.status } });
        } catch (e: any) {
            await fail({ error: { message: e?.message || 'Failed to track event' } });
        }
    },
});

app.step(step);
app.step(trackEventStep);

async function start() {
    await app.start(process.env.PORT ? Number(process.env.PORT) : 3000);
    // eslint-disable-next-line no-console
    console.log('⚡️ xR2 Slack app is running!');
}

start();


