import { HttpStatusCode, IHttp, IMessageBuilder, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, IApiResponse } from "@rocket.chat/apps-engine/definition/api";
import { IMessage } from "@rocket.chat/apps-engine/definition/messages";
import { IUser } from "@rocket.chat/apps-engine/definition/users";

export class WebhookEndpoint extends ApiEndpoint{
    public path = 'recordingstatus';

    public async post(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ): Promise<IApiResponse> {
        const set = read.getEnvironmentReader().getSettings()
        const room = await set.getValueById('Meeting_Channel')
        const sender = (await read.getUserReader().getAppUser()) as IUser
        const creator  = modify.getCreator()
        const messageTemplate: IMessage = {
            text: 'Recording is ready',
            sender,
            room
        }
        const messageBuilder: IMessageBuilder = creator.startMessage(messageTemplate)
        await creator.finish(messageBuilder)

        return {
            status: HttpStatusCode.OK
        }
    }
}