import { ISetting, SettingType } from "@rocket.chat/apps-engine/definition/settings";

export enum Settings {
    MeetingDay = 'Meeting_Day',
    MeetingTime = 'Meeting_Time',
    MeetingChannels = 'Meeting_Channels',
    ReminderRole = 'Reminder_Role',
}

export const AppSettings : Array<ISetting> = [
    {
        id: Settings.MeetingChannels,
        type: SettingType.STRING,
        packageValue: '',
        required: true,
        public: true,
        i18nLabel: 'Meeting Channels',
        i18nDescription: 'The Channel in which notifications are to be sent and commands to be usable',
    },
]