import { IRead, IModify, IHttp, IPersistence, IModifyCreator, IMessageBuilder, ILogger  } from "@rocket.chat/apps-engine/definition/accessors";
import {ISlashCommand, SlashCommandContext} from "@rocket.chat/apps-engine/definition/slashcommands";
import { getSchedule, persistSchedule } from "../persistence/ReminderPersistence";

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

        const [time, day]: Array<string> = context.getArguments()
        var [hour,minute] = time.split(":")

        const data_hrs = parseInt(hour as string, 10)
        const data_mins = parseInt(minute as string, 10)

        const data_dayind = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(day)

        await persistSchedule(persis,commandroom.slugifiedName, {data : `${data_mins};${data_hrs};${data_dayind}`})

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
}