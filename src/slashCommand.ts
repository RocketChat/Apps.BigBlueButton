import type { IModify, IRead, IHttp, IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import type { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';

import type { BigBlueButtonApp } from './BigBlueButtonApp';

export class BBBSlashCommand implements ISlashCommand {
	public command: string;

	public i18nParamsExample: string;

	public i18nDescription: string;

	public providesPreview: boolean;

	private app: BigBlueButtonApp;

	constructor(app: BigBlueButtonApp) {
		this.app = app;
		this.command = 'bbb';
		this.i18nParamsExample = 'params_example';
		this.i18nDescription = 'command_description';
		this.providesPreview = false;
	}

	public async executor(
		context: SlashCommandContext,
		_read: IRead,
		modify: IModify,
		_http: IHttp,
		_persistence: IPersistence,
	): Promise<void> {
		const creator = modify.getCreator();
		const builder = creator.startVideoConference({
			providerName: this.app.getProvider().name,
			rid: context.getRoom().id,
			createdBy: context.getSender().id,
		});

		const [roomName] = context.getArguments();

		if (roomName) {
			builder.setTitle(roomName);
			// Store the roomName as providerData so the app can use it when generating the URL without affecting the behavior of standard video conferences.
			builder.setProviderData({ roomName });
		}

		creator.finish(builder);
	}
}
