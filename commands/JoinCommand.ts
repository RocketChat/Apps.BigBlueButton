import { IRead, IModify, IHttp, IPersistence, IModifyCreator, IMessageBuilder, IHttpRequest  } from "@rocket.chat/apps-engine/definition/accessors";
import { IMessage } from "@rocket.chat/apps-engine/definition/messages";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import {ISlashCommand, SlashCommandContext} from "@rocket.chat/apps-engine/definition/slashcommands";
import { BlockBuilder, TextObjectType } from "@rocket.chat/apps-engine/definition/uikit";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { getMeetingUrl } from "../functions/getMeetingUrl";

export class JoinCommand implements ISlashCommand {
    public command = "joinmeet";
    public i18nDescription = "Lets you join weekly meetings";
    public providesPreview = false;
    public i18nParamsExample = "";

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<void> {
        const set = read.getEnvironmentReader().getSettings()
        const roomstr = await set.getValueById('Meeting_Channels')
        const checkroom = async (name: string): Promise<string | undefined> => {
            const room = await read.getRoomReader().getByName(name)
            if (room === undefined) {
                return undefined
            }
            return room.slugifiedName
        }
        
        const rooms : Array<string> = await Promise.all(roomstr.split(',').map(checkroom).filter(Boolean))

        const commandroom = context.getRoom()
        const roomind = rooms.indexOf(commandroom.slugifiedName)

        if(roomind == -1) {
            const sender : IUser = (await read.getUserReader().getAppUser()) as IUser
            const room : IRoom = context.getRoom()
            
            const blockBuilder: BlockBuilder = modify.getCreator().getBlockBuilder()
            blockBuilder.addSectionBlock({
                text: {
                    type: TextObjectType.PLAINTEXT,
                    text: "This Command is not allowed in this channel"
                }
            })

            await modify.getNotifier().notifyUser(context.getSender(), {
                sender,
                room,
                blocks: blockBuilder.getBlocks()
            })
            return;
        }

        const moderatorPW = await set.getValueById('BigBlueButton_moderatorPW')
        const attendeePW = await set.getValueById('BigBlueButton_attendeePW')

        const [password]: Array<string> = context.getArguments()

        if(password!==moderatorPW && password!==attendeePW){
            const sender : IUser = (await read.getUserReader().getAppUser()) as IUser
            const room : IRoom = context.getRoom()
            
            const blockBuilder: BlockBuilder = modify.getCreator().getBlockBuilder()
            blockBuilder.addSectionBlock({
                text: {
                    type: TextObjectType.PLAINTEXT,
                    text: "Wrong Password!"
                }
            })

            await modify.getNotifier().notifyUser(context.getSender(), {
                sender,
                room,
                blocks: blockBuilder.getBlocks()
            })
            return;
        }

        const meeetingURL = await getMeetingUrl(read,password,context,http)
        
        if(meeetingURL !== undefined){
            const sender : IUser = (await read.getUserReader().getAppUser()) as IUser
            const room : IRoom = context.getRoom()
            
            // The Message is sent with a join url
            const blockBuilder: BlockBuilder = modify.getCreator().getBlockBuilder()
            blockBuilder.addSectionBlock({
                text: {
                    type: TextObjectType.MARKDOWN,
                    text: `Click on the join button below to join the meeting:\n`
                }
            })
            blockBuilder.addActionsBlock({
                elements: [
                    blockBuilder.newButtonElement({
                        text: {
                            type: TextObjectType.PLAINTEXT,
                            text: 'Join'
                        },
                        url: meeetingURL
                    })
                ]
            })

            await modify.getNotifier().notifyUser(context.getSender(), {
                sender,
                room,
                blocks: blockBuilder.getBlocks()
            })
        }
    }
}

