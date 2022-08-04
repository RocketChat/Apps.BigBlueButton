import { IHttp, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { sha1 } from "../SHA1/sha1";
import { getGUID } from "./getGUID";

export async function getMeetingUrl(read: IRead, password: string, context: SlashCommandContext, http: IHttp): Promise<string | undefined>{
    const set = read.getEnvironmentReader().getSettings()
    const bbbserver = await set.getValueById('BigBlueButton_Server_URL')
    const sharedSecret = await set.getValueById('BigBlueButton_sharedSecret')
    const moderatorPW = await set.getValueById('BigBlueButton_moderatorPW')
    const attendeePW = await set.getValueById('BigBlueButton_attendeePW')
    const meetingId = getGUID()
    const meetingName = context.getRoom()
    const sender = context.getSender()

    const query = `name=${meetingName}&meetingID=${meetingId}&attendeePW=${attendeePW}&moderatorPW=${moderatorPW}&record=true`
    const sha1string = "create" + query + `${sharedSecret}`
    const sha = sha1(sha1string)
    const url = bbbserver + "/bigbluebutton/api/create?" + query + `&checksum=${sha}`

    //make the create call
    const response = await http.get(url)

    if(response.statusCode === 200){
        const joinquery = `fullName=${sender.name}&meetingID=${meetingId}&password=${password}&redirect=true`
        const joinsha1string = "join" + joinquery + `${this.sharedSecret}`
        const joinsha1 = sha1(joinsha1string)
        const joinurl = bbbserver + "/bigbluebutton/api/join?" + joinquery + `&checksum=${joinsha1}`
        return joinurl
    } else {
        return undefined
    }
}