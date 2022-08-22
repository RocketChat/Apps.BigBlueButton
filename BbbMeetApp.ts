import {
    IAppAccessors,
    IConfigurationExtend,
    ILogger,
} from '@rocket.chat/apps-engine/definition/accessors';
import { ApiSecurity, ApiVisibility } from '@rocket.chat/apps-engine/definition/api';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { JoinCommand } from './commands/JoinCommand';
import { ScheduleMeetCommand } from './commands/ScheduleMeetCommand';
import { RecordingExportInfo } from './endpoints/RecordingExportInfo';
import { weeklyNotification } from './reminder/processors/weeklyNotification';
import { AppSettings } from './settings/appsettings';

export class BbbMeetApp extends App {

    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {

        await Promise.all(AppSettings.map((setting) => configuration.settings.provideSetting(setting)));

        await configuration.slashCommands.provideSlashCommand(new ScheduleMeetCommand())
        await configuration.slashCommands.provideSlashCommand(new JoinCommand())

        configuration.api.provideApi({
            visibility: ApiVisibility.PUBLIC,
            security: ApiSecurity.UNSECURE,
            endpoints: [new RecordingExportInfo(this)],
        });
        
        //Register processors
        await configuration.scheduler.registerProcessors([
            {
                id : "weeklyreminder",
                processor: weeklyNotification,
            }
        ]); 
    }
}