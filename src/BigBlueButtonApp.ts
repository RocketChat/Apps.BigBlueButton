import type {
	IAppAccessors,
	IConfigurationExtend,
	IConfigurationModify,
	IEnvironmentRead,
	IHttp,
	ILogger,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { ApiSecurity, ApiVisibility } from '@rocket.chat/apps-engine/definition/api';
import { App } from '@rocket.chat/apps-engine/definition/App';
import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';

import { AppSetting, settings } from './settings';
import { BBBProvider } from './videoConfProvider';
import { EventHookEndpoint } from './endpoints/EventHook';
import { BBBSlashCommand } from './slashCommand';

export class BigBlueButtonApp extends App {
	private provider: BBBProvider | undefined;

	public registerHook = true;

	constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
		super(info, logger, accessors);
	}

	protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
		await Promise.all(settings.map((setting) => configuration.settings.provideSetting(setting)));
		await configuration.slashCommands.provideSlashCommand(new BBBSlashCommand(this));

		const provider = this.getProvider();
		await configuration.videoConfProviders.provideVideoConfProvider(provider);

		await configuration.api.provideApi({
			visibility: ApiVisibility.PUBLIC,
			security: ApiSecurity.UNSECURE,
			endpoints: [new EventHookEndpoint(this)],
		});
	}

	public async onEnable(environmentRead: IEnvironmentRead, _configModify: IConfigurationModify): Promise<boolean> {
		const settings = environmentRead.getSettings();

		const provider = this.getProvider();

		provider.url = await settings.getValueById(AppSetting.Url);
		provider.secret = await settings.getValueById(AppSetting.Secret);
		this.registerHook = await settings.getValueById(AppSetting.RegisterHook);

		return true;
	}

	public async onSettingUpdated(setting: ISetting, _configModify: IConfigurationModify, _read: IRead, _http: IHttp): Promise<void> {
		const provider = this.getProvider();

		switch (setting.id) {
			case AppSetting.Url:
				provider.url = setting.value;
				break;
			case AppSetting.Secret:
				provider.secret = setting.value;
				break;
			case AppSetting.RegisterHook:
				this.registerHook = setting.value;
				break;
		}
	}

	public getProvider(): BBBProvider {
		if (!this.provider) {
			this.provider = new BBBProvider(this);
		}

		return this.provider;
	}
}
