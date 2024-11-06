import { HttpStatusCode, IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';

import type { BigBlueButtonApp } from '../BigBlueButtonApp';

export class EventHookEndpoint extends ApiEndpoint {
	public path = 'hook/:id';

	constructor(public app: BigBlueButtonApp) {
		super(app);
	}

	private reject(): IApiResponse {
		return {
			status: HttpStatusCode.BAD_REQUEST,
		};
	}

	public async post(
		request: IApiRequest,
		_endpoint: IApiEndpointInfo,
		_read: IRead,
		modify: IModify,
		_http: IHttp,
		_persistence: IPersistence,
	): Promise<IApiResponse> {
		if (!this.app.registerHook) {
			this.app.getLogger().info('Rejecting Hook because the setting to use it is turned off.');
			return {
				status: HttpStatusCode.FORBIDDEN,
			};
		}

		if (!request.content?.event) {
			this.app.getLogger().error('Invalid event');
			return this.reject();
		}
		const events = JSON.parse(request.content.event);
		if (!Array.isArray(events) || !events.length) {
			this.app.getLogger().error('Invalid event');
			return this.reject();
		}

		const event = events[0];
		const eventType = event.data?.id;
		const meetingID = event.data?.attributes?.meeting?.['external-meeting-id'];

		if (!eventType) {
			this.app.getLogger().error('Missing event type');
			return this.reject();
		}

		if (!meetingID) {
			this.app.getLogger().error('Missing Meeting ID');
			return this.reject();
		}

		const extender = modify.getExtender();
		const videoConf = await extender.extendVideoConference(meetingID);

		switch (eventType) {
			case 'meeting-ended':
				videoConf.setStatus(3);
				break;
			case 'user-joined':
				break;
			case 'user-left':
				break;
			case 'user-presenter-assigned':
				break;
			case 'user-audio-voice-enabled':
				break;
			case 'user-audio-voice-disabled':
				break;
		}

		extender.finish(videoConf);

		return this.success();
	}
}
