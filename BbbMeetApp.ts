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
import { HelpCommand } from './commands/HelpCommand';
import { JoinCommand } from './commands/JoinCommand';
import { StopReminder } from './commands/StopReminder';
import { WebhookEndpoint } from './endpoints/webhook';
import { jobId } from './enums/jobid';
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

        await configuration.slashCommands.provideSlashCommand(new StopReminder())
        await configuration.slashCommands.provideSlashCommand(new JoinCommand())
        await configuration.slashCommands.provideSlashCommand(new HelpCommand())

        configuration.api.provideApi({
            visibility: ApiVisibility.PUBLIC,
            security: ApiSecurity.UNSECURE,
            endpoints: [new WebhookEndpoint(this)],
        });

        //Register processors
        await configuration.scheduler.registerProcessors([
            {
                id: jobId.Reminder,
                processor: async (jobContext: IJobContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> => {
                    const block = modify.getCreator().getBlockBuilder()
                
                    this.getLogger().log('Reached Processor')
                    //Creating the block template 
                    block.addSectionBlock({
                        text: {
                            type: TextObjectType.PLAINTEXT,
                            text: 'The scheduled weekly meeting is about to start! Join by clicking on the "Join" button below'
                        }
                    })
                    block.addActionsBlock({
                        elements: [
                            block.newButtonElement({
                                actionId: "joinbutton",
                                text: {
                                    type: TextObjectType.PLAINTEXT,
                                    text: 'Join'
                                },
                            })
                        ]
                    })
                    //Find the meeting channel from the App settings
                    const setting = read.getEnvironmentReader().getSettings()
                    const roomname = await setting.getValueById('Meeting_Channel')
                    const room = await read.getRoomReader().getByName(roomname);
                    const sender: IUser = (await read.getUserReader().getAppUser()) as IUser
                
                    if (room === undefined){
                        console.log(`Room ${roomname} doesn't exist`)
                    } else {
                        await modify.getCreator().finish(
                            modify.getCreator().startMessage().setSender(sender).addBlocks(block.getBlocks()).setRoom(room)
                        )
                    }
                    
                }
            }
        ]);
        
    }
}
