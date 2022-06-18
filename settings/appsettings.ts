import { ISetting, SettingType } from "@rocket.chat/apps-engine/definition/settings";

export enum Settings {
    MeetingDay = 'Meeting_Day',
    MeetingTime = 'Meeting_Time',
    MeetingChannel = 'Meeting_Channel',
    ReminderRole = 'Reminder_Role',
}

export const AppSettings : Array<ISetting> = [
    {
        id: Settings.MeetingDay,
        type: SettingType.SELECT,
        packageValue: '',
        required: true,
        public: true,
        i18nLabel: 'Meeting Day',
        i18nDescription: 'The Day when the weekly meetings are supposed to be conducted.',
        values: [
            {key: 'sunday', i18nLabel: 'Sunday'},
            {key: 'monday', i18nLabel: 'Monday'},
            {key: 'tuesday', i18nLabel: 'Tuesday'},
            {key: 'wednesday', i18nLabel: 'Wednesday'},
            {key: 'thursday', i18nLabel: 'Thursday'},
            {key: 'friday', i18nLabel: 'Friday'},
            {key: 'saturday', i18nLabel: 'Saturday'}
        ]
    },
    {
        id: Settings.MeetingTime,
        type: SettingType.STRING,
        packageValue: '',
        required: true,
        public: true,
        i18nLabel: 'Meeting Time',
        i18nDescription: 'The Time when the weekly meetings are supposed to be conducted.',
    },
    {
        id: Settings.MeetingChannel,
        type: SettingType.STRING,
        packageValue: '',
        required: true,
        public: true,
        i18nLabel: 'Meeting Channel',
        i18nDescription: 'The Channel in which notifications are to be sent and commands to be usable',
    },
    {
        id: Settings.ReminderRole,
        type: SettingType.STRING,
        packageValue: 'admin',
        required: true,
        public: true,
        i18nLabel: 'Role that can disable reminders',
        i18nDescription: '',
    },
]