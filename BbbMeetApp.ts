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
import { IJobContext } from '@rocket.chat/apps-engine/definition/scheduler';
import { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { DebugCommand } from './commands/DebugCommand';
import { HelpCommand } from './commands/HelpCommand';
import { JoinCommand } from './commands/JoinCommand';
// import { StopReminder } from './commands/StopReminder';
import { WebhookEndpoint } from './endpoints/webhook';
import { jobId } from './reminder/enums/jobid';
import { weeklyNotification } from './reminder/processors/weeklyNotification';
import { AppSettings } from './settings/appsettings';
import { BbbSettings } from './settings/bbbsettings';

export class BbbMeetApp extends App {

    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }
    public async onInstall(context: IAppInstallationContext, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void> {
        //logging in the app logs
        this.getLogger().log('Hello Everyone! I am a Rocket.Chat App which will take care about your weekly meetings');
        
        //sending in the general channel
        const creator: IModifyCreator = modify.getCreator();
        const room = await read.getRoomReader().getByName('general');
        if (room === undefined) {
            this.getLogger().log(`room general doesn't exist`)
        } else {
            const sender: IUser = (await read.getUserReader().getAppUser()) as IUser;
            const messageTemplate: IMessage = {
                text: 'Hello Everyone! I am a Rocket.Chat App which will take care about your weekly meetings',
                sender,
                room
            }
            const messageBuilder: IMessageBuilder = creator.startMessage(messageTemplate)
            await creator.finish(messageBuilder)
        }
    }

    public async onSettingUpdated(setting: ISetting, configurationModify: IConfigurationModify, read: IRead, http: IHttp): Promise<void> {
        // cancel all the existing jobs
        await configurationModify.scheduler.cancelJob(jobId.Reminder)

        // Find the meeting channel from the App settings
        const set = read.getEnvironmentReader().getSettings()
        const room = await set.getValueById('Meeting_Channel')

        // Calculating the Cron Expression
        const time = await set.getValueById('Meeting_Time')
        var [hrs,mins] = time.split(":")
        if(hrs.length !== mins.length){
            this.getLogger().log('Invalid Meeting Time Setting was found');
            return undefined
        }

        hrs = parseInt(hrs as string, 10)
        mins = parseInt(mins as string, 10)

        if(time.length !== 5 || hrs.isNaN || mins.isNaN || hrs>23 || mins>60 || hrs<0 || mins<0){
            this.getLogger().log('Invalid Meeting Time Setting was found');
            return undefined
        }

        const day = await set.getValueById('Meeting_Day')
        const dayind = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(day)

        if(dayind === -1){
            this.getLogger().log('No Meeting Day setting was found. Make sure you have selected a day before proceeding.');
            return
        }

        if(room !== undefined){
            await configurationModify.scheduler.scheduleRecurring({
                id: jobId.Reminder,
                interval: `${mins} ${hrs} * * ${dayind}`,
                skipImmediate: true,
                data: {}
            })
            this.getLogger().log(`${mins} ${hrs} * * ${dayind}`)
        }
    }

    protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        await Promise.all(AppSettings.map((setting) => configuration.settings.provideSetting(setting)));
        await Promise.all(BbbSettings.map((setting) => configuration.settings.provideSetting(setting)));

        // await configuration.slashCommands.provideSlashCommand(new StopReminder())
        await configuration.slashCommands.provideSlashCommand(new JoinCommand())
        await configuration.slashCommands.provideSlashCommand(new HelpCommand())
        await configuration.slashCommands.provideSlashCommand(new DebugCommand())

        configuration.api.provideApi({
            visibility: ApiVisibility.PUBLIC,
            security: ApiSecurity.UNSECURE,
            endpoints: [new WebhookEndpoint(this)],
        });

        //Register processors
        await configuration.scheduler.registerProcessors([
            {
                id: jobId.Reminder,
                processor: weeklyNotification,
            }
        ]); 
    }
}

// @todo - remove the requirement of the moderatorPW of the BBB when the user tries to use the join meet 
//         command. Rather try to make a different access passwords app settings to authenticate user.
//         We dont let the users know the API call tokens.
//         (Felipe sir's Suggestion)
// @todo - multiple room support
// @todo - date and time for different timezones
// @todo - based on team id instead of rooms (different instances for each team)
//         to do this we may have to have a day argument and time argument along with a new slash command
//         (timezone can be given in the settings)
// @todo - use the day and time and then parse it with the timezone and register the process
