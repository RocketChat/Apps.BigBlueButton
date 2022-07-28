import { IRead, IModify, IHttp, IPersistence, IModifyCreator, IMessageBuilder  } from "@rocket.chat/apps-engine/definition/accessors";
import { IMessage } from "@rocket.chat/apps-engine/definition/messages";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import {ISlashCommand, SlashCommandContext} from "@rocket.chat/apps-engine/definition/slashcommands";
import { BlockBuilder, TextObjectType } from "@rocket.chat/apps-engine/definition/uikit";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { jobId } from "../reminder/enums/jobid";
import { ILogger } from "@rocket.chat/apps-engine/definition/accessors";

export class MeetCommand implements ISlashCommand {
    public command = "meet";
    public i18nDescription = "";
    public providesPreview = false;
    public i18nParamsExample = "";
    public logger : ILogger;

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<void> {
        // await modify.getScheduler().cancelJob(jobId.Reminder)
        const commandroom = context.getRoom()

        const set = read.getEnvironmentReader().getSettings()
        const roomstr = await set.getValueById('Meeting_Channels')
        
        const toiroom = async (name: string): Promise<IRoom | undefined> => {
            const room = await read.getRoomReader().getByName(name)
            // if (room === undefined) {
            //     this.logger.debug(`room #${name} doesn't exist`)
            // }
            return room
        }
    
        const rooms = await Promise.all(roomstr.split(',').map(toiroom).filter(Boolean))

        // if(!rooms.includes(commandroom)){
        //     this.logger.debug(`room #${commandroom.slugifiedName} is not a meeting channel`)
        //     return;
        // }

        const [time, day]: Array<string> = context.getArguments()
        var [hour,minute] = time.split(":")

        const hrs = parseInt(hour as string, 10)
        const mins = parseInt(minute as string, 10)

        const dayind = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(day)

        await modify.getScheduler().scheduleRecurring({
            id: `${commandroom.slugifiedName}`,
            // interval: `${mins} ${hrs} * * ${dayind}`,
            interval: '20 seconds',
            skipImmediate: true,
            data: {room: commandroom}
        })
        
        const sender : IUser = (await read.getUserReader().getAppUser()) as IUser
        const blockBuilder: BlockBuilder = modify.getCreator().getBlockBuilder()
        blockBuilder.addSectionBlock({
            text: {
                type: TextObjectType.PLAINTEXT,
                text: `${mins} ${hrs} * * ${dayind}\n ${commandroom.slugifiedName}`
            }
        })

        await modify.getNotifier().notifyUser(context.getSender(), {
            sender,
            room: commandroom,
            blocks: blockBuilder.getBlocks()
        })
    }
}