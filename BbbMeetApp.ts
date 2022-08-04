import {
    IAppAccessors,
    IAppInstallationContext,
    IConfigurationExtend,
    IConfigurationModify,
    IEnvironmentRead,
    IHttp,
    ILogger,
    IMessageBuilder,
    IModify,
    IModifyCreator,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { ApiSecurity, ApiVisibility } from '@rocket.chat/apps-engine/definition/api';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IJobContext, IProcessor } from '@rocket.chat/apps-engine/definition/scheduler';
import { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { IUIKitInteractionHandler, IUIKitResponse, TextObjectType, UIKitBlockInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { DebugCommand } from './commands/DebugCommand';
import { HelpCommand } from './commands/HelpCommand';
import { JoinCommand } from './commands/JoinCommand';
import { MeetCommand } from './commands/Meet';
import { ScheduleMeetCommand } from './commands/ScheduleMeetCommand';
// import { StopReminder } from './commands/StopReminder';
import { WebhookEndpoint } from './endpoints/webhook';
import { jobId } from './reminder/enums/jobid';
import { multipleProcessors } from './reminder/processors/multipleProcessors';
import { weeklyNotification } from './reminder/processors/weeklyNotification';
import { AppSettings } from './settings/appsettings';
import { BbbSettings } from './settings/bbbsettings';

export class BbbMeetApp extends App {

    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }


    protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {

        await Promise.all(AppSettings.map((setting) => configuration.settings.provideSetting(setting)));

        await configuration.slashCommands.provideSlashCommand(new ScheduleMeetCommand())
        await configuration.slashCommands.provideSlashCommand(new MeetCommand())
        
        //Register processors
        await configuration.scheduler.registerProcessors(multipleProcessors); 
    }
}