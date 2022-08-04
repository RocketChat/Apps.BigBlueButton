import { IHttp, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors"
import { IJobContext } from "@rocket.chat/apps-engine/definition/scheduler"
import { BlockBuilder, TextObjectType } from "@rocket.chat/apps-engine/definition/uikit"
import { IUser } from "@rocket.chat/apps-engine/definition/users"


export const weeklyNotification = async (jobContext: IJobContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> => {
    const block = modify.getCreator().getBlockBuilder()
    // this.getLogger().log('Reached Processor')
    block.addSectionBlock({
        text: {
            type: TextObjectType.PLAINTEXT,
            text: "The scheduled weekly meeting is about to start! Join by using the /joinmeet command"
        }
    })
    const sender: IUser = (await read.getUserReader().getAppUser()) as IUser
    const commandroom = jobContext.room
    if(commandroom!=undefined){
        await modify.getCreator().finish(
            modify.getCreator().startMessage().setSender(sender).addBlocks(block.getBlocks()).setRoom(commandroom)
        )
    }
}