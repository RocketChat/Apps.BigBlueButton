/* eslint-disable @typescript-eslint/no-var-requires */
import { HttpStatusCode } from '@rocket.chat/apps-engine/definition/accessors';
import type { IVideoConferenceUser } from '@rocket.chat/apps-engine/definition/videoConferences';
import type {
	IVideoConfProvider,
	IVideoConferenceOptions,
	VideoConfData,
	VideoConfDataExtended,
} from '@rocket.chat/apps-engine/definition/videoConfProviders';
import { XMLParser } from 'fast-xml-parser';

import type { BigBlueButtonApp } from './BigBlueButtonApp';
import { AppSetting, settings } from './settings';

const methodsWithoutChecksum = ['setConfigXML', '/', 'enter', 'configXML', 'signOut'];
const apiParams: Record<string, [string | RegExp, boolean][]> = {
	'/': [],
	'create': [
		['meetingID', true],
		['name', true],
		['attendeePW', false],
		['moderatorPW', false],
		['welcome', false],
		['dialNumber', false],
		['voiceBridge', false],
		['webVoice', false],
		['logoutURL', false],
		['maxParticipants', false],
		['record', false],
		['duration', false],
		['moderatorOnlyMessage', false],
		['autoStartRecording', false],
		['allowStartStopRecording', false],
		['guestPolicy',false],
		[/meta_\w+/, false],
	],
	'join': [
		['fullName', true],
		['meetingID', true],
		['password', true],
		['createTime', false],
		['userID', false],
		['webVoiceConf', false],
		['configToken', false],
		['avatarURL', false],
		['redirect', false],
		['clientURL', false],
	],
	'isMeetingRunning': [['meetingID', true]],
	'getMeetingInfo': [
		['meetingID', true],
		['password', true],
	],
	'end': [
		['meetingID', true],
		['password', true],
	],
	'getDefaultConfigXML': [],
	'setConfigXML': [],
	'enter': [],
	'configXML': [],
	'signOut': [],
	'getRecordings': [
		['meetingID', false],
		['recordID', false],
		['state', false],
		[/meta_\w+/, false],
	],
	'publishRecordings': [
		['recordID', true],
		['publish', true],
	],
	'deleteRecordings': [['recordID', true]],
	'updateRecordings': [
		['recordID', true],
		[/meta_\w+/, false],
	],
	'hooks/create': [
		['callbackURL', false],
		['meetingID', false],
	],
};

export class BBBProvider implements IVideoConfProvider {
	public url = '';

	public secret = '';

	public name = 'BigBlueButton';

	public shaType: 'sha256' | 'sha1' = 'sha1';

	private parser: XMLParser;

	public capabilities = {
		mic: false,
		cam: false,
		title: true,
	};

	constructor(private readonly app: BigBlueButtonApp) {
		this.parser = new XMLParser();
	}

	public async isFullyConfigured(): Promise<boolean> {
		if (!this.url) {
			return false;
		}

		if (!this.secret) {
			return false;
		}

		return true;
	}

	public async generateUrl(call: VideoConfData): Promise<string> {
		this.checkConfiguration();

		await this.createMeeting(call);
		const meetingID = call._id;

		return this.getUrlFor('join', {
			password: 'rocket.chat.attendee',
			meetingID,
			fullName: 'Guest',
			userID: 'guest',
			joinViaHtml5: true,
			guest: true,
		});
	}

	public async customizeUrl(call: VideoConfDataExtended, user: IVideoConferenceUser, _options: IVideoConferenceOptions): Promise<string> {
		const meetingID = call._id;
		if (!user) {
			return this.getUrlFor('join', {
				password: 'rocket.chat.attendee',
				meetingID,
				fullName: 'Guest',
				userID: 'guest',
				joinViaHtml5: true,
				guest: true,
			});
		}

		const isModerator = call.createdBy._id === user._id;

		return this.getUrlFor('join', {
			password: isModerator ? 'rocket.chat.moderator' : 'rocket.chat.attendee',
			meetingID,
			fullName: user.name || user.username,
			userID: user._id,
			joinViaHtml5: true,
			avatarURL: await this.getAbsoluteUrl(`avatar/${user.username}`),
		});
	}

	private async getAbsoluteUrl(relativeUrl: string): Promise<string> {
		const siteUrl = await this.app.getAccessors().environmentReader.getServerSettings().getValueById('Site_Url');
		const separator = siteUrl.endsWith('/') ? '' : '/';
		const suffix = relativeUrl.startsWith('/') ? relativeUrl.substring(1) : relativeUrl;
		return `${siteUrl}${separator}${suffix}`;
	}

	private async createMeeting(call: VideoConfData): Promise<void> {
		this.app.getLogger().log('Creating new meeting', call._id);

		const meetingID = call._id;
		const settings = this.app.getAccessors().environmentReader.getSettings();
		const guestPolicy = await settings.getValueById(AppSetting.GuestPolicy);
		const welcomeMsg = await settings.getValueById(AppSetting.WelcomeMsg);
		
		const createUrl = this.getUrlFor('create', {
			name: call.title || 'Rocket.Chat',
			meetingID,
			attendeePW: 'rocket.chat.attendee',
			moderatorPW: 'rocket.chat.moderator',
			welcome: welcomeMsg,
			guestPolicy : guestPolicy,			
			// eslint-disable-next-line @typescript-eslint/camelcase
			meta_html5chat: false,
			// eslint-disable-next-line @typescript-eslint/camelcase
			meta_html5navbar: false,
			// eslint-disable-next-line @typescript-eslint/camelcase
			meta_html5autoswaplayout: true,
			// eslint-disable-next-line @typescript-eslint/camelcase
			meta_html5autosharewebcam: false,
			// eslint-disable-next-line @typescript-eslint/camelcase
			meta_html5hidepresentation: true,
		});

		this.app.getLogger().debug('URL', createUrl);

		const { content } = await this.app.getAccessors().http.get(createUrl);
		if (!content) {
			throw new Error('Failed to create BBB video conference');
		}

		const doc = this.parseString(content);
		this.app.getLogger().debug('BBB Response', doc);

		if (!doc?.response?.returncode?.[0]) {
			this.app.getLogger().error('Failed to create BBB Video Conference.');
			throw new Error('Failed to create BBB video conference');
		}

		const [webhookEndpoint] = this.app.getAccessors().providedApiEndpoints.filter((e) => e.path === 'hook/:id');
		if (this.app.registerHook) {
			const callbackURL = encodeURI(await this.getAbsoluteUrl(webhookEndpoint.computedPath.replace(':id', call._id)));
			this.app.getLogger().debug('Hook API', callbackURL);

			// #ToDo: We should probably destroy this hook somewhere - BBB will keep it forever unless it fails too much.
			const hookApi = this.getUrlFor('hooks/create', {
				meetingID,
				callbackURL,
			});

			this.app.getLogger().debug('Hook API', hookApi);
			const hookResult = await this.app.getAccessors().http.get(hookApi);
			this.app.getLogger().debug('BBB Response', hookResult);

			if (hookResult.statusCode !== HttpStatusCode.OK) {
				this.app.getLogger().error('Failed to register meeting hook on BBB.');
			}
		}
	}

	private parseString(text: string): any {
		this.app.getLogger().debug('Parsing XML', text);

		return this.parser.parse(text);
	}

	private checkConfiguration(): void {
		if (!this.url) {
			throw new Error('BBB URL is not configured.');
		}

		if (!this.secret) {
			throw new Error('BBB Secret is not configured.');
		}
	}

	private keyMatchesAnyFilter(key: string, filters: typeof apiParams[string]): boolean {
		if (key.match(/^custom_/)) {
			return true;
		}

		for (const [filterName] of filters) {
			if (filterName instanceof RegExp) {
				if (key.match(filterName)) {
					return true;
				}
			} else if (key.match(`^${filterName}$`)) {
				return true;
			}
		}

		return false;
	}

	private objectFromEntries<T>(entries: [string, T][]): Record<string, T> {
		return entries.reduce((obj, item) => ({ ...obj, ...{ [item[0]]: item[1] } }), {});
	}

	private filterParams(params: Record<string, string | boolean>, method: string): Record<string, string | boolean> {
		const filters = apiParams[method];
		if (!filters?.length) {
			return this.filterCustomParameters(params);
		}

		return this.filterCustomParameters(
			this.objectFromEntries(
				Object.keys(params)
					.filter((key) => this.keyMatchesAnyFilter(key, filters))
					.map((key) => [key, params[key]]),
			),
		);
	}

	private filterCustomParameters(params: Record<string, string | boolean>): Record<string, string | boolean> {
		return this.objectFromEntries(Object.keys(params).map((key) => [key.replace(/^custom_/, ''), params[key]]));
	}

	private encodeForUrl(value: string): string {
		return encodeURIComponent(value)
			.replace(/%20/g, '+')
			.replace(/[!'()]/g, escape)
			.replace(/\*/g, '%2A');
	}

	private checksum(method: string, query = ''): string {
		const { createHash } = require('crypto');

		const line = `${method}${query}${this.secret}`;
		const hash = createHash(this.shaType, 'TEXT');
		hash.update(line);

		return hash.digest('hex');
	}

	private getUrlFor(method: string, params: Record<string, string | boolean> = {}, filter = true): string {
		const filteredParams = filter ? this.filterParams(params, method) : this.filterCustomParameters(params);
		const paramList = Object.keys(filteredParams)
			.sort()
			.reduce((list, key) => {
				const value = String(filteredParams[key]);
				if (value) {
					list.push(`${this.encodeForUrl(key)}=${this.encodeForUrl(value)}`);
				}

				return list;
			}, [] as string[]);

		if (method === 'join') {
			Object.keys(this.app.additionalParams)
				.filter((key) => key.startsWith('userdata-bbb'))
				.forEach((key) => paramList.push(this.app.additionalParams[key]));
		}

		const query = paramList.join('&');
		const checksum = this.checksum(method, query);

		const methodName = method !== '/' ? method : '';
		const args = query ? `?${query}` : '';

		if (methodsWithoutChecksum.includes(method)) {
			return `${this.url}/${methodName}${args}`;
		}

		const separator = args ? '&' : '?';
		const slash = this.url.endsWith('/') ? '' : '/';
		return `${this.url}${slash}api/${methodName}${args}${separator}checksum=${checksum}`;
	}
}
