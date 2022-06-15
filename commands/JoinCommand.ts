import { IRead, IModify, IHttp, IPersistence, IModifyCreator, IMessageBuilder, IHttpRequest  } from "@rocket.chat/apps-engine/definition/accessors";
import { IMessage } from "@rocket.chat/apps-engine/definition/messages";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import {ISlashCommand, SlashCommandContext} from "@rocket.chat/apps-engine/definition/slashcommands";
import { BlockBuilder, TextObjectType } from "@rocket.chat/apps-engine/definition/uikit";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { sha1 } from "../SHA1/sha1";

export class JoinCommand implements ISlashCommand {
    public command = "joinmeet";
    public i18nDescription = "Lets you join weekly meetings";
    public providesPreview = false;
    public i18nParamsExample = "";
    private sharedSecret : string;

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<void> {
        const set = read.getEnvironmentReader().getSettings()
        const meetroomname = await set.getValueById('Meeting_Channel')
        const meetroom = await read.getRoomReader().getByName(meetroomname);
        const commandroom = context.getRoom()
        if(meetroom === undefined){
            console.log(`Room ${meetroomname} doesn't exist`)
        } else if(meetroom.id !== commandroom.id) {
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
        // Collect all the required settings
        const bbbserver = await set.getValueById('BigBlueButton_Server_URL')
        this.sharedSecret = await set.getValueById('BigBlueButton_sharedSecret')
        const moderatorPW = await set.getValueById('BigBlueButton_moderatorPW')
        const attendeePW = await set.getValueById('BigBlueButton_attendeePW')
        const meetingId = await set.getValueById('BigBlueButton_Meeting_Id')
        const meetingName = await set.getValueById('BigBlueButton_Meeting_Name')

        const [role, password]: Array<string> = context.getArguments()

        switch (role){
            case "moderator":
                if(password === moderatorPW){
                    break;
                } else {
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
            
            case "attendee":
                if(password === attendeePW){
                    break;
                } else {
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

            default:
                const sender : IUser = (await read.getUserReader().getAppUser()) as IUser
                const room : IRoom = context.getRoom()
                
                const blockBuilder: BlockBuilder = modify.getCreator().getBlockBuilder()
                blockBuilder.addSectionBlock({
                    text: {
                        type: TextObjectType.PLAINTEXT,
                        text: "Please Enter Valid Arguments"
                    }
                })

                await modify.getNotifier().notifyUser(context.getSender(), {
                    sender,
                    room,
                    blocks: blockBuilder.getBlocks()
                })
                return;

        }

        // Create the query string
        const query = `name=${meetingName}&meetingID=${meetingId}&attendeePW=${attendeePW}&moderatorPW=${moderatorPW}&record=true`
        const sha1string = "create" + query + `${this.sharedSecret}`
        // Calculate sha1 value
        const sha = sha1(sha1string)
        //Generate the final url
        const url = bbbserver + "/bigbluebutton/api/create?" + query + `&checksum=${sha}`
        
        //make the create call
        const response = await http.get(url)
        
        if(response.statusCode === 200){
            //Create the join query string
            const joinquery = `fullName=something&meetingID=${meetingId}&password=${password}&redirect=true`
            const joinsha1string = "join" + joinquery + `${this.sharedSecret}`
            const joinsha1 = sha1(joinsha1string)
            const joinurl = bbbserver + "/bigbluebutton/api/join?" + joinquery + `&checksum=${joinsha1}`

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
                        url: joinurl
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

