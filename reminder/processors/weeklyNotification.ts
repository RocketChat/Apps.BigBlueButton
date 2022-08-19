import { IHttp, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors"
import { IJobContext } from "@rocket.chat/apps-engine/definition/scheduler"
import { BlockBuilder, TextObjectType } from "@rocket.chat/apps-engine/definition/uikit"
import { IUser } from "@rocket.chat/apps-engine/definition/users"
import { getSchedule } from "../../persistence/ReminderPersistence"


export const weeklyNotification = async (jobContext: IJobContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> => {
    const block = modify.getCreator().getBlockBuilder()
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

    var sch = new Array(7);

    for (var i = 0; i < sch.length; i++) {
        sch[i] = new Array(24);
    }
    for (var i = 0; i < sch.length; i++) {
        for(var j=0;j<sch[i].length;j++){
            sch[i][j] = new Array(60);
        }
    }
    var res;
    for (const roomname of rooms){
        res = await getSchedule(read.getPersistenceReader(),roomname)

        const [mins, hrs, dayind]: Array<string> = res.data.split(";")
        const h = parseInt(hrs as string, 10)
        const m = parseInt(mins as string, 10)
        const d = parseInt(dayind as string, 10)

        sch[d][h][m] = roomname
    }

    var currentdate = new Date(); 
    var dy = currentdate.getDay()
    var hr = currentdate.getHours();
    var mn = currentdate.getMinutes();
    var scheduleroom;
    var flag = false
    for(let i=0;i<7;i++){
        for(let j=0;j<24;j++){
            for(let k=0;k<60;k++){
                if(sch[(dy + i)%7][(hr + j)%24][(mn +k)%60]!==undefined){
                    scheduleroom = sch[(dy + i)%7][(hr + j)%24][(mn +k)%60]
                    dy = (dy + i)%7
                    hr = (hr + j)%24
                    mn = (mn +k)%60
                    flag = true
                    break;
                }
            }
            if(flag){
                break;
            }
        }
        if(flag){
            break;
        }
    }
    
    await modify.getScheduler().scheduleRecurring({
        id: `weeklyreminder`,
        interval: `${mn} ${hr} * * ${dy}`,
        skipImmediate: true,
        data: {room: scheduleroom}
    })
}