import { IHttp, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors"
import { IJobContext } from "@rocket.chat/apps-engine/definition/scheduler"
import { TextObjectType } from "@rocket.chat/apps-engine/definition/uikit"
import { IUser } from "@rocket.chat/apps-engine/definition/users"


export const weeklyNotification = async (jobContext: IJobContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> => {
    const block = modify.getCreator().getBlockBuilder()

    // this.getLogger().log('Reached Processor') // "this" may be undefined
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