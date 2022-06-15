import { IRead, IModify, IHttp, IPersistence, IModifyCreator, IMessageBuilder  } from "@rocket.chat/apps-engine/definition/accessors";
import { IMessage } from "@rocket.chat/apps-engine/definition/messages";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import {ISlashCommand, SlashCommandContext} from "@rocket.chat/apps-engine/definition/slashcommands";
import { BlockBuilder, TextObjectType } from "@rocket.chat/apps-engine/definition/uikit";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { jobId } from "../enums/jobid";

export class StopReminder implements ISlashCommand {
    public command = "stopreminder";
    public i18nDescription = "Lets you to stop the weekly reminder messages";
    public providesPreview = false;
    public i18nParamsExample = "";

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<void> {
        const creator : IModifyCreator = modify.getCreator()
        const sender : IUser = (await read.getUserReader().getAppUser()) as IUser
        const room : IRoom = context.getRoom()

        const set = read.getEnvironmentReader().getSettings()
        const role = await set.getValueById('Reminder_Role')
        const userRoles = context.getSender().roles

        if(userRoles.includes(role)){
            modify.getScheduler().cancelJob(jobId.Reminder)
            const messageTemplate : IMessage = {
                text: 'The Weekly Meetings Reminder is now disabled',
                room,
                sender
            }
            const messageBuilder : IMessageBuilder = creator.startMessage(messageTemplate)
            await creator.finish(messageBuilder)
        } else {
            const blockBuilder: BlockBuilder = modify.getCreator().getBlockBuilder()
            blockBuilder.addSectionBlock({
                text: {
                    type: TextObjectType.PLAINTEXT,
                    text: 'You are not allowed to use this command.'
                }
            })
            await modify.getNotifier().notifyUser(context.getSender(), {
                sender,
                room,
                blocks: blockBuilder.getBlocks()
            })
        }
    }
}