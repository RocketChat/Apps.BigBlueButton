import { IRead, IModify, IHttp, IPersistence, IModifyCreator, IMessageBuilder, ILogger  } from "@rocket.chat/apps-engine/definition/accessors";
import {ISlashCommand, SlashCommandContext} from "@rocket.chat/apps-engine/definition/slashcommands";
import { BlockBuilder, TextObjectType } from "@rocket.chat/apps-engine/definition/uikit";
import { IUser } from "@rocket.chat/apps-engine/definition/users";

export class ScheduleMeetCommand implements ISlashCommand {
    public command = "schedulemeet";
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
        const set = read.getEnvironmentReader().getSettings()
        const roomstr = await set.getValueById('Meeting_Channels')
        const checkroom = async (name: string): Promise<string | undefined> => {
            const room = await read.getRoomReader().getByName(name)
            if (room === undefined) {
                return undefined
            }
            return room.slugifiedName
        }
        
        // const rooms : Array<IRoom> = await Promise.all(roomstr.split(',').map(toiroom).filter(Boolean))

        const rooms : Array<string> = await Promise.all(roomstr.split(',').map(checkroom).filter(Boolean))

        const commandroom = context.getRoom()

        // if(!rooms.includes(commandroom)){
        //     // this.logger.debug(`room is not a meeting channel`)
        //     return;
        // }

        const roomind = rooms.indexOf(commandroom.slugifiedName)
        // console.log(rooms)

        const [time, day]: Array<string> = context.getArguments()
        var [hour,minute] = time.split(":")

        const hrs = parseInt(hour as string, 10)
        const mins = parseInt(minute as string, 10)

        const dayind = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(day)

        // debug code
        const sender : IUser = (await read.getUserReader().getAppUser()) as IUser
        const blockBuilder: BlockBuilder = modify.getCreator().getBlockBuilder()
        blockBuilder.addSectionBlock({
            text: {
                type: TextObjectType.PLAINTEXT,
                text: `${mins} ${hrs} * * ${dayind}\n ${commandroom.slugifiedName}\n meet${roomind}`
                // text: `${rooms[0].slugifiedName}  ${commandroom.slugifiedName}  ${rooms[0]==commandroom}  ${roomind}`
            }
        })

        await modify.getNotifier().notifyUser(context.getSender(), {
            sender,
            room: commandroom,
            blocks: blockBuilder.getBlocks()
        })

        await modify.getScheduler().scheduleRecurring({
            id: `meet${roomind}`,
            interval: `20 seconds`,
            skipImmediate: true,
            data: {room: commandroom}
        })
    }
}