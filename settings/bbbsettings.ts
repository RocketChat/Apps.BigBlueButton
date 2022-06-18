import { ISetting, SettingType } from "@rocket.chat/apps-engine/definition/settings";

export enum Settings {
    BbbServerURL = 'BigBlueButton_Server_URL',
    BbbSharedSecret = 'BigBlueButton_sharedSecret',
    BbbModeratorPW = 'BigBlueButton_moderatorPW',
    BbbAttendeePW = 'BigBlueButton_attendeePW',
    BbbMeetingName = 'BigBlueButton_Meeting_Name',
    BbbMeetingId = 'BigBlueButton_Meeting_Id'
}

export const BbbSettings : Array<ISetting> = [
    {
        id: Settings.BbbServerURL,
        type: SettingType.STRING,
        packageValue: '',
        required: true,
        public: true,
        i18nLabel: 'BigBlueButton Server URL',
        i18nDescription: 'The Server URL of where the meetings are supposed to be conducted',
    },
    {
        id: Settings.BbbSharedSecret,
        type: SettingType.STRING,
        packageValue: '',
        required: true,
        public: true,
        i18nLabel: 'BigBlueButton sharedSecret',
        i18nDescription: 'The BigBlueButton API parameter which could be obtained by running bbb-conf --secret',
    },
    {
        id: Settings.BbbModeratorPW,
        type: SettingType.STRING,
        packageValue: '',
        required: true,
        public: true,
        i18nLabel: 'BigBlueButton moderatorPW',
        i18nDescription: 'The password to let the person join as a moderator of the meeting',
    },
    {
        id: Settings.BbbAttendeePW,
        type: SettingType.STRING,
        packageValue: '',
        required: true,
        public: true,
        i18nLabel: 'BigBlueButton attendeePW',
        i18nDescription: 'The password to let the person join as an attendee of the meeting',
    },
    {
        id: Settings.BbbMeetingName,
        type: SettingType.STRING,
        packageValue: '',
        required: true,
        public: true,
        i18nLabel: 'BigBlueButton Meeting Name',
        i18nDescription: 'The name of the meeting',
    },
    {
        id: Settings.BbbMeetingId,
        type: SettingType.STRING,
        packageValue: '',
        required: true,
        public: true,
        i18nLabel: 'BigBlueButton Meeting Id',
        i18nDescription: 'The Id of the meeting',
    },
]