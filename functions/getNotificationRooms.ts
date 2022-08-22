import { ILogger, IRead } from "@rocket.chat/apps-engine/definition/accessors"
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms"

export const getNotificationRooms = async (
    logger: ILogger,
    read: IRead
): Promise<Array<IRoom> | undefined> => {
    const set = read.getEnvironmentReader().getSettings()
    const notificationRooms = await set.getValueById('Meeting_Channels')

    const toiroom = async (name: string): Promise<IRoom | undefined> => {
        const room = await read.getRoomReader().getByName(name)
        if (room === undefined) {
            logger.debug(`room #${name} doesn't exist`)
        }
        return room
    }

    const rooms = await Promise.all(notificationRooms.split(',').map(toiroom).filter(Boolean))

    logger.debug(`valid rooms: ${rooms.forEach(room => room?.displayName || room?.slugifiedName)}`)

    return rooms as Array<IRoom>
}