import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';

export enum AppSetting {
	Url = 'bbb_url',
	Secret = 'bbb_shared_secret',
	GuestPolicy = 'bbb_guest_policy',
	WelcomeMsg = 'bbb_welcome_message',
	RegisterHook = 'bbb_register_hook',
	AdditionalParams = 'bbb_additional_params',
}

export const settings: Array<ISetting> = [
	{
		id: AppSetting.Url,
		type: SettingType.STRING,
		packageValue: '',
		required: true,
		public: true,
		i18nLabel: AppSetting.Url,
		i18nDescription: `${AppSetting.Url}_description`,
	},
	{
		id: AppSetting.Secret,
		type: SettingType.STRING,
		packageValue: 'RocketChat',
		required: false,
		public: true,
		i18nLabel: AppSetting.Secret,
		i18nDescription: `${AppSetting.Secret}_description`,
	},
	{
		id: AppSetting.GuestPolicy,
		type: SettingType.STRING,
		packageValue: 'ALWAYS_ACCEPT',
		required: true,
		public: true,
		i18nLabel: AppSetting.GuestPolicy,
		i18nDescription: `${AppSetting.GuestPolicy}_description`,
	},
	{
		id: AppSetting.WelcomeMsg,
		type: SettingType.STRING,
		packageValue: '<br>Welcome to <b>%%CONFNAME%%</b>!',
		required: true,
		public: true,
		i18nLabel: AppSetting.WelcomeMsg,
		i18nDescription: `${AppSetting.WelcomeMsg}_description`,
	},
	{
		id: AppSetting.RegisterHook,
		type: SettingType.BOOLEAN,
		packageValue: true,
		required: false,
		public: true,
		i18nLabel: AppSetting.RegisterHook,
		i18nDescription: `${AppSetting.RegisterHook}_description`,
	},
	{
		id: AppSetting.AdditionalParams,
		type: SettingType.CODE,
		multiline: true,
		packageValue: '',
		required: false,
		public: false,
		i18nLabel: AppSetting.AdditionalParams,
		i18nDescription: `${AppSetting.AdditionalParams}_description`,
	},
];
