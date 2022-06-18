import { IRead, IModify, IHttp, IPersistence, IModifyCreator, IMessageBuilder  } from "@rocket.chat/apps-engine/definition/accessors";
import { IMessage } from "@rocket.chat/apps-engine/definition/messages";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import {ISlashCommand, SlashCommandContext} from "@rocket.chat/apps-engine/definition/slashcommands";
import { BlockBuilder, TextObjectType } from "@rocket.chat/apps-engine/definition/uikit";
import { IUser } from "@rocket.chat/apps-engine/definition/users";

// I know i can use the app logger but i like this.

export class DebugCommand implements ISlashCommand {
    public command = "debugmeet";
    public i18nDescription = "debug";
    public providesPreview = false;
    public i18nParamsExample = "";

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<void> {
        const sender : IUser = (await read.getUserReader().getAppUser()) as IUser
        const room : IRoom = context.getRoom()
        const customFields = room.customFields
        if(customFields===undefined){
            return
        }

        const blockBuilder: BlockBuilder = modify.getCreator().getBlockBuilder()
        blockBuilder.addSectionBlock({
            text: {
                type: TextObjectType.MARKDOWN,
                text: `customFields:${JSON.stringify(customFields)}\n`,
            }
        })

        await modify.getNotifier().notifyUser(context.getSender(), {
            sender,
            room,
            blocks: blockBuilder.getBlocks()
        })
    }
}